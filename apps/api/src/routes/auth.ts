import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { problemResponses } from '../problem.js';
import { registrationSchema, userSchema } from '../users/user.js';
import type { UserService } from '../users/userService.js';

export interface AuthRoutesOptions {
  users: UserService;
}

export const authRoutes: FastifyPluginAsyncZod<AuthRoutesOptions> = async (
  app,
  { users }
) => {
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
};
