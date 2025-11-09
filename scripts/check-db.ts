import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Please set DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection and tables...\n');

    // Check if users table exists
    try {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists;
      `;
      const tableExists = result[0]?.exists;
      
      if (tableExists) {
        console.log('✅ Users table exists');
        
        // Check table structure
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
          ORDER BY ordinal_position;
        `;
        console.log('📋 Users table columns:');
        columns.forEach((col: any) => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // Check row count
        const count = await sql`SELECT COUNT(*) as count FROM users`;
        console.log(`\n📊 Users table has ${count[0]?.count || 0} row(s)\n`);
      } else {
        console.log('❌ Users table does NOT exist');
        console.log('\n⚠️  You need to run the database migration:');
        console.log('   npm run db:push\n');
      }
    } catch (error) {
      console.error('❌ Error checking users table:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        if ('code' in error) {
          console.error('   Error code:', (error as any).code);
        }
      }
    }

    // Check other important tables
    const tablesToCheck = ['photos', 'collections', 'products', 'swipes'];
    for (const table of tablesToCheck) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          ) as exists;
        `;
        const exists = result[0]?.exists;
        console.log(`${exists ? '✅' : '❌'} ${table} table ${exists ? 'exists' : 'does NOT exist'}`);
      } catch (error) {
        console.error(`❌ Error checking ${table} table:`, error);
      }
    }

    console.log('\n✨ Database check complete!');
    await sql.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('\n⚠️  Please check:');
      console.error('   1. DATABASE_URL is set in .env.local');
      console.error('   2. Database is accessible');
      console.error('   3. Database credentials are correct');
    }
    await sql.end();
    process.exit(1);
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

