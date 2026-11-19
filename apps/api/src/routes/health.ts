import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { version } from '../version.js';

const healthResponseSchema = z
  .object({
    status: z.literal('ok'),
    version: z.string(),
    uptime: z.number().describe('Process uptime in seconds'),
  })
  .meta({ id: 'Health' });

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        summary: 'Liveness check',
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
};
