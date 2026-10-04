import type { JSX } from 'react';
import BearImage from './BearImage';
import type { BearWithImage } from './types';
import HighlightedText from '../search/HighlightedText';

interface BearCardProps {
  bear: BearWithImage;
}

function BearCard({ bear }: BearCardProps): JSX.Element {
  return (
    <div className="bear">
      <BearImage result={bear.imageResult} name={bear.name} />
      <p>
        <b>
          <HighlightedText>{bear.name}</HighlightedText>
        </b>{' '}
        (<HighlightedText>{bear.binomial}</HighlightedText>)
      </p>
      <p>
        <HighlightedText>{`Range: ${bear.range}`}</HighlightedText>
      </p>
    </div>
  );
}

export default BearCard;
