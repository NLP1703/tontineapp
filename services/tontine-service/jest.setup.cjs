// Variables d'env factices pour les tests (pas de DB réelle, JWT déterministe).
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.NODE_ENV = 'test';
