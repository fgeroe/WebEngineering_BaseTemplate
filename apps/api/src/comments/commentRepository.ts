import type { Comment } from './comment.js';

export interface CommentRepository {
  listByBear: (bearId: string) => Promise<Comment[]>;
  findById: (id: string) => Promise<Comment | undefined>;
  insert: (comment: Comment) => Promise<void>;
  delete: (id: string) => Promise<boolean>;
}

export function createInMemoryCommentRepository(): CommentRepository {
  const comments = new Map<string, Comment>();

  return {
    listByBear: async (bearId) =>
      [...comments.values()]
        .filter((comment) => comment.bearId === bearId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((comment) => ({ ...comment })),

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
