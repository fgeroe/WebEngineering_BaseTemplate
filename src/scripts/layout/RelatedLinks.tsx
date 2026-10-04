import type { JSX } from 'react';

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
      <h2>Related</h2>
      <ul>
        {relatedLinks.map((label) => (
          <li key={label}>
            <a href="#">{label}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default RelatedLinks;
