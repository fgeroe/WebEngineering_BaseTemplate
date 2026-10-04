import type { JSX } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router';
import Article from './article/Article';
import BearDetailPage from './bears/BearDetailPage';
import BearListPage from './bears/BearListPage';
import BearsProvider from './bears/BearsProvider';
import Footer from './layout/Footer';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import RelatedLinks from './layout/RelatedLinks';
import { SearchContext } from './search/searchContext';

function App(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';

  function handleSearch(term: string): void {
    setSearchParams(term === '' ? {} : { q: term });
  }

  return (
    <BearsProvider>
      <Header />
      <Navigation searchTerm={searchTerm} onSearch={handleSearch} />
      <SearchContext value={searchTerm}>
        <Routes>
          <Route
            path="/"
            element={
              <main>
                <Article />
                <RelatedLinks />
              </main>
            }
          />
          <Route path="/bears" element={<BearListPage />} />
          <Route path="/bears/:bearId" element={<BearDetailPage />} />
          <Route
            path="*"
            element={
              <main>
                <h1>Page not found</h1>
                <p>
                  <Link to="/">Back to the homepage</Link>
                </p>
              </main>
            }
          />
        </Routes>
      </SearchContext>
      <Footer />
    </BearsProvider>
  );
}

export default App;
