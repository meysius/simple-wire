import { DrizzleDb } from "@/setup/db";
import { UsersInsert, UsersSelect, users } from "./identity.schema";

export interface IdentityRepo {
  createUser(userData: UsersInsert): Promise<UsersSelect>;
  listUsers(): Promise<UsersSelect[]>;
}

export class DrizzleIdentityRepo implements IdentityRepo {
  constructor(private readonly db: DrizzleDb) {}

  async createUser(userData: UsersInsert): Promise<UsersSelect> {
    const user = await this.db.insert(users).values(userData).returning();
    return user[0];
  }

  async listUsers(): Promise<UsersSelect[]> {
    return this.db.select().from(users);
  }
}
