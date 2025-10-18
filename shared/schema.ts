import { pgTable, bigint, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const pressPasses = pgTable('press_passes', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  passNumber: text('pass_number').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  
  // Payment tracking fields
  paid: boolean('paid').notNull().default(false),
  paymentPending: boolean('payment_pending').notNull().default(false),
  paymentId: text('payment_id'),
  paymentAmount: bigint('payment_amount', { mode: 'number' }),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  
  // Auditability and revocation fields
  revoked: boolean('revoked').notNull().default(false),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  notes: text('notes'),
  
  // Additional fields from migrations
  downloadType: text('download_type').default('download'),
  contactEmail: text('contact_email').default('press@freepresspass.com'),
});

export type PressPass = typeof pressPasses.$inferSelect;
export type NewPressPass = typeof pressPasses.$inferInsert;
