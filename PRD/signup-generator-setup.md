# Signup Generator Setup Guide

## Implementation Complete! 🎉

The agentic signup generator has been fully implemented with TDD. All 49 tests are passing.

## Setup Instructions

### 1. Run Notion Setup Script
First, create the required Notion databases and configuration:

```bash
npx ts-node scripts/setupNotion.ts
```

This will:
- Create "API Control Panel_USER_GEN" database in Notion
- Create "LLM Comment Prompt_USER_GEN" page with default prompt
- Add database IDs to your .env file

### 2. Set Up PostgreSQL Database
Run the migration script to create the required tables:

```bash
node scripts/migrate-postgres-users.js
```

### 3. Configure Environment Variables
Add these to your `.env` file (if not already added by setup script):

```env
# OpenAI for comment generation
OPENAI_API_KEY=sk-...

# PostgreSQL connection
POSTGRES_URL=postgres://user:password@host:port/database

# API protection (optional)
NOTION_TOKEN=your-secure-api-key
```

### 4. Configure Generation Settings
1. Go to your Notion workspace
2. Open "API Control Panel_USER_GEN" database
3. Edit the configuration with your desired settings:
   - **enabled**: Turn generation on/off
   - **startTime/endTime**: Active hours (24hr format)
   - **minSignups/maxSignups**: Range of users per batch
   - **openAIPercentage**: Percentage with AI comments (0-1)
   - **avgDelay**: Average seconds between signups
   - **jitter**: Random delay variation in seconds

### 5. Customize Comment Prompt
1. Open "LLM Comment Prompt_USER_GEN" page in Notion
2. Edit the prompt text to customize AI-generated comments

## Usage

### Automatic (Cron Job)
The system runs automatically at midnight UTC daily via Vercel cron:
- Configured in `vercel.json`
- Only runs if enabled and within time window

### Manual Trigger
```bash
# With API key protection
curl -X POST https://your-domain.vercel.app/api/generate-signups \
  -H "Authorization: Bearer YOUR_NOTION_TOKEN"

# Local testing
curl -X POST http://localhost:3000/api/generate-signups \
  -H "Authorization: Bearer test-key"
```

## Monitoring

### View Today's Stats
```sql
SELECT * FROM daily_generation_stats 
WHERE generation_date = CURRENT_DATE;
```

### View Recent Batches
```sql
SELECT * FROM generated_users 
ORDER BY generated_at DESC 
LIMIT 50;
```

## File Structure Created
```
├── src/
│   ├── handlers/
│   │   └── generateSignups.ts         # Main orchestrator
│   ├── services/
│   │   ├── notionService.ts          # Notion API integration
│   │   ├── userGenerator.ts          # User & comment generation
│   │   └── databaseService.ts        # PostgreSQL persistence
│   └── types/
│       └── index.ts                   # TypeScript types
├── scripts/
│   ├── setupNotion.ts                 # Notion setup script
│   └── migrate-postgres-users.js      # Database migration
├── tests/signup-generator/            # Comprehensive test suite
├── api/
│   └── generate-signups.ts           # Vercel endpoint
├── tsconfig.json                      # TypeScript config
├── jest.config.cjs                    # Jest test config
└── .env.example                       # Environment template
```

## Test Coverage
- ✅ 6 test suites
- ✅ 49 tests passing
- ✅ Full TDD implementation
- ✅ Mocked external dependencies

## Security Features
- API key protection for manual triggers
- Cron job authentication via Vercel headers
- Environment variable validation
- PostgreSQL SSL in production
- Rate limiting through time windows

## Next Steps
1. Deploy to Vercel: `vercel --prod`
2. Monitor first automated run at midnight
3. Adjust configuration as needed in Notion
4. Review generated users in PostgreSQL

The system is now fully operational and ready for deployment!