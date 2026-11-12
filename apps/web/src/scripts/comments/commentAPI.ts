import { jsonBody, requestJson, requestWithoutContent } from '../api';
import {
  commentListSchema,
  commentSchema,
  type CommentEntry,
  type NewComment,
} from './types';

function commentsUrl(bearId: string): string {
  return `/api/bears/${encodeURIComponent(bearId)}/comments`;
}

export async function fetchComments(
  bearId: string,
  signal: AbortSignal
): Promise<CommentEntry[]> {
  return await requestJson(commentsUrl(bearId), commentListSchema, { signal });
}

export async function createComment(
  bearId: string,
  comment: NewComment
): Promise<CommentEntry> {
  return await requestJson(commentsUrl(bearId), commentSchema, {
    method: 'POST',
    ...jsonBody(comment),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await requestWithoutContent(
    `/api/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' }
  );
}
