import { z } from 'zod';

export const commentLimits = {
  authorMaxLength: 50,
  textMaxLength: 1000,
} as const;

export const commentSchema = z.object({
  id: z.string().min(1),
  bearId: z.string().min(1),
  author: z.string(),
  text: z.string(),
  createdAt: z.iso.datetime(),
  canDelete: z.boolean(),
});

export const commentPageSchema = z.object({
  items: z.array(commentSchema),
  nextCursor: z.string().nullable(),
});

export type CommentPage = z.infer<typeof commentPageSchema>;

export type CommentEntry = z.infer<typeof commentSchema>;

export interface NewComment {
  author: string;
  text: string;
}
