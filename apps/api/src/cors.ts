import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { requestIdHeader } from './requestId.js';

export function setupCors(
  app: FastifyInstance,
  allowedOrigins: string[]
): void {
  void app.register(fastifyCors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', requestIdHeader],
    exposedHeaders: [requestIdHeader, 'Location'],
    maxAge: 600,
  });
}
