import type { Comment, ReportState } from './comment.js';
import type { CommentCursor } from './commentCursor.js';

export interface CommentPageRequest {
  limit: number;
  /** Only comments that come after this position (i.e. are older). */
  after?: CommentCursor;
}

export interface CommentRepository {
  /** One page of a bear's visible comments, newest first (keyset pagination). */
  listByBear: (bearId: string, page: CommentPageRequest) => Promise<Comment[]>;
  /**
   * Visible comments of many bears in ONE query, grouped by bear id. Avoids
   * the N+1 problem of calling listByBear once per bear.
   */
  listByBears: (bearIds: string[]) => Promise<Map<string, Comment[]>>;
  /** A visible comment; hidden comments count as not found. */
  findById: (id: string) => Promise<Comment | undefined>;
  insert: (comment: Comment) => Promise<void>;
  delete: (id: string) => Promise<boolean>;
  /**
   * Report state of a comment, hidden or not. With forUpdate the row stays
   * locked (SELECT ... FOR UPDATE) until the surrounding transaction ends.
   */
  findReportState: (
    id: string,
    options?: { forUpdate?: boolean }
  ) => Promise<ReportState | undefined>;
  saveReportState: (id: string, state: ReportState) => Promise<void>;
}

/**
 * Runs the work inside ONE transaction and hands it a repository bound to that
 * transaction: commit when the work succeeds, rollback when it throws.
 */
export type CommentTransaction = <T>(
  work: (comments: CommentRepository) => Promise<T>
) => Promise<T>;

type StoredComment = Comment & ReportState;

function byCreation(a: Comment, b: Comment): number {
  const byTime = a.createdAt.localeCompare(b.createdAt);
  return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
}

// same rule as the SQL row comparison (created_at, id) < (cursor)
function isAfter(comment: Comment, cursor: CommentCursor): boolean {
  return byCreation(comment, { ...comment, ...cursor }) < 0;
}

function toComment(stored: StoredComment): Comment {
  return {
    id: stored.id,
    bearId: stored.bearId,
    author: stored.author,
    text: stored.text,
    createdAt: stored.createdAt,
  };
}

export function groupByBear(
  bearIds: string[],
  comments: Comment[]
): Map<string, Comment[]> {
  const grouped = new Map(bearIds.map((id) => [id, [] as Comment[]]));
  for (const comment of comments) {
    grouped.get(comment.bearId)?.push(comment);
  }
  return grouped;
}

export function createInMemoryCommentRepository(): CommentRepository {
  const comments = new Map<string, StoredComment>();

  function visible(bearIds: Set<string>): Comment[] {
    return [...comments.values()]
      .filter((comment) => bearIds.has(comment.bearId))
      .filter((comment) => comment.hiddenAt === null)
      .sort(byCreation)
      .map(toComment);
  }

  return {
    listByBear: async (bearId, { limit, after }) =>
      visible(new Set([bearId]))
        .reverse()
        .filter((comment) => after === undefined || isAfter(comment, after))
        .slice(0, limit),

    listByBears: async (bearIds) =>
      groupByBear(bearIds, visible(new Set(bearIds))),

    findById: async (id) => {
      const comment = comments.get(id);
      return comment === undefined || comment.hiddenAt !== null
        ? undefined
        : toComment(comment);
    },

    insert: async (comment) => {
      comments.set(comment.id, { ...comment, reportCount: 0, hiddenAt: null });
    },

    delete: async (id) => comments.delete(id),

    findReportState: async (id) => {
      const comment = comments.get(id);
      return comment === undefined
        ? undefined
        : { reportCount: comment.reportCount, hiddenAt: comment.hiddenAt };
    },

    saveReportState: async (id, state) => {
      const comment = comments.get(id);
      if (comment !== undefined) {
        comments.set(id, { ...comment, ...state });
      }
    },
  };
}

/**
 * In-memory stand-in for a transaction: runs one piece of work at a time,
 * which is what the row lock achieves in PostgreSQL. (No rollback.)
 */
export function createInMemoryCommentTransaction(
  repository: CommentRepository
): CommentTransaction {
  let queue: Promise<unknown> = Promise.resolve();
  return async (work) => {
    const result = queue.then(async () => await work(repository));
    queue = result.catch(() => undefined);
    return await result;
  };
}
