import { DrizzleDb } from "@/setup/db";
import { UsersInsert, UsersSelect } from "./identity.schema";
import { users } from "./identity.schema";

export interface IdentityRepo {
  createUser(userData: UsersInsert): Promise<UsersSelect>;
  listUsers(): Promise<UsersSelect[]>;
}

type Props = {
  db: DrizzleDb;
};

export class DrizzleIdentityRepo implements IdentityRepo {
  private readonly db: DrizzleDb;

  constructor({ db }: Props) {
    this.db = db;
  }

  async createUser(userData: UsersInsert): Promise<UsersSelect> {
    const user = await this.db.insert(users).values(userData).returning();
    return user[0];
  }

  async listUsers(): Promise<UsersSelect[]> {
    return this.db.select().from(users);
  }
}