import { useEffect, useState, type JSX } from 'react';
import BearList from './BearList';

import type { BearWithImage } from './types';
import { fetchBears } from './bearAPI';

function MoreBears(): JSX.Element {
  const [bears, setBears] = useState<BearWithImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load(): Promise<void> {
      try {
        const result = await fetchBears();
        if (!ignore) setBears(result);
      } catch (err) {
        console.error('fetchBears:', err);
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="more_bears">
      <h2>More Bears</h2>
      {isLoading && <p>Loading bears…</p>}
      {error !== null && (
        <p style={{ color: '#c33' }}>
          Not possible to load list of bears: {error}
        </p>
      )}
      <BearList bears={bears} />
    </section>
  );
}

export default MoreBears;
