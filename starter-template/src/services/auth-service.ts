import { User } from "@/db/schema";
import { ILogger } from "simple-wire";
import { IUserRepository } from "@/repos/users";
import { } from 'simple-wire';

type AuthServiceDeps = {
  logger: ILogger;
  userRepository: IUserRepository;
};

export class AuthService {
  private readonly logger: ILogger;
  private readonly userRepository: IUserRepository;

  constructor({ logger, userRepository }: AuthServiceDeps) {
    this.logger = logger;
    this.userRepository = userRepository;
  }

  async performUseCase(): Promise<User | null> {
    this.logger.info("[AuthService] Performing auth use case");
    const user = await this.userRepository.getUserById(1);
    return user;
  }

  async listAllUsers(): Promise<User[]> {
    this.logger.info("[AuthService] Listing all users");
    const users = await this.userRepository.listUsers();
    return users;
  }
}