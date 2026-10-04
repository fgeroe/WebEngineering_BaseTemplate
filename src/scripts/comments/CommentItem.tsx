import type { JSX } from 'react';
import type { CommentEntry } from './types';
import HighlightedText from '../search/HighlightedText';

interface CommentItemProps {
  comment: CommentEntry;
}

function CommentItem({ comment }: CommentItemProps): JSX.Element {
  return (
    <li>
      <p>
        <HighlightedText>{comment.name}</HighlightedText>
      </p>
      <p>
        <HighlightedText>{comment.text}</HighlightedText>
      </p>
    </li>
  );
}

export default CommentItem;
