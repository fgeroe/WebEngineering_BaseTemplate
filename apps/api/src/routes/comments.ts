import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticatedUser, type AuthHooks } from '../auth/authHooks.js';
import {
  commentPageSchema,
  commentReportSchema,
  commentSchema,
  newCommentSchema,
} from '../comments/comment.js';
import type { CommentService } from '../comments/commentService.js';
import { problemResponses } from '../problem.js';

export interface CommentRoutesOptions {
  comments: CommentService;
  hooks: AuthHooks;
}

const bearParamsSchema = z.object({ id: z.string().min(1) });
const commentParamsSchema = z.object({ commentId: z.uuid() });
const commentPageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
});

export const commentRoutes: FastifyPluginAsyncZod<
  CommentRoutesOptions
> = async (app, { comments, hooks }) => {
  app.get(
    '/api/bears/:id/comments',
    {
      schema: {
        summary: 'List the comments of a bear, newest first, page by page',
        tags: ['comments'],
        params: bearParamsSchema,
        querystring: commentPageQuerySchema,
        response: {
          200: commentPageSchema,
          ...problemResponses(400, 404),
        },
      },
      // reading needs no login; the user only decides canDelete per comment
      preHandler: hooks.loadUser,
    },
    async (request) =>
      await comments.listComments(
        request.params.id,
        request.query,
        request.user
      )
  );

  app.post(
    '/api/bears/:id/comments',
    {
      schema: {
        summary: 'Create a comment for a bear',
        tags: ['comments'],
        params: bearParamsSchema,
        body: newCommentSchema,
        response: {
          201: commentSchema,
          ...problemResponses(400, 401, 404, 413, 415),
        },
      },
      preHandler: hooks.requireUser,
    },
    async (request, reply) => {
      const comment = await comments.addComment(
        request.params.id,
        request.body,
        authenticatedUser(request)
      );
      void reply.code(201).header('Location', `/api/comments/${comment.id}`);
      return comment;
    }
  );

  app.get(
    '/api/comments/:commentId',
    {
      schema: {
        summary: 'Get one comment',
        tags: ['comments'],
        params: commentParamsSchema,
        response: {
          200: commentSchema,
          ...problemResponses(400, 404),
        },
      },
      preHandler: hooks.loadUser,
    },
    async (request) =>
      await comments.getComment(request.params.commentId, request.user)
  );

  app.delete(
    '/api/comments/:commentId',
    {
      schema: {
        summary: 'Delete a comment (its author or a moderator)',
        tags: ['comments'],
        params: commentParamsSchema,
        response: {
          204: z.null().describe('Comment deleted'),
          ...problemResponses(400, 401, 403, 404),
        },
      },
      // authentication here (401); authorisation in canDeleteComment (403)
      preHandler: hooks.requireUser,
    },
    async (request, reply) => {
      await comments.deleteComment(
        request.params.commentId,
        authenticatedUser(request)
      );
      return await reply.code(204).send(null);
    }
  );

  app.post(
    '/api/comments/:commentId/report',
    {
      schema: {
        summary: 'Report a comment; it is hidden after the third report',
        tags: ['comments'],
        params: commentParamsSchema,
        response: {
          200: commentReportSchema,
          ...problemResponses(400, 404),
        },
      },
    },
    async (request) => await comments.reportComment(request.params.commentId)
  );
};
