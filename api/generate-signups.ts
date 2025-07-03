import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateSignups } from '../src/handlers/generateSignups';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests or cron jobs
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for cron job authentication or API key
  const authHeader = req.headers.authorization;
  const isCronJob = req.headers['x-vercel-cron'] === '1';

  if (!isCronJob) {
    // For manual triggers, require API key
    const apiKey = process.env.NOTION_TOKEN;
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    console.log('Starting user generation...');

    // Run generation with throttling enabled
    const result = await generateSignups(true);

    if (result.success) {
      console.log(`Successfully generated ${result.generated} users (${result.withComments} with comments)`);
      console.log(`Batch ID: ${result.batchId}`);

      if (result.todayStats) {
        console.log(`Today's stats: ${result.todayStats.totalGenerated} total, ${result.todayStats.totalWithComments} with comments`);
      }
    } else {
      console.log(`Generation failed: ${result.message || result.error}`);
    }

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Unexpected error in generate-signups:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}