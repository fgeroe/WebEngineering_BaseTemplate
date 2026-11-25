import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

export const sessionCookieName = 'sid';

// 32 random bytes as base64url = exactly 43 characters
const sessionTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

/**
 * The session token from the cookie, validated like every other input.
 * Anything malformed counts as "no session" and never reaches the database.
 */
export function readSessionToken(request: FastifyRequest): string | undefined {
  const result = sessionTokenSchema.safeParse(
    request.cookies[sessionCookieName]
  );
  return result.success ? result.data : undefined;
}
