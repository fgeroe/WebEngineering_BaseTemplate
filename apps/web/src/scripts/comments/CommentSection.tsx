import { useState, type JSX } from 'react';
import { Link } from 'react-router';
import { describeError } from '../api';
import { useAuth } from '../auth/authContext';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { useComments } from './useComments';

interface CommentSectionProps {
  bearId: string;
}

function CommentSection({ bearId }: CommentSectionProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const { state: auth } = useAuth();
  const viewerKey =
    auth.status === 'loading'
      ? null
      : auth.status === 'authenticated'
        ? auth.user.id
        : 'anonymous';
  const { state, addComment, removeComment, loadMore } = useComments(
    bearId,
    viewerKey
  );

  async function handleDelete(commentId: string): Promise<void> {
    setDeleteError(null);
    try {
      await removeComment(commentId);
    } catch (err) {
      setDeleteError(`Not possible to delete comment: ${describeError(err)}`);
    }
  }

  async function handleLoadMore(): Promise<void> {
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      await loadMore();
    } catch (err) {
      setLoadMoreError(
        `Not possible to load more comments: ${describeError(err)}`
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <section className="comments">
      <button
        type="button"
        className="show-hide"
        aria-expanded={isVisible}
        onClick={() => {
          setIsVisible((previous) => !previous);
        }}
      >
        {isVisible ? 'Hide comments' : 'Show comments'}
      </button>

      <div className="comment-wrapper" hidden={!isVisible}>
        <h4>Add comment</h4>
        {auth.status === 'authenticated' ? (
          <CommentForm onAddComment={addComment} />
        ) : (
          <p className="comment-login-hint">
            Please <Link to="/login">log in</Link> or{' '}
            <Link to="/register">create an account</Link> to write a comment.
          </p>
        )}

        <h4>Comments</h4>

        {state.status === 'loading' && <p>Loading comments…</p>}

        {state.status === 'error' && (
          <p role="alert" style={{ color: '#c33' }}>
            Not possible to load comments: {state.message}
          </p>
        )}

        {deleteError !== null && (
          <p role="alert" style={{ color: '#c33' }}>
            {deleteError}
          </p>
        )}

        {state.status === 'success' && state.comments.length === 0 && (
          <p>No comments yet.</p>
        )}

        {state.status === 'success' && (
          <CommentList
            comments={state.comments}
            onDelete={(commentId) => {
              void handleDelete(commentId);
            }}
          />
        )}

        {state.status === 'success' && state.nextCursor !== null && (
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => {
              void handleLoadMore();
            }}
          >
            {isLoadingMore ? 'Loading…' : 'Load more comments'}
          </button>
        )}

        {loadMoreError !== null && (
          <p role="alert" style={{ color: '#c33' }}>
            {loadMoreError}
          </p>
        )}
      </div>
    </section>
  );
}

export default CommentSection;
