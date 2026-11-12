import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { BearService } from './bears/bearService.js';
import { bearRoutes } from './routes/bears.js';
import { healthRoutes } from './routes/health.js';

export interface AppDependencies {
  bears: BearService;
}

export function buildApp(
  dependencies: AppDependencies,
  options: FastifyServerOptions = {}
): FastifyInstance {
  const app = Fastify(options);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  void app.register(healthRoutes);
  void app.register(bearRoutes, { bears: dependencies.bears });

  return app;
}
