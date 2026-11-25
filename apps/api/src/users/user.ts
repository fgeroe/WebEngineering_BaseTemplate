import { z } from 'zod';

export const userRoles = ['user', 'moderator'] as const;

export const passwordLimits = {
  // the task asks for 12; NIST SP 800-63B-4 asks for 15 when the password
  // is the only factor
  minLength: 12,
  // NIST: allow at least 64; the upper bound only stops absurd inputs
  maxLength: 128,
} as const;

// normalise first, then check the format
const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const registrationSchema = z
  .object({
    email: emailSchema.describe(
      'Email address; stored trimmed and lower-cased'
    ),
    // length only - no composition rules (no "1 digit, 1 symbol ...")
    password: z
      .string()
      .min(passwordLimits.minLength)
      .max(passwordLimits.maxLength),
  })
  .meta({ id: 'Registration' });

/** What the API returns about a user: never the password hash. */
export const userSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    role: z.enum(userRoles),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });

export type Registration = z.infer<typeof registrationSchema>;
export type User = z.infer<typeof userSchema>;

/** What is stored about a user. */
export interface UserRecord extends User {
  passwordHash: string;
}

export const credentialsSchema = z
  .object({
    email: emailSchema,
    // no length rule on login: it must work for every existing password
    password: z.string().min(1).max(passwordLimits.maxLength),
  })
  .meta({ id: 'Credentials' });

export type Credentials = z.infer<typeof credentialsSchema>;

export function toUser({ id, email, role, createdAt }: UserRecord): User {
  return { id, email, role, createdAt };
}
