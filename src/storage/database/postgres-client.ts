import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'portfolio',
  user: process.env.DB_USER || 'portfolio',
  password: process.env.DB_PASSWORD || 'portfolio123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create drizzle instance with schema
const db = drizzle(pool, { schema });

export { db, pool };
export type Database = typeof db;
