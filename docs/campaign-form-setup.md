# Campaign Form Setup Guide

## Overview
This system handles form submissions from campaign pages (like `/campaigns/final.html`) and stores them in a Notion database.

## Environment Variables

Add this to your `.env.local`:

```bash
# Campaign Forms Database
NOTION_CAMPAIGN_FORMS_DB_ID=your_campaign_forms_database_id_here
```

## Notion Database Setup

Create a new Notion database with these properties:

| Property Name | Type | Description |
|--------------|------|-------------|
| Name | Title | Voter's full name |
| Email | Email | Voter's email address |
| Postcode | Text | UK postcode (normalized) |
| Voting Priority | Select | Their top priority for the council |
| Message | Text | Optional message about why they're voting |
| Vote Commitment | Checkbox | Confirmed commitment to vote |
| Campaign | Select | Which campaign page (e.g., "Final Countdown") |
| Form Type | Select | Type of form (e.g., "vote-commitment") |
| Page Source | Text | URL path of the submission page |
| Submitted At | Date | When the form was submitted |
| IP Address | Text | IP address for tracking |

### Select Options to Configure:

**Voting Priority:**
- transparency
- safety
- democracy
- business
- residents

**Campaign:**
- Final Countdown
- Electoral Violation
- Rigged Consultation
- Emergency Services

**Form Type:**
- vote-commitment
- petition-signature
- volunteer-signup
- general-contact

## Implementation

### 1. Add to Campaign HTML Pages

Add these scripts before the closing `</body>` tag:

```html
<!-- Form handler -->
<script src="/campaigns/form-handler.js"></script>

<!-- Optional: Also include visitor tracking -->
<script src="/campaigns/tracker.js"></script>
```

### 2. HTML Form Structure

Your form should follow this structure:

```html
<form id="vote-commitment-form">
  <div class="form-group">
    <label for="voter-name">Full Name</label>
    <input type="text" id="voter-name" name="voter-name" required>
  </div>

  <div class="form-group">
    <label for="voter-email">Email Address</label>
    <input type="email" id="voter-email" name="voter-email" required>
  </div>

  <div class="form-group">
    <label for="voter-postcode">Postcode</label>
    <input type="text" id="voter-postcode" name="voter-postcode" required>
  </div>

  <div class="form-group">
    <label for="voting-priority">Top Priority</label>
    <select id="voting-priority" name="voting-priority" required>
      <option value="">Choose...</option>
      <option value="transparency">Transparent consultations</option>
      <option value="emergency-services">Emergency services access</option>
      <!-- Add more options -->
    </select>
  </div>

  <div class="form-group">
    <label for="voter-message">Why are you voting? (Optional)</label>
    <textarea id="voter-message" name="voter-message" rows="4"></textarea>
  </div>

  <div class="commitment-checkbox">
    <input type="checkbox" id="vote-commitment" name="vote-commitment" required>
    <label for="vote-commitment">
      I commit to vote for change on July 24th
    </label>
  </div>

  <button type="submit" id="submit-commitment">
    Add My Commitment
  </button>
</form>
```

## Data Collection

1. **Email Storage**: Emails are stored directly for campaign communication
2. **IP Tracking**: IPs are stored for analytics and duplicate detection
3. **Postcode Normalization**: Postcodes are uppercased and spaces removed
4. **No Cookies**: Form doesn't use cookies or tracking

## Testing

Test the endpoint with curl:

```bash
curl -X POST http://localhost:3000/api/campaign-form \
  -H "Content-Type: application/json" \
  -d '{
    "voterName": "John Smith",
    "voterEmail": "john@example.com",
    "voterPostcode": "BH19 1LU",
    "votingPriority": "transparency",
    "voterMessage": "Time for change!",
    "voteCommitment": true,
    "pageSource": "/campaigns/final.html"
  }'
```

## Validation Rules

1. **Required Fields**: Name, Email, Postcode, Priority, Commitment
2. **Email Format**: Must be valid email format
3. **UK Postcode**: Must match UK postcode pattern
4. **Commitment**: Checkbox must be checked

## Success Response

```json
{
  "success": true,
  "message": "Thank you for your commitment to vote for change!",
  "data": {
    "name": "John Smith",
    "priority": "transparency",
    "commitment": true
  }
}
```

## Error Handling

The form handler provides user-friendly error messages:
- Missing required fields
- Invalid email format
- Invalid UK postcode
- Network errors
- Server errors

All errors are displayed to the user and logged to console for debugging.