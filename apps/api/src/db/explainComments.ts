import { loadConfig } from '../config.js';
import { createPool } from './pool.js';

const pageSize = 20;
const deepOffset = 5_000;

const config = loadConfig();
const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: 1,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});

const firstPage = `
  SELECT id, bear_id, author, text, created_at FROM comments
  WHERE bear_id = $1
  ORDER BY created_at DESC, id DESC
  LIMIT ${pageSize + 1}`;

const cursorPage = `
  SELECT id, bear_id, author, text, created_at FROM comments
  WHERE bear_id = $1 AND (created_at, id) < ($2::timestamptz, $3::uuid)
  ORDER BY created_at DESC, id DESC
  LIMIT ${pageSize + 1}`;

const offsetPage = `
  SELECT id, bear_id, author, text, created_at FROM comments
  WHERE bear_id = $1
  ORDER BY created_at DESC, id DESC
  OFFSET ${deepOffset} LIMIT ${pageSize + 1}`;

async function explain(
  title: string,
  query: string,
  params: unknown[]
): Promise<void> {
  const { rows } = await pool.query<{ 'QUERY PLAN': string }>(
    `EXPLAIN (ANALYZE, BUFFERS) ${query}`,
    params
  );
  console.log(`\n=== ${title}\n`);
  for (const row of rows) console.log(row['QUERY PLAN']);
}

try {
  const { rows: indexes } = await pool.query<{ indexdef: string }>(
    `SELECT indexdef FROM pg_indexes WHERE tablename = 'comments'`
  );
  console.log('Indexes on comments:');
  for (const index of indexes) console.log(`  ${index.indexdef}`);

  const { rows: top } = await pool.query<{ bear_id: string; total: number }>(
    `SELECT bear_id, count(*)::int AS total FROM comments
     GROUP BY bear_id ORDER BY total DESC LIMIT 1`
  );
  const bear = top[0];
  if (bear === undefined) {
    console.log('No comments yet. Run npm run db:seed:comments first.');
  } else {
    console.log(`\nBear "${bear.bear_id}" has ${bear.total} comments`);
    await explain('First page', firstPage, [bear.bear_id]);

    const { rows: cursorRows } = await pool.query<{
      created_at: Date;
      id: string;
    }>(
      `SELECT created_at, id FROM comments WHERE bear_id = $1
       ORDER BY created_at DESC, id DESC OFFSET ${deepOffset} LIMIT 1`,
      [bear.bear_id]
    );
    const cursor = cursorRows[0];
    if (cursor !== undefined) {
      await explain(`Cursor page after ${deepOffset} comments`, cursorPage, [
        bear.bear_id,
        cursor.created_at,
        cursor.id,
      ]);
      await explain(
        `For comparison: OFFSET ${deepOffset} (not used by the API)`,
        offsetPage,
        [bear.bear_id]
      );
    }
  }
} finally {
  await pool.end();
}
