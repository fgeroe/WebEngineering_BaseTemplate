import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  ENABLE_DEBUG_ROUTES: z.stringbool().optional(),
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
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
