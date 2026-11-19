import { buildApp } from './app.js';
import { createBearService } from './bears/bearService.js';
import { createDrizzleBearRepository } from './bears/drizzleBearRepository.js';
import { createCommentService } from './comments/commentService.js';
import { createDrizzleCommentRepository } from './comments/drizzleCommentRepository.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { createPool, pingDatabase } from './db/pool.js';

const config = loadConfig();

const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: config.DB_POOL_MAX,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});

const db = createDatabase(pool);

const bears = createBearService(createDrizzleBearRepository(db));
const comments = createCommentService({
  bears,
  comments: createDrizzleCommentRepository(db),
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
