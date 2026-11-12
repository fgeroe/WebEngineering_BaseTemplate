import { useState, type JSX } from 'react';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import type { CommentEntry } from './types';

const initialComments: CommentEntry[] = [
  {
    id: 'bob-fossil',
    name: 'Bob Fossil',
    text: 'Oh I am so glad you taught me all about the big brown angry guys...',
  },
];

function CommentSection(): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [comments, setComments] = useState<CommentEntry[]>(initialComments);

  function addComment(comment: CommentEntry): void {
    setComments((previous) => [...previous, comment]);
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
        <CommentList comments={comments} />
      </div>
    </section>
  );
}

export default CommentSection;
