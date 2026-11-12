import { readFileSync } from 'node:fs';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const packageJsonSchema = z.object({ version: z.string() });

const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  uptime: z.number(),
});

const { version } = packageJsonSchema.parse(
  JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
);

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    { schema: { response: { 200: healthResponseSchema } } },
    async () => ({
      status: 'ok' as const,
      version,
      uptime: process.uptime(),
    })
  );
};
