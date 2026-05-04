import { AsyncLocalStorage } from "async_hooks";
import { PinoLogger, createAsyncContextGetter, SWController } from "simple-wire";
import { Config, ConfigSchema } from "@/setup/config";
import { AsyncContext } from "@/setup/async-context";
import { createDbClient, DrizzleDb } from "@/setup/db";
import { DrizzleIdentityRepo } from "@/domain/identity/identity.repo";
import { IdentityService } from "@/domain/identity/identity.service";
import { UsersController } from "@/controllers/users.controller";
import { WelcomeController } from "@/controllers/welcome.controller";

export type App = {
  cfg: Config;
  logger: PinoLogger;
  db: DrizzleDb;
  asyncStorage: AsyncLocalStorage<AsyncContext>;
  controllers: SWController[];
  shutdown: () => Promise<void>;
};

export function buildApp(): App {
  const cfg = ConfigSchema.parse(process.env);
  const asyncStorage = new AsyncLocalStorage<AsyncContext>();
  const getAsyncContext = createAsyncContextGetter(asyncStorage);

  const logger = new PinoLogger(cfg, getAsyncContext);
  const db = createDbClient(cfg);

  const identityRepo = new DrizzleIdentityRepo(db);
  const identityService = new IdentityService(logger, identityRepo);

  const controllers: SWController[] = [
    new WelcomeController(),
    new UsersController(logger, identityService),
  ];

  return {
    cfg,
    logger,
    db,
    asyncStorage,
    controllers,
    shutdown: async () => {
      // Close DB connections, etc.
    },
  };
}
