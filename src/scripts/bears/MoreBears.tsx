import type { JSX } from 'react';
import BearList from './BearList';
import { useBears } from './bearsContext';
import type { BearWithImage } from './types';
import HighlightedText from '../search/HighlightedText';

function matchesFilter(bear: BearWithImage, filter: string): boolean {
  const needle = filter.toLowerCase();
  return [bear.name, bear.binomial, bear.range].some((value) =>
    value.toLowerCase().includes(needle)
  );
}

interface MoreBearsProps {
  filter?: string;
}

function MoreBears({ filter = '' }: MoreBearsProps): JSX.Element {
  const { state, reload } = useBears();

  const visibleBears =
    state.status === 'success'
      ? state.bears.filter((bear) => matchesFilter(bear, filter))
      : [];

  return (
    <section className="more_bears">
      <h2>
        <HighlightedText>More Bears</HighlightedText>
      </h2>

      <button type="button" onClick={reload}>
        Reload bears
      </button>

      {state.status === 'loading' && <p>Loading bears…</p>}

      {state.status === 'empty' && <p>No bears found.</p>}

      {state.status === 'error' && (
        <p style={{ color: '#c33' }}>
          Not possible to load list of bears: {state.message}
        </p>
      )}

      {state.status === 'success' && visibleBears.length === 0 && (
        <p>No bears match &quot;{filter}&quot;.</p>
      )}

      {state.status === 'success' && <BearList bears={visibleBears} />}
    </section>
  );
}

export default MoreBears;
