import { useState, type JSX } from 'react';
import Article from './article/Article';
import Footer from './layout/Footer';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import RelatedLinks from './layout/RelatedLinks';
import { SearchContext } from './search/searchContext';

function App(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <Header />
      <Navigation onSearch={setSearchTerm} />
      <SearchContext value={searchTerm}>
        <main>
          <Article />
          <RelatedLinks />
        </main>
      </SearchContext>
      <Footer />
    </>
  );
}

export default App;
