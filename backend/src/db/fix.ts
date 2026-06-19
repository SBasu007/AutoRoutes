import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
    console.log('🔄 Fixing old data statuses...');
    try {
        await db.execute(sql`UPDATE stands SET status = 'approved'`);
        await db.execute(sql`UPDATE routes SET status = 'approved'`);
        console.log('✅ Old data set to approved successfully!');
    } catch (e) {
        console.error('❌ Error fixing data:', e);
    }
}

main();
