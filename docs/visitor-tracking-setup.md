# Visitor Tracking Setup Guide

## Overview
This visitor tracking system collects anonymous analytics data and stores it in a Notion database for analysis.

## Notion Database Setup

### 1. Create a New Database in Notion
Create a new database with the following properties:

| Property Name | Type | Notes |
|--------------|------|-------|
| Page URL | Title | The full URL of the visited page |
| Page Title | Text | The HTML title of the page |
| Timestamp | Date | When the visit occurred |
| Device Type | Select | Options: desktop, tablet, mobile |
| Browser | Select | Options: Chrome, Safari, Firefox, Edge, Unknown |
| OS | Select | Options: Windows, macOS, Linux, Android, iOS, Unknown |
| Referrer | Text | Where the visitor came from |
| Session ID | Text | Unique session identifier |
| New Visitor | Checkbox | First-time visitor flag |
| Hashed IP | Text | Anonymized IP for geographic insights |
| Page Load Time | Number | Page load duration in milliseconds |
| Screen Resolution | Text | Format: "1920x1080" |
| Language | Select | Browser language (e.g., en-US, es-ES) |
| UTM Source | Text | Campaign source parameter |
| UTM Campaign | Text | Campaign name parameter |

### 2. Environment Variables
Add these to your `.env.local`:

```bash
# Visitor tracking database
NOTION_VISITOR_DB_ID=your_visitor_database_id_here

# Optional: Salt for IP hashing (recommended for privacy)
IP_SALT=your-random-salt-string-here
```

## Implementation

### 1. Add to Your Pages
Add this to any page you want to track:

```javascript
// Option 1: Import in your entry file
import '../modules/visitor-tracking.js';

// Option 2: Add to HTML
<script type="module">
  import { trackVisitor } from '/js/modules/visitor-tracking.js';
  trackVisitor();
</script>
```

### 2. For Static HTML Pages
For pages in the public folder (like campaign pages), add this before closing `</body>`:

```html
<script type="module">
  // Inline tracking for static pages
  (async function() {
    try {
      const visitorData = {
        pageUrl: window.location.href,
        pageTitle: document.title,
        referrer: document.referrer || 'direct',
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        isNewVisitor: !localStorage.getItem('has-visited'),
        pageLoadTime: 0,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('has-visited', 'true');
      
      await fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData)
      });
    } catch (e) {
      // Fail silently
    }
  })();
</script>
```

## Privacy Considerations

1. **IP Anonymization**: IPs are hashed with SHA-256, making them impossible to reverse
2. **No Personal Data**: No names, emails, or other PII is collected
3. **Session-Based**: Session IDs reset when browser is closed
4. **Opt-Out Friendly**: Respects Do Not Track if implemented

## Analytics Queries

Once data is collected, you can analyze in Notion:

### Common Filters:
- **Today's Traffic**: Filter by Timestamp = Today
- **Mobile Users**: Filter by Device Type = mobile
- **Campaign Traffic**: Filter by UTM Source is not empty
- **New vs Returning**: Group by New Visitor checkbox
- **Top Pages**: Group by Page URL, sort by count

### Useful Views:
1. **Daily Traffic**: Calendar view by Timestamp
2. **Device Breakdown**: Board view by Device Type
3. **Browser Stats**: Gallery view grouped by Browser
4. **Referrer Analysis**: Table grouped by Referrer

## Testing

Test the endpoint with curl:

```bash
curl -X POST http://localhost:3000/api/track-visitor \
  -H "Content-Type: application/json" \
  -d '{
    "pageUrl": "http://localhost:3000/test",
    "pageTitle": "Test Page",
    "referrer": "https://google.com",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "sessionId": "test-session",
    "isNewVisitor": true,
    "pageLoadTime": 1234,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

## Troubleshooting

### Common Issues:

1. **403 Forbidden from Notion**
   - Check your NOTION_TOKEN has access to the database
   - Verify NOTION_VISITOR_DB_ID is correct

2. **Missing Data**
   - Ensure all Select properties in Notion have the expected options
   - Check browser console for errors

3. **No Tracking on Production**
   - Verify environment variables are set in Vercel
   - Check API endpoint is accessible at /api/track-visitor