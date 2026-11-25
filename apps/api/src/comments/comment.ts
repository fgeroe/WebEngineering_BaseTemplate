import { z } from 'zod';

export const commentLimits = {
  authorMaxLength: 50,
  textMaxLength: 1000,
} as const;

export const commentSchema = z
  .object({
    id: z.uuid(),
    bearId: z.string().min(1),
    author: z.string().min(1).max(commentLimits.authorMaxLength),
    text: z.string().min(1).max(commentLimits.textMaxLength),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Comment' });

export const newCommentSchema = z
  .object({
    author: z.string().trim().min(1).max(commentLimits.authorMaxLength),
    text: z.string().trim().min(1).max(commentLimits.textMaxLength),
  })
  .meta({ id: 'NewComment' });

export type Comment = z.infer<typeof commentSchema>;
export type NewComment = z.infer<typeof newCommentSchema>;

export const commentPageSchema = z
  .object({
    items: z.array(commentSchema),
    nextCursor: z
      .string()
      .nullable()
      .describe('Send as ?cursor= to get the next page; null on the last page'),
  })
  .meta({ id: 'CommentPage' });

export type CommentPage = z.infer<typeof commentPageSchema>;

export const commentReportSchema = z
  .object({
    id: z.uuid(),
    reportCount: z.number().int().nonnegative(),
    hidden: z.boolean(),
  })
  .meta({ id: 'CommentReport' });

export type CommentReport = z.infer<typeof commentReportSchema>;

/** Moderation state of a comment, stored next to it. */
export interface ReportState {
  reportCount: number;
  hiddenAt: string | null;
}
