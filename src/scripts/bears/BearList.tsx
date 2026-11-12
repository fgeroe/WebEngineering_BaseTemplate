import type { JSX } from 'react';
import BearCard from './BearCard';
import type { BearWithImage } from './types';

interface BearListProps {
  bears: BearWithImage[];
}

function BearList({ bears }: BearListProps): JSX.Element {
  return (
    <>
      {bears.map((bear) => (
        <BearCard key={bear.id} bear={bear} />
      ))}
    </>
  );
}

export default BearList;
