#!/usr/bin/env python3

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import getpass
import json
import os
import sys
import time
import argparse
from datetime import datetime
from pathlib import Path
import resend
import dotenv
import requests
import string
import random
import base64

# Load environment variables
dotenv.load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

from notion_client import Client as NotionClient

# Get script directory
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent

# File paths
SENT_EMAILS_FILE = PROJECT_ROOT / "scripts" / "sent-victory-emails.json"
FAILED_EMAILS_FILE = PROJECT_ROOT / "scripts" / "failed-victory-emails.json"

# Configuration
CONFIG = {
    "RATE_LIMIT_SECONDS": 10,  # 30 seconds between emails to prevent API blocking
    "GMAIL_USER": "engineering@nstcg.org",  # Default sender email
    "EMAIL_SUBJECT": "Important Update on Shore Road Campaign - Victory on the Issue!",
    "SITE_URL": "https://nstcg.org",
    "CAMPAIGN_ID": "victory-update-2024",  # Campaign identifier for tracking
}


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Send victory update emails to users from Notion database",
        epilog="""
Examples:
  python auto_resend_victory.py --dry-run              # Preview mode
  python auto_resend_victory.py --test-email kai@example.com  # Send test to specific email
  python auto_resend_victory.py --resume               # Resume previous run
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview mode without sending emails"
    )
    parser.add_argument(
        "--resume", action="store_true", help="Resume from previous run"
    )
    parser.add_argument(
        "--test-email",
        type=str,
        help="Send test email to a specific email address",
    )
    parser.add_argument("--gmail-user", type=str, help="Gmail address to send from")

    return parser.parse_args()


def fetch_users_from_notion():
    """Fetch all users from Notion database"""
    print("📊 Fetching users from Notion database...")

    notion_token = os.getenv("NOTION_TOKEN")
    database_id = os.getenv("NOTION_DATABASE_ID")

    if not notion_token or not database_id:
        raise ValueError("Missing NOTION_TOKEN or NOTION_DATABASE_ID in environment")

    notion = NotionClient(auth=notion_token)
    users = []
    has_more = True
    start_cursor = None

    while has_more:
        try:
            response = notion.databases.query(
                database_id=database_id,
                start_cursor=start_cursor,
                page_size=100,
                filter={
                    "property": "Email",
                    "email": {"is_not_empty": True},
                },
            )

            for page in response["results"]:
                properties = page["properties"]

                # Extract email
                email_prop = properties.get("Email", {})
                email = email_prop.get("email")

                if email:
                    # Extract other fields
                    name_title = properties.get("Name", {}).get("title", [])
                    name = (
                        name_title[0].get("text", {}).get("content", "")
                        if name_title
                        else ""
                    )

                    first_name_text = properties.get("First Name", {}).get(
                        "rich_text", []
                    )
                    first_name = (
                        first_name_text[0].get("text", {}).get("content", "")
                        if first_name_text
                        else ""
                    )

                    last_name_text = properties.get("Last Name", {}).get(
                        "rich_text", []
                    )
                    last_name = (
                        last_name_text[0].get("text", {}).get("content", "")
                        if last_name_text
                        else ""
                    )

                    postcode_text = properties.get("Postcode", {}).get("rich_text", [])
                    postcode = (
                        postcode_text[0].get("text", {}).get("content", "")
                        if postcode_text
                        else ""
                    )

                    users.append(
                        {
                            "id": page["id"],
                            "email": email,
                            "name": name
                            or f"{first_name} {last_name}".strip()
                            or email.split("@")[0],
                            "firstName": first_name,
                            "lastName": last_name,
                            "postcode": postcode,
                        }
                    )

            has_more = response.get("has_more", False)
            start_cursor = response.get("next_cursor")

        except Exception as e:
            print(f"❌ Error fetching from Notion: {e}")
            raise

    print(f"✅ Found {len(users)} users with email addresses")
    return users


def load_sent_emails():
    """Load previously sent emails from file"""
    if SENT_EMAILS_FILE.exists():
        print(f"📁 Loading sent emails from: {SENT_EMAILS_FILE}")
        with open(SENT_EMAILS_FILE, "r") as f:
            sent_list = json.load(f)
            print(f"📧 Found {len(sent_list)} previously sent emails")
            return set(sent_list)
    else:
        print(f"📁 No previous sent emails file found at: {SENT_EMAILS_FILE}")
    return set()


def save_sent_emails(sent_emails):
    """Save sent emails to file"""
    # Ensure directory exists
    SENT_EMAILS_FILE.parent.mkdir(exist_ok=True)
    with open(SENT_EMAILS_FILE, "w") as f:
        json.dump(list(sent_emails), f, indent=2)


def save_failed_email(email, error):
    """Save failed email to file for later retry"""
    failed_emails = []
    if FAILED_EMAILS_FILE.exists():
        with open(FAILED_EMAILS_FILE, "r") as f:
            failed_emails = json.load(f)

    failed_emails.append(
        {
            "email": email,
            "error": error,
            "timestamp": datetime.now().isoformat(),
        }
    )

    # Ensure directory exists
    FAILED_EMAILS_FILE.parent.mkdir(exist_ok=True)
    with open(FAILED_EMAILS_FILE, "w") as f:
        json.dump(failed_emails, f, indent=2)


def generate_tracking_pixel_url(email):
    """Generate a tracking pixel URL for email opens"""
    # Simple encoding of email for tracking
    encoded_email = base64.urlsafe_b64encode(email.encode()).decode().rstrip("=")

    # Add campaign ID and timestamp
    params = {"e": encoded_email, "c": CONFIG["CAMPAIGN_ID"], "t": int(time.time())}

    base_url = CONFIG["SITE_URL"]

    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{base_url}/api/track-email?{query_string}"


def generate_victory_email(user):
    """Generate personalized victory email HTML"""
    try:
        # Read the template
        template_path = SCRIPT_DIR / "victory-email-template.html"
        with open(template_path, "r", encoding="utf-8") as f:
            html_content = f.read()

        # Simple interpolation - replace the name if placeholder exists
        if "{{name}}" in html_content:
            html_content = html_content.replace("{{name}}", user["name"])

        # Generate tracking pixel HTML
        tracking_url = generate_tracking_pixel_url(user["email"])
        tracking_pixel = f'<img src="{tracking_url}" alt="" width="1" height="1" style="display:block;border:0;outline:none;text-decoration:none;" />'

        # Replace tracking pixel placeholder
        html_content = html_content.replace("{{tracking_pixel}}", tracking_pixel)

        return html_content

    except Exception as e:
        print(f"❌ Email generation failed: {e}")
        raise


def send_email(to_email, html_content, gmail_user):
    """Send email via Resend API"""
    try:
        params: resend.Emails.SendParams = {
            "from": "Pete Michell <engineering@nstcg.org>",
            "to": [to_email],
            "subject": CONFIG["EMAIL_SUBJECT"],
            "html": html_content,
        }

        email = resend.Emails.send(params)
        print(email)

        return True, None

    except Exception as e:
        return False, str(e)


def run_test_email(test_email, gmail_user):
    """Send single test email to specified address"""
    print(f"🚀 Test Mode - Sending test email to {test_email}...\n")

    start_time = time.time()

    try:
        # Create test user object
        test_user = {
            "id": "test-user",
            "email": test_email,
            "firstName": test_email.split("@")[0],
            "lastName": "Test",
            "name": test_email.split("@")[0],
        }

        # Generate personalized email
        html_content = generate_victory_email(test_user)

        # Send the email
        print(f"📧 Sending to {test_email}...", end=" ", flush=True)
        success, error = send_email(test_email, html_content, gmail_user)

        if success:
            print("✅")
            print(f"✅ Test email sent successfully!")
            print(f"   To: {test_email}")
            print(f"   From: {gmail_user}")
            print(f"   Subject: {CONFIG['EMAIL_SUBJECT']}")
        else:
            print(f"❌ ({error})")
            print(f"❌ Failed to send test email: {error}")

        duration = time.time() - start_time
        print(f"\n⏱️  Duration: {duration:.1f} seconds")
        print("\n🎉 Test completed!")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)


def main():
    args = parse_arguments()

    # Set Gmail user
    gmail_user = args.gmail_user or CONFIG["GMAIL_USER"]

    # Check for test email mode
    if args.test_email:
        return run_test_email(args.test_email, gmail_user)

    print("🚀 Starting Victory Update Email Campaign...")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"Rate Limit: {CONFIG['RATE_LIMIT_SECONDS']} seconds between emails")
    print(f"Resume: {'Yes' if args.resume else 'No'}\n")

    start_time = time.time()
    stats = {
        "total": 0,
        "sent": 0,
        "skipped": 0,
        "failed": 0,
    }

    try:
        # Always load previously sent emails to prevent duplicates
        sent_emails = load_sent_emails()
        if not args.resume and sent_emails:
            print(
                f"⚠️  Found {len(sent_emails)} previously sent emails that will be skipped"
            )
            print(
                "   Use --resume flag to acknowledge and continue from previous run\n"
            )

        # Fetch users from Notion
        users = fetch_users_from_notion()
        stats["total"] = len(users)

        if args.dry_run:
            print(f"\n🔍 DRY RUN - Would send to {len(users)} users")
            for i, user in enumerate(users[:10]):  # Show first 10
                print(f"   {i+1}. {user['email']} ({user['name']})")
            if len(users) > 10:
                print(f"   ... and {len(users) - 10} more")
            print()

        # Send emails
        print(f"\n📮 Sending emails to {stats['total']} users...\n")

        for i, user in enumerate(users):
            progress = f"[{i+1}/{stats['total']}]"

            # Skip if already sent
            if user["email"] in sent_emails:
                print(f"⏭️  {progress} Skipping {user['email']} (already sent)")
                stats["skipped"] += 1
                continue

            try:
                if args.dry_run:
                    print(f"📧 {progress} Would send to: {user['email']}")
                    stats["sent"] += 1
                else:
                    # Generate personalized email
                    html_content = generate_victory_email(user)

                    # Send email
                    print(
                        f"📧 {progress} Sending to {user['email']}...",
                        end=" ",
                        flush=True,
                    )
                    success, error = send_email(user["email"], html_content, gmail_user)

                    if success:
                        print("✅")
                        stats["sent"] += 1
                        sent_emails.add(user["email"])
                        save_sent_emails(sent_emails)
                    else:
                        print(f"❌ ({error})")
                        stats["failed"] += 1
                        save_failed_email(user["email"], error)

                    # Rate limiting (except for last email)
                    if i < len(users) - 1:
                        print(
                            f"   ⏳ Waiting {CONFIG['RATE_LIMIT_SECONDS']} seconds..."
                        )
                        time.sleep(CONFIG["RATE_LIMIT_SECONDS"])

            except Exception as e:
                print(f"❌ Error: {e}")
                stats["failed"] += 1
                save_failed_email(user["email"], str(e))

        # Summary
        duration = time.time() - start_time
        print("\n" + "=" * 50)
        print("📊 CAMPAIGN SUMMARY")
        print("=" * 50)
        print(f"Total Users:    {stats['total']}")
        print(f"Emails Sent:    {stats['sent']} ✅")
        print(f"Skipped:        {stats['skipped']} ⏭️")
        print(f"Failed:         {stats['failed']} ❌")
        print(f"Duration:       {duration:.1f} seconds")
        print(f"Mode:           {'DRY RUN' if args.dry_run else 'LIVE'}")
        print("=" * 50)

        if stats["failed"] > 0:
            print(f"\n⚠️  Failed emails saved to: {FAILED_EMAILS_FILE}")

        print("\n🎉 Campaign completed!")

    except Exception as e:
        print(f"\n❌ Campaign failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
