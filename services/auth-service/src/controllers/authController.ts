import type { Request, Response } from 'express';
import { z } from 'zod';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import * as Users from '../models/user.js';
import * as Otps from '../models/otp.js';
import type { OtpPurpose } from '../models/otp.js';
import { sendMail } from '../mailer.js';

function signToken(userId: string): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign(
    { sub: String(userId) },
    process.env.JWT_SECRET || 'change_me_secret',
    { expiresIn }
  );
}

// Génère un OTP à 6 chiffres, le persiste et l'envoie par email.
// Retourne le code (exposé en clair seulement hors production, pour le debug).
async function issueOtp(
  userId: string,
  email: string,
  fullName: string,
  purpose: OtpPurpose
): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
  await Otps.create(userId, otp, ttlMinutes, purpose);

  const subject =
    purpose === 'signup'
      ? 'Votre code de vérification TontineApp'
      : 'Réinitialisation de mot de passe TontineApp';
  const intro =
    purpose === 'signup'
      ? `Bonjour ${fullName}, confirmez votre adresse email avec le code ci-dessous.`
      : `Bonjour ${fullName}, utilisez ce code pour réinitialiser votre mot de passe.`;
  // Envoi en arrière-plan : la réponse HTTP (inscription/connexion) ne doit jamais
  // attendre le SMTP. Le code OTP est déjà persisté ci-dessus. sendMail logue ses erreurs.
  void sendMail(
    email,
    subject,
    `${intro}\n\nCode : ${otp}\n\nIl expire dans ${ttlMinutes} minutes.`,
    `<p>${intro}</p><p style="font-size:24px;font-weight:bold;letter-spacing:3px">${otp}</p><p>Il expire dans ${ttlMinutes} minutes.</p>`
  );
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
  if (phone && (await Users.existsByPhone(phone))) {
    return res.status(409).json({ error: 'Phone already used' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await Users.create(fullName, email, passwordHash, phone ?? null);

  // Vérification de l'email obligatoire : on envoie un OTP, pas de token tout de suite.
  const debugOtp = await issueOtp(user.id, user.email, user.full_name, 'signup');

  const payload: { requiresOtp: true; email: string; debugOtp?: string } = {
    requiresOtp: true,
    email: user.email,
  };
  if (process.env.NODE_ENV !== 'production') payload.debugOtp = debugOtp;
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

  // Email non vérifié : on (re)génère un OTP et on demande la vérification.
  if (user.email_verified === false) {
    const debugOtp = await issueOtp(user.id, user.email, user.full_name, 'signup');
    const payload: { error: string; requiresOtp: true; email: string; debugOtp?: string } = {
      error: 'Email non vérifié',
      requiresOtp: true,
      email: user.email,
    };
    if (process.env.NODE_ENV !== 'production') payload.debugOtp = debugOtp;
    return res.status(403).json(payload);
  }

  return res.json({
    token: signToken(user.id),
    user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
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

  const otp = await issueOtp(user.id, user.email, user.full_name, 'password_reset');

  const payload: { ok: boolean; debugOtp?: string } = { ok: true };
  if (process.env.NODE_ENV !== 'production') payload.debugOtp = otp;
  return res.json(payload);
}

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(10),
});

export async function verifyOtp(req: Request, res: Response) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, otp } = parsed.data;

  const user = await Users.findByEmail(email);
  if (!user) return res.status(400).json({ error: 'Invalid OTP' });

  const otpRow = await Otps.findLatest(user.id, otp);
  if (!otpRow) return res.status(400).json({ error: 'Invalid OTP' });

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  await Otps.markUsed(otpRow.id);
  // La validation d'un OTP prouve la possession de l'email → on le marque vérifié.
  await Users.markEmailVerified(user.id);

  return res.json({
    token: signToken(user.id),
    user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
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
    token: signToken(user.id),
    user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const user = await Users.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
  });
}
