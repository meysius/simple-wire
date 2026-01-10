import { z } from "zod";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

const UsersSelectSchema = createSelectSchema(users);
const UsersInsertSchema = createInsertSchema(users);
const UsersUpdateSchema = createUpdateSchema(users);

export type UsersSelect = z.infer<typeof UsersSelectSchema>;
export type UsersInsert = z.infer<typeof UsersInsertSchema>;
export type UsersUpdate = z.infer<typeof UsersUpdateSchema>;
