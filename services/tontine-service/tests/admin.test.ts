import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

// Mock de la couche DB.
const query = jest.fn<(...args: any[]) => Promise<any>>()
jest.unstable_mockModule('../src/db.js', () => ({ pool: { query } }))

// Évite tout appel réseau réel vers le notification-service pendant les tests.
;(global as any).fetch = jest.fn(async () => ({ ok: true }))

const { createApp } = await import('../src/app.js')
const request = (await import('supertest')).default
const app = createApp()

const SECRET = process.env.JWT_SECRET || 'test_secret'
const adminToken = jwt.sign({ sub: 'admin-1', role: 'super_admin' }, SECRET)
const memberToken = jwt.sign({ sub: 'user-1', role: 'member' }, SECRET)

beforeEach(() => query.mockReset())

describe('tontine-service admin — contrôle du rôle', () => {
  it('refuse GET /api/admin/groups sans token (401)', async () => {
    const res = await request(app).get('/api/admin/groups')
    expect(res.status).toBe(401)
  })

  it('refuse GET /api/admin/groups à un non super_admin (403)', async () => {
    const res = await request(app).get('/api/admin/groups').set({ Authorization: `Bearer ${memberToken}` })
    expect(res.status).toBe(403)
    expect(query).not.toHaveBeenCalled()
  })

  it('autorise GET /api/admin/groups à un super_admin (200)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'A', member_count: 2, total_collected: 1000 }] })
    const res = await request(app).get('/api/admin/groups').set({ Authorization: `Bearer ${adminToken}` })
    expect(res.status).toBe(200)
    expect(res.body.groups).toHaveLength(1)
  })
})

describe('tontine-service admin — force-rotation + audit', () => {
  it('force la rotation, choisit le bon bénéficiaire et trace l’audit (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'A', current_cycle: 1 }] }) // findById
      .mockResolvedValueOnce({
        rows: [
          { user_id: 'a', rotation_order: 1, received_at: null, reliability_score: '90', payout_date: null },
          { user_id: 'b', rotation_order: 2, received_at: null, reliability_score: '95', payout_date: null },
        ],
      }) // listByTontine
      .mockResolvedValueOnce({ rows: [] }) // markReceived UPDATE
      .mockResolvedValueOnce({ rows: [{ user_id: 'a' }, { user_id: 'b' }] }) // listUserIds (notif)
      .mockResolvedValueOnce({ rows: [] }) // INSERT audit_logs

    const res = await request(app)
      .post('/api/admin/groups/g1/force-rotation')
      .set({ Authorization: `Bearer ${adminToken}` })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.beneficiary).toBe('a') // plus petit rotation_order
    expect(res.body.cycleAdvanced).toBe(false) // 'b' reste en attente
    const insertedAudit = query.mock.calls.some((c) => String(c[0]).includes('audit_logs'))
    expect(insertedAudit).toBe(true)
  })

  it('retourne 404 si le groupe n’existe pas', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // findById → introuvable
    const res = await request(app)
      .post('/api/admin/groups/ghost/force-rotation')
      .set({ Authorization: `Bearer ${adminToken}` })
    expect(res.status).toBe(404)
  })
})

describe('tontine-service admin — validation de transaction + audit', () => {
  it('valide une cotisation contestée et trace l’audit (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'p1', status: 'paid', days_late: 0 }] }) // validateTransaction UPDATE
      .mockResolvedValueOnce({ rows: [] }) // INSERT audit_logs
    const res = await request(app)
      .patch('/api/admin/transactions/p1/validate')
      .set({ Authorization: `Bearer ${adminToken}` })
    expect(res.status).toBe(200)
    expect(res.body.transaction.status).toBe('paid')
    const insertedAudit = query.mock.calls.some((c) => String(c[0]).includes('audit_logs'))
    expect(insertedAudit).toBe(true)
  })
})
