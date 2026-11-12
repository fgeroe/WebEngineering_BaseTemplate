import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from 'fastify-type-provider-zod';
import { version } from './version.js';

export const docsPrefix = '/api/docs';

export function setupDocs(app: FastifyInstance): void {
  void app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Bears BFF API',
        description:
          'Backend for Frontend for the bear wildlife website. Every error is returned as RFC 9457 Problem Details.',
        version,
      },
      tags: [
        { name: 'health', description: 'Service status' },
        { name: 'bears', description: 'Bears from Wikipedia' },
        { name: 'comments', description: 'Comments on bears' },
      ],
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  void app.register(fastifySwaggerUi, { routePrefix: docsPrefix });
}
