import type { JSX } from 'react';
import Search from '../search/Search';

const navLinks = ['Home', 'Our team', 'Projects', 'Blog'];

interface NavigationProps {
  onSearch: (term: string) => void;
}

function Navigation({ onSearch }: NavigationProps): JSX.Element {
  return (
    <nav>
      <ul>
        {navLinks.map((label) => (
          <li key={label}>
            <a href="#">{label}</a>
          </li>
        ))}
      </ul>

      <Search onSearch={onSearch} />
    </nav>
  );
}

export default Navigation;
