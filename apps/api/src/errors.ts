export class NotFoundError extends Error {
  readonly statusCode: number = 404;
}

export class UpstreamError extends Error {
  readonly statusCode: number = 502;
}

export class UpstreamTimeoutError extends UpstreamError {
  readonly statusCode: number = 504;
}
