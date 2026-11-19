import { randomUUID } from 'node:crypto';
import type { BearService } from '../bears/bearService.js';
import { NotFoundError } from '../errors.js';
import type { Comment, NewComment } from './comment.js';
import type { CommentRepository } from './commentRepository.js';

export interface CommentService {
  listComments: (bearId: string) => Promise<Comment[]>;
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
  async function listComments(bearId: string): Promise<Comment[]> {
    await bears.getBear(bearId);
    return await comments.listByBear(bearId);
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
