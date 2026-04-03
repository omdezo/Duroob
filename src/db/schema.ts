import {
  pgTable,
  text,
  uuid,
  serial,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── USERS ──────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('user'),
  localePref: text('locale_pref').default('en'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── REGIONS ────────────────────────────────────────────────────────────────
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  latCenter: doublePrecision('lat_center'),
  lngCenter: doublePrecision('lng_center'),
});

// ─── CATEGORIES ─────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  icon: text('icon').notNull(),
});

// ─── DESTINATIONS ───────────────────────────────────────────────────────────
export const destinations = pgTable('destinations', {
  id: text('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  regionId: integer('region_id').references(() => regions.id),
  companyEn: text('company_en'),
  companyAr: text('company_ar'),
  avgVisitMin: integer('avg_visit_min').default(60),
  ticketCost: doublePrecision('ticket_cost').default(0),
  crowdLevel: integer('crowd_level'),
  images: text('images').array().default(sql`'{}'`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── DESTINATION ↔ CATEGORIES (M2M) ────────────────────────────────────────
export const destinationCategories = pgTable(
  'destination_categories',
  {
    destinationId: text('destination_id')
      .notNull()
      .references(() => destinations.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.destinationId, t.categoryId] }),
  }),
);

// ─── DESTINATION ↔ RECOMMENDED MONTHS (M2M) ────────────────────────────────
export const destinationMonths = pgTable(
  'destination_months',
  {
    destinationId: text('destination_id')
      .notNull()
      .references(() => destinations.id),
    month: integer('month').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.destinationId, t.month] }),
  }),
);

// ─── SAVED TRIPS ────────────────────────────────────────────────────────────
export const savedTrips = pgTable('saved_trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title'),
  inputsJson: jsonb('inputs_json').notNull(),
  planJson: jsonb('plan_json').notNull(),
  scoresJson: jsonb('scores_json'),
  isShared: boolean('is_shared').default(false),
  shareToken: text('share_token').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── SAVED INTERESTS ────────────────────────────────────────────────────────
export const savedInterests = pgTable('saved_interests', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  destinationId: text('destination_id').references(() => destinations.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── ANALYTICS EVENTS ───────────────────────────────────────────────────────
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: text('session_id'),
  payload: jsonb('payload').default(sql`'{}'`),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── CHAT SESSIONS ──────────────────────────────────────────────────────────
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── CHAT MESSAGES ──────────────────────────────────────────────────────────
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').references(() => chatSessions.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),
  planSnapshot: jsonb('plan_snapshot'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── ADMIN AUDIT LOG ────────────────────────────────────────────────────────
export const adminAuditLog = pgTable('admin_audit_log', {
  id: serial('id').primaryKey(),
  adminUserId: uuid('admin_user_id').references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── PLATFORM SETTINGS ──────────────────────────────────────────────────────
export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});
