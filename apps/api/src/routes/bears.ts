import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { bearListSchema, bearSchema } from '../bears/bear.js';
import type { BearService } from '../bears/bearService.js';

export interface BearRoutesOptions {
  bears: BearService;
}

export const bearRoutes: FastifyPluginAsyncZod<BearRoutesOptions> = async (
  app,
  { bears }
) => {
  app.get(
    '/api/bears',
    { schema: { response: { 200: bearListSchema } } },
    async () => await bears.listBears()
  );

  app.get(
    '/api/bears/:id',
    {
      schema: {
        params: z.object({ id: z.string().min(1) }),
        response: { 200: bearSchema },
      },
    },
    async (request) => await bears.getBear(request.params.id)
  );
};
