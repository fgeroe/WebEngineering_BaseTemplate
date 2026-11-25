import type { UserRecord } from '../users/user.js';
import type { UserRepository } from '../users/userRepository.js';

export interface SessionRecord {
  /** SHA-256 of the session token, never the token itself. */
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionRepository {
  create: (session: SessionRecord) => Promise<void>;
  /** The user behind a session that exists and has not expired. */
  findUser: (sessionId: string, now: Date) => Promise<UserRecord | undefined>;
  delete: (sessionId: string) => Promise<void>;
}

export function createInMemorySessionRepository(
  users: UserRepository
): SessionRepository {
  const sessions = new Map<string, SessionRecord>();

  return {
    create: async (session) => {
      sessions.set(session.id, { ...session });
    },

    findUser: async (sessionId, now) => {
      const session = sessions.get(sessionId);
      if (session === undefined || new Date(session.expiresAt) <= now) {
        return undefined;
      }
      return await users.findById(session.userId);
    },

    delete: async (sessionId) => {
      sessions.delete(sessionId);
    },
  };
}
