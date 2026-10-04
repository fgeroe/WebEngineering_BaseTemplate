import type { JSX } from 'react';
import type { CommentEntry } from './types';

interface CommentItemProps {
  comment: CommentEntry;
}

function CommentItem({ comment }: CommentItemProps): JSX.Element {
  return (
    <li>
      <p>{comment.name}</p>
      <p>{comment.text}</p>
    </li>
  );
}

export default CommentItem;
