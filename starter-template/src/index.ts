import { Request } from "express";
import { createApp, BaseCradle, Logger } from "simple-wire";
import { asClass, asFunction, asValue } from "awilix";
import { AsyncContext } from "./async-context";
import { config, Config } from "./config";
import { DrizzleDb, createDbClient } from "./db";
import { UsersController } from "./controllers/users.controller";
import { IdentityService } from "./domain/identity/identity.service";
import { IdentityRepo, DrizzleIdentityRepo } from "./domain/identity/identity.repo";

interface ProvidersCradle {
  db: DrizzleDb;
  identityService: IdentityService;
  identityRepo: IdentityRepo;
}

interface ControllersCradle {
  usersController: UsersController;
}

export type AppDependencies = BaseCradle<Config, AsyncContext> & ProvidersCradle & ControllersCradle;

createApp<Config, AsyncContext, ControllersCradle, ProvidersCradle>({
  createAsyncContext: (req: Request) => new AsyncContext(req),
  logger: asClass(Logger).singleton(),
  config: asValue(config),
  controllers: {
    usersController: asClass(UsersController).singleton(),
  },
  providers: {
    db: asFunction(createDbClient).singleton(),
    identityService: asClass(IdentityService).singleton(),
    identityRepo: asClass(DrizzleIdentityRepo).singleton(),
  },
});