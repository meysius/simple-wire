import "dotenv/config";
import { Request } from "express";
import { createApp, PinoLogger } from "simple-wire";
import { asClass, asFunction, asValue } from "awilix";
import { AsyncContext } from "@/setup/async-context";
import { ConfigSchema, Config } from "@/setup/config";
import { DrizzleDb, createDbClient } from "@/setup/db";
import { UsersController } from "./controllers/users.controller";
import { IdentityService } from "./domain/identity/identity.service";
import { IdentityRepo, DrizzleIdentityRepo } from "./domain/identity/identity.repo";

interface ControllersCradle {
  usersController: UsersController;
  // Add more controllers here
}

interface ProvidersCradle {
  db: DrizzleDb;
  identityService: IdentityService;
  identityRepo: IdentityRepo;
  // Add more providers here
}

createApp<Config, AsyncContext, ControllersCradle, ProvidersCradle>({
  createAsyncContext: (req: Request) => new AsyncContext(req),
  logger: asClass(PinoLogger).singleton(),
  config: asValue(ConfigSchema.parse(process.env)),
  controllers: {
    usersController: asClass(UsersController).singleton(),
    // Add more controllers here
  },
  providers: {
    db: asFunction(createDbClient).singleton(),
    identityService: asClass(IdentityService).singleton(),
    identityRepo: asClass(DrizzleIdentityRepo).singleton(),
    // Add more providers here
  },
});