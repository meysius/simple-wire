import { DrizzleDb } from "@/db";
import { usersTable, User, NewUser } from "@/db/schema";
import { eq } from 'drizzle-orm';

export interface IUserRepository {
  getUserById(userId: number): Promise<User | null>;
  createUser(userData: NewUser): Promise<User>;
  listUsers(): Promise<User[]>;
}

type UserRepositoryDeps = {
  db: DrizzleDb;
};

export class UserRepository implements IUserRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: UserRepositoryDeps) {
    this.db = db;
  }

  async getUserById(userId: number): Promise<User | null> {
    const user = await this.db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    return user || null;
  }

  async createUser(userData: NewUser): Promise<User> {
    const user = await this.db.insert(usersTable).values(userData).returning();
    return user[0];
  }

  async listUsers(): Promise<User[]> {
    const users = await this.db.select().from(usersTable);
    return users;
  }
}