import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { bearListSchema, bearSchema } from '../bears/bear.js';
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
        summary: 'List all bears from the Wikipedia list of ursids',
        tags: ['bears'],
        response: {
          200: bearListSchema,
          ...problemResponses(502, 504),
        },
      },
    },
    async () => await bears.listBears()
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
          ...problemResponses(400, 404, 502, 504),
        },
      },
    },
    async (request) => await bears.getBear(request.params.id)
  );
};
