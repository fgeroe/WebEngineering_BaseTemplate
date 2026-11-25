import { useRef, useState, type JSX, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { ApiError, describeError } from '../api';
import { passwordMinLength, registerUser, type User } from './authAPI';

type Field = 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!emailPattern.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (password.length < passwordMinLength) {
    errors.password = `Use at least ${passwordMinLength} characters.`;
  }
  return errors;
}

function errorsFromServer(err: ApiError): FieldErrors {
  if (err.status === 409) return { email: err.message };
  const errors: FieldErrors = {};
  for (const fieldError of err.fieldErrors) {
    const field = fieldError.pointer.replace(/^\//, '');
    if (field === 'email' || field === 'password') {
      errors[field] = fieldError.detail;
    }
  }
  return errors;
}

function RegisterPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function focusFirstInvalid(errors: FieldErrors): void {
    if (errors.email !== undefined) emailRef.current?.focus();
    else if (errors.password !== undefined) passwordRef.current?.focus();
  }

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    try {
      setRegisteredUser(await registerUser({ email, password }));
      setPassword('');
    } catch (err) {
      const errors = err instanceof ApiError ? errorsFromServer(err) : {};
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        focusFirstInvalid(errors);
      } else {
        setFormError(`Registration failed: ${describeError(err)}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormError(null);
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }
    void submit();
  }

  if (registeredUser !== null) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="register-done">
          <h1 id="register-done">Welcome aboard!</h1>
          <p className="form-success" role="status">
            Your account <strong>{registeredUser.email}</strong> has been
            created.
          </p>
          <p className="auth-footer">
            <Link to="/login">Log in now</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title">Create an account</h1>
        <p className="auth-intro">
          Join the community to comment on your favourite bears.
        </p>

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="register-email">Email address</label>
            <input
              ref={emailRef}
              type="email"
              id="register-email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={fieldErrors.email !== undefined}
              aria-describedby={
                fieldErrors.email !== undefined ? 'email-error' : undefined
              }
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
            {fieldErrors.email !== undefined && (
              <p id="email-error" className="field-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="register-password">Password</label>
            <div className="password-input">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                name="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={fieldErrors.password !== undefined}
                aria-describedby={
                  fieldErrors.password !== undefined
                    ? 'password-error password-hint'
                    : 'password-hint'
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
              <button
                type="button"
                aria-controls="register-password"
                aria-pressed={showPassword}
                onClick={() => {
                  setShowPassword((previous) => !previous);
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password !== undefined && (
              <p id="password-error" className="field-error">
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default RegisterPage;
