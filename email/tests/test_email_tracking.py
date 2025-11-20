#!/usr/bin/env python3

import pytest
import time
import base64
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from auto_resend_news import (
    obfuscate_email, 
    generate_tracking_pixel_url,
    generate_news_email,
    CONFIG
)


class TestEmailTracking:
    """Test email tracking functionality"""
    
    def test_obfuscate_email(self):
        """Test email obfuscation"""
        email = "test@example.com"
        obfuscated = obfuscate_email(email)
        
        # Should be base64 encoded without padding
        assert "=" not in obfuscated
        
        # Should be reversible
        padded = obfuscated
        padding = len(obfuscated) % 4
        if padding:
            padded += "=" * (4 - padding)
        decoded = base64.b64decode(padded).decode()
        assert decoded == email
    
    def test_generate_tracking_pixel_url(self):
        """Test tracking pixel URL generation"""
        email = "user@example.com"
        campaign_id = "test-campaign"
        
        url = generate_tracking_pixel_url(email, campaign_id)
        
        # Check URL structure
        assert url.startswith(CONFIG["SITE_URL"])
        assert "/api/track-email?" in url
        assert f"c={campaign_id}" in url
        assert "e=" in url
        assert "t=" in url
        
        # Extract and verify email parameter
        import urllib.parse
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)
        
        assert "e" in params
        assert "c" in params
        assert "t" in params
        assert params["c"][0] == campaign_id
    
    def test_generate_tracking_pixel_url_default_campaign(self):
        """Test tracking pixel URL with default campaign"""
        email = "user@example.com"
        
        url = generate_tracking_pixel_url(email)
        
        # Should use default campaign from CONFIG
        assert f"c={CONFIG['CAMPAIGN_ID']}" in url
    
    def test_email_template_generation(self):
        """Test that tracking pixel is injected into email template"""
        # Create a mock user
        user = {
            "email": "test@example.com",
            "name": "Test User",
            "firstName": "Test",
            "lastName": "User"
        }
        
        # Generate email (this will fail if template doesn't exist)
        try:
            html_content = generate_news_email(user)
            
            # Check that tracking pixel is present
            assert '<img src="' in html_content
            assert '/api/track-email?' in html_content
            assert 'width="1"' in html_content
            assert 'height="1"' in html_content
            
            # Check that email is properly encoded in URL
            assert obfuscate_email(user["email"]) in html_content
            
            # Check that tracking pixel placeholder is replaced
            assert "{{tracking_pixel}}" not in html_content
            
        except FileNotFoundError:
            pytest.skip("Email template not found - run mjml compilation first")
    
    def test_tracking_pixel_url_components(self):
        """Test individual components of tracking pixel URL"""
        email = "special+chars@example.com"
        campaign_id = "campaign-2024"
        
        # Generate URL
        before_time = int(time.time() * 1000)
        url = generate_tracking_pixel_url(email, campaign_id)
        after_time = int(time.time() * 1000)
        
        # Parse URL components
        import urllib.parse
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)
        
        # Check timestamp is within expected range
        timestamp = int(params["t"][0])
        assert before_time <= timestamp <= after_time
        
        # Check obfuscated email can be decoded
        obfuscated = params["e"][0]
        padded = obfuscated
        padding = len(obfuscated) % 4
        if padding:
            padded += "=" * (4 - padding)
        decoded_email = base64.b64decode(padded).decode()
        assert decoded_email == email


if __name__ == "__main__":
    pytest.main([__file__, "-v"])