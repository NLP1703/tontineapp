import type { Request, Response } from 'express';
import { z } from 'zod';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import * as Users from '../models/user.js';
import * as Otps from '../models/otp.js';
import type { OtpPurpose } from '../models/otp.js';
import * as Pending from '../models/pendingRegistration.js';
import { sendMail } from '../mailer.js';

function signToken(userId: string, role: string = 'member'): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign(
    { sub: String(userId), role },
    process.env.JWT_SECRET || 'change_me_secret',
    { expiresIn }
  );
}

function newOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpTtlMinutes(): number {
  return Number(process.env.OTP_TTL_MINUTES || 10);
}

// Envoie un email OTP (sujet/corps selon la finalité). En arrière-plan : la réponse
// HTTP ne doit jamais attendre le SMTP. sendMail logue ses propres erreurs.
function sendOtpEmail(email: string, fullName: string, otp: string, purpose: OtpPurpose): void {
  const ttlMinutes = otpTtlMinutes();
  const subject =
    purpose === 'signup'
      ? 'Votre code de vérification TontineApp'
      : 'Réinitialisation de mot de passe TontineApp';
  const intro =
    purpose === 'signup'
      ? `Bonjour ${fullName}, confirmez votre adresse email avec le code ci-dessous.`
      : `Bonjour ${fullName}, utilisez ce code pour réinitialiser votre mot de passe.`;
  void sendMail(
    email,
    subject,
    `${intro}\n\nCode : ${otp}\n\nIl expire dans ${ttlMinutes} minutes.`,
    `<p>${intro}</p><p style="font-size:24px;font-weight:bold;letter-spacing:3px">${otp}</p><p>Il expire dans ${ttlMinutes} minutes.</p>`
  );
}

// Génère un OTP de réinitialisation pour un utilisateur EXISTANT, le persiste et l'envoie.
async function issueResetOtp(userId: string, email: string, fullName: string): Promise<string> {
  const otp = newOtp();
  await Otps.create(userId, otp, otpTtlMinutes(), 'password_reset');
  sendOtpEmail(email, fullName, otp, 'password_reset');
  return otp;
}

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(20).optional(),
  password: z.string().min(8).max(72),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { fullName, email, phone, password } = parsed.data;

  if (await Users.existsByEmail(email)) {
    return res.status(409).json({ error: 'Email already used' });
  }
  if (phone && ((await Users.existsByPhone(phone)) || (await Pending.existsByPhone(phone, email)))) {
    return res.status(409).json({ error: 'Phone already used' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = newOtp();

  // Vérification de l'email obligatoire AVANT toute création de compte : on garde
  // l'inscription "en attente" et on envoie un OTP. Aucune ligne n'est écrite dans
  // `users` tant que le code n'est pas validé (verifyOtp). Sans validation, l'inscrit
  // n'existe pas en base et ne peut pas se connecter.
  await Pending.upsert(fullName, email, passwordHash, phone ?? null, otp, otpTtlMinutes());
  sendOtpEmail(email, fullName, otp, 'signup');

  const payload: { requiresOtp: true; email: string; debugOtp?: string } = {
    requiresOtp: true,
    email,
  };
  if (process.env.NODE_ENV !== 'production') payload.debugOtp = otp;
  return res.status(201).json(payload);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  const user = await Users.findByEmail(email);
  if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // Un email non vérifié n'a pas accès au site. Avec le flux actuel, un compte
  // n'existe dans `users` qu'après validation de l'OTP (cf. register/verifyOtp),
  // donc ce cas ne devrait plus survenir — garde défensive pour les comptes hérités.
  if (user.email_verified === false) {
    return res.status(403).json({ error: 'Email not verified' });
  }

  // Compte désactivé (soft delete admin) : connexion refusée.
  if (user.is_active === false) {
    return res.status(403).json({ error: 'Account disabled' });
  }

  return res.json({
    token: signToken(user.id, user.role),
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role ?? 'member',
    },
  });
}

const forgotSchema = z.object({ email: z.string().email() });

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email } = parsed.data;
  const user = await Users.findByEmail(email);

  // Toujours répondre 200 pour éviter l'énumération d'utilisateurs
  if (!user) return res.json({ ok: true });

  const otp = await issueResetOtp(user.id, user.email, user.full_name);

  const payload: { ok: boolean; debugOtp?: string } = { ok: true };
  if (process.env.NODE_ENV !== 'production') payload.debugOtp = otp;
  return res.json(payload);
}

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(10),
});

// Valide l'OTP d'inscription : c'est SEULEMENT ici que le compte est créé dans
// `users`. Tant que cet appel n'a pas réussi, l'inscription n'existe qu'en attente.
export async function verifyOtp(req: Request, res: Response) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, otp } = parsed.data;

  const pending = await Pending.findByEmailAndCode(email, otp);
  if (!pending) return res.status(400).json({ error: 'Invalid OTP' });

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  // OTP valide → l'email est prouvé → on crée enfin le compte (directement vérifié).
  let user;
  try {
    user = await Users.create(pending.full_name, pending.email, pending.password_hash, pending.phone);
  } catch (err) {
    // Email/téléphone pris entretemps (contrainte unique) : on abandonne l'attente.
    await Pending.deleteByEmail(email);
    if ((err as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Email or phone already used' });
    }
    throw err;
  }
  await Users.markEmailVerified(user.id);
  await Pending.deleteByEmail(email);

  return res.json({
    token: signToken(user.id, user.role),
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role ?? 'member',
    },
  });
}

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(10),
  newPassword: z.string().min(8).max(72),
});

// Réinitialise le mot de passe : valide l'OTP (envoyé par /password/forgot)
// puis enregistre le nouveau mot de passe. L'OTP est consommé (usage unique).
export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, otp, newPassword } = parsed.data;

  const user = await Users.findByEmail(email);
  if (!user) return res.status(400).json({ error: 'Invalid OTP' });

  const otpRow = await Otps.findLatest(user.id, otp);
  if (!otpRow) return res.status(400).json({ error: 'Invalid OTP' });

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  await Otps.markUsed(otpRow.id);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await Users.updatePassword(user.id, passwordHash);
  // Réinitialiser le mot de passe prouve aussi la possession de l'email.
  await Users.markEmailVerified(user.id);

  return res.json({
    token: signToken(user.id, user.role),
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role ?? 'member',
    },
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const user = await Users.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role ?? 'member',
    },
  });
}
