import argon2 from 'argon2';

export interface PasswordHasher {
  hash: (password: string) => Promise<string>;
  verify: (hash: string, password: string) => Promise<boolean>;
}

/**
 * argon2id with the library defaults: 64 MiB memory, 3 iterations,
 * parallelism 4 and a random 16-byte salt per password. The result contains
 * algorithm, parameters and salt, e.g. $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
 */
export function createArgon2PasswordHasher(): PasswordHasher {
  return {
    hash: async (password) =>
      await argon2.hash(password, { type: argon2.argon2id }),
    verify: async (hash, password) => await argon2.verify(hash, password),
  };
}
