import type { JSX } from 'react';
import { Link, useParams } from 'react-router';
import BearImage from './BearImage';
import { useBears } from './bearsContext';
import CommentSection from '../comments/CommentSection';
import HighlightedText from '../search/HighlightedText';

function BearDetailPage(): JSX.Element {
  const { bearId } = useParams();
  const { state } = useBears();

  const bear =
    state.status === 'success'
      ? state.bears.find((candidate) => candidate.id === bearId)
      : undefined;

  return (
    <main>
      <p>
        <Link to="/bears">← Back to all bears</Link>
      </p>

      {state.status === 'loading' && <p>Loading bear…</p>}

      {state.status === 'error' && (
        <p style={{ color: '#c33' }}>
          Not possible to load bear: {state.message}
        </p>
      )}

      {(state.status === 'empty' ||
        (state.status === 'success' && bear === undefined)) && (
        <p>No bear found with the id &quot;{bearId}&quot;.</p>
      )}

      {bear !== undefined && (
        <article className="bear">
          <h1>
            <HighlightedText>{bear.name}</HighlightedText>
          </h1>
          <BearImage imageUrl={bear.imageUrl} name={bear.name} />
          <p>
            Scientific name: <HighlightedText>{bear.binomial}</HighlightedText>
          </p>
          <p>
            <HighlightedText>{`Range: ${bear.range}`}</HighlightedText>
          </p>
        </article>
      )}

      {bear !== undefined && <CommentSection key={bear.id} bearId={bear.id} />}
    </main>
  );
}

export default BearDetailPage;
