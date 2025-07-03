import { Pool, PoolClient } from 'pg';
import { GeneratedUser, DatabaseRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface GenerationStats {
  totalGenerated: number;
  totalWithComments: number;
  commentPercentage: number;
}

interface BatchInfo {
  batchId: string;
  timestamp: Date;
  userCount: number;
  commentCount: number;
}

export class DatabaseService {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async ensureTable(): Promise<void> {
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
        is_generated BOOLEAN NOT NULL,
        generated_at TIMESTAMP NOT NULL,
        generation_batch UUID NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_generation_batch ON generated_users(generation_batch);
      CREATE INDEX IF NOT EXISTS idx_generated_at ON generated_users(generated_at);
    `;

    try {
      await this.pool.query(createTableQuery);
    } catch (error) {
      throw new Error(`Failed to create table: ${error}`);
    }
  }

  async saveUsers(users: GeneratedUser[]): Promise<string> {
    let client: PoolClient;
    const batchId = uuidv4();

    try {
      client = await this.pool.connect();
    } catch (error) {
      throw new Error(`Failed to save users: ${error}`);
    }

    try {
      await client.query('BEGIN');

      for (const user of users) {
        const insertQuery = `
          INSERT INTO generated_users (
            name, email, postcode, hear_about, wants_updates,
            comment, referral_code, is_generated, generated_at, generation_batch
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          user.name,
          user.email,
          user.postcode,
          user.hearAbout,
          user.wantsUpdates,
          user.comment || null,
          user.referralCode || null,
          true, // is_generated
          user.timestamp,
          batchId,
        ];

        await client.query(insertQuery, values);
      }

      await client.query('COMMIT');
      return batchId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to save users: ${error}`);
    } finally {
      client.release();
    }
  }

  async getTodayStats(): Promise<GenerationStats> {
    const query = `
      SELECT 
        COUNT(*) as total_generated,
        COUNT(comment) as total_with_comments
      FROM generated_users
      WHERE DATE(generated_at) = CURRENT_DATE
        AND is_generated = true
    `;

    try {
      const result = await this.pool.query(query, []);
      const row = result.rows[0];
      
      const totalGenerated = parseInt(row.total_generated, 10);
      const totalWithComments = parseInt(row.total_with_comments, 10);
      
      return {
        totalGenerated,
        totalWithComments,
        commentPercentage: totalGenerated > 0 ? totalWithComments / totalGenerated : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get today's stats: ${error}`);
    }
  }

  async getRecentBatches(limit: number = 10): Promise<BatchInfo[]> {
    const query = `
      SELECT 
        generation_batch,
        MIN(generated_at) as batch_time,
        COUNT(*) as user_count,
        COUNT(comment) as comment_count
      FROM generated_users
      WHERE is_generated = true
      GROUP BY generation_batch
      ORDER BY MIN(generated_at) DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      
      return result.rows.map(row => ({
        batchId: row.generation_batch,
        timestamp: new Date(row.batch_time),
        userCount: parseInt(row.user_count, 10),
        commentCount: parseInt(row.comment_count, 10),
      }));
    } catch (error) {
      throw new Error(`Failed to get recent batches: ${error}`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}