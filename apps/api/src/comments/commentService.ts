import { randomUUID } from 'node:crypto';
import type { BearService } from '../bears/bearService.js';
import { ForbiddenError, NotFoundError } from '../errors.js';
import type { User } from '../users/user.js';
import type {
  Comment,
  CommentPage,
  CommentReport,
  CommentView,
  NewComment,
  ReportState,
} from './comment.js';
import { decodeCursor, encodeCursor } from './commentCursor.js';
import { canDeleteComment } from './commentPolicy.js';
import type {
  CommentRepository,
  CommentTransaction,
} from './commentRepository.js';

/** A comment is hidden once it has been reported this often. */
export const reportsUntilHidden = 3;

/** 'naive' only exists to demonstrate the lost update. */
export type ReportStrategy = 'locked' | 'naive';

export interface CommentPageQuery {
  limit: number;
  cursor?: string;
}

export interface CommentService {
  listComments: (
    bearId: string,
    query: CommentPageQuery,
    viewer: User | null
  ) => Promise<CommentPage>;
  getComment: (id: string, viewer: User | null) => Promise<CommentView>;
  addComment: (
    bearId: string,
    input: NewComment,
    author: User
  ) => Promise<CommentView>;
  deleteComment: (id: string, actor: User) => Promise<void>;
  reportComment: (id: string) => Promise<CommentReport>;
}

export interface CommentServiceDependencies {
  bears: BearService;
  comments: CommentRepository;
  transaction: CommentTransaction;
  reportStrategy?: ReportStrategy;
  now?: () => Date;
  generateId?: () => string;
}

export function createCommentService({
  bears,
  comments,
  transaction,
  reportStrategy = 'locked',
  now = () => new Date(),
  generateId = randomUUID,
}: CommentServiceDependencies): CommentService {
  // the API never exposes authorId, only what the viewer may do
  function toView(
    { authorId, ...comment }: Comment,
    viewer: User | null
  ): CommentView {
    return { ...comment, canDelete: canDeleteComment(viewer, { authorId }) };
  }

  async function listComments(
    bearId: string,
    { limit, cursor }: CommentPageQuery,
    viewer: User | null
  ): Promise<CommentPage> {
    const after = cursor === undefined ? undefined : decodeCursor(cursor);
    await bears.getBear(bearId);

    const rows = await comments.listByBear(bearId, { limit: limit + 1, after });
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items: items.map((comment) => toView(comment, viewer)),
      nextCursor:
        rows.length > limit && last !== undefined ? encodeCursor(last) : null,
    };
  }

  async function getComment(
    id: string,
    viewer: User | null
  ): Promise<CommentView> {
    const comment = await comments.findById(id);
    if (comment === undefined) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
    return toView(comment, viewer);
  }

  async function addComment(
    bearId: string,
    input: NewComment,
    author: User
  ): Promise<CommentView> {
    await bears.getBear(bearId);
    const comment: Comment = {
      id: generateId(),
      bearId,
      authorId: author.id,
      author: input.author,
      text: input.text,
      createdAt: now().toISOString(),
    };
    await comments.insert(comment);
    return toView(comment, author);
  }

  async function deleteComment(id: string, actor: User): Promise<void> {
    const owner = await comments.findOwner(id);
    if (owner === undefined) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
    if (!canDeleteComment(actor, owner)) {
      throw new ForbiddenError(
        'Only the author or a moderator may delete this comment.'
      );
    }
    await comments.delete(id);
  }

  function nextReportState(state: ReportState): ReportState {
    const reportCount = state.reportCount + 1;
    return {
      reportCount,
      hiddenAt:
        state.hiddenAt ??
        (reportCount >= reportsUntilHidden ? now().toISOString() : null),
    };
  }

  // read - modify in TypeScript - write
  async function report(
    repository: CommentRepository,
    id: string,
    lock: boolean
  ): Promise<CommentReport> {
    const state = await repository.findReportState(id, { forUpdate: lock });
    if (state === undefined) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
    const next = nextReportState(state);
    await repository.saveReportState(id, next);
    return {
      id,
      reportCount: next.reportCount,
      hidden: next.hiddenAt !== null,
    };
  }

  async function reportComment(id: string): Promise<CommentReport> {
    if (reportStrategy === 'naive') {
      // two independent statements: concurrent reports read the same old
      // count and overwrite each other's result (lost update)
      return await report(comments, id, false);
    }
    // the transaction boundary lives here in the service: read with a row
    // lock and write in ONE transaction, so concurrent reports wait in line
    return await transaction(async (tx) => await report(tx, id, true));
  }

  return {
    listComments,
    getComment,
    addComment,
    deleteComment,
    reportComment,
  };
}
