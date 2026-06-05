import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

// Mock de la couche DB.
const query = jest.fn<(...args: any[]) => Promise<any>>()
jest.unstable_mockModule('../src/db.js', () => ({ pool: { query } }))

const { createApp } = await import('../src/app.js')
const request = (await import('supertest')).default
const app = createApp()

const token = jwt.sign({ sub: 'user-1' }, process.env.JWT_SECRET || 'test_secret')
const auth = { Authorization: `Bearer ${token}` }

beforeEach(() => query.mockReset())

describe('GET /api/groups', () => {
  it('refuse sans token (401)', async () => {
    const res = await request(app).get('/api/groups')
    expect(res.status).toBe(401)
  })

  it('retourne les groupes de l’utilisateur (200)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'Tontine A' }] })
    const res = await request(app).get('/api/groups').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.groups).toHaveLength(1)
  })
})

describe('POST /api/groups', () => {
  it('crée un groupe et ajoute le créateur comme membre (201)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'Nouvelle', current_cycle: 1 }] }) // create tontine
      .mockResolvedValueOnce({ rows: [{ id: 'm1' }] }) // add member
    const res = await request(app)
      .post('/api/groups')
      .set(auth)
      .send({ name: 'Nouvelle', contributionAmount: 50000, frequency: 'monthly' })
    expect(res.status).toBe(201)
    expect(res.body.group.name).toBe('Nouvelle')
  })

  it('refuse un nom trop court (400)', async () => {
    const res = await request(app).post('/api/groups').set(auth).send({ name: 'X' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/groups/:id/contribute', () => {
  it('enregistre une cotisation et recalcule le score (201)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'g1', current_cycle: 1, contribution_amount: '50000', name: 'A' }] }) // findById tontine
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // isMember
      .mockResolvedValueOnce({ rows: [] }) // rubrics du groupe (aucune → cotisation simple)
      .mockResolvedValueOnce({ rows: [{ id: 'p1', amount: '50000', status: 'paid' }] }) // insert payment
      .mockResolvedValueOnce({ rows: [{ daysLate: 0 }] }) // historyForMember
      .mockResolvedValueOnce({ rows: [] }) // updateReliability
      .mockResolvedValueOnce({ rows: [{ id: 'user-1', full_name: 'Alice' }] }) // findManyByIds (payeur)
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] }) // listUserIds (notif)
    const res = await request(app)
      .post('/api/groups/g1/contribute')
      .set(auth)
      .send({ amount: 50000, senderPhone: '650000000', receiverPhone: '651111111' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('reliabilityScore')
  })

  it('refuse de cotiser à un groupe inexistant (404)', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // findById → introuvable
    const res = await request(app)
      .post('/api/groups/x/contribute')
      .set(auth)
      .send({ amount: 100, senderPhone: '650000000', receiverPhone: '651111111' })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/groups/:id', () => {
  it('retourne le groupe et ses membres (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'A', current_cycle: 1 }] }) // findById
      .mockResolvedValueOnce({ rows: [{ id: 'm1', user_id: 'user-1', rotation_order: 1, reliability_score: '100' }] }) // members
      .mockResolvedValueOnce({ rows: [] }) // rubrics
      .mockResolvedValueOnce({ rows: [] }) // paidUserIdsForCycle (qui a payé ce cycle)
    const res = await request(app).get('/api/groups/g1').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.members).toHaveLength(1)
  })
})

describe('GET /api/groups/:id/rotation', () => {
  it('retourne l’ordre courant, recommandé et le prochain bénéficiaire (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'g1' }] }) // findById
      .mockResolvedValueOnce({
        rows: [
          { user_id: 'a', rotation_order: 1, received_at: null, reliability_score: '90' },
          { user_id: 'b', rotation_order: 2, received_at: null, reliability_score: '95' },
        ],
      })
    const res = await request(app).get('/api/groups/g1/rotation').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.nextBeneficiary.userId).toBe('a')
    expect(res.body.recommendedOrder[0].userId).toBe('b')
  })
})

describe('GET /api/groups/:id/history', () => {
  it('retourne l’historique des cotisations (200)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'g1' }] }) // findById
      .mockResolvedValueOnce({ rows: [{ id: 'p1', amount: '50000', status: 'paid' }] }) // payments
    const res = await request(app).get('/api/groups/g1/history').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.payments).toHaveLength(1)
  })
})
