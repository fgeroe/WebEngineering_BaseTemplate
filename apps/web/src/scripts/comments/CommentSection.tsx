import { useState, type JSX } from 'react';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { useComments } from './useComments';

interface CommentSectionProps {
  bearId: string;
}

function CommentSection({ bearId }: CommentSectionProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { state, addComment, removeComment } = useComments(bearId);

  async function handleDelete(commentId: string): Promise<void> {
    setDeleteError(null);
    try {
      await removeComment(commentId);
    } catch (err) {
      setDeleteError(
        `Not possible to delete comment: ${err instanceof Error ? err.message : String(err)}`
      );
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
        <CommentForm onAddComment={addComment} />

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
      </div>
    </section>
  );
}

export default CommentSection;
