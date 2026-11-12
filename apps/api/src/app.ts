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
import { setupCors } from './cors.js';
import { setupDocs } from './docs.js';
import { setupErrorHandling } from './errorHandler.js';
import { generateRequestId, setupRequestId } from './requestId.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comments.js';
import { debugRoutes } from './routes/debug.js';
import { healthRoutes } from './routes/health.js';

export interface AppOptions {
  bears: BearService;
  comments: CommentService;
  corsOrigins?: string[];
  debugRoutes?: boolean;
}

export function buildApp(
  {
    bears,
    comments,
    corsOrigins = [],
    debugRoutes: enableDebugRoutes = false,
  }: AppOptions,
  fastifyOptions: FastifyServerOptions = {}
): FastifyInstance {
  const app = Fastify({
    requestIdHeader: false,
    genReqId: generateRequestId,
    requestIdLogLabel: 'requestId',
    ...fastifyOptions,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  setupRequestId(app);
  setupErrorHandling(app);
  setupCors(app, corsOrigins);
  setupDocs(app);

  void app.register(healthRoutes);
  void app.register(bearRoutes, { bears });
  void app.register(commentRoutes, { comments });
  if (enableDebugRoutes) {
    void app.register(debugRoutes);
  }

  return app;
}
