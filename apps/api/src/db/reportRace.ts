// Sends many reports for ONE new comment at the same time and compares the
// final report_count in the database with the number of reports (Task 5).
// The API must be running. Run with: npm run report:race  (-- --count=50)
import { loadConfig } from '../config.js';
import { createPool } from './pool.js';

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
const countArgument = process.argv.find((arg) => arg.startsWith('--count='));
const reports = Number(countArgument?.split('=')[1] ?? 50);

const config = loadConfig();
const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: 1,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});

try {
  // a fresh comment, so every run starts at report_count = 0. Written
  // directly into the database: creating comments via the API needs a login
  // since Playground 6
  const { rows: created } = await pool.query<{ id: string }>(
    `INSERT INTO comments (bear_id, author, text)
     SELECT id, 'Race test', 'Report me' FROM bears ORDER BY position LIMIT 1
     RETURNING id`
  );
  const comment = created[0];
  if (comment === undefined) throw new Error('No bears. Run npm run db:seed.');

  console.log(
    `Sending ${reports} concurrent reports for comment ${comment.id}`
  );
  const statuses = await Promise.all(
    Array.from({ length: reports }, async () => {
      const response = await fetch(
        `${apiUrl}/api/comments/${comment.id}/report`,
        { method: 'POST' }
      );
      return response.status;
    })
  );
  const ok = statuses.filter((status) => status === 200).length;
  console.log(`Responses: ${ok} x 200, ${reports - ok} other`);

  const { rows } = await pool.query<{
    report_count: number;
    hidden_at: Date | null;
  }>('SELECT report_count, hidden_at FROM comments WHERE id = $1', [
    comment.id,
  ]);
  const finalCount = rows[0]?.report_count ?? 0;
  console.log(`Final report_count: ${finalCount} (expected ${ok})`);
  console.log(`Hidden: ${rows[0]?.hidden_at === null ? 'no' : 'yes'}`);
  console.log(
    finalCount === ok
      ? 'No report was lost.'
      : `LOST UPDATE: ${ok - finalCount} reports were overwritten.`
  );
} catch (err) {
  console.error('Race test failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
