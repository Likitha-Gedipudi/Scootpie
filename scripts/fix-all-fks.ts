import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function fixAllForeignKeys() {
  try {
    console.log('🔧 Fixing all foreign key constraints to point to app_users...\n');

    const tables = ['collections', 'photos'];
    
    for (const tableName of tables) {
      console.log(`\n📋 Processing ${tableName} table...`);
      
      // Check if table exists
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists;
      `;

      if (!exists[0]?.exists) {
        console.log(`   ⚠️  ${tableName} table does not exist, skipping...`);
        continue;
      }

      // Clean up orphaned rows
      console.log(`   🧹 Cleaning up orphaned ${tableName}...`);
      const orphanedCount = await sql.unsafe(`
        DELETE FROM ${tableName}
        WHERE user_id NOT IN (SELECT id FROM app_users);
      `);
      console.log(`   ✅ Cleaned up ${orphanedCount.count || 0} orphaned row(s)`);

      // Get the constraint name
      const constraint = await sql.unsafe(`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = '${tableName}'
          AND kcu.column_name = 'user_id';
      `);

      if (constraint.length > 0) {
        const constraintName = constraint[0].constraint_name;
        console.log(`   📌 Found foreign key constraint: ${constraintName}`);
        console.log('   Dropping old constraint...');
        
        // Drop the old foreign key constraint
        await sql.unsafe(`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`);
        console.log('   ✅ Dropped old constraint');
      }

      // Add the correct foreign key constraint
      console.log('   Adding correct foreign key constraint...');
      await sql.unsafe(`
        ALTER TABLE ${tableName}
        ADD CONSTRAINT ${tableName}_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
      `);
      console.log(`   ✅ Fixed ${tableName} table`);
    }

    await sql.end();
    console.log('\n✨ All foreign key constraints fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

fixAllForeignKeys();

