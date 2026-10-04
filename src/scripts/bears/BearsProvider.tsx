import { useEffect, useState, type JSX, type ReactNode } from 'react';
import { fetchBears } from './bearAPI';
import { BearsContext, type BearsState } from './bearsContext';

interface BearsProviderProps {
  children: ReactNode;
}

function BearsProvider({ children }: BearsProviderProps): JSX.Element {
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

  return <BearsContext value={{ state, reload }}>{children}</BearsContext>;
}

export default BearsProvider;
