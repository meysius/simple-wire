import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Config } from '@/setup/config';
import * as identitySchema from "@/domain/identity/identity.schema";

export const schema = {
  ...identitySchema,
  // Add other domain schemas here
};

export type Schema = typeof schema;

export type DrizzleDb = NodePgDatabase<Schema>;

type createDbClientProps = {
  config: Config;
};

export function createDbClient({ config }: createDbClientProps): DrizzleDb {
  const client = new Pool({
    connectionString: config.DATABASE_URL,
  });
  return drizzle<Schema>({ client });
}