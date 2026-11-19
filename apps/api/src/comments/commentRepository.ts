import type { Comment } from './comment.js';
import type { CommentCursor } from './commentCursor.js';

export interface CommentPageRequest {
  limit: number;
  after?: CommentCursor;
}

export interface CommentRepository {
  listByBear: (bearId: string, page: CommentPageRequest) => Promise<Comment[]>;
  listByBears: (bearIds: string[]) => Promise<Map<string, Comment[]>>;
  findById: (id: string) => Promise<Comment | undefined>;
  insert: (comment: Comment) => Promise<void>;
  delete: (id: string) => Promise<boolean>;
}

function byCreation(a: Comment, b: Comment): number {
  const byTime = a.createdAt.localeCompare(b.createdAt);
  return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
}

// same rule as the SQL row comparison (created_at, id) < (cursor)
function isAfter(comment: Comment, cursor: CommentCursor): boolean {
  return byCreation(comment, { ...comment, ...cursor }) < 0;
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
  const comments = new Map<string, Comment>();

  function copies(bearIds: Set<string>): Comment[] {
    return [...comments.values()]
      .filter((comment) => bearIds.has(comment.bearId))
      .sort(byCreation)
      .map((comment) => ({ ...comment }));
  }

  return {
    listByBear: async (bearId, { limit, after }) =>
      copies(new Set([bearId]))
        .reverse()
        .filter((comment) => after === undefined || isAfter(comment, after))
        .slice(0, limit),

    listByBears: async (bearIds) =>
      groupByBear(bearIds, copies(new Set(bearIds))),

    findById: async (id) => {
      const comment = comments.get(id);
      return comment === undefined ? undefined : { ...comment };
    },

    insert: async (comment) => {
      comments.set(comment.id, { ...comment });
    },

    delete: async (id) => comments.delete(id),
  };
}
