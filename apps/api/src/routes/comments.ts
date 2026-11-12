import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { commentSchema, newCommentSchema } from '../comments/comment.js';
import type { CommentService } from '../comments/commentService.js';
import { problemResponses } from '../problem.js';

export interface CommentRoutesOptions {
  comments: CommentService;
}

const bearParamsSchema = z.object({ id: z.string().min(1) });
const commentParamsSchema = z.object({ commentId: z.string().min(1) });

export const commentRoutes: FastifyPluginAsyncZod<
  CommentRoutesOptions
> = async (app, { comments }) => {
  app.get(
    '/api/bears/:id/comments',
    {
      schema: {
        summary: 'List the comments of a bear',
        tags: ['comments'],
        params: bearParamsSchema,
        response: {
          200: z.array(commentSchema),
          ...problemResponses(400, 404, 502, 504),
        },
      },
    },
    async (request) => await comments.listComments(request.params.id)
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
          ...problemResponses(400, 404, 413, 415, 502, 504),
        },
      },
    },
    async (request, reply) => {
      const comment = await comments.addComment(
        request.params.id,
        request.body
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
    },
    async (request) => await comments.getComment(request.params.commentId)
  );

  app.delete(
    '/api/comments/:commentId',
    {
      schema: {
        summary: 'Delete a comment',
        tags: ['comments'],
        params: commentParamsSchema,
        response: {
          204: z.null().describe('Comment deleted'),
          ...problemResponses(400, 404),
        },
      },
    },
    async (request, reply) => {
      await comments.deleteComment(request.params.commentId);
      return await reply.code(204).send(null);
    }
  );
};
