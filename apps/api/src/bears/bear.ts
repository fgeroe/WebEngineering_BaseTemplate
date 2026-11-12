import { z } from 'zod';

export const bearSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  binomial: z.string().min(1),
  imageUrl: z.url().nullable(),
  range: z.string().min(1),
});

export const bearListSchema = z
  .array(bearSchema)
  .min(1)
  .refine(
    (bears) => new Set(bears.map((bear) => bear.id)).size === bears.length,
    'Bear ids must be unique'
  );

export type Bear = z.infer<typeof bearSchema>;
