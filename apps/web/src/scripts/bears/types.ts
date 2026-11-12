import { z } from 'zod';

export const bearSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  binomial: z.string().min(1),
  imageUrl: z.url().nullable(),
  range: z.string(),
});

export const bearListSchema = z.array(bearSchema);

export type Bear = z.infer<typeof bearSchema>;
