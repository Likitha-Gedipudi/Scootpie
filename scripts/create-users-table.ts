import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function createUsersTable() {
  try {
    console.log('🔧 Creating users table...\n');

    // Check if table already exists
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists;
    `;

    if (exists[0]?.exists) {
      console.log('✅ Users table already exists');
      await sql.end();
      return;
    }

    // Create users table
    await sql`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "clerk_id" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "name" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "preferences" jsonb,
        "primary_photo_id" uuid,
        CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
      );
    `;

    console.log('✅ Users table created successfully!\n');

    // Verify the table was created
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Users table structure:');
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    await sql.end();
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

createUsersTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

