import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AuthService } from '../auth/authService.js';
import { problemResponses } from '../problem.js';
import {
  credentialsSchema,
  registrationSchema,
  userSchema,
} from '../users/user.js';
import type { UserService } from '../users/userService.js';

export const sessionCookieName = 'sid';

export interface AuthRoutesOptions {
  users: UserService;
  auth: AuthService;
  /** Secure flag of the session cookie (true in production). */
  cookieSecure: boolean;
}

export const authRoutes: FastifyPluginAsyncZod<AuthRoutesOptions> = async (
  app,
  { users, auth, cookieSecure }
) => {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true, // JavaScript (and therefore XSS) cannot read the cookie
    secure: cookieSecure, // only sent over HTTPS
    sameSite: 'lax', // not sent with cross-site POSTs: protects against CSRF
    path: '/', // valid for the whole site
  };

  app.post(
    '/api/auth/register',
    {
      schema: {
        summary: 'Create a user account',
        tags: ['auth'],
        body: registrationSchema,
        response: {
          201: userSchema,
          ...problemResponses(400, 409, 415),
        },
      },
    },
    async (request, reply) => {
      const user = await users.register(request.body);
      return await reply.code(201).send(user);
    }
  );

  app.post(
    '/api/auth/login',
    {
      schema: {
        summary: 'Log in and receive a session cookie',
        tags: ['auth'],
        body: credentialsSchema,
        response: {
          200: userSchema,
          ...problemResponses(400, 401, 415),
        },
      },
    },
    async (request, reply) => {
      const { user, sessionToken, expiresAt } = await auth.login(
        request.body,
        request.cookies[sessionCookieName]
      );
      void reply.setCookie(sessionCookieName, sessionToken, {
        ...cookieOptions,
        expires: expiresAt,
      });
      return user;
    }
  );

  app.post(
    '/api/auth/logout',
    {
      schema: {
        summary: 'End the session (also works without one)',
        tags: ['auth'],
        response: { 204: z.null().describe('Logged out') },
      },
    },
    async (request, reply) => {
      await auth.logout(request.cookies[sessionCookieName]);
      void reply.clearCookie(sessionCookieName, cookieOptions);
      return await reply.code(204).send(null);
    }
  );

  app.get(
    '/api/auth/me',
    {
      schema: {
        summary: 'The logged-in user',
        tags: ['auth'],
        response: {
          200: userSchema,
          ...problemResponses(401),
        },
      },
    },
    async (request, reply) => {
      // personal data: never store it in a shared cache
      void reply.header('Cache-Control', 'private, no-store');
      return await auth.currentUser(request.cookies[sessionCookieName]);
    }
  );
};
