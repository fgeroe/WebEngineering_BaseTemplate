import type { JSX } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../auth/authContext';
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
  const { state, logout } = useAuth();

  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } catch (err) {
      console.error('logout:', err);
    }
  }

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

      {/* account actions live apart from the content links */}
      <div className="account">
        {state.status === 'authenticated' && (
          <>
            <span className="account-user" title={state.user.email}>
              {state.user.email}
            </span>
            <button
              type="button"
              className="account-link"
              onClick={() => {
                void handleLogout();
              }}
            >
              Log out
            </button>
          </>
        )}
        {state.status === 'anonymous' && (
          <>
            <NavLink to="/login" className="account-secondary">
              Log in
            </NavLink>
            <NavLink to="/register" className="account-link">
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
