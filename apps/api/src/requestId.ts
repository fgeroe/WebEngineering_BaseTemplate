import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { FastifyInstance } from 'fastify';

export const requestIdHeader = 'x-request-id';

const validRequestId = /^[A-Za-z0-9._:-]{1,128}$/;

export function generateRequestId(request: IncomingMessage): string {
  const incoming = request.headers[requestIdHeader];
  return typeof incoming === 'string' && validRequestId.test(incoming)
    ? incoming
    : randomUUID();
}

export function setupRequestId(app: FastifyInstance): void {
  app.addHook('onRequest', async (request, reply) => {
    void reply.header(requestIdHeader, request.id);
  });
}
