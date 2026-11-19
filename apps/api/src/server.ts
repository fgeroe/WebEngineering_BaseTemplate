import { buildApp } from './app.js';
import { createBearService } from './bears/bearService.js';
import { createWikipediaClient } from './bears/wikipediaClient.js';
import { createInMemoryCommentRepository } from './comments/commentRepository.js';
import { createCommentService } from './comments/commentService.js';
import { loadConfig } from './config.js';

const config = loadConfig();

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
    corsOrigins: config.CORS_ORIGINS,
    debugRoutes: config.ENABLE_DEBUG_ROUTES ?? config.NODE_ENV !== 'production',
  },
  { logger: true }
);

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
