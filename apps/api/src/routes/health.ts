import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ServiceUnavailableError } from '../errors.js';
import { problemResponses } from '../problem.js';
import { version } from '../version.js';

export interface HealthRoutesOptions {
  checkDatabase: () => Promise<void>;
}

const healthResponseSchema = z
  .object({
    status: z.literal('ok'),
    version: z.string(),
    uptime: z.number().describe('Process uptime in seconds'),
  })
  .meta({ id: 'Health' });

const readyResponseSchema = z
  .object({
    status: z.literal('ready'),
    checks: z.object({ database: z.literal('ok') }),
  })
  .meta({ id: 'Readiness' });

export const healthRoutes: FastifyPluginAsyncZod<HealthRoutesOptions> = async (
  app,
  { checkDatabase }
) => {
  app.get(
    '/health',
    {
      schema: {
        summary: 'Liveness check (does not touch the database)',
        tags: ['health'],
        response: { 200: healthResponseSchema },
      },
    },
    async () => ({
      status: 'ok' as const,
      version,
      uptime: process.uptime(),
    })
  );

  app.get(
    '/health/ready',
    {
      schema: {
        summary: 'Readiness check (database answers a trivial query)',
        tags: ['health'],
        response: {
          200: readyResponseSchema,
          ...problemResponses(503),
        },
      },
    },
    async () => {
      try {
        await checkDatabase();
      } catch (err) {
        throw new ServiceUnavailableError('The database is not reachable.', {
          cause: err,
        });
      }
      return { status: 'ready' as const, checks: { database: 'ok' as const } };
    }
  );
};
