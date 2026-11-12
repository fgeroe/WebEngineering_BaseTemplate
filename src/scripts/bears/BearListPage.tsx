import type { JSX } from 'react';
import { useSearchParams } from 'react-router';
import MoreBears from './MoreBears';

function BearListPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('q') ?? '';

  return (
    <main>
      <h1>All bears</h1>
      <MoreBears filter={filter} />
    </main>
  );
}

export default BearListPage;
