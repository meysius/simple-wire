import { z } from 'zod';
import { SWConfig } from 'simple-wire';

export const ConfigSchema = z.object({
  // Required to satisfy the simple-wire Config interface
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().min(1000).default(3000),

  // Add your custom config variables here
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/test_seed?schema=public'),
}) satisfies z.ZodType<SWConfig>;

export type Config = z.infer<typeof ConfigSchema>;