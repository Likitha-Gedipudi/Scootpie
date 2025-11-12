import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Please set DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function createAppUsersTable() {
  try {
    console.log('🔧 Creating app_users table...\n');

    // Check if table already exists
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_users'
      ) as exists;
    `;

    if (exists[0]?.exists) {
      console.log('✅ app_users table already exists');
      await sql.end();
      return;
    }

    // Create app_users table
    await sql`
      CREATE TABLE app_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        clerk_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        preferences JSONB,
        primary_photo_id UUID
      );
    `;

    console.log('✅ app_users table created successfully!\n');

    // Verify the table was created
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'app_users'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 app_users table structure:');
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    await sql.end();
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error creating app_users table:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

createAppUsersTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });

