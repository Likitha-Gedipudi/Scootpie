import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function fixCollectionsTable() {
  try {
    console.log('🔧 Fixing collections table foreign key constraint...\n');

    // Check if collections table exists
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collections'
      ) as exists;
    `;

    if (!exists[0]?.exists) {
      console.log('⚠️  Collections table does not exist. Creating it...');
      await sql`
        CREATE TABLE collections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          is_default BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;
      console.log('✅ Created collections table with correct foreign key');
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
        AND tc.table_name = 'collections'
        AND kcu.column_name = 'user_id';
    `;

    // First, clean up any orphaned rows (user_id not in app_users)
    console.log('🧹 Cleaning up orphaned collections...');
    const orphanedCount = await sql`
      DELETE FROM collections
      WHERE user_id NOT IN (SELECT id FROM app_users);
    `;
    console.log(`   ✅ Cleaned up ${orphanedCount.count || 0} orphaned collection(s)`);

    if (constraint.length > 0) {
      const constraintName = constraint[0].constraint_name;
      console.log(`📌 Found foreign key constraint: ${constraintName}`);
      console.log('   Dropping old constraint...');
      
      // Drop the old foreign key constraint
      await sql.unsafe(`ALTER TABLE collections DROP CONSTRAINT ${constraintName}`);
      console.log('   ✅ Dropped old constraint');
    }

    // Add the correct foreign key constraint
    console.log('   Adding correct foreign key constraint...');
    await sql`
      ALTER TABLE collections
      ADD CONSTRAINT collections_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
    `;
    console.log('   ✅ Added correct foreign key constraint');

    await sql.end();
    console.log('\n✨ Collections table fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

fixCollectionsTable();

