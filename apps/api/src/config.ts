import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  ENABLE_DEBUG_ROUTES: z.stringbool().optional(),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== '')
    )
    .pipe(
      z.array(
        z
          .url()
          .refine(
            (origin) => new URL(origin).origin === origin,
            'Must be an origin like http://localhost:4173 without path or trailing slash'
          )
      )
    ),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  WIKIPEDIA_API_URL: z.url().default('https://en.wikipedia.org/w/api.php'),
  WIKIPEDIA_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  WIKIPEDIA_USER_AGENT: z
    .string()
    .min(1)
    .default(
      'WebEngineeringBearsBFF/1.0 (https://github.com/fgeroe/WebEngineering_BaseTemplate)'
    ),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'Must be a postgres:// connection string',
  }),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  // 'naive' only exists to demonstrate the lost update (Task 5)
  REPORT_STRATEGY: z.enum(['locked', 'naive']).default('locked'),
  SESSION_MAX_AGE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7),
  // default: Secure in production; set false only for plain-http setups
  COOKIE_SECURE: z.stringbool().optional(),
  // login and register: at most AUTH_RATE_LIMIT_MAX attempts per IP and window
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  // largest accepted request body; comments are at most ~1 KB
  BODY_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(16 * 1024),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid environment (copy .env.example to .env):\n${z.prettifyError(result.error)}`
    );
  }
  return result.data;
}
