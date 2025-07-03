import { NotionService } from '../services/notionService';
import { UserGenerator } from '../services/userGenerator';
import { DatabaseService } from '../services/databaseService';
import { GeneratedUser } from '../types';

interface GenerationResult {
  success: boolean;
  generated?: number;
  withComments?: number;
  batchId?: string;
  message?: string;
  error?: string;
  todayStats?: {
    totalGenerated: number;
    totalWithComments: number;
    commentPercentage: number;
  };
}

export async function generateSignups(enableThrottling: boolean = false): Promise<GenerationResult> {
  // Validate environment variables
  const requiredEnvVars = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_ID_USER_GEN',
    'NOTION_USER_GEN_DATABASE_ID',
    'OPENAI_API_KEY',
    'POSTGRES_URL',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      return {
        success: false,
        error: `Missing required environment variables: ${envVar}`,
      };
    }
  }

  // Initialize services
  const notionService = new NotionService(
    process.env.NOTION_TOKEN!,
    process.env.NOTION_DATABASE_ID_USER_GEN!,
    process.env.NOTION_USER_GEN_DATABASE_ID!
  );

  const databaseService = new DatabaseService(process.env.POSTGRES_URL!);

  try {
    // Get configuration from Notion
    const config = await notionService.getConfig();
    if (!config) {
      return {
        success: false,
        message: 'No configuration found',
      };
    }

    if (!config.enabled) {
      return {
        success: false,
        message: 'Generation is disabled',
      };
    }

    // Get prompt from Notion
    const prompt = await notionService.getPrompt();

    // Initialize user generator
    const userGenerator = new UserGenerator(config, prompt, process.env.OPENAI_API_KEY!);

    // Check time window
    if (!userGenerator.isWithinTimeWindow()) {
      return {
        success: false,
        message: 'Outside configured time window',
      };
    }

    // Ensure database table exists
    await databaseService.ensureTable();

    // Generate users
    const generationResult = await userGenerator.generateUsers();

    // Apply throttling if enabled
    if (enableThrottling && generationResult.users.length > 1) {
      const throttledUsers: GeneratedUser[] = [];

      for (let i = 0; i < generationResult.users.length; i++) {
        throttledUsers.push(generationResult.users[i]);

        // Add delay between users (except for the last one)
        if (i < generationResult.users.length - 1) {
          const delay = userGenerator.calculateDelay();
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      generationResult.users = throttledUsers;
    }

    // Save users to database
    const batchId = await databaseService.saveUsers(generationResult.users);

    // Get today's stats
    const todayStats = await databaseService.getTodayStats();

    return {
      success: true,
      generated: generationResult.users.length,
      withComments: generationResult.withComments,
      batchId,
      todayStats,
    };
  } catch (error) {
    console.error('Error in generateSignups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Always close database connection
    await databaseService.close();
  }
}