import type { JSX } from 'react';
import type { BearWithImage } from './types';
import BearCard from './BearCard';

interface BearListProps {
  bears: BearWithImage[];
}

function BearList({ bears }: BearListProps): JSX.Element {
  return (
    <>
      {bears.map((bear) => (
        <BearCard key={bear.name} bear={bear} />
      ))}
    </>
  );
}

export default BearList;
