import 'dotenv/config';
import { getDb } from '../../api/utils/neon-db.js';
import fs from 'fs';

/**
 * Restore original timestamps from Notion backup to Neon database
 */
async function restoreTimestamps() {
  console.log('Starting timestamp restoration...');

  try {
    const sql = getDb();

    // Read the backup file
    const backupContent = fs.readFileSync('leads-backup.md', 'utf-8');

    // Parse entries - each lead is in a separate <file> block
    const entries = backupContent.split(/<file path=/);

    const timestampMap = new Map();

    for (const entry of entries) {
      // Extract email
      const emailMatch = entry.match(/Email:\s*([^\n]+)/);
      // Extract timestamp
      const timestampMatch = entry.match(/Timestamp:\s*([A-Za-z]+\s+\d+,\s+\d+\s+\d+:\d+\s+[AP]M\s+\([^)]+\))/);

      if (emailMatch && timestampMatch) {
        const email = emailMatch[1].trim();
        const timestampStr = timestampMatch[1].trim();

        // Parse the Notion timestamp format: "June 20, 2025 4:26 PM (GMT+1)"
        const parsedDate = parseNotionTimestamp(timestampStr);

        if (parsedDate && email) {
          timestampMap.set(email, parsedDate);
        }
      }
    }

    console.log(`Found ${timestampMap.size} timestamps to restore`);

    // Update each record in the database
    let updated = 0;
    let notFound = 0;

    for (const [email, timestamp] of timestampMap.entries()) {
      try {
        const result = await sql`
          UPDATE leads
          SET timestamp = ${timestamp}
          WHERE email = ${email}
        `;

        if (result.count > 0) {
          updated++;
          if (updated % 50 === 0) {
            console.log(`Updated ${updated} records...`);
          }
        } else {
          notFound++;
        }
      } catch (error) {
        console.error(`Error updating ${email}:`, error.message);
      }
    }

    console.log('\nTimestamp restoration complete:');
    console.log(`- Updated: ${updated} records`);
    console.log(`- Not found in database: ${notFound} records`);

    // Verify the update
    const verifyResult = await sql`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM leads
      WHERE published = true
      GROUP BY DATE(timestamp)
      ORDER BY date
      LIMIT 10
    `;

    console.log('\nTimestamp distribution after restoration:');
    verifyResult.forEach(row => {
      console.log(`  ${row.date}: ${row.count} participants`);
    });

  } catch (error) {
    console.error('Error restoring timestamps:', error);
    throw error;
  }
}

/**
 * Parse Notion timestamp format to ISO date
 * Format: "June 20, 2025 4:26 PM (GMT+1)"
 */
function parseNotionTimestamp(timestampStr) {
  try {
    // Remove timezone part for now
    const dateStr = timestampStr.replace(/\s*\(GMT[+-]\d+\)/, '');

    // Parse the date
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      console.error(`Invalid date: ${timestampStr}`);
      return null;
    }

    return date.toISOString();
  } catch (error) {
    console.error(`Error parsing timestamp "${timestampStr}":`, error.message);
    return null;
  }
}

// Run the restoration
restoreTimestamps()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
