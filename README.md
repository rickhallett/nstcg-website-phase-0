# NSTCG Website - Static Archive

This is a static archive of the North Swanage Traffic Consultation Group website, preserved as of December 2025. This archive captures the final state of the campaign website that mobilized the community during the Shore Road traffic consultation period.

## What This Is

A static HTML/CSS/JavaScript snapshot preserving:
- 416 community participant registrations
- Campaign activity feed and timeline
- Community comments and engagement
- Original visual design and user experience

## What This Is NOT

- Not a functional registration system (forms are disabled)
- Not connected to any databases or APIs
- Not accepting donations or processing payments
- Not tracking user activity or analytics

## How to View

### Option 1: Simple HTTP Server (Recommended)

```bash
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

### Option 2: Any Web Server

Works with Apache, Nginx, or any static file server. No special configuration needed.

### File Protocol Warning

Some browsers may have CORS restrictions with `file://` protocol. Using an HTTP server is recommended for full functionality.

## File Structure

```
/
├── index.html               - Homepage
├── feeds.html               - All participants list
├── share.html               - Share page (archived)
├── privacy-policy.html      - Privacy policy
├── terms-and-conditions.html- Terms & conditions
├── 404.html                 - Not found page
├── maintenance.html         - Maintenance page
├── survey-screenshot.html   - Historical reference
├── /js/
│   ├── homepage-static.js   - Homepage functionality
│   ├── feeds-static.js      - Feeds page functionality
│   ├── share-static.js      - Share page functionality
│   └── data-loader.js       - JSON data loading utility
├── /css/                    - Modular CSS files
├── /data/
│   ├── /participants/       - Participant data (416 records)
│   ├── /config/             - Site configuration
└── /images/                 - Image assets
```

## Technical Details

- **Zero build process** - Works without npm, Node.js, or any build tools
- **No dependencies** - Except CDN libraries (MicroModal, Animate.css, Font Awesome)
- **Static data** - All data stored in JSON files, loaded at runtime
- **Browser compatibility** - Modern browsers (Chrome, Firefox, Safari, Edge)
- **Size** - 11MB total, 431 files

## Archive Date

- **Created:** December 1, 2025
- **Original Campaign Period:** Early 2025 - December 2025
- **Final Participant Count:** 416
- **Extraction Source:** Neon PostgreSQL database

## Historical Context

This website was created to mobilize community support during the Dorset Coast Forum's public consultation on Shore Road traffic improvements in North Swanage. It served as a:

- Registration platform for community members
- Information hub about traffic safety concerns
- Community organizing tool with gamification features
- Resource for sharing campaign updates

The campaign successfully engaged over 400 community members in advocating for safer traffic solutions.

## Data Privacy

All participant data in this archive:
- Has been anonymized (last names shown as initials only)
- Includes only publicly shared information (names, comments, timestamps)
- Does not include email addresses or sensitive information
- Represents participants who opted to be publicly listed

## For Developers

### Architecture

- **Simple IIFE pattern** - No complex module system
- **Direct DOM manipulation** - No framework dependencies
- **Fetch API** - For loading static JSON data
- **Event-driven** - Standard browser event handlers

### Data Loading

All data loading goes through `js/data-loader.js`:

```javascript
// Load site configuration
const config = await DataLoader.loadConfig();

// Load all participants
const { participants, totalCount } = await DataLoader.loadAllParticipants();

// Load recent activity
const { signups } = await DataLoader.loadRecentSignups();

// Load comments
const comments = await DataLoader.loadComments();
```

### Adding to Archive Notice

The archive notice is automatically added by each static JavaScript file. To modify the message, edit the `addArchiveNotice()` function in:
- `js/homepage-static.js`
- `js/feeds-static.js`
- `js/share-static.js`

## Migration History

This static archive was created from a dynamic Vite + Vercel + Neon (PostgreSQL) application through a systematic migration process:

1. **Phase 1:** Data extraction from Neon database to JSON files
2. **Phase 2:** JavaScript simplification - replaced API calls with static data loading
3. **Phase 3:** Build system removal and file cleanup

Original codebase: ~200+ files with build system, APIs, and dependencies
Final archive: 431 files, 11MB, zero build dependencies

## License

MIT License - See original campaign materials for full details

## Contact

For historical inquiries about this campaign:
- North Swanage Traffic Consultation Group
- Community archive maintained for historical reference

---

**Note:** This is a preserved snapshot. The information reflects the state of the campaign as of December 2025. For current traffic information in Swanage, please contact local authorities or the Dorset Coast Forum.
