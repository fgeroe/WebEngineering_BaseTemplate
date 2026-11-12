import { z } from 'zod';

export const problemFieldErrorSchema = z.object({
  in: z.string(),
  pointer: z.string(),
  detail: z.string(),
});

export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string(),
  instance: z.string(),
  errors: z.array(problemFieldErrorSchema).optional(),
});

export type ProblemFieldError = z.infer<typeof problemFieldErrorSchema>;
export type Problem = z.infer<typeof problemSchema>;

export const problemContentType = 'application/problem+json';
