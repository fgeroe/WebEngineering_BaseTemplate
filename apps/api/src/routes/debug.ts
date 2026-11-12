import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const debugRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/api/debug/error', async () => {
    throw new Error(
      'Simulated failure with internals: connection to db://admin:secret@internal:5432 lost'
    );
  });
};
