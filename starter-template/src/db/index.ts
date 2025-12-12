import 'dotenv/config';
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from './schema';

export type DrizzleDb = NodePgDatabase<typeof schema>;

export function createDbClient(): DrizzleDb {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });
  return drizzle<typeof schema>({ client });
}