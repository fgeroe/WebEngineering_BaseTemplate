import { readFileSync } from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';

interface HealthResponse {
  status: 'ok';
  version: string;
  uptime: number;
}

function readVersion(): string {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  );
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('version' in raw) ||
    typeof raw.version !== 'string'
  ) {
    throw new Error('package.json does not contain a version string');
  }
  return raw.version;
}

const version = readVersion();

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Reply: HealthResponse }>(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            required: ['status', 'version', 'uptime'],
            properties: {
              status: { type: 'string', enum: ['ok'] },
              version: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async () => ({
      status: 'ok',
      version,
      uptime: process.uptime(),
    })
  );
};
