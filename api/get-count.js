import { getDb } from './utils/neon-db.js';

// Simple caching mechanism
let cachedCount = null;
let cacheTime = 0;
const CACHE_DURATION = 900000; // 15 minute cache

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache for 15 minutes with stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400, max-age=300');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check cache
  const now = Date.now();
  if (cachedCount !== null && (now - cacheTime) < CACHE_DURATION) {
    return res.status(200).json({ count: cachedCount });
  }

  try {
    const sql = getDb();

    // Query Neon database for count
    const result = await sql`SELECT COUNT(*) as count FROM leads`;
    const totalCount = parseInt(result[0].count, 10);

    // Update cache
    cachedCount = 215 + totalCount; // Add base count to database count
    cacheTime = now;

    // Log count for monitoring
    console.log('Database count fetched:', {
      databaseCount: totalCount,
      displayCount: cachedCount,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ count: cachedCount });

  } catch (error) {
    console.error('Error fetching count:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Return cached count if available (even if stale)
    if (cachedCount !== null) {
      console.log('Returning stale cache due to error');
      return res.status(200).json({
        count: cachedCount,
        stale: true
      });
    }

    // Return default count on error
    res.status(200).json({ count: 215 });
  }
}
