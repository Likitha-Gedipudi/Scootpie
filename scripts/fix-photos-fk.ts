import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function fixPhotosTable() {
  try {
    console.log('🔧 Fixing photos table foreign key constraint...\n');

    // Check if photos table exists
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'photos'
      ) as exists;
    `;

    if (!exists[0]?.exists) {
      console.log('⚠️  Photos table does not exist. Creating it...');
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
      console.log('✅ Created photos table with correct foreign key');
      await sql.end();
      return;
    }

    // Get the constraint name
    const constraint = await sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'photos'
        AND kcu.column_name = 'user_id';
    `;

    // First, clean up any orphaned rows (user_id not in app_users)
    console.log('🧹 Cleaning up orphaned photos...');
    const orphanedCount = await sql`
      DELETE FROM photos
      WHERE user_id NOT IN (SELECT id FROM app_users);
    `;
    console.log(`   ✅ Cleaned up ${orphanedCount.count || 0} orphaned photo(s)`);

    if (constraint.length > 0) {
      const constraintName = constraint[0].constraint_name;
      console.log(`📌 Found foreign key constraint: ${constraintName}`);
      console.log('   Dropping old constraint...');
      
      // Drop the old foreign key constraint
      await sql.unsafe(`ALTER TABLE photos DROP CONSTRAINT ${constraintName}`);
      console.log('   ✅ Dropped old constraint');
    }

    // Add the correct foreign key constraint
    console.log('   Adding correct foreign key constraint...');
    await sql`
      ALTER TABLE photos
      ADD CONSTRAINT photos_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
    `;
    console.log('   ✅ Added correct foreign key constraint');

    await sql.end();
    console.log('\n✨ Photos table fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

fixPhotosTable();

