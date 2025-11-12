import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function fixChatTables() {
  try {
    console.log('🔧 Fixing chat tables foreign key constraints...\n');

    // Fix conversations table
    console.log('1. Fixing conversations table...');
    const convConstraint = await sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'conversations'
        AND kcu.column_name = 'user_id';
    `;

    if (convConstraint.length > 0) {
      const constraintName = convConstraint[0].constraint_name;
      console.log(`   📌 Found foreign key constraint: ${constraintName}`);
      
      // Clean up orphaned rows
      console.log('   🧹 Cleaning up orphaned conversations...');
      const orphanedCount = await sql`
        DELETE FROM conversations
        WHERE user_id NOT IN (SELECT id FROM app_users);
      `;
      console.log(`   ✅ Cleaned up ${orphanedCount.count || 0} orphaned conversation(s)`);

      // Drop old constraint
      console.log('   Dropping old constraint...');
      await sql.unsafe(`ALTER TABLE conversations DROP CONSTRAINT ${constraintName}`);
      console.log('   ✅ Dropped old constraint');

      // Add correct constraint
      console.log('   Adding correct foreign key constraint...');
      await sql`
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
      `;
      console.log('   ✅ Fixed conversations table');
    } else {
      console.log('   ⚠️  No foreign key constraint found');
    }

    await sql.end();
    console.log('\n✨ Chat tables fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    await sql.end();
    process.exit(1);
  }
}

fixChatTables();

