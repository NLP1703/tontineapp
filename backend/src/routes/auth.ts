import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


import { pool } from '../db.js';
import { requireAuth } from '../security/requireAuth.js';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { fullName, email, password } = parsed.data;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already used' });

  const passwordHash = await bcrypt.hash(password, 10);

  const userIns = await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, email`,
    [fullName, email, passwordHash]
  );

  return res.status(201).json({ user: userIns.rows[0] });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  const userRes = await pool.query('SELECT id, full_name, email, password_hash FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET || 'change_me_secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') }
  );

  return res.json({
    token,
    user: { id: user.id, fullName: user.full_name, email: user.email },
  });
});

const forgotSchema = z.object({ email: z.string().email() });
router.post('/password/forgot', async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email } = parsed.data;
  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];

  // Always respond 200 to avoid user enumeration
  if (!user) return res.json({ ok: true });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);

  await pool.query(
    `INSERT INTO otps (user_id, code, expires_at, purpose)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval, 'password_reset')`,
    [user.id, otp, ttlMinutes]
  );

  // TODO: send via email/SMS in the future
  return res.json({ ok: true, debugOtp: otp });
});

const verifyOtpSchema = z.object({ email: z.string().email(), otp: z.string().min(4).max(10) });
router.post('/otp/verify', async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, otp } = parsed.data;

  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid OTP' });

  const otpRes = await pool.query(
    `SELECT id, code, expires_at
     FROM otps
     WHERE user_id = $1 AND code = $2 AND purpose = 'password_reset'
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id, otp]
  );

  const otpRow = otpRes.rows[0];
  if (!otpRow) return res.status(400).json({ error: 'Invalid OTP' });

  const expiresAt = new Date(otpRow.expires_at);
  if (expiresAt.getTime() < Date.now()) return res.status(400).json({ error: 'OTP expired' });

  // Mark used
  await pool.query('UPDATE otps SET used_at = NOW() WHERE id = $1', [otpRow.id]);

  const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET || 'change_me_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return res.json({
    token,
    user: { id: user.id },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const userRes = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  return res.json({ user });
});

export default router;

