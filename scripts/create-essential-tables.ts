import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Please set DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function createEssentialTables() {
  try {
    console.log('🔧 Creating essential database tables...\n');

    // 1. Create app_users table if it doesn't exist
    console.log('1. Checking app_users table...');
    const usersExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_users'
      ) as exists;
    `;

    if (!usersExists[0]?.exists) {
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
      console.log('   ✅ Created app_users table');
    } else {
      console.log('   ✅ app_users table already exists');
    }

    // 2. Create photos table if it doesn't exist
    console.log('2. Checking photos table...');
    const photosExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'photos'
      ) as exists;
    `;

    if (!photosExists[0]?.exists) {
      await sql`
        CREATE TABLE photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT false NOT NULL,
          uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
          metadata JSONB
        );
      `;
      console.log('   ✅ Created photos table');
    } else {
      console.log('   ✅ photos table already exists');
    }

    // 3. Create collections table if it doesn't exist
    console.log('3. Checking collections table...');
    const collectionsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collections'
      ) as exists;
    `;

    if (!collectionsExists[0]?.exists) {
      await sql`
        CREATE TABLE collections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          is_default BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;
      console.log('   ✅ Created collections table');
    } else {
      console.log('   ✅ collections table already exists');
    }

    await sql.end();
    console.log('\n✨ All essential tables are ready!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

createEssentialTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });

