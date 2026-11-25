import { randomUUID } from 'node:crypto';
import type { BearService } from '../bears/bearService.js';
import { NotFoundError } from '../errors.js';
import type {
  Comment,
  CommentPage,
  CommentReport,
  NewComment,
  ReportState,
} from './comment.js';
import { decodeCursor, encodeCursor } from './commentCursor.js';
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
    query: CommentPageQuery
  ) => Promise<CommentPage>;
  getComment: (id: string) => Promise<Comment>;
  addComment: (bearId: string, input: NewComment) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;
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
