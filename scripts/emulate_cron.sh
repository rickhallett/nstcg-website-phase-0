#!/bin/bash

# A more robust way to load the CRON_SECRET from a .env file
if [ -f .env ]; then
  # Specifically find the CRON_SECRET line and export it
  export $(grep -E '^CRON_SECRET=' .env)
fi

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET is not set in your .env file."
  exit 1
fi

# Your Vercel preview deployment URL
# Make sure to update this to your current preview URL
DEPLOYMENT_URL="https://nstcg-website-rickhallett0-rick-halletts-projects.vercel.app"

echo "Emulating cron job trigger for: $DEPLOYMENT_URL"
echo "---"

# Make the request with the standard Authorization header
curl -v -X POST "$DEPLOYMENT_URL/api/generate-signups" \
  -H "Authorization: Bearer $CRON_SECRET"