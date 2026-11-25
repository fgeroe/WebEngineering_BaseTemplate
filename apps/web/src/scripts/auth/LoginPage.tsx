import { useRef, useState, type JSX, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, describeError } from '../api';
import { useAuth } from './authContext';

type Field = 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!emailPattern.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (password === '') {
    errors.password = 'Please enter your password.';
  }
  return errors;
}

function LoginPage(): JSX.Element {
  const { state, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    try {
      await login({ email, password });
      void navigate('/');
    } catch (err) {
      // 401: the server deliberately does not say whether email or password
      // was wrong, so the message belongs to the whole form
      setFormError(
        err instanceof ApiError && err.status === 401
          ? err.message
          : `Login failed: ${describeError(err)}`
      );
      setPassword('');
      passwordRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormError(null);
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (errors.email !== undefined) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password !== undefined) {
      passwordRef.current?.focus();
      return;
    }
    void submit();
  }

  if (state.status === 'authenticated') {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="login-done">
          <h1 id="login-done">You are logged in</h1>
          <p className="form-success" role="status">
            Signed in as <strong>{state.user.email}</strong>.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void logout();
            }}
          >
            Log out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Log in</h1>
        <p className="auth-intro">Welcome back to the bear community.</p>

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              ref={emailRef}
              type="email"
              id="login-email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={fieldErrors.email !== undefined}
              aria-describedby={
                fieldErrors.email !== undefined
                  ? 'login-email-error'
                  : undefined
              }
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
            {fieldErrors.email !== undefined && (
              <p id="login-email-error" className="field-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="password-input">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                name="password"
                autoComplete="current-password"
                value={password}
                aria-invalid={fieldErrors.password !== undefined}
                aria-describedby={
                  fieldErrors.password !== undefined
                    ? 'login-password-error'
                    : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
              <button
                type="button"
                aria-controls="login-password"
                aria-pressed={showPassword}
                onClick={() => {
                  setShowPassword((previous) => !previous);
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password !== undefined && (
              <p id="login-password-error" className="field-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {formError !== null && (
            <p className="form-alert" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
