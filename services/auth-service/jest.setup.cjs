// Variables d'env factices : le Pool pg ne se connecte qu'à la première requête.
// Les tests de validation/sécurité échouent avant tout accès DB.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.NODE_ENV = 'test';
