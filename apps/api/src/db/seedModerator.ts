import { z } from 'zod';
import { loadConfig } from '../config.js';
import { createArgon2PasswordHasher } from '../users/passwordHasher.js';
import { registrationSchema } from '../users/user.js';
import { createDatabase } from './client.js';
import { createPool } from './pool.js';
import { users } from './schema.js';

const moderatorEnv = z.object({
  MODERATOR_EMAIL: registrationSchema.shape.email,
  MODERATOR_PASSWORD: registrationSchema.shape.password,
});

const env = moderatorEnv.safeParse(process.env);
if (!env.success) {
  console.error(
    `Set MODERATOR_EMAIL and MODERATOR_PASSWORD (at least 6 characters):\n${z.prettifyError(env.error)}`
  );
  process.exit(1);
}
const { MODERATOR_EMAIL: email, MODERATOR_PASSWORD: password } = env.data;

const config = loadConfig();
const pool = createPool({
  connectionString: config.DATABASE_URL,
  max: 1,
  connectionTimeoutMs: config.DB_CONNECTION_TIMEOUT_MS,
});

try {
  const passwordHash = await createArgon2PasswordHasher().hash(password);
  await createDatabase(pool)
    .insert(users)
    .values({ email, passwordHash, role: 'moderator' })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, role: 'moderator' },
    });
  console.log(`Moderator ${email} is ready`);
} catch (err) {
  console.error('Seeding the moderator failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
