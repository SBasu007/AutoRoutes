
CREATE TABLE "route_stops" (
	"id" serial PRIMARY KEY,
	"route_id" integer NOT NULL,
	"stand_id" integer NOT NULL,
	"stop_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "routes" (
	"id" serial PRIMARY KEY,
	"from_stand_id" integer,
	"to_stand_id" integer,
	"name" text,
	"path" text,
	"estimated_time_min" integer,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending',
	CONSTRAINT "routes_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);
CREATE TABLE "stands" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"address" text,
	"type" text DEFAULT 'auto_stand',
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending',
	CONSTRAINT "stands_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
	CONSTRAINT "stands_type_check" CHECK ((type = ANY (ARRAY['auto_stand'::text, 'destination'::text, 'stop'::text])))
);
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'contributor',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE contributions (
    id SERIAL PRIMARY KEY,

    stand_payload JSONB,
    route_payload JSONB,
    route_stops_payload JSONB,

    status TEXT DEFAULT 'pending',

    added_by UUID REFERENCES users(id),

    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,

    created_at TIMESTAMP DEFAULT now(),
    reviewed_at TIMESTAMP
);