import type { JSX } from 'react';
import { Link } from 'react-router';
import BearImage from './BearImage';
import type { Bear } from './types';
import HighlightedText from '../search/HighlightedText';

interface BearCardProps {
  bear: Bear;
}

function BearCard({ bear }: BearCardProps): JSX.Element {
  return (
    <div className="bear">
      <BearImage imageUrl={bear.imageUrl} name={bear.name} />
      <p>
        <b>
          <Link to={`/bears/${bear.id}`}>
            <HighlightedText>{bear.name}</HighlightedText>
          </Link>
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
