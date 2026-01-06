import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "voter"] }).notNull().default("voter"),
  name: text("name"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const elections = pgTable("elections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "open", "closed", "archived"] }).notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertElectionSchema = createInsertSchema(elections).omit({ id: true, createdAt: true });
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof elections.$inferSelect;

export const contests = pgTable("contests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["single-choice", "multi-choice"] }).notNull().default("single-choice"),
  maxChoices: text("max_choices"),
}, (table) => ({
  electionIdx: index("contests_election_idx").on(table.electionId),
}));

export const insertContestSchema = createInsertSchema(contests).omit({ id: true });
export type InsertContest = z.infer<typeof insertContestSchema>;
export type Contest = typeof contests.$inferSelect;

export const options = pgTable("options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: varchar("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  description: text("description"),
}, (table) => ({
  contestIdx: index("options_contest_idx").on(table.contestId),
}));

export const insertOptionSchema = createInsertSchema(options).omit({ id: true });
export type InsertOption = z.infer<typeof insertOptionSchema>;
export type Option = typeof options.$inferSelect;

export const eligibleVoters = pgTable("eligible_voters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  electionIdx: index("eligible_voters_election_idx").on(table.electionId),
  userIdx: index("eligible_voters_user_idx").on(table.userId),
}));

export const insertEligibleVoterSchema = createInsertSchema(eligibleVoters).omit({ id: true });
export type InsertEligibleVoter = z.infer<typeof insertEligibleVoterSchema>;
export type EligibleVoter = typeof eligibleVoters.$inferSelect;

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contestId: varchar("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  optionIds: text("option_ids").array().notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  userContestIdx: index("votes_user_contest_idx").on(table.userId, table.contestId),
}));

export const insertVoteSchema = createInsertSchema(votes).omit({ id: true, createdAt: true });
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export * from "./audit_logs";
export * from "./models/chat";
