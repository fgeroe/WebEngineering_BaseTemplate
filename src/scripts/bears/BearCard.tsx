import type { JSX } from 'react';
import type { BearWithImage } from './types';
import BearImage from './BearImage';

interface BearCardProps {
  bear: BearWithImage;
}

function BearCard({ bear }: BearCardProps): JSX.Element {
  return (
    <div className="bear">
      <BearImage result={bear.imageResult} name={bear.name} />
      <p>
        <b>{bear.name}</b> ({bear.binomial})
      </p>
      <p>Range: {bear.range}</p>
    </div>
  );
}

export default BearCard;
