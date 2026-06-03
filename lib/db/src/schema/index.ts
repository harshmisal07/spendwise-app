import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cloudBackupsTable = pgTable("cloud_backups", {
  userId:          text("user_id").primaryKey(),
  transactions:    jsonb("transactions").notNull().default([]),
  goals:           jsonb("goals").notNull().default([]),
  categoryBudgets: jsonb("category_budgets").notNull().default([]),
  currency:        text("currency").notNull().default("INR"),
  backedUpAt:      timestamp("backed_up_at").notNull().defaultNow(),
});

export const insertCloudBackupSchema = createInsertSchema(cloudBackupsTable).omit({ backedUpAt: true });
export type InsertCloudBackup = z.infer<typeof insertCloudBackupSchema>;
export type CloudBackup = typeof cloudBackupsTable.$inferSelect;
