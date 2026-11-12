import { useEffect, useState } from 'react';
import { createComment, deleteComment, fetchComments } from './commentAPI';
import type { CommentEntry, NewComment } from './types';

export type CommentsState =
  | { status: 'loading' }
  | { status: 'success'; comments: CommentEntry[] }
  | { status: 'error'; message: string };

export interface UseCommentsResult {
  state: CommentsState;
  addComment: (comment: NewComment) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function useComments(bearId: string): UseCommentsResult {
  const [state, setState] = useState<CommentsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const comments = await fetchComments(bearId, controller.signal);
        if (controller.signal.aborted) return;
        setState({ status: 'success', comments });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('fetchComments:', err);
        setState({ status: 'error', message: errorMessage(err) });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [bearId]);

  async function addComment(comment: NewComment): Promise<void> {
    const created = await createComment(bearId, comment);
    setState((previous) =>
      previous.status === 'success'
        ? { ...previous, comments: [...previous.comments, created] }
        : previous
    );
  }

  async function removeComment(commentId: string): Promise<void> {
    await deleteComment(commentId);
    setState((previous) =>
      previous.status === 'success'
        ? {
            ...previous,
            comments: previous.comments.filter(
              (comment) => comment.id !== commentId
            ),
          }
        : previous
    );
  }

  return { state, addComment, removeComment };
}
