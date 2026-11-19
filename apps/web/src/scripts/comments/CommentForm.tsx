import { useState, type SubmitEvent, type JSX } from 'react';
import { describeError } from '../api';
import { commentLimits, type NewComment } from './types';

interface CommentFormProps {
  onAddComment: (comment: NewComment) => Promise<void>;
}

function CommentForm({ onAddComment }: CommentFormProps): JSX.Element {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(comment: NewComment): Promise<void> {
    setIsSubmitting(true);
    setError(null);
    try {
      await onAddComment(comment);
      setAuthor('');
      setText('');
    } catch (err) {
      setError(`Not possible to save comment: ${describeError(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const trimmedAuthor = author.trim();
    const trimmedText = text.trim();
    if (trimmedAuthor === '' || trimmedText === '') {
      setError('Please enter your name and a comment.');
      return;
    }

    void submit({ author: trimmedAuthor, text: trimmedText });
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
          maxLength={commentLimits.authorMaxLength}
          value={author}
          onChange={(event) => {
            setAuthor(event.target.value);
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
          maxLength={commentLimits.textMaxLength}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </div>
      {error !== null && (
        <p role="alert" style={{ color: '#c33' }}>
          {error}
        </p>
      )}
      <div>
        <input
          type="submit"
          value={isSubmitting ? 'Saving…' : 'Submit comment'}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}

export default CommentForm;
