import { readFileSync } from 'node:fs';
import { z } from 'zod';

const packageJsonSchema = z.object({ version: z.string() });

export const { version } = packageJsonSchema.parse(
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
);
