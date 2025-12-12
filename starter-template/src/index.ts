import 'dotenv/config';
import { createApp, BaseCradle } from "simple-wire";
import { AuthService } from './services/auth-service';
import { UserController } from "./controllers/user-controller";
import { asClass, asFunction } from "awilix";
import { Config, ConfigSchema } from "./config";
import { DrizzleDb, createDbClient } from "./db";
import { IUserRepository, UserRepository } from "./repos/users";

interface ProvidersCradle {
  db: DrizzleDb;
  authService: AuthService;
  userRepository: IUserRepository;
}

interface ControllersCradle {
  userController: UserController;
}

export type Cradle = ProvidersCradle & ControllersCradle & BaseCradle<Config>;

createApp<Config, ProvidersCradle, ControllersCradle>({
  configSchema: ConfigSchema,
  providers: {
    authService: asClass(AuthService).singleton(),
    userRepository: asClass(UserRepository).singleton(),
    db: asFunction(createDbClient).singleton(),
  },
  controllers: {
    userController: asClass(UserController).singleton(),
  }
});