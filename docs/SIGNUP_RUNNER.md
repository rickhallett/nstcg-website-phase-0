# Signup Runner Documentation

The signup runner is a standalone Node.js script that simulates user registrations by submitting generated user data to the same API endpoint that real users use. This replaces the previous Vercel cron job approach with a more flexible, locally-controlled solution.

## Overview

The runner:
- Generates realistic UK user data using faker.js
- Implements time-based probability for natural signup patterns
- Supports AI-generated comments via OpenAI (optional)
- Logs all activity to files for monitoring
- Can run locally or be deployed anywhere

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the example environment file:
```bash
cp .env.example.runner .env
```

3. (Optional) Add your OpenAI API key to `.env` if you want AI-generated comments

## Usage

### Quick Start

```bash
# Run with default settings
npm run generate:local

# Dry run (generate but don't submit)
npm run generate:dry-run

# Production mode
npm run generate:prod
```

### CLI Options

```bash
node scripts/signup-runner.js [options]

Options:
  -e, --enabled              Enable/disable generation (default: true)
  -p, --base-probability     Base probability per minute (default: 0.0035)
  -m, --peak-multiplier      Multiplier for peak hours (default: 8)
  -c, --comment-percentage   Percentage with comments (default: 0.3)
  -u, --api-url             API endpoint URL
  -d, --dry-run             Generate but don't submit
  -v, --verbose             Enable verbose logging
  -l, --log-file            Path to log file
  -i, --interval            Run interval in ms (default: 60000)
  --peak-hours              Comma-separated peak hours (default: "7,8,11,12,16,17,20,21")
  -h, --help                Show help
```

### Examples

```bash
# Run every 30 seconds with higher probability
node scripts/signup-runner.js --interval 30000 --base-probability 0.005

# Dry run with verbose logging
node scripts/signup-runner.js --dry-run --verbose

# Custom peak hours (9-5 work hours)
node scripts/signup-runner.js --peak-hours "9,10,11,12,13,14,15,16,17"

# No comments (save on OpenAI costs)
node scripts/signup-runner.js --comment-percentage 0
```

## How It Works

### Generation Algorithm

1. **Time-based Probability**: 
   - Base probability: 0.35% per minute (~25 signups/day)
   - Peak hours get 8x multiplier
   - Peak hours: 7-8am, 11am-12pm, 4-5pm, 8-9pm UTC

2. **User Generation**:
   - 80% chance of 1 user, 20% chance of 2 users per cycle
   - 30% of users get referral codes
   - Comments generated based on configured percentage

3. **Data Quality**:
   - UK-specific email providers
   - BH19 postcodes for Swanage
   - Realistic names from faker.js en_GB locale
   - Varied "hear about" sources

### Logging

Logs are written to `logs/signup-runner.log` in JSON format:
```json
{
  "timestamp": "2025-01-03T10:30:00Z",
  "level": "info",
  "message": "User submitted successfully",
  "email": "joh***"
}
```

### Graceful Shutdown

The runner handles SIGINT and SIGTERM signals, logging final statistics before exit:
- Total generated
- Total submitted
- Total failed
- Runtime duration

## Deployment Options

### Local Development
```bash
npm run generate:local
```

### Background Process (Linux/Mac)
```bash
nohup npm run generate:prod > runner.out 2>&1 &
```

### Process Manager (PM2)
```bash
pm2 start scripts/signup-runner.js --name signup-runner -- --api-url https://nstcg.org/api/submit-form
```

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "scripts/signup-runner.js"]
```

## Monitoring

Check the logs:
```bash
# Follow logs in real-time
tail -f logs/signup-runner.log | jq

# Count today's submissions
grep "User submitted successfully" logs/signup-runner.log | grep "$(date +%Y-%m-%d)" | wc -l

# View errors
grep '"level":"error"' logs/signup-runner.log | jq
```

## Troubleshooting

### No users being generated
- Check probability settings (default 0.35% is quite low)
- Verify you're running during peak hours
- Use `--verbose` to see all generation attempts

### API submission failures
- Verify the API URL is correct
- Check network connectivity
- Look for rate limiting (429 errors)
- Ensure the API server is running

### Missing comments
- Verify OPENAI_API_KEY is set in .env
- Check OpenAI API quota/billing
- Comments only generate for configured percentage of users

## Security Notes

- Never commit `.env` files with API keys
- Use environment-specific API URLs
- Monitor logs for unusual patterns
- Consider rate limiting if deploying publicly