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
SENT_EMAILS_FILE = PROJECT_ROOT / "scripts" / "sent-news-emails.json"
FAILED_EMAILS_FILE = PROJECT_ROOT / "scripts" / "failed-news-emails.json"

# Configuration
CONFIG = {
    "RATE_LIMIT_SECONDS": 30,  # 30 seconds between emails to prevent API blocking
    "GMAIL_USER": "engineering@nstcg.org",  # Default sender email
    "EMAIL_SUBJECT": "Important Update: Philip Eades Opposes Shore Road Closure",
    "SITE_URL": "https://nstcg.org",
    "CAMPAIGN_ID": "news-philip-eades-2024",  # Campaign identifier for tracking
}


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Send news update emails to users from Notion database",
        epilog="""
Examples:
  python auto_resend_news.py --dry-run              # Preview mode
  python auto_resend_news.py --test-email kai@example.com  # Send test to specific email
  python auto_resend_news.py --resume               # Resume previous run
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

            # Process results
            for page in response["results"]:
                props = page["properties"]
                email_prop = props.get("Email", {})
                email = email_prop.get("email")

                if email:
                    # Extract name fields
                    first_name = ""
                    last_name = ""
                    name = ""

                    if "First Name" in props:
                        first_name_data = props["First Name"].get("rich_text", [])
                        if first_name_data:
                            first_name = first_name_data[0]["text"]["content"]

                    if "Last Name" in props:
                        last_name_data = props["Last Name"].get("rich_text", [])
                        if last_name_data:
                            last_name = last_name_data[0]["text"]["content"]

                    if "Name" in props:
                        name_data = props["Name"].get("title", [])
                        if name_data:
                            name = name_data[0]["text"]["content"]

                    # Construct user object
                    users.append(
                        {
                            "id": page["id"],
                            "email": email.lower(),
                            "firstName": (
                                first_name or name.split()[0]
                                if name
                                else email.split("@")[0]
                            ),
                            "lastName": last_name or "",
                            "name": name
                            or f"{first_name} {last_name}".strip()
                            or email.split("@")[0],
                        }
                    )

            has_more = response.get("has_more", False)
            start_cursor = response.get("next_cursor")

        except Exception as e:
            print(f"❌ Error fetching users from Notion: {e}")
            raise

    print(f"✅ Found {len(users)} registered users")
    return users


def load_json_file(filepath):
    """Load JSON file, return empty list/dict if not found"""
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return [] if "emails" in str(filepath) else {}
    except json.JSONDecodeError:
        print(f"⚠️ Warning: {filepath} is corrupted, starting fresh")
        return [] if "emails" in str(filepath) else {}


def save_json_file(filepath, data):
    """Save data to JSON file"""
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


def obfuscate_email(email):
    """Simple obfuscation for email addresses in tracking URLs"""
    return base64.b64encode(email.encode()).decode().replace("=", "")


def generate_tracking_pixel_url(email, campaign_id=None):
    """Generate tracking pixel URL for email open tracking"""
    campaign = campaign_id or CONFIG.get("CAMPAIGN_ID", "default")
    base_url = CONFIG.get("SITE_URL", "https://nstcg.org")
    
    params = {
        "e": obfuscate_email(email),
        "c": campaign,
        "t": str(int(time.time() * 1000))  # Timestamp in milliseconds
    }
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{base_url}/api/track-email?{query_string}"


def generate_news_email(user):
    """Generate personalized news email HTML"""
    try:
        # Read the template
        template_path = SCRIPT_DIR / "news-email-template.html"
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
            "from": "North Swanage Traffic Concern Group <engineering@nstcg.org>",
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
        html_content = generate_news_email(test_user)

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

    print("🚀 Starting News Email Campaign...")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"Rate Limit: {CONFIG['RATE_LIMIT_SECONDS']} seconds between emails")
    print(f"Resume: {'Yes' if args.resume else 'No'}\n")

    start_time = time.time()
    stats = {
        "total": 0,
        "sent": 0,
        "failed": 0,
        "skipped": 0,
    }

    try:
        # Fetch users from Notion
        users = fetch_users_from_notion()
        stats["total"] = len(users)

        if not users:
            print("❌ No users found to process")
            return

        # Load sent emails
        sent_emails = set(load_json_file(SENT_EMAILS_FILE))
        if sent_emails:
            print(f"📌 Found {len(sent_emails)} previously sent emails")

        # Filter out already sent emails
        filtered_users = [u for u in users if u["email"] not in sent_emails]
        stats["skipped"] = len(users) - len(filtered_users)

        print(
            f"📊 Filtering: {stats['skipped']} already sent, {len(filtered_users)} to process\n"
        )

        if not filtered_users:
            print("✅ All users have already received emails!")
            return

        # Using Resend API
        if not args.dry_run:
            print("🔧 Using Resend API for email delivery")
            if not resend.api_key:
                print("❌ RESEND_API_KEY not found in environment")
                return
            print("✅ Resend API configured\n")

        # Process users sequentially with rate limiting
        for i, user in enumerate(filtered_users):
            progress = f"[{i+1}/{len(filtered_users)}]"

            try:
                if args.dry_run:
                    print(f"📧 {progress} Would send to: {user['email']}")
                    stats["sent"] += 1
                else:
                    # Generate personalized email
                    html_content = generate_news_email(user)

                    # Send email
                    print(
                        f"📧 {progress} Sending to {user['email']}...",
                        end=" ",
                        flush=True,
                    )
                    success, error = send_email(
                        user["email"],
                        html_content,
                        gmail_user,
                    )

                    if success:
                        print("✅")
                        stats["sent"] += 1

                        # Update sent emails file
                        sent_emails_list = load_json_file(SENT_EMAILS_FILE)
                        sent_emails_list.append(user["email"])
                        save_json_file(SENT_EMAILS_FILE, sent_emails_list)
                    else:
                        print(f"❌ ({error})")
                        stats["failed"] += 1

                        # Update failed emails file
                        failed_emails = load_json_file(FAILED_EMAILS_FILE)
                        failed_emails.append(
                            {
                                **user,
                                "error": error,
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                        save_json_file(FAILED_EMAILS_FILE, failed_emails)

                # Rate limiting - wait 30 seconds between emails
                if i < len(filtered_users) - 1 and not args.dry_run:
                    print(
                        f"⏳ Waiting {CONFIG['RATE_LIMIT_SECONDS']} seconds before next email..."
                    )
                    time.sleep(CONFIG["RATE_LIMIT_SECONDS"])

            except KeyboardInterrupt:
                print("\n\n⚠️ Campaign interrupted by user")
                print("💡 Use --resume flag to continue from where you left off")
                break
            except Exception as e:
                print(f"❌ Error processing {user['email']}: {e}")
                stats["failed"] += 1

        # Summary
        duration = time.time() - start_time
        print(f"\n{'='*50}")
        print("📊 Campaign Summary")
        print(f"{'='*50}")
        print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
        print(f"Total Users: {stats['total']}")
        print(f"Already Sent: {stats['skipped']}")
        print(f"Processed: {stats['sent'] + stats['failed']}")
        print(f"Successful: {stats['sent']}")
        print(f"Failed: {stats['failed']}")
        print(f"Duration: {duration/60:.1f} minutes")
        print(f"{'='*50}")
        print("\n🎉 News email campaign completed!")

    except Exception as e:
        print(f"\n❌ Campaign failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
