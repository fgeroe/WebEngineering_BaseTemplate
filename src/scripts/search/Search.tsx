import { useState, type JSX, type SubmitEvent } from 'react';

interface SearchProps {
  initialQuery: string;
  onSearch: (term: string) => void;
}

function Search({ initialQuery, onSearch }: SearchProps): JSX.Element {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearch(query.trim());
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
