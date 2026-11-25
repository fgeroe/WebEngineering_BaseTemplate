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

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl + path, init);
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${response.status}`);
  }
  return (await response.json()) as T;
}

try {
  // a fresh comment, so every run starts at report_count = 0
  const [bear] = await api<Array<{ id: string }>>('/api/bears');
  if (bear === undefined) throw new Error('No bears. Run npm run db:seed.');
  const comment = await api<{ id: string }>(`/api/bears/${bear.id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'Race test', text: 'Report me' }),
  });

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
