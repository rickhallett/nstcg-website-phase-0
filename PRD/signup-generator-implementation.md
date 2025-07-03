# Agentic Sign-Up Generator Implementation Plan (Final)

## Critical Acknowledgments
- ✅ Use `NOTION_TOKEN` (not NOTION_API_KEY) as per existing codebase
- ✅ Will NOT overwrite any existing files/directories
- ✅ Will complete ENTIRE PRD without stopping
- ✅ Database IDs will use suffix "_USER_GEN"
- ✅ Will use curl for Notion API calls (no MCP available)
- ✅ Follow existing API patterns from the codebase

## Complete Execution Plan

### Sprint 1: Project & Test Setup
1. Install TypeScript dependencies via Bun
2. Create `tsconfig.json` 
3. Create `jest.config.js`
4. Create test directory structure
5. Write basic test to verify setup

### Sprint 2: Automated Setup Script (TDD)
1. Write failing tests for:
   - Checking existing "API Control Panel_USER_GEN" database
   - Creating database with correct schema
   - Creating "LLM Comment Prompt_USER_GEN" page
   - Appending IDs to .env file
2. Implement `scripts/setupNotion.ts` using:
   - `Authorization: Bearer ${process.env.NOTION_TOKEN}`
   - `Notion-Version: 2022-06-28`
   - Same pattern as existing API files

### Sprint 3: Core Logic - Configuration (TDD)
1. Write failing tests for Notion service
2. Implement configuration fetching using existing patterns

### Sprint 4: Core Logic - Generation (TDD)
1. Write all failing tests for:
   - User generation with faker.js
   - OpenAI comment generation (percentage-based)
   - Postgres persistence
   - Throttled timing
2. Implement all services following TDD

### Sprint 5: Deployment
1. Create `api/generate-signups.ts` following existing API patterns
2. Update `vercel.json`:
   - Add function configuration
   - Add cron job: `"crons": [{"path": "/api/generate-signups", "schedule": "0 0 * * *"}]`
3. Create Postgres migration script
4. Document environment variables

## New Files to Create
```
├── src/
│   ├── handlers/
│   │   └── generateSignups.ts
│   ├── services/
│   │   ├── notionService.ts
│   │   ├── userGenerator.ts
│   │   └── databaseService.ts
│   └── types/
│       └── index.ts
├── scripts/
│   ├── setupNotion.ts
│   └── migrate-postgres-users.js
├── tests/
│   └── signup-generator/
│       ├── setupNotion.test.ts
│       ├── notionService.test.ts
│       ├── userGenerator.test.ts
│       ├── databaseService.test.ts
│       └── generateSignups.test.ts
├── api/
│   └── generate-signups.ts
├── tsconfig.json
├── jest.config.js
└── .env.example
```

## Environment Variables
```bash
# Existing (will use)
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=... 

# New (will be added by setup script)
NOTION_DATABASE_ID_USER_GEN=...
NOTION_USER_GEN_DATABASE_ID=...

# New (need to be added manually)
OPENAI_API_KEY=sk-...
POSTGRES_URL=postgres://...
```

## Execution Promise
I will now execute ALL sprints in sequence, following strict TDD. Each test will be written before implementation. The system will be fully functional at completion.