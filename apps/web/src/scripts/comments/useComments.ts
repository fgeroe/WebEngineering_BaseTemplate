import { useEffect, useState } from 'react';
import { describeError } from '../api';
import { createComment, deleteComment, fetchComments } from './commentAPI';
import type { CommentEntry, NewComment } from './types';

export type CommentsState =
  | { status: 'loading' }
  | {
      status: 'success';
      bearId: string;
      comments: CommentEntry[];
      nextCursor: string | null;
    }
  | { status: 'error'; message: string };

export interface UseCommentsResult {
  state: CommentsState;
  addComment: (comment: NewComment) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useComments(bearId: string): UseCommentsResult {
  const [state, setState] = useState<CommentsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const page = await fetchComments(bearId, null, controller.signal);
        if (controller.signal.aborted) return;
        setState({
          status: 'success',
          bearId,
          comments: page.items,
          nextCursor: page.nextCursor,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('fetchComments:', err);
        setState({ status: 'error', message: describeError(err) });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [bearId]);

  async function loadMore(): Promise<void> {
    if (state.status !== 'success' || state.nextCursor === null) return;
    const page = await fetchComments(state.bearId, state.nextCursor);
    setState((previous) =>
      // ignore the answer if the user switched to another bear meanwhile
      previous.status === 'success' && previous.bearId === state.bearId
        ? {
            ...previous,
            comments: [...previous.comments, ...page.items],
            nextCursor: page.nextCursor,
          }
        : previous
    );
  }

  async function addComment(comment: NewComment): Promise<void> {
    const created = await createComment(bearId, comment);
    // newest first: a new comment goes to the top
    setState((previous) =>
      previous.status === 'success'
        ? { ...previous, comments: [created, ...previous.comments] }
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

  return { state, addComment, removeComment, loadMore };
}
