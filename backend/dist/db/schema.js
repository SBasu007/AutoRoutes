// src/db/schema.ts
import { pgTable, text, serial, doublePrecision, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').unique().notNull(),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').default('contributor'),
    createdAt: timestamp('created_at').defaultNow(),
});
export const contributions = pgTable('contributions', {
    id: serial('id').primaryKey(),
    standPayload: jsonb('stand_payload'),
    routePayload: jsonb('route_payload'),
    routeStopsPayload: jsonb('route_stops_payload'),
    status: text('status').default('pending'),
    addedBy: uuid('added_by').references(() => users.id),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at').defaultNow(),
    reviewedAt: timestamp('reviewed_at'),
});
export const stands = pgTable('stands', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    address: text('address'),
    type: text('type', { enum: ['auto_stand', 'destination', 'stop'] }).default('auto_stand'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
    addedBy: text('added_by').notNull(), // clerk user id or custom user id
    createdAt: timestamp('created_at').defaultNow(),
});
export const routes = pgTable('routes', {
    id: serial('id').primaryKey(),
    fromStandId: integer('from_stand_id').references(() => stands.id),
    toStandId: integer('to_stand_id').references(() => stands.id),
    name: text('name'), // e.g. "Ballygunge to Howrah"
    path: text('path'), // JSON stringified array of {lat, lng} points for polyline
    estimatedTimeMin: integer('estimated_time_min'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
    addedBy: text('added_by').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});
export const routeStops = pgTable("route_stops", {
    id: serial("id").primaryKey(),
    routeId: integer("route_id")
        .notNull()
        .references(() => routes.id, {
        onDelete: "cascade",
    }),
    standId: integer("stand_id")
        .notNull()
        .references(() => stands.id, {
        onDelete: "cascade",
    }),
    stopOrder: integer("stop_order").notNull(),
    createdAt: timestamp("created_at")
        .defaultNow(),
});
