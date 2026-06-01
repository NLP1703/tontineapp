import request from 'supertest';
import { createApp } from '../src/app.js';

// Tests d'intégration ne nécessitant PAS de base de données :
// validation des entrées et protection des routes (échec avant tout accès DB).
const app = createApp();

describe('auth-service — santé & sécurité', () => {
  it('GET /health retourne ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/auth/me sans token retourne 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('auth-service — validation register', () => {
  it('rejette un email invalide (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jean Dupont', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejette un mot de passe trop court (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jean Dupont', email: 'jean@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('auth-service — validation login', () => {
  it('rejette un corps vide (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
