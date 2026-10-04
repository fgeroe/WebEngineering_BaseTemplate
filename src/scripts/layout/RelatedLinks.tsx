import type { JSX } from 'react';
import HighlightedText from '../search/HighlightedText';

const relatedLinks = [
  'The trouble with Bees',
  'The trouble with Otters',
  'The trouble with Penguins',
  'The trouble with Octopi',
  'The trouble with Lemurs',
];

function RelatedLinks(): JSX.Element {
  return (
    <aside>
      <h2>
        <HighlightedText>Related</HighlightedText>
      </h2>
      <ul>
        {relatedLinks.map((title) => (
          <li key={title}>
            <a href="#">
              <HighlightedText>{title}</HighlightedText>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default RelatedLinks;
