import type { JSX } from 'react';
import CommentItem from './CommentItem';
import type { CommentEntry } from './types';

interface CommentListProps {
  comments: CommentEntry[];
}

function CommentList({ comments }: CommentListProps): JSX.Element {
  return (
    <ul className="comment-container">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}

export default CommentList;
