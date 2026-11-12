import { buildApp } from './app.js';
import { createBearService } from './bears/bearService.js';
import { createWikipediaClient } from './bears/wikipediaClient.js';
import { loadConfig } from './config.js';

const config = loadConfig();

const wikipedia = createWikipediaClient({
  apiUrl: config.WIKIPEDIA_API_URL,
  timeoutMs: config.WIKIPEDIA_TIMEOUT_MS,
  userAgent: config.WIKIPEDIA_USER_AGENT,
});

const app = buildApp({ bears: createBearService(wikipedia) }, { logger: true });

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
