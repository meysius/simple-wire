import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const UsersSelectSchema = createSelectSchema(usersTable);
export const UsersInsertSchema = createInsertSchema(usersTable);
export const UsersUpdateSchema = createUpdateSchema(usersTable);

export type User = z.infer<typeof UsersSelectSchema>;
export type NewUser = z.infer<typeof UsersInsertSchema>;
