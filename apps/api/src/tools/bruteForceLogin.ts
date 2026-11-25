// Simulates a password-guessing attack on /api/auth/login (Playground 6,
// Task 4) and shows when the rate limit answers 429. The API must be running.
// Run with: npm run security:brute-force  (-- --attempts=20 --email=a@b.c)
import { z } from 'zod';

function argument(name: string): string | undefined {
  return process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
}

// inputs are validated here too: command line and environment
const options = z
  .object({
    apiUrl: z.url().default('http://localhost:3000'),
    attempts: z.coerce.number().int().min(1).max(1000).default(20),
    email: z.email().default('victim@example.com'),
  })
  .parse({
    apiUrl: process.env.API_URL,
    attempts: argument('attempts'),
    email: argument('email'),
  });

console.log(
  `${options.attempts} login attempts with wrong passwords for ${options.email}\n`
);

let firstBlocked: number | null = null;
for (let attempt = 1; attempt <= options.attempts; attempt++) {
  const response = await fetch(`${options.apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: options.email,
      password: `guess-${attempt}`,
    }),
  });
  const retryAfter = response.headers.get('retry-after');
  console.log(
    `attempt ${String(attempt).padStart(2)}: ${response.status}` +
      (retryAfter === null ? '' : `  Retry-After: ${retryAfter}s`)
  );
  if (response.status === 429 && firstBlocked === null) firstBlocked = attempt;
}

console.log(
  firstBlocked === null
    ? '\nNever blocked - the rate limit is not working!'
    : `\nBlocked from attempt ${firstBlocked} on (429 Too Many Requests).`
);
