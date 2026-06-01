import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'

// Mock de la couche DB : on simule pool.query sans Postgres réel.
const query = jest.fn<(...args: any[]) => Promise<any>>()
jest.unstable_mockModule('../src/db.js', () => ({ pool: { query } }))

const { createApp } = await import('../src/app.js')
const request = (await import('supertest')).default
const app = createApp()

beforeEach(() => query.mockReset())

describe('POST /api/auth/register', () => {
  it('crée un utilisateur quand l’email est libre (201)', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // existsByEmail → libre
      .mockResolvedValueOnce({ rows: [{ id: 'u1', full_name: 'Jean', email: 'jean@ex.com' }] }) // insert

    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jean', email: 'jean@ex.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('jean@ex.com')
  })

  it('refuse un email déjà utilisé (409)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] }) // existsByEmail → pris

    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jean', email: 'jean@ex.com', password: 'password123' })

    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('retourne un token JWT avec de bons identifiants (200)', async () => {
    const password_hash = await bcrypt.hash('password123', 10)
    query.mockResolvedValueOnce({
      rows: [{ id: 'u1', full_name: 'Jean', email: 'jean@ex.com', password_hash }],
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jean@ex.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.user.email).toBe('jean@ex.com')
  })

  it('refuse un mauvais mot de passe (401)', async () => {
    const password_hash = await bcrypt.hash('autre', 10)
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'jean@ex.com', password_hash }] })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jean@ex.com', password: 'password123' })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/password/forgot', () => {
  it('répond 200 même pour un email inconnu (anti-énumération)', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // findByEmail → inconnu
    const res = await request(app).post('/api/auth/password/forgot').send({ email: 'x@ex.com' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('génère un OTP pour un email connu (200 + debugOtp en dev)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] }) // findByEmail → connu
      .mockResolvedValueOnce({ rows: [] }) // insert otp
    const res = await request(app).post('/api/auth/password/forgot').send({ email: 'jean@ex.com' })
    expect(res.status).toBe(200)
    expect(res.body.debugOtp).toMatch(/^\d{6}$/)
  })
})

describe('POST /api/auth/otp/verify', () => {
  it('valide un OTP correct et retourne un token (200)', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] }) // findByEmail
      .mockResolvedValueOnce({ rows: [{ id: 'o1', code: '123456', expires_at: future }] }) // findLatest
      .mockResolvedValueOnce({ rows: [] }) // markUsed
    const res = await request(app).post('/api/auth/otp/verify').send({ email: 'jean@ex.com', otp: '123456' })
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
  })

  it('refuse un OTP expiré (400)', async () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'o1', code: '123456', expires_at: past }] })
    const res = await request(app).post('/api/auth/otp/verify').send({ email: 'jean@ex.com', otp: '123456' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  it('retourne le profil avec un token valide (200)', async () => {
    const jwtMod = (await import('jsonwebtoken')).default
    const token = jwtMod.sign({ sub: 'u1' }, process.env.JWT_SECRET || 'test_secret')
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', full_name: 'Jean', email: 'jean@ex.com' }] })
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe('u1')
  })

  it('refuse un token invalide (401)', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer faux')
    expect(res.status).toBe(401)
  })
})
