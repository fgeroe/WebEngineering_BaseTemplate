import { buildApp } from './app.js';
import { createBearService } from './bears/bearService.js';
import { createWikipediaClient } from './bears/wikipediaClient.js';
import { createInMemoryCommentRepository } from './comments/commentRepository.js';
import { createCommentService } from './comments/commentService.js';
import { loadConfig } from './config.js';
import { createPool, pingDatabase } from './db/pool.js';

const config = loadConfig();

const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: config.DB_POOL_MAX,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});

const wikipedia = createWikipediaClient({
  apiUrl: config.WIKIPEDIA_API_URL,
  timeoutMs: config.WIKIPEDIA_TIMEOUT_MS,
  userAgent: config.WIKIPEDIA_USER_AGENT,
});

const bears = createBearService(wikipedia);
const comments = createCommentService({
  bears,
  comments: createInMemoryCommentRepository(),
});

const app = buildApp(
  {
    bears,
    comments,
    checkDatabase: async () => {
      await pingDatabase(pool);
    },
    corsOrigins: config.CORS_ORIGINS,
    debugRoutes: config.ENABLE_DEBUG_ROUTES ?? config.NODE_ENV !== 'production',
  },
  { logger: true }
);

pool.on('error', (err) => {
  app.log.warn({ err }, 'Idle database connection failed');
});

app.addHook('onClose', async () => {
  await pool.end();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info(`Received ${signal}, shutting down`);
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
