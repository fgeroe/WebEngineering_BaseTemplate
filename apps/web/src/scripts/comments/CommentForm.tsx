import { useState, type SubmitEvent, type JSX } from 'react';
import type { CommentEntry } from './types';

interface CommentFormProps {
  onAddComment: (comment: CommentEntry) => void;
}

function CommentForm({ onAddComment }: CommentFormProps): JSX.Element {
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedText = text.trim();
    if (trimmedName === '' || trimmedText === '') return;

    onAddComment({
      id: crypto.randomUUID(),
      name: trimmedName,
      text: trimmedText,
    });
    setName('');
    setText('');
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="flex-pair">
        <label htmlFor="name">Your name:</label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <div className="flex-pair">
        <label htmlFor="comment">Your comment:</label>
        <textarea
          name="comment"
          id="comment"
          rows={3}
          placeholder="Enter your comment"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </div>
      <div>
        <input type="submit" value="Submit comment" />
      </div>
    </form>
  );
}

export default CommentForm;
