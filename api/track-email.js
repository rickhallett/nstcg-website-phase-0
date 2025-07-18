/**
 * Email Tracking Pixel API Endpoint
 * 
 * Tracks email opens by serving a 1x1 transparent GIF
 * and logging the open event to Notion database.
 */

import { Client } from '@notionhq/client';

// 1x1 transparent GIF (43 bytes)
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// Bot user agents to ignore
const BOT_USER_AGENTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'applebot', 'semrushbot', 'dataprovider', 'ahrefs'
];

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Simple obfuscation for email addresses
function obfuscateEmail(email) {
  return Buffer.from(email).toString('base64').replace(/=/g, '');
}

function deobfuscateEmail(encoded) {
  // Add back padding if needed
  const padding = encoded.length % 4;
  const padded = padding ? encoded + '='.repeat(4 - padding) : encoded;
  return Buffer.from(padded, 'base64').toString('utf-8');
}

// Check if user agent is a bot
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

// Get anonymized location from IP headers
function getAnonymizedLocation(headers) {
  // Vercel provides geo headers
  const country = headers['x-vercel-ip-country'] || 'Unknown';
  const region = headers['x-vercel-ip-country-region'] || 'Unknown';
  return { country, region };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract parameters
    const { e: encodedEmail, c: campaignId, t: timestamp } = req.query;

    // Always return the tracking pixel, regardless of tracking success
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).send(TRACKING_PIXEL);

    // Validate required parameters
    if (!encodedEmail || !campaignId) {
      console.log('Missing required parameters');
      return;
    }

    // Check user agent for bots
    const userAgent = req.headers['user-agent'] || '';
    if (isBot(userAgent)) {
      console.log('Bot detected, skipping tracking');
      return;
    }

    // Validate timestamp (within 30 days)
    if (timestamp) {
      const openTime = parseInt(timestamp);
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (isNaN(openTime) || now - openTime > thirtyDays) {
        console.log('Invalid or expired timestamp');
        return;
      }
    }

    // Decode email
    let email;
    try {
      email = deobfuscateEmail(encodedEmail);
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email format');
      }
    } catch (error) {
      console.log('Failed to decode email:', error.message);
      return;
    }

    // Get location data
    const location = getAnonymizedLocation(req.headers);

    // Check if email analytics database is configured
    if (!process.env.NOTION_EMAIL_ANALYTICS_DB_ID) {
      console.log('Email analytics database not configured, creating in gamification DB');
      
      // Log to gamification database instead
      if (process.env.NOTION_GAMIFICATION_DB_ID) {
        await logToGamificationDB(email, campaignId, userAgent, location);
      }
      return;
    }

    // Log email open to Notion
    await logEmailOpen(email, campaignId, userAgent, location);

  } catch (error) {
    console.error('Error tracking email:', error);
    // Don't return error to client, tracking should be transparent
  }
}

async function logEmailOpen(email, campaignId, userAgent, location) {
  try {
    // First, check if this email/campaign combination exists
    const response = await notion.databases.query({
      database_id: process.env.NOTION_EMAIL_ANALYTICS_DB_ID,
      filter: {
        and: [
          { property: 'Email', title: { equals: email } }, // Email is a title property
          { property: 'Campaign ID', rich_text: { equals: campaignId } }
        ]
      },
      page_size: 1
    });

    const now = new Date().toISOString();

    if (response.results.length > 0) {
      // Update existing record
      const page = response.results[0];
      const currentOpenCount = page.properties['Open Count']?.number || 0;
      
      await notion.pages.update({
        page_id: page.id,
        properties: {
          'Open Count': { number: currentOpenCount + 1 },
          'Last Opened': { date: { start: now } },
          'Country': { rich_text: [{ text: { content: location.country } }] },
          'Region': { rich_text: [{ text: { content: location.region } }] }
        }
      });
    } else {
      // Create new record
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_EMAIL_ANALYTICS_DB_ID },
        properties: {
          'Email': { title: [{ text: { content: email } }] }, // Email is a title property
          'Campaign ID': { rich_text: [{ text: { content: campaignId } }] },
          'Open Count': { number: 1 },
          'First Opened': { date: { start: now } },
          'Last Opened': { date: { start: now } },
          'Country': { rich_text: [{ text: { content: location.country } }] },
          'Region': { rich_text: [{ text: { content: location.region } }] }
        }
      });
    }

    console.log(`Tracked email open: ${email} - Campaign: ${campaignId}`);
  } catch (error) {
    console.error('Failed to log email open:', error);
  }
}

async function logToGamificationDB(email, campaignId, userAgent, location) {
  try {
    // Find user in gamification database
    const response = await notion.databases.query({
      database_id: process.env.NOTION_GAMIFICATION_DB_ID,
      filter: { property: 'Email', email: { equals: email } },
      page_size: 1
    });

    if (response.results.length > 0) {
      // Update user's last activity
      const page = response.results[0];
      const properties = page.properties;
      
      // Get current email opens count (we'll add this field)
      const currentEmailOpens = properties['Email Opens']?.number || 0;
      
      await notion.pages.update({
        page_id: page.id,
        properties: {
          'Email Opens': { number: currentEmailOpens + 1 },
          'Last Activity': { date: { start: new Date().toISOString() } },
          'Last Email Campaign': { rich_text: [{ text: { content: campaignId } }] }
        }
      });

      console.log(`Tracked email open in gamification DB: ${email} - Campaign: ${campaignId}`);
    }
  } catch (error) {
    console.error('Failed to log to gamification DB:', error);
  }
}

// Export helper function for generating tracking URLs
export function generateTrackingPixelUrl(email, campaignId) {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://nstcg.org';
  
  const params = new URLSearchParams({
    e: obfuscateEmail(email),
    c: campaignId,
    t: Date.now().toString()
  });
  
  return `${baseUrl}/api/track-email?${params.toString()}`;
}