import type { JSX } from 'react';
import type { CommentEntry } from './types';
import HighlightedText from '../search/HighlightedText';

interface CommentItemProps {
  comment: CommentEntry;
  onDelete: (commentId: string) => void;
}

function CommentItem({ comment, onDelete }: CommentItemProps): JSX.Element {
  return (
    <li>
      <p>
        <HighlightedText>{comment.author}</HighlightedText>{' '}
        <time dateTime={comment.createdAt}>
          {new Date(comment.createdAt).toLocaleString()}
        </time>
      </p>
      <p>
        <HighlightedText>{comment.text}</HighlightedText>
      </p>
      {/* only shown where the server would allow it; the server still
          checks every DELETE itself */}
      {comment.canDelete && (
        <button
          type="button"
          onClick={() => {
            onDelete(comment.id);
          }}
        >
          Delete comment
        </button>
      )}
    </li>
  );
}

export default CommentItem;
