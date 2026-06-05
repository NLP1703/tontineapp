import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

// Mock de la couche DB (même approche que groups.integration.test.ts).
const query = jest.fn<(...args: any[]) => Promise<any>>()
jest.unstable_mockModule('../src/db.js', () => ({ pool: { query } }))

const { createApp } = await import('../src/app.js')
const request = (await import('supertest')).default
const app = createApp()

// L'utilisateur authentifié est 'user-1' (= propriétaire des groupes ci-dessous).
const token = jwt.sign({ sub: 'user-1' }, process.env.JWT_SECRET || 'test_secret')
const auth = { Authorization: `Bearer ${token}` }

beforeEach(() => query.mockReset())

// Séquence DB commune au début de addMember : findById -> findByEmailOrPhone -> isMember.
function mockAddMemberPreamble(owner = 'user-1') {
  query
    .mockResolvedValueOnce({ rows: [{ id: 'g1', owner_user_id: owner, name: 'Tontine A' }] }) // findById
    .mockResolvedValueOnce({ rows: [{ id: 'u2', full_name: 'Bob', email: 'bob@x.cm', phone: null }] }) // findByEmailOrPhone
    .mockResolvedValueOnce({ rows: [] }) // isMember -> pas encore membre
}

describe('Limite Freemium sur l’ajout de membre', () => {
  it('autorise l’ajout quand le groupe est sous la limite du plan (201)', async () => {
    mockAddMemberPreamble()
    query
      .mockResolvedValueOnce({ rows: [{ plan: 'free' }] }) // subscription -> free (limite 10)
      .mockResolvedValueOnce({ rows: [{ n: 5 }] }) // count -> 5 membres
      .mockResolvedValueOnce({ rows: [{ id: 'm2', tontine_id: 'g1', user_id: 'u2', rotation_order: 6 }] }) // add
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }, { user_id: 'u2' }] }) // listUserIds

    const res = await request(app).post('/api/groups/g1/members').set(auth).send({ identifier: 'bob@x.cm' })
    expect(res.status).toBe(201)
  })

  it('bloque l’ajout quand la limite du plan gratuit est atteinte (402)', async () => {
    mockAddMemberPreamble()
    query
      .mockResolvedValueOnce({ rows: [] }) // pas d’abonnement -> plan free par défaut
      .mockResolvedValueOnce({ rows: [{ n: 10 }] }) // count -> 10 membres (= limite free)

    const res = await request(app).post('/api/groups/g1/members').set(auth).send({ identifier: 'bob@x.cm' })
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('PLAN_LIMIT_REACHED')
    expect(res.body.limit).toBe(10)
  })

  it('n’impose aucune limite au plan premium (201 même avec beaucoup de membres)', async () => {
    mockAddMemberPreamble()
    query
      .mockResolvedValueOnce({ rows: [{ plan: 'premium' }] }) // premium -> illimité (pas de count)
      .mockResolvedValueOnce({ rows: [{ id: 'm99', tontine_id: 'g1', user_id: 'u2', rotation_order: 100 }] }) // add
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] }) // listUserIds

    const res = await request(app).post('/api/groups/g1/members').set(auth).send({ identifier: 'bob@x.cm' })
    expect(res.status).toBe(201)
  })
})

describe('API d’abonnement', () => {
  it('GET /api/subscription/plans retourne les 3 plans (200)', async () => {
    const res = await request(app).get('/api/subscription/plans').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.plans).toHaveLength(3)
    const ids = res.body.plans.map((p: any) => p.id)
    expect(ids).toEqual(expect.arrayContaining(['free', 'standard', 'premium']))
  })

  it('GET /api/subscription retourne le plan courant (200)', async () => {
    query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1', plan: 'standard', status: 'active' }] })
    const res = await request(app).get('/api/subscription').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.plan.id).toBe('standard')
    expect(res.body.plan.maxMembersPerGroup).toBe(30)
  })

  it('PUT /api/subscription change de plan (200)', async () => {
    query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1', plan: 'premium', status: 'active' }] }) // upsert
    const res = await request(app).put('/api/subscription').set(auth).send({ plan: 'premium' })
    expect(res.status).toBe(200)
    expect(res.body.plan.id).toBe('premium')
    expect(res.body.plan.maxMembersPerGroup).toBeNull()
  })

  it('PUT /api/subscription refuse un plan invalide (400)', async () => {
    const res = await request(app).put('/api/subscription').set(auth).send({ plan: 'gold' })
    expect(res.status).toBe(400)
  })
})
