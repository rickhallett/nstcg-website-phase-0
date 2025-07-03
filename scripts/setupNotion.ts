import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Try to load .env if it exists
dotenv.config();

interface NotionSearchResponse {
  results: Array<{ id: string }>;
  has_more: boolean;
}

interface NotionDatabaseResponse {
  id: string;
  properties: Record<string, unknown>;
}

interface NotionPageResponse {
  id: string;
}

const NOTION_API_VERSION = '2022-06-28';
const DATABASE_NAME = 'API Control Panel_USER_GEN';
const PAGE_TITLE = 'LLM Comment Prompt_USER_GEN';

async function makeNotionRequest(endpoint: string, method: string, body?: unknown): Promise<Response> {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error('NOTION_TOKEN is required');
  }

  const response = await fetch(`https://api.notion.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }

  return response;
}

async function searchForDatabase(): Promise<string | null> {
  try {
    const response = await makeNotionRequest('search', 'POST', {
      query: DATABASE_NAME,
      filter: { property: 'object', value: 'database' },
    });

    const data = (await response.json()) as NotionSearchResponse;
    return data.results.length > 0 ? data.results[0].id : null;
  } catch (error) {
    throw new Error(`Failed to search for existing database: ${error}`);
  }
}

async function validatePageId(pageId: string): Promise<boolean> {
  try {
    const response = await makeNotionRequest(`pages/${pageId}`, 'GET');
    return response.ok;
  } catch (error) {
    console.log('❌ Page validation failed:', error);
    return false;
  }
}

async function createDatabase(): Promise<string> {
  // Notion API requires a valid page_id as parent for database creation
  const rootPageId = process.env.NOTION_USER_GEN_PROMPT_PAGE_ID;
  if (!rootPageId) {
    throw new Error(`
NOTION_USER_GEN_PROMPT_PAGE_ID is required to create a Notion database.

To get a page ID:
1. Open Notion in your browser
2. Navigate to the page where you want to create the database
3. Copy the page URL - it looks like: https://notion.so/workspace-name/page-title-32-character-id
4. Extract the 32-character ID from the URL (after the last dash)
5. Set it in your .env file: NOTION_USER_GEN_PROMPT_PAGE_ID=your-page-id-here

Alternatively, you can create a new page in Notion and use its ID.
    `);
  }

  // Validate page ID first
  console.log('🔍 Validating page ID...');
  const isValidPage = await validatePageId(rootPageId);
  if (!isValidPage) {
    throw new Error(`Invalid page ID: ${rootPageId}. Please check that the page exists and your integration has access to it.`);
  }
  console.log('✅ Page ID is valid');

  const databaseSchema = {
    parent: {
      type: 'page_id' as const,
      page_id: rootPageId
    },
    title: [
      {
        type: 'text',
        text: {
          content: 'API Control Panel USER GEN',
        },
      },
    ],
    properties: {
      Name: {
        title: {},
      },
      enabled: {
        checkbox: {},
      },
      startTime: {
        rich_text: {},
      },
      endTime: {
        rich_text: {},
      },
      minSignups: {
        number: {},
      },
      maxSignups: {
        number: {},
      },
      openAIPercentage: {
        number: {},
      },
      avgDelay: {
        number: {},
      },
      jitter: {
        number: {},
      },
    },
  };

  // Debug: Log the schema being sent
  console.log('🔍 Database schema being sent to Notion API:');
  console.log('Database name:', DATABASE_NAME);
  console.log('Parent page ID:', rootPageId);
  console.log('Title structure:', JSON.stringify(databaseSchema.title, null, 2));

  try {
    const response = await makeNotionRequest('databases', 'POST', databaseSchema);
    const data = (await response.json()) as NotionDatabaseResponse;
    return data.id;
  } catch (error) {
    throw new Error(`Failed to create database: ${error}`);
  }
}

async function createPromptPage(databaseId: string): Promise<string> {
  const pageContent = {
    parent: { database_id: databaseId },
    properties: {
      title: {
        title: [
          {
            text: { content: PAGE_TITLE },
          },
        ],
      },
      enabled: {
        checkbox: true,
      },
      startTime: {
        rich_text: [
          {
            text: { content: '00:00' },
          },
        ],
      },
      endTime: {
        rich_text: [
          {
            text: { content: '23:59' },
          },
        ],
      },
      minSignups: {
        number: 5,
      },
      maxSignups: {
        number: 20,
      },
      openAIPercentage: {
        number: 0.3, // 30%
      },
      avgDelay: {
        number: 120, // 2 minutes in seconds
      },
      jitter: {
        number: 30, // 30 seconds
      },
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `You are a concerned citizen in North Swanage who supports the traffic consultation group's efforts to improve road safety. Generate a thoughtful, genuine comment that:

1. Expresses personal concern about traffic safety (speeding, lack of crossings, HGVs, etc.)
2. References specific local areas naturally (High Street, Institute Road, Shore Road, etc.)  
3. Shows support for the consultation group's work
4. Feels authentic and conversational
5. Varies in length (1-3 sentences)
6. Sometimes mentions personal experiences or observations

Keep the tone positive and constructive. Avoid being overly dramatic or political.`,
              },
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await makeNotionRequest('pages', 'POST', pageContent);
    const data = (await response.json()) as NotionPageResponse;
    return data.id;
  } catch (error) {
    throw new Error(`Failed to create prompt page: ${error}`);
  }
}

function updateEnvFile(envPath: string, databaseId: string, pageId: string): void {
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  const updates: Record<string, string> = {
    NOTION_DATABASE_ID_USER_GEN: databaseId,
    NOTION_USER_GEN_DATABASE_ID: pageId,
  };

  // Update or append each variable
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      // Update existing
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Append new
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
}

export async function setupNotion(envPath?: string): Promise<void> {
  const targetEnvPath = envPath || path.join(process.cwd(), '.env');

  // Check if .env file exists and create template if not
  if (!fs.existsSync(targetEnvPath)) {
    console.log('📄 Creating .env file template...');
    fs.writeFileSync(targetEnvPath, `# Notion API Configuration
NOTION_TOKEN=your-notion-integration-token-here
NOTION_USER_GEN_PROMPT_PAGE_ID=your-notion-page-id-here

# These will be auto-generated by the setup script:
# NOTION_DATABASE_ID_USER_GEN=
# NOTION_USER_GEN_DATABASE_ID=
`);
    console.log('✅ Created .env file template');
    console.log('\n⚠️  Please update the .env file with your Notion credentials before running this script again.');
    console.log('\nTo set up Notion integration:');
    console.log('1. Go to https://www.notion.so/my-integrations');
    console.log('2. Create a new integration and copy the token');
    console.log('3. Update NOTION_TOKEN in .env file');
    console.log('4. Create or find a Notion page where you want the database');
    console.log('5. Copy the page ID from the URL and update NOTION_USER_GEN_PROMPT_PAGE_ID in .env file');
    return;
  }

  // Reload environment variables from the .env file
  dotenv.config({ path: targetEnvPath });

  // Check if required environment variables are set
  if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'your-notion-integration-token-here') {
    console.log('❌ NOTION_TOKEN is not set or still has the default value.');
    console.log('\nTo set up your Notion integration:');
    console.log('1. Go to https://www.notion.so/my-integrations');
    console.log('2. Create a new integration and copy the token');
    console.log('3. Update NOTION_TOKEN in your .env file');
    return;
  }

  if (!process.env.NOTION_USER_GEN_PROMPT_PAGE_ID || process.env.NOTION_USER_GEN_PROMPT_PAGE_ID === 'your-notion-page-id-here') {
    console.log('❌ NOTION_USER_GEN_PROMPT_PAGE_ID is not set or still has the default value.');
    console.log('\nTo get a page ID:');
    console.log('1. Open Notion in your browser');
    console.log('2. Navigate to the page where you want to create the database');
    console.log('3. Copy the page URL - it looks like: https://notion.so/workspace-name/page-title-32-character-id');
    console.log('4. Extract the 32-character ID from the URL (after the last dash)');
    console.log('5. Update NOTION_USER_GEN_PROMPT_PAGE_ID in your .env file');
    return;
  }

  console.log('🔍 Checking for existing Notion database...');

  // Check if database already exists
  let databaseId = await searchForDatabase();

  if (!databaseId) {
    console.log('📝 Creating new Notion database...');
    databaseId = await createDatabase();
    console.log(`✅ Created database: ${databaseId}`);

    console.log('📄 Creating prompt page...');
    const pageId = await createPromptPage(databaseId);
    console.log(`✅ Created page: ${pageId}`);

    console.log('💾 Updating .env file...');
    updateEnvFile(targetEnvPath, databaseId, pageId);
    console.log('✅ Environment variables updated');
  } else {
    console.log(`✅ Database already exists: ${databaseId}`);

    // Check if env vars need updating
    const envContent = fs.existsSync(targetEnvPath) ? fs.readFileSync(targetEnvPath, 'utf-8') : '';

    if (!envContent.includes('NOTION_DATABASE_ID_USER_GEN=')) {
      // Find existing page or create new one
      console.log('📄 Creating prompt page...');
      const pageId = await createPromptPage(databaseId);
      updateEnvFile(targetEnvPath, databaseId, pageId);
      console.log('✅ Environment variables updated');
    }
  }

  console.log('\n🎉 Setup complete!');
}

// Run if called directly
if (require.main === module) {
  setupNotion().catch(console.error);
}