import { randomUUID } from 'node:crypto';
import { ConflictError } from '../errors.js';
import type { PasswordHasher } from './passwordHasher.js';
import type { Registration, User, UserRecord } from './user.js';
import type { UserRepository } from './userRepository.js';

export interface UserService {
  register: (registration: Registration) => Promise<User>;
}

export interface UserServiceDependencies {
  users: UserRepository;
  passwords: PasswordHasher;
  now?: () => Date;
  generateId?: () => string;
}

function toUser({ id, email, role, createdAt }: UserRecord): User {
  return { id, email, role, createdAt };
}

export function createUserService({
  users,
  passwords,
  now = () => new Date(),
  generateId = randomUUID,
}: UserServiceDependencies): UserService {
  async function register({ email, password }: Registration): Promise<User> {
    const record: UserRecord = {
      id: generateId(),
      email,
      role: 'user',
      passwordHash: await passwords.hash(password),
      createdAt: now().toISOString(),
    };

    if ((await users.insert(record)) === 'email_taken') {
      throw new ConflictError(
        'An account with this email address already exists.'
      );
    }
    return toUser(record);
  }

  return { register };
}
