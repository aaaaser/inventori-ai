import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export const hasDatabaseUrl = Boolean(
  connectionString &&
    connectionString.startsWith('postgres') &&
    !connectionString.includes('endpoint-id.region')
);

let dbInstance: ReturnType<typeof drizzle> | null = null;

if (hasDatabaseUrl && connectionString) {
  try {
    const sql = neon(connectionString);
    dbInstance = drizzle(sql, { schema });
  } catch (err) {
    console.error('[DB] Failed to initialize Neon connection:', err);
  }
}

export function isDbConnected(): boolean {
  return Boolean(hasDatabaseUrl && dbInstance);
}

export const db = dbInstance;
export { schema };
