import { z } from 'zod';

export const commentLimits = {
  authorMaxLength: 50,
  textMaxLength: 1000,
} as const;

/** A comment as the API returns it to one particular viewer. */
export const commentSchema = z
  .object({
    id: z.uuid(),
    bearId: z.string().min(1),
    author: z.string().min(1).max(commentLimits.authorMaxLength),
    text: z.string().min(1).max(commentLimits.textMaxLength),
    createdAt: z.iso.datetime(),
    canDelete: z
      .boolean()
      .describe('Whether the current user may delete this comment'),
  })
  .meta({ id: 'Comment' });

export const newCommentSchema = z
  .object({
    author: z.string().trim().min(1).max(commentLimits.authorMaxLength),
    text: z.string().trim().min(1).max(commentLimits.textMaxLength),
  })
  .meta({ id: 'NewComment' });

export type CommentView = z.infer<typeof commentSchema>;

/** What is stored about a comment. */
export interface Comment {
  id: string;
  bearId: string;
  /** null: written before logins existed, or the account was deleted */
  authorId: string | null;
  author: string;
  text: string;
  createdAt: string;
}
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
