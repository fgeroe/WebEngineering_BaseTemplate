import {
  drizzle,
  type NodePgDatabase,
  type NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type pg from 'pg';
import * as schema from './schema.js';

export type Database = NodePgDatabase<typeof schema>;

/** Either the database itself or an open transaction: both can run queries. */
export type Executor = PgDatabase<NodePgQueryResultHKT, typeof schema>;

export function createDatabase(pool: pg.Pool): Database {
  return drizzle(pool, { schema });
}
