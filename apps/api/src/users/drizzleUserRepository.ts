import { eq } from 'drizzle-orm';
import type { Executor } from '../db/client.js';
import { users } from '../db/schema.js';
import type { UserRecord } from './user.js';
import type { UserRepository } from './userRepository.js';

type UserRow = typeof users.$inferSelect;

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createDrizzleUserRepository(db: Executor): UserRepository {
  return {
    insert: async (user) => {
      // the UNIQUE constraint decides, not a SELECT before the INSERT: two
      // registrations with the same email at the same time cannot both win
      const inserted = await db
        .insert(users)
        .values({ ...user, createdAt: new Date(user.createdAt) })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });
      return inserted.length > 0 ? 'created' : 'email_taken';
    },

    findByEmail: async (email) => {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return row === undefined ? undefined : toUserRecord(row);
    },
  };
}
