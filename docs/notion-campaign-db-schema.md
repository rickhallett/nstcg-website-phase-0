# Notion Database Schema for Campaign Forms

Please create a new database called "Campaign Form Submissions" with the following properties:

## Database Properties

1. **Name** (Title property)
   - The primary field
   - Contains the voter's full name

2. **Email** (Email property)
   - Type: Email
   - Stores the voter's email address for campaign communication

3. **Postcode** (Text property)
   - Type: Text
   - Stores normalized UK postcodes (uppercase, no spaces)
   - Example: "BH191LU"

4. **Voting Priority** (Select property)
   - Type: Select
   - Options to create:
     - transparency
     - safety
     - democracy
     - business
     - residents

5. **Message** (Text property)
   - Type: Text
   - Stores optional message about why they're voting for change
   - Can be empty

6. **Vote Commitment** (Checkbox property)
   - Type: Checkbox
   - Indicates if the user committed to vote

7. **Campaign** (Select property)
   - Type: Select
   - Options to create:
     - Final Countdown
     - Electoral Violation
     - Rigged Consultation
     - Emergency Services

8. **Form Type** (Select property)
   - Type: Select
   - Options to create:
     - vote-commitment
     - petition-signature
     - volunteer-signup
     - general-contact

9. **Page Source** (Text property)
   - Type: Text
   - Stores the URL path where form was submitted
   - Example: "/campaigns/final.html"

10. **Submitted At** (Date property)
    - Type: Date
    - Include time: Yes
    - Stores when the form was submitted

11. **IP Address** (Text property)
    - Type: Text
    - Stores the submitter's IP address for analytics

## Database Views to Create

1. **All Submissions** (Default table view)
   - Sort by: Submitted At (Descending)
   - Show all properties

2. **By Campaign** (Board view)
   - Group by: Campaign
   - Sort by: Submitted At (Descending)

3. **By Priority** (Board view)
   - Group by: Voting Priority
   - Sort by: Submitted At (Descending)

4. **Recent Submissions** (Table view)
   - Filter: Submitted At is on or after "Today minus 7 days"
   - Sort by: Submitted At (Descending)

5. **Committed Voters** (Table view)
   - Filter: Vote Commitment is checked
   - Sort by: Name (Ascending)

## Additional Settings

- Enable "Duplicate" feature for the database
- Set database icon to 📊 or 🗳️
- Add database description: "Form submissions from campaign pages including vote commitments and contact information"

## Integration Notes

This database will receive data from the API endpoint at `/api/campaign-form`. The API will populate all fields automatically when users submit forms on campaign pages.