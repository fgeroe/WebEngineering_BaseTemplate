import type { ProblemFieldError } from './problem.js';

export abstract class ApiError extends Error {
  abstract readonly status: number;
  abstract readonly type: string;
  abstract readonly title: string;
}

export class ValidationError extends ApiError {
  readonly status = 400;
  readonly type = '/problems/validation-error';
  readonly title = 'Invalid request';
  readonly errors: ProblemFieldError[];

  constructor(message: string, errors: ProblemFieldError[]) {
    super(message);
    this.errors = errors;
  }
}

export class UnauthorizedError extends ApiError {
  readonly status = 401;
  readonly type = '/problems/unauthorized';
  readonly title = 'Unauthorized';
}

export class NotFoundError extends ApiError {
  readonly status = 404;
  readonly type = '/problems/not-found';
  readonly title = 'Resource not found';
}

export class ConflictError extends ApiError {
  readonly status = 409;
  readonly type = '/problems/conflict';
  readonly title = 'Conflict';
}

export class ServiceUnavailableError extends ApiError {
  readonly status = 503;
  readonly type = '/problems/service-unavailable';
  readonly title = 'Service unavailable';
}

export class UpstreamError extends ApiError {
  readonly status: number = 502;
  readonly type: string = '/problems/upstream-error';
  readonly title: string = 'Upstream service failed';
}

export class UpstreamTimeoutError extends UpstreamError {
  readonly status: number = 504;
  readonly type: string = '/problems/upstream-timeout';
  readonly title: string = 'Upstream service timed out';
}
