#!/bin/bash

# Backup script for files identified for deletion in FILE_DELETION_REVIEW.md
# Creates timestamped archive before cleanup

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="archive/cleanup_backup_${TIMESTAMP}"

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR/email"
mkdir -p "$BACKUP_DIR/scripts"

# High confidence files (95% confidence)
echo "Backing up high confidence deletions..."

# Email directory - compiled/generated files
[ -f "email/activate-compiled.html" ] && cp "email/activate-compiled.html" "$BACKUP_DIR/email/"
[ -f "email/encourage.html" ] && cp "email/encourage.html" "$BACKUP_DIR/email/"
[ -f "email/encourage-old.html" ] && cp "email/encourage-old.html" "$BACKUP_DIR/email/"
[ -f "email/news-email-template.html" ] && cp "email/news-email-template.html" "$BACKUP_DIR/email/"

# Scripts directory - OAuth and migrations
[ -f "scripts/oauth-setup.js" ] && cp "scripts/oauth-setup.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/oneshot_auth2.sh" ] && cp "scripts/oneshot_auth2.sh" "$BACKUP_DIR/scripts/"
[ -f "scripts/send_grid_min.js" ] && cp "scripts/send_grid_min.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/send_template.js" ] && cp "scripts/send_template.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/migrate-postgres-users.js" ] && cp "scripts/migrate-postgres-users.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/migrate-referral-codes.js" ] && cp "scripts/migrate-referral-codes.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/migrate-referral-codes-optimized.js" ] && cp "scripts/migrate-referral-codes-optimized.js" "$BACKUP_DIR/scripts/"

# Medium confidence files (70-80% confidence)
echo "Backing up medium confidence deletions..."

# Database setup scripts
[ -f "scripts/create-feature-flags-database.js" ] && cp "scripts/create-feature-flags-database.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/create-gamification-database.js" ] && cp "scripts/create-gamification-database.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/cleanup-test-databases.js" ] && cp "scripts/cleanup-test-databases.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/setupNotion.ts" ] && cp "scripts/setupNotion.ts" "$BACKUP_DIR/scripts/"

# Example and test scripts
[ -f "scripts/example-gamification-usage.js" ] && cp "scripts/example-gamification-usage.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/test-leaderboard.js" ] && cp "scripts/test-leaderboard.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/test-delegation-simple.js" ] && cp "scripts/test-delegation-simple.js" "$BACKUP_DIR/scripts/"

# Development scripts
[ -f "scripts/loopback_handler.js" ] && cp "scripts/loopback_handler.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/vercel-deploy-config.js" ] && cp "scripts/vercel-deploy-config.js" "$BACKUP_DIR/scripts/"
[ -f "scripts/emulate_cron.sh" ] && cp "scripts/emulate_cron.sh" "$BACKUP_DIR/scripts/"

# Low confidence files (50% confidence) - optional
echo "Backing up low confidence deletions (optional)..."
[ -f "email/auto_resend.py" ] && cp "email/auto_resend.py" "$BACKUP_DIR/email/"
[ -f "email/package.json" ] && cp "email/package.json" "$BACKUP_DIR/email/"
[ -f "scripts/using_gcloud_client.js" ] && cp "scripts/using_gcloud_client.js" "$BACKUP_DIR/scripts/"

# JSON tracking files
echo "Backing up JSON tracking files..."
[ -f "scripts/sent-emails.json" ] && cp "scripts/sent-emails.json" "$BACKUP_DIR/scripts/"
[ -f "scripts/sent-news-emails.json" ] && cp "scripts/sent-news-emails.json" "$BACKUP_DIR/scripts/"
[ -f "scripts/failed-emails.json" ] && cp "scripts/failed-emails.json" "$BACKUP_DIR/scripts/"
[ -f "scripts/failed-news-emails.json" ] && cp "scripts/failed-news-emails.json" "$BACKUP_DIR/scripts/"
[ -f "scripts/test-results.json" ] && cp "scripts/test-results.json" "$BACKUP_DIR/scripts/"

echo "Backup complete! Files saved to: $BACKUP_DIR"
echo "Total files backed up: $(find "$BACKUP_DIR" -type f | wc -l)"
echo ""
echo "To restore from backup:"
echo "  cp -r $BACKUP_DIR/* ."