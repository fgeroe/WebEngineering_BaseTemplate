import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Database, Executor } from '../db/client.js';
import { comments } from '../db/schema.js';
import type { Comment } from './comment.js';
import {
  groupByBear,
  type CommentRepository,
  type CommentTransaction,
} from './commentRepository.js';

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

const isVisible = isNull(comments.hiddenAt);

// db can be the database or an open transaction (see createDrizzleCommentTransaction)
export function createDrizzleCommentRepository(
  db: Executor
): CommentRepository {
  return {
    listByBear: async (bearId, { limit, after }) => {
      const rows = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.bearId, bearId),
            isVisible,
            // keyset condition: strictly older than the cursor position
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
      // one query for all bears: WHERE bear_id IN (...)
      const rows = await db
        .select()
        .from(comments)
        .where(and(inArray(comments.bearId, bearIds), isVisible))
        .orderBy(asc(comments.createdAt), asc(comments.id));
      return groupByBear(bearIds, rows.map(toComment));
    },

    findById: async (id) => {
      const [row] = await db
        .select()
        .from(comments)
        .where(and(eq(comments.id, id), isVisible))
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

    findReportState: async (id, { forUpdate = false } = {}) => {
      const query = db
        .select({
          reportCount: comments.reportCount,
          hiddenAt: comments.hiddenAt,
        })
        .from(comments)
        .where(eq(comments.id, id));
      // FOR UPDATE: other transactions that want this row wait until we commit
      const [row] = forUpdate ? await query.for('update') : await query;
      return row === undefined
        ? undefined
        : {
            reportCount: row.reportCount,
            hiddenAt: row.hiddenAt?.toISOString() ?? null,
          };
    },

    saveReportState: async (id, { reportCount, hiddenAt }) => {
      await db
        .update(comments)
        .set({
          reportCount,
          hiddenAt: hiddenAt === null ? null : new Date(hiddenAt),
        })
        .where(eq(comments.id, id));
    },
  };
}

export function createDrizzleCommentTransaction(
  db: Database
): CommentTransaction {
  // BEGIN ... COMMIT (or ROLLBACK if the work throws), all on one connection
  return async (work) =>
    await db.transaction(
      async (tx) => await work(createDrizzleCommentRepository(tx))
    );
}
