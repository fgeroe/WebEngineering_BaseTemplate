import { loadConfig } from '../config.js';
import { createPool } from './pool.js';

const countArgument = process.argv.find((arg) => arg.startsWith('--count='));
const count = Number(countArgument?.split('=')[1] ?? 100_000);

const config = loadConfig();
const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: 1,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});

try {
  const result = await pool.query(
    `WITH bear_ids AS (SELECT array_agg(id ORDER BY position) AS ids FROM bears)
     INSERT INTO comments (bear_id, author, text, created_at)
     SELECT ids[1 + (n % array_length(ids, 1))],
            'Load test',
            'Generated comment #' || n,
            date_trunc('milliseconds', now() - n * interval '1 minute')
     FROM bear_ids, generate_series(1, $1::int) AS n
     WHERE array_length(ids, 1) > 0`,
    [count]
  );
  if (result.rowCount === 0) {
    console.error('No bears in the database. Run npm run db:seed first.');
    process.exitCode = 1;
  } else {
    await pool.query('ANALYZE comments');
    console.log(`Inserted ${result.rowCount} comments`);
  }
} catch (err) {
  console.error('Seeding comments failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
