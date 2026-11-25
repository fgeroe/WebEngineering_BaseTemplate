import type { FastifyInstance, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../errors.js';
import type { User } from '../users/user.js';
import type { AuthService } from './authService.js';
import { readSessionToken } from './sessionCookie.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the auth preHandlers; null when nobody is logged in. */
    user: User | null;
  }
}

export interface AuthHooks {
  /** preHandler: looks up the user if there is a session, never fails. */
  loadUser: (request: FastifyRequest) => Promise<void>;
  /** preHandler: 401 unless a valid session exists (authentication). */
  requireUser: (request: FastifyRequest) => Promise<void>;
}

export function setupAuthHooks(
  app: FastifyInstance,
  auth: AuthService
): AuthHooks {
  app.decorateRequest('user', null);

  return {
    loadUser: async (request) => {
      request.user = await auth.findUser(readSessionToken(request));
    },
    requireUser: async (request) => {
      request.user = await auth.currentUser(readSessionToken(request));
    },
  };
}

/** The user that requireUser has put on the request. */
export function authenticatedUser(request: FastifyRequest): User {
  if (request.user === null) {
    throw new UnauthorizedError('You are not logged in.');
  }
  return request.user;
}
