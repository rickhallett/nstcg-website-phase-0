import { getDb } from './utils/neon-db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache for 1 minute with stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=3600, max-age=30');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = getDb();

    // Query Neon database for recent entries
    const results = await sql`
      SELECT first_name, last_name, name, timestamp, comments
      FROM leads
      ORDER BY timestamp DESC
      LIMIT 5
    `;

    // Process results to extract names and timestamps
    const signups = results.map(row => {
      try {
        // Get full name
        let fullName = row.name || 'Anonymous';
        if (!fullName && row.first_name) {
          fullName = row.last_name
            ? `${row.first_name} ${row.last_name}`
            : row.first_name;
        }

        // Anonymize name: First name + last initial
        const nameParts = fullName.trim().split(' ');
        let displayName = nameParts[0];

        if (nameParts.length > 1) {
          const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
          displayName = `${nameParts[0]} ${lastNameInitial}.`;
        }

        // Format timestamp
        let timestamp = new Date().toISOString();
        if (row.timestamp) {
          timestamp = row.timestamp instanceof Date
            ? row.timestamp.toISOString()
            : row.timestamp;
        }

        return {
          name: displayName,
          timestamp: timestamp,
          comment: row.comments || null
        };
      } catch (error) {
        console.error('Error processing signup:', error);
        return null;
      }
    }).filter(signup => signup !== null);

    // Return the processed signups
    res.status(200).json({
      signups: signups,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching recent signups:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Return empty array on error
    res.status(200).json({
      signups: [],
      timestamp: new Date().toISOString()
    });
  }
}
