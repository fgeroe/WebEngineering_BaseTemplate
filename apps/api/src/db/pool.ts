import pg from 'pg';

export interface PoolOptions {
  connectionString: string;
  max: number;
  connectionTimeoutMs: number;
}

export function createPool({
  connectionString,
  max,
  connectionTimeoutMs,
}: PoolOptions): pg.Pool {
  return new pg.Pool({
    connectionString,
    max,
    connectionTimeoutMillis: connectionTimeoutMs,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
  });
}

export async function pingDatabase(pool: pg.Pool): Promise<void> {
  await pool.query('SELECT 1');
}
