import { z } from 'zod';

const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string().optional(),
  errors: z
    .array(
      z.object({ in: z.string(), pointer: z.string(), detail: z.string() })
    )
    .optional(),
});

export type ProblemFieldError = NonNullable<
  z.infer<typeof problemSchema>['errors']
>[number];

export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly fieldErrors: ProblemFieldError[];

  constructor(
    message: string,
    status: number,
    requestId: string | null,
    fieldErrors: ProblemFieldError[] = []
  ) {
    super(message);
    this.status = status;
    this.requestId = requestId;
    this.fieldErrors = fieldErrors;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get('x-request-id');
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/problem+json')) {
    const body: unknown = await response.json().catch(() => null);
    const result = problemSchema.safeParse(body);
    if (result.success) {
      return new ApiError(
        result.data.detail,
        response.status,
        requestId,
        result.data.errors
      );
    }
  }

  return new ApiError(
    'Server responded with ' + response.status,
    response.status,
    requestId
  );
}

async function send(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json, application/problem+json');

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

export async function requestJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init: RequestInit = {}
): Promise<T> {
  const response = await send(url, init);
  const result = schema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('Server sent data in an unexpected format');
  }
  return result.data;
}

export async function requestWithoutContent(
  url: string,
  init: RequestInit = {}
): Promise<void> {
  await send(url, init);
}

export function jsonBody(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function describeError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return err instanceof Error ? err.message : String(err);
  }

  const fields = err.fieldErrors.map((fieldError) => {
    const field = fieldError.pointer.replace(/^\//, '');
    return `${field === '' ? fieldError.in : field}: ${fieldError.detail}`;
  });
  const message = [err.message, ...fields].join(' ');
  return err.requestId === null
    ? message
    : `${message} (Request ID: ${err.requestId})`;
}
