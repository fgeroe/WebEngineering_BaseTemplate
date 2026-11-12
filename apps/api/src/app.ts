import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { healthRoutes } from './routes/health.js';

export function buildApp(options: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify(options);

  void app.register(healthRoutes);

  return app;
}
