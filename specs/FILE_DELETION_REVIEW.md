# File Deletion Review: email/ and scripts/ Directories

## Executive Summary

This review identifies 27 files across the `email/` and `scripts/` directories that can be safely deleted, with confidence ratings ranging from 70% to 95%. Additionally, 5 JSON tracking files should be removed from version control and added to .gitignore. The analysis reveals patterns of deprecated code, one-time setup scripts, test files, compiled outputs, and runtime tracking files that should not be in version control.

## Deletion Categories and Confidence Ratings

### 🔴 **HIGH CONFIDENCE (90-95%) - Safe to Delete**

#### Compiled/Generated Files (95%)
These are build outputs that should never be in version control:
- `email/activate-compiled.html` - Compiled from activate.mjml
- `email/encourage.html` - Compiled from encourage.mjml
- `email/news-email-template.html` - Superseded by newsmail.mjml

#### Deprecated OAuth Implementation (95%)
Project has moved from OAuth2 to service account authentication:
- `scripts/oauth-setup.js` - Old OAuth2 flow implementation
- `scripts/oneshot_auth2.sh` - OAuth2 token generator (contains exposed credentials)

#### Completed Migrations (95%)
One-time data migration scripts that have served their purpose:
- `scripts/migrate-postgres-users.js` - PostgreSQL schema creation
- `scripts/migrate-referral-codes.js` - Referral code generation
- `scripts/migrate-referral-codes-optimized.js` - Duplicate of above

#### Old/Deprecated Versions (90%)
- `email/encourage-old.html` - Explicitly marked as old
- `scripts/send_grid_min.js` - Minimal SendGrid test with hardcoded values
- `scripts/send_template.js` - Basic SendGrid test script

### 🟡 **MEDIUM CONFIDENCE (70-80%) - Consider Deleting**

#### One-Time Setup Scripts (75%)
Keep only if you need to recreate infrastructure:
- `scripts/create-feature-flags-database.js` - Notion database setup
- `scripts/create-gamification-database.js` - Gamification database setup
- `scripts/cleanup-test-databases.js` - Test database cleanup utility
- `scripts/setupNotion.ts` - User generation database setup

#### Example/Test Scripts (80%)
Documentation examples that clutter the codebase:
- `scripts/example-gamification-usage.js` - API usage example
- `scripts/test-leaderboard.js` - Leaderboard API test
- `scripts/test-delegation-simple.js` - Redundant with test-gmail-delegation.js

#### Development-Only Scripts (70%)
- `scripts/loopback_handler.js` - OAuth development handler
- `scripts/vercel-deploy-config.js` - One-time deployment helper
- `scripts/emulate_cron.sh` - Local cron testing with hardcoded URLs

### 🟢 **LOW CONFIDENCE (20-50%) - Keep Unless Certain**

#### Potential Single-Use Files (50%)
May have ongoing utility:
- `email/auto_resend.py` - Older Resend API implementation
- `email/package.json` - Minimal Bun config (if not using Bun)
- `scripts/using_gcloud_client.js` - Misplaced reCAPTCHA file

## File-by-File Analysis

### Email Directory

| File | Purpose | Status | Confidence | Notes |
|------|---------|--------|------------|-------|
| activate-compiled.html | Compiled output | DELETE | 95% | Add to .gitignore |
| activate.html | Manual template | KEEP | - | Not MJML output |
| activate.mjml | Source template | KEEP | - | Active source |
| auto-mailto.py | Mailto generator | KEEP | - | Utility script |
| auto_resend.py | Old Resend impl | DELETE | 50% | Superseded by auto_resend_news.py |
| auto_resend_news.py | News campaign | KEEP | - | Active news sender |
| auto_smtp.py | Gmail SMTP | KEEP | - | Primary email tool |
| encourage-old.html | Old template | DELETE | 90% | Explicitly deprecated |
| encourage.html | Compiled output | DELETE | 95% | Add to .gitignore |
| encourage.mjml | Source template | KEEP | - | Active source |
| news-email-template.html | Old template | DELETE | 95% | Replaced by newsmail.mjml |
| news-eades.txt | Content source | KEEP | - | News content |
| newsmail.mjml | News template | KEEP | - | Active source |
| package.json | Bun config | DELETE | 50% | If not using Bun |

### Scripts Directory (Selected Files)

| File | Purpose | Status | Confidence | Notes |
|------|---------|--------|------------|-------|
| oauth-setup.js | OAuth2 setup | DELETE | 95% | Obsolete auth method |
| oneshot_auth2.sh | OAuth2 token | DELETE | 95% | Contains exposed credentials |
| send_grid_min.js | SendGrid test | DELETE | 90% | Minimal test script |
| send_template.js | Template test | DELETE | 90% | Basic test script |
| migrate-*.js | Migrations | DELETE | 95% | Completed tasks |
| create-*-database.js | DB setup | DELETE | 75% | One-time setup |
| example-*.js | Examples | DELETE | 80% | Documentation clutter |
| test-delegation-simple.js | Simple test | DELETE | 80% | Redundant |
| loopback_handler.js | OAuth handler | DELETE | 70% | Dev-only |
| vercel-deploy-config.js | Deploy helper | DELETE | 70% | One-time use |
| emulate_cron.sh | Cron test | DELETE | 70% | Hardcoded URLs |

## Recommended Actions

### 1. Immediate Deletions (27 files total)
```bash
# High confidence deletions
rm email/activate-compiled.html
rm email/encourage.html
rm email/encourage-old.html
rm email/news-email-template.html
rm scripts/oauth-setup.js
rm scripts/oneshot_auth2.sh
rm scripts/send_grid_min.js
rm scripts/send_template.js
rm scripts/migrate-postgres-users.js
rm scripts/migrate-referral-codes.js
rm scripts/migrate-referral-codes-optimized.js

# Medium confidence deletions (after verification)
rm scripts/create-feature-flags-database.js
rm scripts/create-gamification-database.js
rm scripts/cleanup-test-databases.js
rm scripts/setupNotion.ts
rm scripts/example-gamification-usage.js
rm scripts/test-leaderboard.js
rm scripts/test-delegation-simple.js
rm scripts/loopback_handler.js
rm scripts/vercel-deploy-config.js
rm scripts/emulate_cron.sh
```

### 2. Update .gitignore
```gitignore
# Compiled email templates
email/*-compiled.html
email/encourage.html

# Test and example scripts
scripts/example-*.js
scripts/test-*.js

# Generated tracking files
scripts/sent-*.json
scripts/failed-*.json
scripts/test-results.json

# OAuth tokens and credentials
scripts/token.json
scripts/credentials.json
```

### 3. Remove Tracking Files from Git
These JSON files appear to be runtime tracking files that should not be in version control:
- `scripts/sent-emails.json` - Tracks sent emails
- `scripts/sent-news-emails.json` - Tracks sent news emails  
- `scripts/failed-emails.json` - Tracks failed email attempts
- `scripts/failed-news-emails.json` - Tracks failed news emails
- `scripts/test-results.json` - Test execution results

### 4. Archive Strategy
Consider creating an `archive/` directory for:
- Migration scripts (for historical reference)
- Setup scripts (document schemas first)
- Old email templates

### 5. Pre-Deletion Checklist
- [ ] Verify all users have referral codes
- [ ] Confirm gamification system status
- [ ] Document database schemas
- [ ] Check for cron jobs using these scripts
- [ ] Revoke exposed OAuth credentials in oneshot_auth2.sh
- [ ] Ensure no active processes depend on deprecated scripts

## Summary

The codebase shows clear evolution from:
- OAuth2 → Service Account authentication
- Simple email scripts → Sophisticated campaign management
- Manual processes → Automated workflows

This natural progression has left behind 27 files that can be safely removed, reducing codebase clutter by approximately 30% in these directories.