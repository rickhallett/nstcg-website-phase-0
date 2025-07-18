#!/usr/bin/env python3
"""
Local Email Tracking Test Script

This script helps test the email tracking pixel implementation locally.
It simulates email opens and verifies tracking data is properly recorded.
"""

import requests
import time
import base64
import json
import sys
import os
from datetime import datetime
from pathlib import Path
import argparse

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from auto_resend_news import obfuscate_email, generate_tracking_pixel_url, CONFIG

# Test configuration
TEST_BASE_URL = "http://localhost:3000"
TEST_EMAILS = [
    "test1@example.com",
    "test2@example.com",
    "test3@example.com"
]


def test_tracking_endpoint():
    """Test if the tracking endpoint is accessible"""
    print("🔍 Testing tracking endpoint availability...")
    
    try:
        url = f"{TEST_BASE_URL}/api/track-email"
        response = requests.get(url)
        
        if response.status_code == 200:
            print("✅ Tracking endpoint is accessible")
            print(f"   Content-Type: {response.headers.get('Content-Type')}")
            print(f"   Content-Length: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ Tracking endpoint returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to local server")
        print("   Make sure to run 'npm run both' first")
        return False


def test_pixel_response(email, campaign_id="test-local"):
    """Test tracking pixel response for a specific email"""
    print(f"\n📧 Testing tracking for: {email}")
    
    # Generate tracking URL
    params = {
        "e": obfuscate_email(email),
        "c": campaign_id,
        "t": str(int(time.time() * 1000))
    }
    
    url = f"{TEST_BASE_URL}/api/track-email"
    
    # Test normal request
    print("   Testing normal request...")
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        print("   ✅ Received tracking pixel")
        print(f"   Cache-Control: {response.headers.get('Cache-Control')}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    return response


def test_bot_filtering():
    """Test that bot user agents are filtered"""
    print("\n🤖 Testing bot filtering...")
    
    bot_agents = [
        "Googlebot/2.1 (+http://www.google.com/bot.html)",
        "facebookexternalhit/1.1",
        "Mozilla/5.0 (compatible; bingbot/2.0)",
    ]
    
    params = {
        "e": obfuscate_email("bot@test.com"),
        "c": "bot-test",
        "t": str(int(time.time() * 1000))
    }
    
    for agent in bot_agents:
        print(f"   Testing: {agent[:50]}...")
        headers = {"User-Agent": agent}
        response = requests.get(f"{TEST_BASE_URL}/api/track-email", 
                              params=params, headers=headers)
        
        if response.status_code == 200:
            print("   ✅ Pixel served (bot should be ignored in logs)")
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")


def test_invalid_parameters():
    """Test handling of invalid parameters"""
    print("\n⚠️  Testing invalid parameters...")
    
    test_cases = [
        {"name": "Missing email", "params": {"c": "test", "t": "123"}},
        {"name": "Missing campaign", "params": {"e": "test", "t": "123"}},
        {"name": "Invalid email encoding", "params": {"e": "invalid!", "c": "test", "t": "123"}},
        {"name": "Expired timestamp", "params": {"e": obfuscate_email("test@example.com"), 
                                                "c": "test", "t": "1000000000"}},
    ]
    
    for test in test_cases:
        print(f"   Testing: {test['name']}...")
        response = requests.get(f"{TEST_BASE_URL}/api/track-email", 
                              params=test['params'])
        
        if response.status_code == 200:
            print("   ✅ Gracefully handled (pixel served)")
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")


def test_multiple_opens():
    """Test multiple opens from same email"""
    print("\n🔄 Testing multiple opens...")
    
    email = "multiple@test.com"
    campaign = "multi-open-test"
    
    for i in range(3):
        print(f"   Open #{i+1}...")
        params = {
            "e": obfuscate_email(email),
            "c": campaign,
            "t": str(int(time.time() * 1000))
        }
        
        response = requests.get(f"{TEST_BASE_URL}/api/track-email", params=params)
        
        if response.status_code == 200:
            print(f"   ✅ Open #{i+1} tracked")
        else:
            print(f"   ❌ Failed with status {response.status_code}")
        
        # Small delay between opens
        time.sleep(1)


def simulate_email_campaign():
    """Simulate a full email campaign with tracking"""
    print("\n📨 Simulating email campaign...")
    
    campaign_id = f"test-campaign-{int(time.time())}"
    print(f"   Campaign ID: {campaign_id}")
    
    # Simulate sending emails
    print(f"   Simulating {len(TEST_EMAILS)} emails sent...")
    
    # Simulate some opens after delay
    print("   Waiting 2 seconds before opens...")
    time.sleep(2)
    
    # Simulate 70% open rate
    opens = int(len(TEST_EMAILS) * 0.7)
    print(f"   Simulating {opens} email opens...")
    
    for i in range(opens):
        email = TEST_EMAILS[i]
        print(f"   - {email} opening email...")
        
        params = {
            "e": obfuscate_email(email),
            "c": campaign_id,
            "t": str(int(time.time() * 1000))
        }
        
        response = requests.get(f"{TEST_BASE_URL}/api/track-email", params=params)
        
        if response.status_code == 200:
            print("     ✅ Tracked")
        else:
            print(f"     ❌ Failed: {response.status_code}")
        
        # Simulate read delay
        time.sleep(0.5)
    
    print(f"\n   Campaign simulation complete!")
    print(f"   - Emails sent: {len(TEST_EMAILS)}")
    print(f"   - Emails opened: {opens}")
    print(f"   - Open rate: {(opens/len(TEST_EMAILS)*100):.1f}%")


def check_server_logs():
    """Provide instructions for checking server logs"""
    print("\n📋 To verify tracking in server logs:")
    print("   1. Check the terminal running 'npm run both'")
    print("   2. Look for messages like:")
    print("      - 'Tracked email open: test@example.com - Campaign: test'")
    print("      - 'Bot detected, skipping tracking'")
    print("      - 'Email analytics database not configured' (if no DB)")
    print("\n   3. Check your Notion database for new entries")


def main():
    """Run all tests"""
    parser = argparse.ArgumentParser(description="Test email tracking locally")
    parser.add_argument("--quick", action="store_true", 
                       help="Run quick tests only")
    parser.add_argument("--campaign", action="store_true",
                       help="Run campaign simulation only")
    
    args = parser.parse_args()
    
    print("🚀 Email Tracking Local Test Suite")
    print("==================================\n")
    
    # Check if server is running
    if not test_tracking_endpoint():
        print("\n⚠️  Please start the local server first:")
        print("   npm run both")
        sys.exit(1)
    
    if args.campaign:
        simulate_email_campaign()
    elif args.quick:
        # Quick tests only
        test_pixel_response("quick@test.com")
        test_bot_filtering()
    else:
        # Run all tests
        test_pixel_response("test@example.com")
        test_bot_filtering()
        test_invalid_parameters()
        test_multiple_opens()
        simulate_email_campaign()
    
    # Final instructions
    check_server_logs()
    
    print("\n✨ Testing complete!")
    print("\nNext steps:")
    print("1. Send a real test email: python auto_resend_news.py --test-email your@email.com")
    print("2. Check your Notion Email Analytics database")
    print("3. Deploy to production when ready: vercel --prod")


if __name__ == "__main__":
    main()