import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { bearSchema } from '../bears/bear.js';
import type { BearService } from '../bears/bearService.js';
import { problemResponses } from '../problem.js';

export interface BearRoutesOptions {
  bears: BearService;
}

export const bearRoutes: FastifyPluginAsyncZod<BearRoutesOptions> = async (
  app,
  { bears }
) => {
  app.get(
    '/api/bears',
    {
      schema: {
        summary: 'List all bears (from the database)',
        tags: ['bears'],
        querystring: z.object({
          q: z
            .string()
            .max(100)
            .optional()
            .describe('Only bears whose name contains this text'),
        }),
        response: {
          200: z.array(bearSchema),
          ...problemResponses(),
        },
      },
    },
    async (request) => await bears.listBears(request.query.q)
  );

  app.get(
    '/api/bears/:id',
    {
      schema: {
        summary: 'Get one bear by its id',
        tags: ['bears'],
        params: z.object({ id: z.string().min(1) }),
        response: {
          200: bearSchema,
          ...problemResponses(400, 404),
        },
      },
    },
    async (request) => await bears.getBear(request.params.id)
  );
};
