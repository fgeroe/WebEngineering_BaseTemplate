import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { setupAuthHooks } from './auth/authHooks.js';
import type { AuthService } from './auth/authService.js';
import type { BearService } from './bears/bearService.js';
import type { CommentService } from './comments/commentService.js';
import { setupCors } from './cors.js';
import { setupDocs } from './docs.js';
import { setupErrorHandling } from './errorHandler.js';
import { TooManyRequestsError } from './errors.js';
import { generateRequestId, setupRequestId } from './requestId.js';
import { authRoutes } from './routes/auth.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comments.js';
import { debugRoutes } from './routes/debug.js';
import { healthRoutes } from './routes/health.js';
import type { UserService } from './users/userService.js';

export interface AppOptions {
  bears: BearService;
  comments: CommentService;
  users: UserService;
  auth: AuthService;
  checkDatabase: () => Promise<void>;
  cookieSecure?: boolean;
  corsOrigins?: string[];
  debugRoutes?: boolean;
  /** Largest accepted request body in bytes (413 above). */
  bodyLimit?: number;
  /** Rate limit for login and register, per client IP. */
  authRateLimit?: { max: number; timeWindowMs: number };
}

export function buildApp(
  {
    bears,
    comments,
    users,
    auth,
    checkDatabase,
    cookieSecure = false,
    corsOrigins = [],
    debugRoutes: enableDebugRoutes = false,
    bodyLimit = 16 * 1024,
    authRateLimit = { max: 5, timeWindowMs: 60_000 },
  }: AppOptions,
  fastifyOptions: FastifyServerOptions = {}
): FastifyInstance {
  const app = Fastify({
    requestIdHeader: false,
    genReqId: generateRequestId,
    requestIdLogLabel: 'requestId',
    bodyLimit,
    ...fastifyOptions,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  setupRequestId(app);
  setupErrorHandling(app);
  // security headers on every response (nosniff, frame-ancestors, HSTS, ...)
  void app.register(fastifyHelmet);
  setupCors(app, corsOrigins);
  // only routes with a rateLimit config are limited (login, register)
  void app.register(fastifyRateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) =>
      new TooManyRequestsError(
        `Too many attempts. Try again in ${context.after}.`
      ),
  });
  setupDocs(app);
  void app.register(fastifyCookie);
  const hooks = setupAuthHooks(app, auth);

  void app.register(healthRoutes, { checkDatabase });
  void app.register(bearRoutes, { bears });
  void app.register(commentRoutes, { comments, hooks });
  void app.register(authRoutes, {
    users,
    auth,
    cookieSecure,
    rateLimit: authRateLimit,
  });
  if (enableDebugRoutes) {
    void app.register(debugRoutes);
  }

  return app;
}
