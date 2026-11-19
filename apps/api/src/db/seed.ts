import { count, sql, type Column } from 'drizzle-orm';
import { fetchBearsFromWikipedia } from '../bears/wikipediaBears.js';
import { createWikipediaClient } from '../bears/wikipediaClient.js';
import { loadConfig } from '../config.js';
import { UpstreamError } from '../errors.js';
import { createDatabase, type Database } from './client.js';
import { createPool } from './pool.js';
import { bears } from './schema.js';

const ifEmpty = process.argv.includes('--if-empty');

const config = loadConfig();
const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: 1,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});
const db = createDatabase(pool);

function excluded(column: Column): ReturnType<typeof sql.raw> {
  return sql.raw(`excluded."${column.name}"`);
}

async function hasBears(database: Database): Promise<boolean> {
  const [row] = await database.select({ total: count() }).from(bears);
  return (row?.total ?? 0) > 0;
}

async function seed(): Promise<void> {
  if (ifEmpty && (await hasBears(db))) {
    console.log('Bears already seeded, skipping');
    return;
  }

  const wikipedia = createWikipediaClient({
    apiUrl: config.WIKIPEDIA_API_URL,
    timeoutMs: config.WIKIPEDIA_TIMEOUT_MS,
    userAgent: config.WIKIPEDIA_USER_AGENT,
  });
  const fetched = await fetchBearsFromWikipedia(wikipedia);
  const fetchedAt = new Date();

  await db
    .insert(bears)
    .values(fetched.map((bear, position) => ({ ...bear, position, fetchedAt })))
    .onConflictDoUpdate({
      target: bears.id,
      set: {
        position: excluded(bears.position),
        name: excluded(bears.name),
        binomial: excluded(bears.binomial),
        imageUrl: excluded(bears.imageUrl),
        range: excluded(bears.range),
        fetchedAt: excluded(bears.fetchedAt),
      },
    });

  console.log(`Seeded ${fetched.length} bears`);
}

try {
  await seed();
} catch (err) {
  if (ifEmpty && err instanceof UpstreamError) {
    console.warn(`Seeding skipped, Wikipedia not available: ${err.message}`);
  } else {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
