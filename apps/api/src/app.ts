import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { BearService } from './bears/bearService.js';
import type { CommentService } from './comments/commentService.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comments.js';
import { healthRoutes } from './routes/health.js';

export interface AppDependencies {
  bears: BearService;
  comments: CommentService;
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
  void app.register(commentRoutes, { comments: dependencies.comments });

  return app;
}
