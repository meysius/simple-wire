import { SWLogger } from "simple-wire";
import { IdentityRepo } from "./identity.repo";
import { UsersSelect, UsersInsert } from "./identity.schema";

export class IdentityService {
  constructor(
    private readonly logger: SWLogger,
    private readonly identityRepo: IdentityRepo,
  ) {}

  async createUser(userData: UsersInsert): Promise<UsersSelect> {
    this.logger.info("IdentityService.createUser called");
    return this.identityRepo.createUser(userData);
  }

  async listAllUsers(): Promise<UsersSelect[]> {
    this.logger.info("IdentityService.listAllUsers called");
    return this.identityRepo.listUsers();
  }
}
