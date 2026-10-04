import { useState, type SubmitEvent, type JSX } from 'react';
import { getElement } from '../dom';
import { clearHighlights, highlightMatches } from './highlight';

function Search(): JSX.Element {
  const [query, setQuery] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    clearHighlights();

    const searchKey = query.trim();
    if (searchKey === '') return;

    highlightMatches(getElement('main', HTMLElement), searchKey);
  }

  return (
    <form className="search" onSubmit={handleSubmit}>
      <label htmlFor="q" className="visually-hidden">
        Search query
      </label>
      <input
        type="search"
        name="q"
        id="q"
        placeholder="Search query"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <input type="submit" value="Go!" />
    </form>
  );
}

export default Search;
