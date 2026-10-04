import type { JSX } from 'react';
import Search from '../search/Search';

const navLinks = ['Home', 'Our team', 'Projects', 'Blog'];

function Navigation(): JSX.Element {
  return (
    <nav>
      <ul>
        {navLinks.map((label) => (
          <li key={label}>
            <a href="#">{label}</a>
          </li>
        ))}
      </ul>

      <Search />
    </nav>
  );
}

export default Navigation;
