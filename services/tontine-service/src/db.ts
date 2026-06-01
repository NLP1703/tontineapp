import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL in environment');
}

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
});
