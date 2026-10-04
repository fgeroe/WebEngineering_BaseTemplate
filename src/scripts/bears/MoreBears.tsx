import { useEffect, useState, type JSX } from 'react';
import BearList from './BearList';
import { fetchBears } from './bearAPI';
import type { BearWithImage } from './types';
import HighlightedText from '../search/HighlightedText';

type BearsState =
  | { status: 'loading' }
  | { status: 'success'; bears: BearWithImage[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

function MoreBears(): JSX.Element {
  const [state, setState] = useState<BearsState>({ status: 'loading' });
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const bears = await fetchBears(controller.signal);
        if (controller.signal.aborted) return;
        setState(
          bears.length === 0
            ? { status: 'empty' }
            : { status: 'success', bears }
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('fetchBears:', err);
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [requestId]);

  function reload(): void {
    setState({ status: 'loading' });
    setRequestId((previous) => previous + 1);
  }

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

      {state.status === 'success' && <BearList bears={state.bears} />}
    </section>
  );
}

export default MoreBears;
