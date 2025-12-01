/**
 * Data Extraction Script
 *
 * Extracts all data from Neon database and saves to static JSON files
 * for the static archive migration.
 *
 * Usage: node extract-data.js
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try both .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL or POSTGRES_URL not found in environment variables');
  console.error('Checked .env.local and .env files');
  process.exit(1);
}

console.log('Database connection configured');

// Initialize Neon client
const sql = neon(DATABASE_URL);

// Create data directories
const dataDir = path.join(__dirname, 'data');
const participantsDir = path.join(dataDir, 'participants');
const configDir = path.join(dataDir, 'config');

[dataDir, participantsDir, configDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Extract all participants data
 */
async function extractParticipants() {
  console.log('\n[1/4] Extracting all participants...');

  try {
    const allParticipants = await sql`
      SELECT
        name,
        first_name,
        last_name,
        email,
        timestamp,
        comments,
        visitor_type,
        published
      FROM leads
      ORDER BY timestamp ASC
    `;

    console.log(`Found ${allParticipants.length} total participants`);

    // Save raw data
    const filePath = path.join(participantsDir, 'all-participants.json');
    fs.writeFileSync(filePath, JSON.stringify(allParticipants, null, 2));
    console.log(`Saved to: ${filePath}`);

    return allParticipants;
  } catch (error) {
    console.error('Error extracting participants:', error);
    throw error;
  }
}

/**
 * Extract recent signups for live feed
 */
async function extractRecentSignups() {
  console.log('\n[2/4] Extracting recent signups...');

  try {
    const recentSignups = await sql`
      SELECT first_name, last_name, name, timestamp, comments
      FROM leads
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    // Process for display (anonymize)
    const processed = recentSignups.map(row => {
      let fullName = row.name || 'Anonymous';
      if (!fullName && row.first_name) {
        fullName = row.last_name
          ? `${row.first_name} ${row.last_name}`
          : row.first_name;
      }

      // Anonymize: First name + last initial
      const nameParts = fullName.trim().split(' ');
      let displayName = nameParts[0];

      if (nameParts.length > 1) {
        const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        displayName = `${nameParts[0]} ${lastNameInitial}.`;
      }

      return {
        name: displayName,
        timestamp: row.timestamp,
        comment: row.comments || null
      };
    });

    const filePath = path.join(participantsDir, 'recent-signups.json');
    fs.writeFileSync(filePath, JSON.stringify(processed, null, 2));
    console.log(`Saved ${processed.length} recent signups to: ${filePath}`);

    return processed;
  } catch (error) {
    console.error('Error extracting recent signups:', error);
    throw error;
  }
}

/**
 * Extract comments for thought bubbles
 */
async function extractComments() {
  console.log('\n[3/4] Extracting comments...');

  try {
    const commentsData = await sql`
      SELECT first_name, last_name, name, comments, timestamp
      FROM leads
      WHERE comments IS NOT NULL AND comments != ''
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    // Process comments with anonymized names
    const processed = commentsData.map(row => {
      let fullName = row.name || 'Anonymous';
      if (!fullName && row.first_name) {
        fullName = row.last_name
          ? `${row.first_name} ${row.last_name}`
          : row.first_name;
      }

      // Anonymize
      const nameParts = fullName.trim().split(' ');
      let displayName = nameParts[0];

      if (nameParts.length > 1) {
        const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        displayName = `${nameParts[0]} ${lastNameInitial}.`;
      }

      return {
        name: displayName,
        comment: row.comments,
        timestamp: row.timestamp
      };
    });

    const filePath = path.join(participantsDir, 'comments.json');
    fs.writeFileSync(filePath, JSON.stringify(processed, null, 2));
    console.log(`Saved ${processed.length} comments to: ${filePath}`);

    return processed;
  } catch (error) {
    console.error('Error extracting comments:', error);
    throw error;
  }
}

/**
 * Create site configuration with final counts
 */
async function createSiteConfig(allParticipants) {
  console.log('\n[4/4] Creating site configuration...');

  try {
    const totalCount = allParticipants.length;
    const publishedCount = allParticipants.filter(p => p.published).length;

    // Calculate today and week counts
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const todayCount = allParticipants.filter(p =>
      new Date(p.timestamp) >= todayStart
    ).length;

    const weekCount = allParticipants.filter(p =>
      new Date(p.timestamp) >= weekStart
    ).length;

    const config = {
      finalCount: totalCount,
      publishedCount: publishedCount,
      todayCount: todayCount,
      weekCount: weekCount,
      extractionDate: new Date().toISOString(),
      campaignStatus: 'archived',
      features: {
        donations: false,
        leaderboard: false,
        referrals: false,
        forms: false
      }
    };

    const filePath = path.join(configDir, 'site-config.json');
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log(`Saved site configuration to: ${filePath}`);
    console.log('\nFinal Statistics:');
    console.log(`- Total participants: ${totalCount}`);
    console.log(`- Published: ${publishedCount}`);
    console.log(`- Signups today: ${todayCount}`);
    console.log(`- Signups this week: ${weekCount}`);

    return config;
  } catch (error) {
    console.error('Error creating site config:', error);
    throw error;
  }
}

/**
 * Main extraction function
 */
async function main() {
  console.log('========================================');
  console.log('NSTCG Data Extraction Script');
  console.log('========================================');

  try {
    const allParticipants = await extractParticipants();
    await extractRecentSignups();
    await extractComments();
    await createSiteConfig(allParticipants);

    console.log('\n========================================');
    console.log('Data extraction complete!');
    console.log('========================================');
    console.log('\nExtracted files:');
    console.log('- data/participants/all-participants.json');
    console.log('- data/participants/recent-signups.json');
    console.log('- data/participants/comments.json');
    console.log('- data/config/site-config.json');
    console.log('\nNext step: Verify the data files are correct');

  } catch (error) {
    console.error('\n========================================');
    console.error('ERROR: Data extraction failed');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  }
}

// Run the extraction
main();
