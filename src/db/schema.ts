// Drizzle schema reflection of the live Neon database.
// Source of truth lives in src/db/migrations/. Keep this file in sync.
//
// We don't actually use Drizzle to query — we use raw SQL via @neondatabase/serverless.
// This file exists so types and shapes are documented and IDE-checked.

import {
  pgTable,
  text,
  uuid,
  serial,
  integer,
  boolean,
  doublePrecision,
  numeric,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── USERS ──────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  password: text('password').notNull(),
  role: text('role').default('user'),
  localePref: text('locale_pref').default('en'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── DESTINATIONS ───────────────────────────────────────────────────────────
export const destinations = pgTable('destinations', {
  id: text('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  regionEn: text('region_en'),
  regionAr: text('region_ar'),
  categories: text('categories').array(),
  companyEn: text('company_en'),
  companyAr: text('company_ar'),
  avgVisitMin: integer('avg_visit_min').default(60),
  ticketCost: numeric('ticket_cost').default('0'),
  crowdLevel: integer('crowd_level').default(3),
  recommendedMonths: integer('recommended_months').array(),
  isActive: boolean('is_active').default(true),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── SAVED TRIPS ────────────────────────────────────────────────────────────
export const savedTrips = pgTable('saved_trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  inputsJson: jsonb('inputs_json').notNull().default(sql`'{}'::jsonb`),
  planJson: jsonb('plan_json').notNull().default(sql`'{}'::jsonb`),
  scoresJson: jsonb('scores_json').default(sql`'{}'::jsonb`),
  isPublic: boolean('is_public').default(false),
  shareCount: integer('share_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── SAVED INTERESTS ────────────────────────────────────────────────────────
export const savedInterests = pgTable('saved_interests', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  destinationId: text('destination_id').references(() => destinations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── CHAT SESSIONS ──────────────────────────────────────────────────────────
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: text('user_email'),
  userName: text('user_name'),
  messageCount: integer('message_count').default(0),
  hasPlan: boolean('has_plan').default(false),
  lastMessage: text('last_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── CHAT MESSAGES ──────────────────────────────────────────────────────────
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  planJson: jsonb('plan_json'),
  toolCalls: jsonb('tool_calls'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── TRIP ANALYTICS ─────────────────────────────────────────────────────────
export const tripAnalytics = pgTable('trip_analytics', {
  id: serial('id').primaryKey(),
  duration: integer('duration'),
  tier: text('tier'),
  regions: text('regions').array(),
  totalCost: numeric('total_cost'),
  safetyScore: numeric('safety_score'),
  enjoymentScore: numeric('enjoyment_score'),
  overall: text('overall'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── AUDIT LOG ──────────────────────────────────────────────────────────────
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  adminEmail: text('admin_email'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
