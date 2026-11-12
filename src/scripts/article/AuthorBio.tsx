import type { JSX } from 'react';
import HighlightedText from '../search/HighlightedText';

function AuthorBio(): JSX.Element {
  return (
    <aside>
      <h2>
        <HighlightedText>About the author</HighlightedText>
      </h2>

      <p>
        <HighlightedText>
          Evan Wild is an unemployed plumber from Doncaster...
        </HighlightedText>
      </p>
    </aside>
  );
}

export default AuthorBio;
