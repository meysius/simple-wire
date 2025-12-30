import 'dotenv/config';
import { z } from 'zod';

export const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().min(1000).default(3000),
  SECRET: z.string().min(10).default('supersecretkey'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/test_seed?schema=public'),
});

export type Config = z.infer<typeof ConfigSchema>;
export const config = ConfigSchema.parse(process.env);