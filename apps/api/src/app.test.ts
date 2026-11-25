import { randomUUID } from 'node:crypto';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type AppOptions } from './app.js';
import { createAuthService } from './auth/authService.js';
import { createInMemorySessionRepository } from './auth/sessionRepository.js';
import type { Bear } from './bears/bear.js';
import { createInMemoryBearRepository } from './bears/bearRepository.js';
import { createBearService } from './bears/bearService.js';
import type { CommentPage } from './comments/comment.js';
import {
  createInMemoryCommentRepository,
  createInMemoryCommentTransaction,
} from './comments/commentRepository.js';
import { createCommentService } from './comments/commentService.js';
import {
  createArgon2PasswordHasher,
  type PasswordHasher,
} from './users/passwordHasher.js';
import {
  createInMemoryUserRepository,
  type UserRepository,
} from './users/userRepository.js';
import { createUserService } from './users/userService.js';

const testBears: Bear[] = [
  {
    id: 'ursus-arctos',
    name: 'Brown bear',
    binomial: 'Ursus arctos',
    imageUrl: null,
    range: 'Europe, Asia and North America',
  },
  {
    id: 'ursus-maritimus',
    name: 'Polar bear',
    binomial: 'Ursus maritimus',
    imageUrl: null,
    range: 'Arctic',
  },
];

const unknownCommentId = '00000000-0000-4000-8000-000000000000';

let app: FastifyInstance;
let appOptions: AppOptions;
let databaseUp: boolean;
let userRepository: UserRepository;
let passwords: PasswordHasher;

const testPassword = 'correct horse battery staple';

/** Creates an account, logs in and returns the session cookie value. */
async function loginAs(
  email: string,
  role: 'user' | 'moderator' = 'user'
): Promise<string> {
  // the API cannot create moderators, so the test writes one directly
  await userRepository.insert({
    id: randomUUID(),
    email,
    role,
    passwordHash: await passwords.hash(testPassword),
    createdAt: new Date().toISOString(),
  });
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: testPassword },
  });
  const sid = response.cookies.find((cookie) => cookie.name === 'sid')?.value;
  if (sid === undefined) throw new Error(`login as ${email} failed`);
  return sid;
}

beforeEach(() => {
  databaseUp = true;
  const bears = createBearService(createInMemoryBearRepository(testBears));
  const commentRepository = createInMemoryCommentRepository();
  const comments = createCommentService({
    bears,
    comments: commentRepository,
    transaction: createInMemoryCommentTransaction(commentRepository),
  });
  userRepository = createInMemoryUserRepository();
  passwords = createArgon2PasswordHasher();
  const users = createUserService({ users: userRepository, passwords });
  const auth = createAuthService({
    users: userRepository,
    sessions: createInMemorySessionRepository(userRepository),
    passwords,
    sessionMaxAgeSeconds: 3600,
  });
  appOptions = {
    bears,
    comments,
    users,
    auth,
    checkDatabase: async () => {
      if (!databaseUp) throw new Error('database down');
    },
  };
  app = buildApp(appOptions);
});

afterEach(async () => {
  await app.close();
});

describe('bears', () => {
  it('lists the bears in their stored order', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/bears' });

    expect(response.statusCode).toBe(200);
    expect(response.json<Bear[]>().map((bear) => bear.id)).toEqual([
      'ursus-arctos',
      'ursus-maritimus',
    ]);
  });

  it('filters the bears by name with ?q=', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears?q=POLAR',
    });

    expect(response.json<Bear[]>().map((bear) => bear.id)).toEqual([
      'ursus-maritimus',
    ]);
  });

  it('answers 404 as Problem Details for an unknown bear', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears/unknown',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain(
      'application/problem+json'
    );
  });
});

describe('comments', () => {
  let anna: string;

  beforeEach(async () => {
    anna = await loginAs('anna@example.com');
  });

  it('creates, lists and deletes a comment', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      cookies: { sid: anna },
      payload: { author: 'Anna', text: 'Big bear!' },
    });
    expect(created.statusCode).toBe(201);
    const { id } = created.json<{ id: string }>();
    expect(created.headers.location).toBe(`/api/comments/${id}`);

    const listed = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments',
    });
    expect(listed.json<CommentPage>().items).toHaveLength(1);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${id}`,
      cookies: { sid: anna },
    });
    expect(deleted.statusCode).toBe(204);

    const deletedAgain = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${id}`,
      cookies: { sid: anna },
    });
    expect(deletedAgain.statusCode).toBe(404);
  });

  it('pages through all comments with the cursor', async () => {
    for (let i = 1; i <= 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/bears/ursus-arctos/comments',
        cookies: { sid: anna },
        payload: { author: 'Anna', text: `Comment ${i}` },
      });
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const query: string = cursor === null ? '' : `&cursor=${cursor}`;
      const response = await app.inject({
        method: 'GET',
        url: `/api/bears/ursus-arctos/comments?limit=2${query}`,
      });
      const page = response.json<CommentPage>();
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor;
      pages++;
    } while (cursor !== null);

    expect(pages).toBe(3);
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('rejects an invalid cursor with 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments?cursor=garbage',
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects an empty comment with 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      cookies: { sid: anna },
      payload: { author: ' ', text: '' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('answers 404 for comments on an unknown bear', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bears/unknown/comments',
      cookies: { sid: anna },
      payload: { author: 'Anna', text: 'Hello' },
    });

    expect(response.statusCode).toBe(404);
  });

  it('answers 400 for a comment id that is not a uuid', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/comments/not-a-uuid',
      cookies: { sid: anna },
    });

    expect(response.statusCode).toBe(400);
  });

  it('answers 404 for an unknown comment', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${unknownCommentId}`,
      cookies: { sid: anna },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('reports', () => {
  let anna: string;

  beforeEach(async () => {
    anna = await loginAs('anna@example.com');
  });

  it('hides a comment after the third report', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      cookies: { sid: anna },
      payload: { author: 'Troll', text: 'Spam' },
    });
    const { id } = created.json<{ id: string }>();

    const reports = [];
    for (let i = 0; i < 3; i++) {
      const response = await app.inject({
        method: 'POST',
        url: `/api/comments/${id}/report`,
      });
      reports.push(response.json<{ reportCount: number; hidden: boolean }>());
    }

    expect(reports.map((report) => report.hidden)).toEqual([
      false,
      false,
      true,
    ]);
    expect(reports[2]?.reportCount).toBe(3);

    const listed = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments',
    });
    expect(listed.json<CommentPage>().items).toHaveLength(0);
  });

  it('answers 404 when reporting an unknown comment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/comments/${unknownCommentId}/report`,
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('authorisation for comments', () => {
  let author: string;
  let commentId: string;

  async function deleteAs(sid?: string): Promise<number> {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${commentId}`,
      ...(sid === undefined ? {} : { cookies: { sid } }),
    });
    return response.statusCode;
  }

  async function canDeleteAs(sid?: string): Promise<boolean | undefined> {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments',
      ...(sid === undefined ? {} : { cookies: { sid } }),
    });
    return response.json<CommentPage>().items[0]?.canDelete;
  }

  beforeEach(async () => {
    author = await loginAs('author@example.com');
    const created = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      cookies: { sid: author },
      payload: { author: 'Author', text: 'My comment' },
    });
    commentId = created.json<{ id: string }>().id;
  });

  it('needs a login to write a comment (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      payload: { author: 'Anonymous', text: 'Hello' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('DELETE as anonymous: 401', async () => {
    expect(await deleteAs()).toBe(401);
  });

  it('DELETE as another user: 403', async () => {
    expect(await deleteAs(await loginAs('other@example.com'))).toBe(403);
  });

  it('DELETE as the author: 204', async () => {
    expect(await deleteAs(author)).toBe(204);
  });

  it('DELETE as a moderator: 204', async () => {
    const moderator = await loginAs('mod@example.com', 'moderator');
    expect(await deleteAs(moderator)).toBe(204);
  });

  it('tells each viewer whether they may delete (for the UI)', async () => {
    const other = await loginAs('other@example.com');
    const moderator = await loginAs('mod@example.com', 'moderator');

    expect(await canDeleteAs()).toBe(false);
    expect(await canDeleteAs(other)).toBe(false);
    expect(await canDeleteAs(author)).toBe(true);
    expect(await canDeleteAs(moderator)).toBe(true);
  });
});

describe('registration', () => {
  const password = 'correct horse battery staple';

  async function register(
    email: string,
    pass: string
  ): Promise<LightMyRequestResponse> {
    return await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: pass },
    });
  }

  it('creates a user and never returns the password or its hash', async () => {
    const response = await register('  Anna@Example.COM ', password);

    expect(response.statusCode).toBe(201);
    const body = response.json<Record<string, unknown>>();
    expect(body).toMatchObject({ email: 'anna@example.com', role: 'user' });
    expect(Object.keys(body).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'role',
    ]);
  });

  it('stores only an argon2id hash of the password', async () => {
    await register('anna@example.com', password);

    const stored = await userRepository.findByEmail('anna@example.com');

    expect(stored?.passwordHash).toMatch(
      /^\$argon2id\$v=19\$m=65536,t=3,p=4\$/
    );
    expect(stored?.passwordHash).not.toContain(password);
  });

  it('answers 409 for an email that is already registered', async () => {
    await register('anna@example.com', password);

    const response = await register('ANNA@example.com', password);

    expect(response.statusCode).toBe(409);
    expect(response.headers['content-type']).toContain(
      'application/problem+json'
    );
  });

  it('rejects passwords shorter than 6 characters', async () => {
    const response = await register('anna@example.com', 'five5');

    expect(response.statusCode).toBe(400);
  });

  it('has no composition rules: lowercase letters only are fine', async () => {
    const response = await register('anna@example.com', 'abcdefghijkl');

    expect(response.statusCode).toBe(201);
  });

  it('rejects an invalid email address', async () => {
    const response = await register('not-an-email', password);

    expect(response.statusCode).toBe(400);
  });
});

describe('login and session', () => {
  const email = 'anna@example.com';
  const password = 'correct horse battery staple';

  async function login(pass = password): Promise<LightMyRequestResponse> {
    return await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: pass },
    });
  }

  async function me(sid?: string): Promise<LightMyRequestResponse> {
    return await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      ...(sid === undefined ? {} : { cookies: { sid } }),
    });
  }

  beforeEach(async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password },
    });
  });

  it('answers 401 on /me without a cookie', async () => {
    const response = await me();

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain(
      'application/problem+json'
    );
  });

  it('sets an HttpOnly, SameSite=Lax session cookie and knows the user', async () => {
    const response = await login();

    expect(response.statusCode).toBe(200);
    const cookie = response.cookies.find((entry) => entry.name === 'sid');
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
    });

    const current = await me(cookie?.value);
    expect(current.statusCode).toBe(200);
    expect(current.json<{ email: string }>().email).toBe(email);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await login('wrong password 123');
    const unknownEmail = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@example.com', password },
    });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(unknownEmail.json<{ detail: string }>().detail).toBe(
      wrongPassword.json<{ detail: string }>().detail
    );
  });

  it('invalidates the session on logout, not only the cookie', async () => {
    const sid = (await login()).cookies.find((c) => c.name === 'sid')?.value;

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: { sid: sid ?? '' },
    });

    expect(logout.statusCode).toBe(204);
    // even if someone kept a copy of the old cookie, it no longer works
    expect((await me(sid)).statusCode).toBe(401);
  });
});

describe('hardening', () => {
  it('answers 429 with Retry-After after 5 login attempts per window', async () => {
    const statuses: number[] = [];
    let last: LightMyRequestResponse | undefined;
    for (let attempt = 1; attempt <= 6; attempt++) {
      last = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'victim@example.com', password: `guess ${attempt}` },
      });
      statuses.push(last.statusCode);
    }

    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    expect(last?.headers['retry-after']).toBeDefined();
    expect(last?.headers['content-type']).toContain('application/problem+json');
  });

  it('sends security headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/bears' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('rejects a request body above the limit with 413', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'big@example.com', password: 'x'.repeat(20_000) },
    });

    expect(response.statusCode).toBe(413);
    expect(response.headers['content-type']).toContain(
      'application/problem+json'
    );
  });

  it('allows credentials only for configured origins (CORS)', async () => {
    const corsApp = buildApp({
      ...appOptions,
      corsOrigins: ['http://localhost:4173'],
    });
    const allowed = await corsApp.inject({
      method: 'GET',
      url: '/api/bears',
      headers: { origin: 'http://localhost:4173' },
    });
    const other = await corsApp.inject({
      method: 'GET',
      url: '/api/bears',
      headers: { origin: 'https://evil.example' },
    });
    await corsApp.close();

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:4173'
    );
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('treats a malformed session cookie as "not logged in"', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { sid: "' OR 1=1 --" },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('health', () => {
  it('is ready while the database answers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
  });

  it('is not ready but still alive while the database is down', async () => {
    databaseUp = false;

    const ready = await app.inject({ method: 'GET', url: '/health/ready' });
    const live = await app.inject({ method: 'GET', url: '/health' });

    expect(ready.statusCode).toBe(503);
    expect(live.statusCode).toBe(200);
  });
});
