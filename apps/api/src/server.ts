import { buildApp } from './app.js';
import { createAuthService } from './auth/authService.js';
import { createDrizzleSessionRepository } from './auth/drizzleSessionRepository.js';
import { createBearService } from './bears/bearService.js';
import { createDrizzleBearRepository } from './bears/drizzleBearRepository.js';
import { createCommentService } from './comments/commentService.js';
import {
  createDrizzleCommentRepository,
  createDrizzleCommentTransaction,
} from './comments/drizzleCommentRepository.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { createPool, pingDatabase } from './db/pool.js';
import { createDrizzleUserRepository } from './users/drizzleUserRepository.js';
import { createArgon2PasswordHasher } from './users/passwordHasher.js';
import { createUserService } from './users/userService.js';

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
  transaction: createDrizzleCommentTransaction(db),
  reportStrategy: config.REPORT_STRATEGY,
});
const userRepository = createDrizzleUserRepository(db);
const passwords = createArgon2PasswordHasher();
const users = createUserService({ users: userRepository, passwords });
const auth = createAuthService({
  users: userRepository,
  sessions: createDrizzleSessionRepository(db),
  passwords,
  sessionMaxAgeSeconds: config.SESSION_MAX_AGE_SECONDS,
});

const app = buildApp(
  {
    bears,
    comments,
    users,
    auth,
    checkDatabase: async () => {
      await pingDatabase(pool);
    },
    cookieSecure: config.COOKIE_SECURE ?? config.NODE_ENV === 'production',
    bodyLimit: config.BODY_LIMIT_BYTES,
    authRateLimit: {
      max: config.AUTH_RATE_LIMIT_MAX,
      timeWindowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
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
