import { getDb } from './utils/neon-db.js';

// Simple in-memory cache
let cachedData = null;
let cacheTime = 0;
const CACHE_DURATION = 900000; // 15 minutes

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Cache for 15 minutes with stale-while-revalidate for better performance
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
  if (cachedData !== null && (now - cacheTime) < CACHE_DURATION) {
    return res.status(200).json(cachedData);
  }

  try {
    const sql = getDb();

    // Fetch all participants from Neon database
    const allParticipants = await sql`
      SELECT
        name,
        timestamp,
        comments
      FROM leads
      WHERE published = true
      ORDER BY timestamp ASC
    `;

    // Process results to match expected format
    const processedResults = allParticipants.map(participant => {
      // Anonymize name: First name + last initial
      const fullName = participant.name || 'Anonymous';
      const nameParts = fullName.trim().split(' ');
      let displayName = nameParts[0];

      if (nameParts.length > 1) {
        const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        displayName = `${nameParts[0]} ${lastNameInitial}.`;
      }

      return {
        name: displayName,
        timestamp: participant.timestamp,
        comment: participant.comments || null
      };
    });

    // Calculate statistics
    const nowDate = new Date();
    const todayStart = new Date(nowDate);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(nowDate);
    weekStart.setDate(weekStart.getDate() - 7);

    const todayCount = processedResults.filter(p =>
      new Date(p.timestamp) >= todayStart
    ).length;

    const weekCount = processedResults.filter(p =>
      new Date(p.timestamp) >= weekStart
    ).length;

    // Prepare response data
    const responseData = {
      participants: processedResults,
      totalCount: processedResults.length, // Just database count, frontend adds base count
      todayCount: todayCount,
      weekCount: weekCount,
      timestamp: new Date().toISOString()
    };

    // Update cache
    cachedData = responseData;
    cacheTime = now;

    // Log for monitoring
    console.log('Participants fetched from Neon:', {
      totalCount: responseData.totalCount,
      todayCount: responseData.todayCount,
      weekCount: responseData.weekCount,
      timestamp: responseData.timestamp
    });

    // Return all participants with statistics
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching all participants:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Return cached data if available (even if stale)
    if (cachedData !== null) {
      console.log('Returning stale cache due to error');
      return res.status(200).json({
        ...cachedData,
        stale: true
      });
    }

    // Return error response
    res.status(500).json({
      error: 'Failed to fetch participants',
      participants: [],
      totalCount: 0,
      todayCount: 0,
      weekCount: 0,
      timestamp: new Date().toISOString()
    });
  }
}
