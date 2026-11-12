import { STATUS_CODES } from 'node:http';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ApiError, NotFoundError, ValidationError } from './errors.js';
import { problemContentType, type Problem } from './problem.js';

type ProblemWithoutInstance = Omit<Problem, 'instance'>;

const internalProblem: ProblemWithoutInstance = {
  type: '/problems/internal-error',
  title: 'Internal server error',
  status: 500,
  detail: 'An unexpected error occurred. Please try again later.',
};

function isFastifyClientError(
  error: unknown
): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('FST_') &&
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  );
}

function fromApiError(error: ApiError): ProblemWithoutInstance {
  return {
    type: error.type,
    title: error.title,
    status: error.status,
    detail: error.message,
    ...(error instanceof ValidationError ? { errors: error.errors } : {}),
  };
}

function toProblem(error: unknown): ProblemWithoutInstance {
  if (error instanceof ApiError) {
    return fromApiError(error);
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    const location = error.validationContext ?? 'request';
    return fromApiError(
      new ValidationError(
        `The request ${location} is invalid.`,
        error.validation.map((issue) => ({
          in: location,
          pointer: issue.instancePath === '' ? '/' : issue.instancePath,
          detail: issue.message ?? 'Invalid value',
        }))
      )
    );
  }

  if (isFastifyClientError(error)) {
    return {
      type: 'about:blank',
      title: STATUS_CODES[error.statusCode] ?? 'Client error',
      status: error.statusCode,
      detail: error.message,
    };
  }

  return internalProblem;
}

async function sendProblem(
  request: FastifyRequest,
  reply: FastifyReply,
  problem: ProblemWithoutInstance
): Promise<FastifyReply> {
  const body: Problem = {
    ...problem,
    instance: `urn:request-id:${request.id}`,
  };
  return await reply.code(problem.status).type(problemContentType).send(body);
}

export function setupErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler(async (request, reply) => {
    const error = new NotFoundError(
      `Route ${request.method} ${request.url} does not exist.`
    );
    request.log.info({ err: error }, error.message);
    return await sendProblem(request, reply, fromApiError(error));
  });

  app.setErrorHandler(async (error, request, reply) => {
    const problem = toProblem(error);
    if (problem.status >= 500) {
      request.log.error({ err: error }, problem.detail);
    } else {
      request.log.info({ err: error }, problem.detail);
    }
    return await sendProblem(request, reply, problem);
  });
}
