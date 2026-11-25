import { and, eq, gt } from 'drizzle-orm';
import type { Executor } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { toUserRecord } from '../users/drizzleUserRepository.js';
import type { SessionRepository } from './sessionRepository.js';

export function createDrizzleSessionRepository(
  db: Executor
): SessionRepository {
  return {
    create: async (session) => {
      await db.insert(sessions).values({
        ...session,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
      });
    },

    findUser: async (sessionId, now) => {
      // one query: the session must exist, be unexpired, and its user exists
      const [row] = await db
        .select({ user: users })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
        .limit(1);
      return row === undefined ? undefined : toUserRecord(row.user);
    },

    delete: async (sessionId) => {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    },
  };
}
