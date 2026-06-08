import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

// Mock de la couche DB (les contrôleurs admin n'utilisent que pool.query).
const query = jest.fn<(...args: any[]) => Promise<any>>()
jest.unstable_mockModule('../src/db.js', () => ({ pool: { query } }))

const { createApp } = await import('../src/app.js')
const request = (await import('supertest')).default
const app = createApp()

const SECRET = process.env.JWT_SECRET || 'test_secret'
const adminToken = jwt.sign({ sub: 'admin-1', role: 'super_admin' }, SECRET)
const memberToken = jwt.sign({ sub: 'user-1', role: 'member' }, SECRET)

beforeEach(() => query.mockReset())

describe('auth-service admin — contrôle du rôle', () => {
  it('refuse GET /api/auth/users sans token (401)', async () => {
    const res = await request(app).get('/api/auth/users')
    expect(res.status).toBe(401)
  })

  it('refuse GET /api/auth/users à un non super_admin (403)', async () => {
    const res = await request(app).get('/api/auth/users').set({ Authorization: `Bearer ${memberToken}` })
    expect(res.status).toBe(403)
    // Aucune requête DB ne doit être tentée quand le rôle est refusé.
    expect(query).not.toHaveBeenCalled()
  })

  it('autorise GET /api/auth/users à un super_admin (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u2', full_name: 'Bob', email: 'bob@x.io', role: 'member', is_active: true }] }) // listUsers (rows)
      .mockResolvedValueOnce({ rows: [{ n: 1 }] }) // count
    const res = await request(app).get('/api/auth/users').set({ Authorization: `Bearer ${adminToken}` })
    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(1)
    expect(res.body.total).toBe(1)
  })
})

describe('auth-service admin — changement de rôle + audit', () => {
  it('change le rôle et écrit dans le journal d’audit (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u2', full_name: 'Bob', email: 'bob@x.io', role: 'group_admin', is_active: true }] }) // setRole UPDATE
      .mockResolvedValueOnce({ rows: [] }) // INSERT audit_logs
    const res = await request(app)
      .patch('/api/auth/users/u2/role')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({ role: 'group_admin' })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('group_admin')
    // L'action admin doit être tracée dans audit_logs.
    const insertedAudit = query.mock.calls.some((c) => String(c[0]).includes('audit_logs'))
    expect(insertedAudit).toBe(true)
  })

  it('rejette un rôle invalide (400)', async () => {
    const res = await request(app)
      .patch('/api/auth/users/u2/role')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({ role: 'wizard' })
    expect(res.status).toBe(400)
  })

  it('retourne 404 si l’utilisateur cible n’existe pas', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // setRole UPDATE → aucune ligne
    const res = await request(app)
      .patch('/api/auth/users/ghost/role')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({ role: 'member' })
    expect(res.status).toBe(404)
  })
})
