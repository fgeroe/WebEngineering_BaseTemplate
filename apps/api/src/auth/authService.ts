import { createHash, randomBytes } from 'node:crypto';
import { UnauthorizedError } from '../errors.js';
import type { PasswordHasher } from '../users/passwordHasher.js';
import { toUser, type Credentials, type User } from '../users/user.js';
import type { UserRepository } from '../users/userRepository.js';
import type { SessionRepository } from './sessionRepository.js';

export interface LoginResult {
  user: User;
  /** Goes into the cookie; only its hash is stored. */
  sessionToken: string;
  expiresAt: Date;
}

export interface AuthService {
  login: (credentials: Credentials, oldToken?: string) => Promise<LoginResult>;
  logout: (token: string | undefined) => Promise<void>;
  currentUser: (token: string | undefined) => Promise<User>;
}

export interface AuthServiceDependencies {
  users: UserRepository;
  sessions: SessionRepository;
  passwords: PasswordHasher;
  sessionMaxAgeSeconds: number;
  now?: () => Date;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// same message for "unknown email" and "wrong password": no user enumeration
const invalidCredentials = 'Invalid email or password.';

export function createAuthService({
  users,
  sessions,
  passwords,
  sessionMaxAgeSeconds,
  now = () => new Date(),
}: AuthServiceDependencies): AuthService {
  // hash of a random password, so an unknown email costs as much time as a
  // wrong password (otherwise the response time reveals registered emails)
  let dummyHash: Promise<string> | undefined;
  async function getDummyHash(): Promise<string> {
    dummyHash ??= passwords.hash(randomBytes(16).toString('base64url'));
    return await dummyHash;
  }

  async function login(
    { email, password }: Credentials,
    oldToken?: string
  ): Promise<LoginResult> {
    const user = await users.findByEmail(email);
    const valid = await passwords.verify(
      user?.passwordHash ?? (await getDummyHash()),
      password
    );
    if (user === undefined || !valid) {
      throw new UnauthorizedError(invalidCredentials);
    }

    // a fresh session on every login (no session fixation), the old one ends
    if (oldToken !== undefined) await sessions.delete(hashToken(oldToken));

    // 256 random bits: impossible to guess, so the token needs no signature
    const sessionToken = randomBytes(32).toString('base64url');
    const createdAt = now();
    const expiresAt = new Date(
      createdAt.getTime() + sessionMaxAgeSeconds * 1000
    );
    await sessions.create({
      id: hashToken(sessionToken),
      userId: user.id,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    return { user: toUser(user), sessionToken, expiresAt };
  }

  async function logout(token: string | undefined): Promise<void> {
    // deleting the row is what makes logout real: the cookie is worthless now
    if (token !== undefined) await sessions.delete(hashToken(token));
  }

  async function currentUser(token: string | undefined): Promise<User> {
    const user =
      token === undefined
        ? undefined
        : await sessions.findUser(hashToken(token), now());
    if (user === undefined) {
      throw new UnauthorizedError('You are not logged in.');
    }
    return toUser(user);
  }

  return { login, logout, currentUser };
}
