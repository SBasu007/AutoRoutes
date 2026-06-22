import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
    console.log('🚀 Creating tables...');

    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contributions (
        id SERIAL PRIMARY KEY,
        stand_payload JSONB,
        route_payload JSONB,
        route_stops_payload JSONB,
        status TEXT DEFAULT 'pending',
        added_by UUID REFERENCES users(id),
        reviewed_by UUID REFERENCES users(id),
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP
      );
    `);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        address TEXT,
        type TEXT DEFAULT 'auto_stand' CHECK (type IN ('auto_stand', 'destination', 'stop')),
        added_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        from_stand_id INTEGER REFERENCES stands(id) ON DELETE CASCADE,
        to_stand_id INTEGER REFERENCES stands(id) ON DELETE CASCADE,
        name TEXT,
        path TEXT,
        estimated_time_min INTEGER,
        added_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS route_stops (
        id SERIAL PRIMARY KEY,
        route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        stand_id INTEGER NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
        stop_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        console.log('✅ Tables created successfully!');

        console.log('🔄 Applying migrations...');
        try {
            await db.execute(sql`ALTER TABLE stands ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))`);
            await db.execute(sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))`);
            console.log('✅ Migrations applied successfully!');
        } catch (e) {
            console.log('⚠️ Migration note: Columns might already exist or another error occurred:', e);
        }
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    }
}

main();