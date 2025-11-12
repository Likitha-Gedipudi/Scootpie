import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function checkChatTables() {
  try {
    console.log('🔍 Checking chat-related tables...\n');

    const tables = ['conversations', 'messages'];
    
    for (const tableName of tables) {
      console.log(`\n📋 Checking ${tableName} table...`);
      
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists;
      `;

      if (!exists[0]?.exists) {
        console.log(`   ❌ ${tableName} table does NOT exist`);
      } else {
        console.log(`   ✅ ${tableName} table exists`);
        
        // Check columns
        const columns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;
        
        console.log(`   📋 Columns:`);
        columns.forEach((col: any) => {
          console.log(`      - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Check foreign keys
        const fks = await sql.unsafe(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = '${tableName}';
        `);

        if (fks.length > 0) {
          console.log(`   🔗 Foreign keys:`);
          fks.forEach((fk: any) => {
            console.log(`      - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
      }
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkChatTables();

