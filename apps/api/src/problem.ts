import { STATUS_CODES } from 'node:http';
import { z } from 'zod';

export const problemFieldErrorSchema = z
  .object({
    in: z.string().describe('Part of the request: body, params or querystring'),
    pointer: z.string().describe('JSON Pointer to the invalid value'),
    detail: z.string(),
  })
  .meta({ id: 'ProblemFieldError' });

export const problemSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int().min(400).max(599),
    detail: z.string(),
    instance: z.string().describe('Contains the request id of the request'),
    errors: z.array(problemFieldErrorSchema).optional(),
  })
  .meta({
    id: 'Problem',
    description: 'RFC 9457 Problem Details',
  });

export type ProblemFieldError = z.infer<typeof problemFieldErrorSchema>;
export type Problem = z.infer<typeof problemSchema>;

export const problemContentType = 'application/problem+json';

interface ProblemResponse {
  description: string;
  content: Record<typeof problemContentType, { schema: typeof problemSchema }>;
}

export function problemResponses<const Status extends number>(
  ...statuses: Status[]
): Record<Status | 500, ProblemResponse> {
  return Object.fromEntries(
    [...statuses, 500].map((status) => [
      status,
      {
        description: STATUS_CODES[status] ?? 'Error',
        content: { [problemContentType]: { schema: problemSchema } },
      },
    ])
  ) as Record<Status | 500, ProblemResponse>;
}
