import { randomUUID } from 'node:crypto';
import type { BearService } from '../bears/bearService.js';
import { NotFoundError } from '../errors.js';
import type { Comment, CommentPage, NewComment } from './comment.js';
import { decodeCursor, encodeCursor } from './commentCursor.js';
import type { CommentRepository } from './commentRepository.js';

export interface CommentPageQuery {
  limit: number;
  cursor?: string;
}

export interface CommentService {
  listComments: (
    bearId: string,
    query: CommentPageQuery
  ) => Promise<CommentPage>;
  getComment: (id: string) => Promise<Comment>;
  addComment: (bearId: string, input: NewComment) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;
}

export interface CommentServiceDependencies {
  bears: BearService;
  comments: CommentRepository;
  now?: () => Date;
  generateId?: () => string;
}

export function createCommentService({
  bears,
  comments,
  now = () => new Date(),
  generateId = randomUUID,
}: CommentServiceDependencies): CommentService {
  async function listComments(
    bearId: string,
    { limit, cursor }: CommentPageQuery
  ): Promise<CommentPage> {
    const after = cursor === undefined ? undefined : decodeCursor(cursor);
    await bears.getBear(bearId);

    const rows = await comments.listByBear(bearId, { limit: limit + 1, after });
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > limit && last !== undefined ? encodeCursor(last) : null,
    };
  }

  async function getComment(id: string): Promise<Comment> {
    const comment = await comments.findById(id);
    if (comment === undefined) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
    return comment;
  }

  async function addComment(
    bearId: string,
    input: NewComment
  ): Promise<Comment> {
    await bears.getBear(bearId);
    const comment: Comment = {
      id: generateId(),
      bearId,
      author: input.author,
      text: input.text,
      createdAt: now().toISOString(),
    };
    await comments.insert(comment);
    return comment;
  }

  async function deleteComment(id: string): Promise<void> {
    const deleted = await comments.delete(id);
    if (!deleted) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
  }

  return { listComments, getComment, addComment, deleteComment };
}
