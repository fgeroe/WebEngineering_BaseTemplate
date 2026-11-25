import { jsonBody, requestJson, requestWithoutContent } from '../api';
import {
  commentPageSchema,
  commentSchema,
  type CommentEntry,
  type CommentPage,
  type NewComment,
} from './types';

const pageSize = 10;

function commentsUrl(bearId: string): string {
  return `/api/bears/${encodeURIComponent(bearId)}/comments`;
}

export async function fetchComments(
  bearId: string,
  cursor: string | null,
  signal?: AbortSignal
): Promise<CommentPage> {
  const params = new URLSearchParams({ limit: String(pageSize) });
  if (cursor !== null) {
    params.set('cursor', cursor);
  }
  return await requestJson(
    `${commentsUrl(bearId)}?${params.toString()}`,
    commentPageSchema,
    { signal }
  );
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
