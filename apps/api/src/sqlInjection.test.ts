// Playground 6, Task 5 - attack test: SQL injection through GET /api/bears?q=
//
// Runs against a real PostgreSQL: PGlite is PostgreSQL compiled to WebAssembly
// and runs inside the test process (no Docker, works in CI). The database gets
// all migrations and the route uses the real Drizzle repository, so the SQL
// under attack is exactly the SQL that runs in production.
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { createAuthService } from './auth/authService.js';
import { createInMemorySessionRepository } from './auth/sessionRepository.js';
import type { Bear } from './bears/bear.js';
import { createBearService } from './bears/bearService.js';
import { createDrizzleBearRepository } from './bears/drizzleBearRepository.js';
import {
  createInMemoryCommentRepository,
  createInMemoryCommentTransaction,
} from './comments/commentRepository.js';
import { createCommentService } from './comments/commentService.js';
import * as schema from './db/schema.js';
import { createArgon2PasswordHasher } from './users/passwordHasher.js';
import { createInMemoryUserRepository } from './users/userRepository.js';
import { createUserService } from './users/userService.js';

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

// The attacker's goal: read e-mail addresses and password hashes. The UNION
// part has the same five columns as the bear query; -- comments out the rest.
const unionPayload =
  "' UNION SELECT id::text, email, password_hash, NULL, role::text FROM users --";

const attacks: Array<[name: string, payload: string]> = [
  ['UNION SELECT that reads the users table', unionPayload],
  ['tautology that matches every row', "' OR '1'='1"],
  ['stacked query that drops a table', "'; DROP TABLE users; --"],
  ['LIKE wildcard that matches every name', '%'],
];

const victimEmail = 'victim@example.com';
let victimHash: string;

let client: PGlite;
let app: FastifyInstance;
// every statement Drizzle sends, with its parameters
const sentQueries: Array<{ sql: string; params: unknown[] }> = [];

beforeAll(async () => {
  client = new PGlite();
  const db = drizzle(client, {
    schema,
    logger: { logQuery: (sql, params) => sentQueries.push({ sql, params }) },
  });
  await migrate(db, { migrationsFolder });

  await db.insert(schema.bears).values([
    {
      id: 'ursus-arctos',
      position: 0,
      name: 'Brown bear',
      binomial: 'Ursus arctos',
      range: 'Europe, Asia and North America',
    },
    {
      id: 'ursus-maritimus',
      position: 1,
      name: 'Polar bear',
      binomial: 'Ursus maritimus',
      range: 'Arctic',
    },
  ]);
  victimHash = await createArgon2PasswordHasher().hash('the victims password');
  await db.insert(schema.users).values({
    id: randomUUID(),
    email: victimEmail,
    passwordHash: victimHash,
  });

  // only the bears come from PostgreSQL; the rest is not under attack here
  const userRepository = createInMemoryUserRepository();
  const passwords = createArgon2PasswordHasher();
  const bears = createBearService(createDrizzleBearRepository(db));
  const commentRepository = createInMemoryCommentRepository();
  app = buildApp({
    bears,
    comments: createCommentService({
      bears,
      comments: commentRepository,
      transaction: createInMemoryCommentTransaction(commentRepository),
    }),
    users: createUserService({ users: userRepository, passwords }),
    auth: createAuthService({
      users: userRepository,
      sessions: createInMemorySessionRepository(userRepository),
      passwords,
      sessionMaxAgeSeconds: 3600,
    }),
    checkDatabase: async () => {},
  });
}, 30_000);

afterAll(async () => {
  await app.close();
  await client.close();
});

describe('attack: SQL injection through GET /api/bears?q=', () => {
  it('is a real attack: pasted into the SQL text, the payload leaks the password hashes', async () => {
    // what a hand-written query built by string concatenation would do
    const vulnerable = await client.query<{ name: string; binomial: string }>(
      `SELECT id, name, binomial, image_url, range FROM bears
       WHERE name ILIKE '%${unionPayload}%' ORDER BY position`
    );

    expect(vulnerable.rows).toContainEqual(
      expect.objectContaining({ name: victimEmail, binomial: victimHash })
    );
  });

  it('still finds bears by name (the defence does not break the search)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears',
      query: { q: 'polar' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<Bear[]>().map((bear) => bear.name)).toEqual([
      'Polar bear',
    ]);
  });

  it.each(attacks)(
    '%s: passes validation, but the API treats it as plain text',
    async (_name, payload) => {
      sentQueries.length = 0;

      const response = await app.inject({
        method: 'GET',
        url: '/api/bears',
        query: { q: payload },
      });

      // zod lets the payload through: it is a valid string of <= 100 chars.
      // Validation is not what stops this attack ...
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
      expect(response.body).not.toContain(victimHash);

      // ... the parameterised query is: the SQL text only holds a placeholder,
      // the payload travels separately as a value and is never parsed as SQL
      const [query] = sentQueries;
      expect(query?.sql).toMatch(/ilike \$1/);
      expect(query?.sql).not.toContain(payload);
      expect(query?.params).toHaveLength(1);
    }
  );

  it('leaves the database intact after all attacks', async () => {
    const bears = await client.query('SELECT id FROM bears');
    const users = await client.query<{ email: string }>(
      'SELECT email FROM users'
    );

    expect(bears.rows).toHaveLength(2);
    expect(users.rows).toEqual([{ email: victimEmail }]);
  });
});
