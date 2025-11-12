import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('🔄 Starting migration to app_users table...');

    // Drop existing tables that reference users
    console.log('1. Dropping dependent tables...');
    await sql`DROP TABLE IF EXISTS try_on_cache CASCADE`;
    await sql`DROP TABLE IF EXISTS collection_items CASCADE`;
    await sql`DROP TABLE IF EXISTS collections CASCADE`;
    await sql`DROP TABLE IF EXISTS messages CASCADE`;
    await sql`DROP TABLE IF EXISTS conversations CASCADE`;
    await sql`DROP TABLE IF EXISTS swipes CASCADE`;
    await sql`DROP TABLE IF EXISTS photos CASCADE`;
    await sql`DROP TABLE IF EXISTS user_style_profiles CASCADE`;
    console.log('✅ Dropped dependent tables');

    // Create app_users table if it doesn't exist
    console.log('2. Ensuring app_users table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        preferences JSONB,
        primary_photo_id UUID
      )
    `;
    console.log('✅ app_users table ready');

    // Recreate photos table
    console.log('3. Creating photos table...');
    await sql`
      CREATE TABLE photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT false NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
        metadata JSONB
      )
    `;
    console.log('✅ Created photos table');

    // Recreate collections table
    console.log('4. Creating collections table...');
    await sql`
      CREATE TABLE collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created collections table');

    // Recreate collection_items table
    console.log('5. Creating collection_items table...');
    await sql`
      CREATE TABLE collection_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT NOW() NOT NULL,
        try_on_image_url TEXT
      )
    `;
    console.log('✅ Created collection_items table');

    // Recreate swipes table
    console.log('6. Creating swipes table...');
    await sql`
      CREATE TABLE swipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        direction VARCHAR(10) NOT NULL,
        swiped_at TIMESTAMP DEFAULT NOW() NOT NULL,
        session_id UUID NOT NULL,
        card_position INTEGER NOT NULL
      )
    `;
    console.log('✅ Created swipes table');

    // Recreate conversations table
    console.log('7. Creating conversations table...');
    await sql`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_message_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created conversations table');

    // Recreate messages table
    console.log('8. Creating messages table...');
    await sql`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        product_recommendations JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created messages table');

    // Recreate try_on_cache table
    console.log('9. Creating try_on_cache table...');
    await sql`
      CREATE TABLE try_on_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        generated_image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(user_id, photo_id, product_id)
      )
    `;
    console.log('✅ Created try_on_cache table');

    // Recreate user_style_profiles table
    console.log('10. Creating user_style_profiles table...');
    await sql`
      CREATE TABLE user_style_profiles (
        user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        style_vector vector(384),
        preferred_categories JSONB,
        price_sensitivity DECIMAL(3, 2),
        color_preferences JSONB,
        brand_affinities JSONB,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created user_style_profiles table');

    console.log('');
    console.log('✨ Migration completed successfully!');
    console.log('All tables now reference app_users instead of users');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

migrate();
