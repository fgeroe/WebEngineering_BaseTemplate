import type { JSX } from 'react';
import { NavLink } from 'react-router';
import Search from '../search/Search';

const routeLinks = [
  { label: 'Home', to: '/' },
  { label: 'Bears', to: '/bears' },
];

const placeholderLinks = ['Our team', 'Projects', 'Blog'];

interface NavigationProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

function Navigation({ searchTerm, onSearch }: NavigationProps): JSX.Element {
  return (
    <nav>
      <ul>
        {routeLinks.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end>
              {link.label}
            </NavLink>
          </li>
        ))}
        {placeholderLinks.map((label) => (
          <li key={label}>
            <a href="#">{label}</a>
          </li>
        ))}
      </ul>

      <Search key={searchTerm} initialQuery={searchTerm} onSearch={onSearch} />
    </nav>
  );
}

export default Navigation;
