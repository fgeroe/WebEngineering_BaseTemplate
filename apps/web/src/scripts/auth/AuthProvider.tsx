import { useEffect, useState, type JSX, type ReactNode } from 'react';
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  type Credentials,
  type User,
} from './authAPI';
import { AuthContext, type AuthState } from './authContext';

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // the session cookie is HttpOnly, so the app cannot read it - it asks the
  // server who is logged in
  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const user = await fetchCurrentUser(controller.signal);
        if (controller.signal.aborted) return;
        setState(
          user === null
            ? { status: 'anonymous' }
            : { status: 'authenticated', user }
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('fetchCurrentUser:', err);
        setState({ status: 'anonymous' });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, []);

  async function login(credentials: Credentials): Promise<User> {
    const user = await loginUser(credentials);
    setState({ status: 'authenticated', user });
    return user;
  }

  async function logout(): Promise<void> {
    await logoutUser();
    setState({ status: 'anonymous' });
  }

  return <AuthContext value={{ state, login, logout }}>{children}</AuthContext>;
}

export default AuthProvider;
