import type { JSX } from 'react';
import CommentItem from './CommentItem';
import type { CommentEntry } from './types';

interface CommentListProps {
  comments: CommentEntry[];
  onDelete: (commentId: string) => void;
}

function CommentList({ comments, onDelete }: CommentListProps): JSX.Element {
  return (
    <ul className="comment-container">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onDelete={onDelete} />
      ))}
    </ul>
  );
}

export default CommentList;
