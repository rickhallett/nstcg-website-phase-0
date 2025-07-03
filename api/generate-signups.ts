import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionService } from '../src/services/notionService.js';
import { UserGenerator } from '../src/services/userGenerator.js';
import { DatabaseService } from '../src/services/databaseService.js';

// Main Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- Security Check ---
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Environment Variable Validation ---
  const requiredEnvVars = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_ID_USER_GEN',
    'NOTION_USER_GEN_DATABASE_ID',
    'OPENAI_API_KEY',
    'POSTGRES_URL',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      return res.status(500).json({ error: `Server configuration error: missing ${envVar}` });
    }
  }

  const notionService = new NotionService(
    process.env.NOTION_TOKEN!,
    process.env.NOTION_DATABASE_ID_USER_GEN!,
    process.env.NOTION_USER_GEN_DATABASE_ID!
  );

  const databaseService = new DatabaseService(process.env.POSTGRES_URL!);

  try {
    // Check if generation is globally enabled in Notion (simple boolean check)
    const config = await notionService.getConfig();
    if (!config?.enabled) {
      return res.status(200).json({ message: 'Generation is disabled in Notion. Skipping run.' });
    }

    // Fetch the prompt from Notion
    const prompt = await notionService.getPrompt();

    // Initialize the generator
    const userGenerator = new UserGenerator(prompt, process.env.OPENAI_API_KEY!);

    // The generator itself decides if it's time to create users
    const generationResult = await userGenerator.generateUsersForCurrentTime(
      config.openAIPercentage
    );

    if (generationResult.users.length === 0) {
      // This is the normal, expected outcome for most minutes.
      return res.status(200).json({ message: 'No users generated this minute.' });
    }

    // If users were generated, save them to the database
    await databaseService.ensureTable();
    const batchId = await databaseService.saveUsers(generationResult.users);

    console.log(`Successfully generated and saved ${generationResult.users.length} user(s). Batch ID: ${batchId}`);
    return res.status(200).json({
      success: true,
      generated: generationResult.users.length,
      batchId,
    });

  } catch (error) {
    console.error('Error during signup generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ error: 'Failed to generate signups.', details: errorMessage });
  } finally {
    // Ensure the database connection is always closed
    await databaseService.close();
  }
}