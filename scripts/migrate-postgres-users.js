#!/usr/bin/env node

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function runMigration() {
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Starting database migration...');

    // Create the generated_users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS generated_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        postcode VARCHAR(10) NOT NULL,
        hear_about VARCHAR(50) NOT NULL,
        wants_updates BOOLEAN NOT NULL,
        comment TEXT,
        referral_code VARCHAR(10),
        is_generated BOOLEAN NOT NULL DEFAULT true,
        generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        generation_batch UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log('✅ Table created successfully');

    // Create indexes for better query performance
    const indexes = [
      {
        name: 'idx_generation_batch',
        query: 'CREATE INDEX IF NOT EXISTS idx_generation_batch ON generated_users(generation_batch);'
      },
      {
        name: 'idx_generated_at',
        query: 'CREATE INDEX IF NOT EXISTS idx_generated_at ON generated_users(generated_at);'
      },
      {
        name: 'idx_is_generated',
        query: 'CREATE INDEX IF NOT EXISTS idx_is_generated ON generated_users(is_generated);'
      },
      {
        name: 'idx_email',
        query: 'CREATE INDEX IF NOT EXISTS idx_email ON generated_users(email);'
      }
    ];

    for (const index of indexes) {
      await pool.query(index.query);
      console.log(`✅ Index ${index.name} created`);
    }

    // Add additional columns if they don't exist (for future migrations)
    const alterTableQueries = [
      {
        column: 'ip_address',
        query: `ALTER TABLE generated_users ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);`
      },
      {
        column: 'user_agent',
        query: `ALTER TABLE generated_users ADD COLUMN IF NOT EXISTS user_agent TEXT;`
      }
    ];

    for (const alteration of alterTableQueries) {
      try {
        await pool.query(alteration.query);
        console.log(`✅ Column ${alteration.column} added (if not existed)`);
      } catch (error) {
        // Column might already exist, which is fine
        console.log(`ℹ️  Column ${alteration.column} already exists or error: ${error.message}`);
      }
    }

    // Create a view for daily statistics
    const createViewQuery = `
      CREATE OR REPLACE VIEW daily_generation_stats AS
      SELECT 
        DATE(generated_at) as generation_date,
        COUNT(*) as total_generated,
        COUNT(comment) as total_with_comments,
        COUNT(DISTINCT generation_batch) as batch_count,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND((COUNT(comment)::numeric / COUNT(*)) * 100, 2)
          ELSE 0
        END as comment_percentage
      FROM generated_users
      WHERE is_generated = true
      GROUP BY DATE(generated_at)
      ORDER BY generation_date DESC;
    `;

    await pool.query(createViewQuery);
    console.log('✅ Statistics view created');

    // Get current statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN is_generated = true THEN 1 END) as generated_records,
        COUNT(CASE WHEN comment IS NOT NULL THEN 1 END) as records_with_comments
      FROM generated_users;
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    console.log('\n📊 Current Database Statistics:');
    console.log(`   Total records: ${stats.total_records}`);
    console.log(`   Generated records: ${stats.generated_records}`);
    console.log(`   Records with comments: ${stats.records_with_comments}`);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();