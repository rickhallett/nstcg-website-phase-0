#!/usr/bin/env python3
"""
View Email Tracking Statistics

This script fetches and displays email tracking statistics from your Notion database.
"""

import os
import sys
from datetime import datetime, timedelta
from collections import defaultdict
import dotenv

# Load environment variables
dotenv.load_dotenv()

try:
    from notion_client import Client as NotionClient
except ImportError:
    print("❌ Please install notion-client: pip install notion-client")
    sys.exit(1)


def fetch_tracking_data():
    """Fetch all email tracking data from Notion"""
    notion_token = os.getenv("NOTION_TOKEN")
    analytics_db_id = os.getenv("NOTION_EMAIL_ANALYTICS_DB_ID")
    
    if not notion_token or not analytics_db_id:
        print("❌ Missing NOTION_TOKEN or NOTION_EMAIL_ANALYTICS_DB_ID in .env")
        sys.exit(1)
    
    notion = NotionClient(auth=notion_token)
    
    print("📊 Fetching email tracking data...")
    
    all_data = []
    has_more = True
    start_cursor = None
    
    while has_more:
        try:
            response = notion.databases.query(
                database_id=analytics_db_id,
                start_cursor=start_cursor,
                page_size=100
            )
            
            for page in response["results"]:
                props = page["properties"]
                
                # Email is a title property in this database
                email_title = props.get("Email", {}).get("title", [])
                email = email_title[0].get("text", {}).get("content", "") if email_title else ""
                
                data = {
                    "email": email,
                    "campaign": props.get("Campaign ID", {}).get("rich_text", [{}])[0].get("text", {}).get("content", ""),
                    "open_count": props.get("Open Count", {}).get("number", 0),
                    "first_opened": props.get("First Opened", {}).get("date", {}).get("start"),
                    "last_opened": props.get("Last Opened", {}).get("date", {}).get("start"),
                    "country": props.get("Country", {}).get("rich_text", [{}])[0].get("text", {}).get("content", "Unknown"),
                }
                
                if data["email"]:  # Only add if email exists
                    all_data.append(data)
            
            has_more = response.get("has_more", False)
            start_cursor = response.get("next_cursor")
            
        except Exception as e:
            print(f"❌ Error fetching data: {e}")
            return []
    
    return all_data


def analyze_tracking_data(data):
    """Analyze and display tracking statistics"""
    if not data:
        print("📭 No tracking data found")
        return
    
    print(f"\n✅ Found {len(data)} tracked email opens\n")
    
    # Overall statistics
    print("📈 Overall Statistics")
    print("=" * 50)
    
    total_opens = sum(d["open_count"] for d in data)
    unique_emails = len(set(d["email"] for d in data))
    
    print(f"Total opens: {total_opens}")
    print(f"Unique recipients: {unique_emails}")
    print(f"Average opens per recipient: {total_opens/unique_emails:.1f}")
    
    # Campaign statistics
    print("\n📊 Campaign Statistics")
    print("=" * 50)
    
    campaigns = defaultdict(lambda: {"recipients": set(), "opens": 0})
    
    for d in data:
        campaign = d["campaign"] or "Unknown"
        campaigns[campaign]["recipients"].add(d["email"])
        campaigns[campaign]["opens"] += d["open_count"]
    
    for campaign, stats in sorted(campaigns.items()):
        recipients = len(stats["recipients"])
        opens = stats["opens"]
        print(f"\nCampaign: {campaign}")
        print(f"  Recipients: {recipients}")
        print(f"  Total opens: {opens}")
        print(f"  Avg opens/recipient: {opens/recipients:.1f}")
    
    # Geographic distribution
    print("\n🌍 Geographic Distribution")
    print("=" * 50)
    
    countries = defaultdict(int)
    for d in data:
        countries[d["country"]] += 1
    
    for country, count in sorted(countries.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(data)) * 100
        print(f"{country}: {count} ({percentage:.1f}%)")
    
    # Recent activity
    print("\n⏰ Recent Activity (Last 7 Days)")
    print("=" * 50)
    
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_opens = []
    
    for d in data:
        if d["last_opened"]:
            last_opened = datetime.fromisoformat(d["last_opened"].replace("Z", "+00:00"))
            if last_opened.replace(tzinfo=None) > seven_days_ago:
                recent_opens.append(d)
    
    if recent_opens:
        print(f"Recent opens: {len(recent_opens)}")
        
        # Show last 5 opens
        print("\nLast 5 email opens:")
        sorted_opens = sorted(recent_opens, 
                            key=lambda x: x["last_opened"], 
                            reverse=True)[:5]
        
        for d in sorted_opens:
            opened = datetime.fromisoformat(d["last_opened"].replace("Z", "+00:00"))
            print(f"  - {d['email']} ({d['campaign']}) - {opened.strftime('%Y-%m-%d %H:%M')}")
    else:
        print("No opens in the last 7 days")
    
    # Top engaged users
    print("\n🏆 Top 10 Most Engaged Recipients")
    print("=" * 50)
    
    sorted_by_opens = sorted(data, key=lambda x: x["open_count"], reverse=True)[:10]
    
    for i, d in enumerate(sorted_by_opens, 1):
        print(f"{i}. {d['email']} - {d['open_count']} opens ({d['campaign']})")


def export_csv(data):
    """Export tracking data to CSV"""
    import csv
    
    filename = f"email_tracking_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    with open(filename, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "email", "campaign", "open_count", 
            "first_opened", "last_opened", "country"
        ])
        writer.writeheader()
        writer.writerows(data)
    
    print(f"\n💾 Data exported to: {filename}")


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="View email tracking statistics")
    parser.add_argument("--export", action="store_true", 
                       help="Export data to CSV")
    
    args = parser.parse_args()
    
    print("📧 Email Tracking Statistics")
    print("============================\n")
    
    # Fetch data
    data = fetch_tracking_data()
    
    if data:
        # Analyze and display
        analyze_tracking_data(data)
        
        # Export if requested
        if args.export:
            export_csv(data)
    else:
        print("No tracking data available")
        print("\nMake sure:")
        print("1. Your .env file contains NOTION_EMAIL_ANALYTICS_DB_ID")
        print("2. You have sent tracked emails")
        print("3. Recipients have opened the emails")


if __name__ == "__main__":
    main()