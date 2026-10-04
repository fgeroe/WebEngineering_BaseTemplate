import type { JSX } from 'react';
import Article from './article/Article';
import Footer from './layout/Footer';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import RelatedLinks from './layout/RelatedLinks';

function App(): JSX.Element {
  return (
    <>
      <Header />
      <Navigation />
      <main>
        <Article />
        <RelatedLinks />
      </main>
      <Footer />
    </>
  );
}

export default App;
