import type { UserRecord } from './user.js';

export type InsertUserResult = 'created' | 'email_taken';

export interface UserRepository {
  /** Inserts the user, or reports that the email address is already taken. */
  insert: (user: UserRecord) => Promise<InsertUserResult>;
  findByEmail: (email: string) => Promise<UserRecord | undefined>;
  findById: (id: string) => Promise<UserRecord | undefined>;
}

export function createInMemoryUserRepository(): UserRepository {
  const usersByEmail = new Map<string, UserRecord>();

  return {
    insert: async (user) => {
      if (usersByEmail.has(user.email)) return 'email_taken';
      usersByEmail.set(user.email, { ...user });
      return 'created';
    },

    findByEmail: async (email) => {
      const user = usersByEmail.get(email);
      return user === undefined ? undefined : { ...user };
    },

    findById: async (id) => {
      const user = [...usersByEmail.values()].find(
        (candidate) => candidate.id === id
      );
      return user === undefined ? undefined : { ...user };
    },
  };
}
