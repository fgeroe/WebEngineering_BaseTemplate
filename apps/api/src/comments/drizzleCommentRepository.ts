import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { comments } from '../db/schema.js';
import type { Comment } from './comment.js';
import { groupByBear, type CommentRepository } from './commentRepository.js';

type CommentRow = typeof comments.$inferSelect;

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    bearId: row.bearId,
    author: row.author,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createDrizzleCommentRepository(
  db: Database
): CommentRepository {
  return {
    listByBear: async (bearId, { limit, after }) => {
      const rows = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.bearId, bearId),
            after === undefined
              ? undefined
              : sql`(${comments.createdAt}, ${comments.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`
          )
        )
        .orderBy(desc(comments.createdAt), desc(comments.id))
        .limit(limit);
      return rows.map(toComment);
    },

    listByBears: async (bearIds) => {
      if (bearIds.length === 0) return new Map();
      const rows = await db
        .select()
        .from(comments)
        .where(inArray(comments.bearId, bearIds))
        .orderBy(asc(comments.createdAt), asc(comments.id));
      return groupByBear(bearIds, rows.map(toComment));
    },

    findById: async (id) => {
      const [row] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);
      return row === undefined ? undefined : toComment(row);
    },

    insert: async (comment) => {
      await db.insert(comments).values({
        ...comment,
        createdAt: new Date(comment.createdAt),
      });
    },

    delete: async (id) => {
      const deleted = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning({ id: comments.id });
      return deleted.length > 0;
    },
  };
}
