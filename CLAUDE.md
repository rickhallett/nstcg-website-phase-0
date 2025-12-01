# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSTCG (North Swanage Traffic Consultation Group) static website archive - a preserved snapshot of a community activism campaign website with 416 participant registrations. Originally a dynamic Vite + PostgreSQL application, now a zero-dependency static HTML/CSS/JavaScript site.

## Build and Development Commands

### Local Development
```bash
# No build required for development - serve files directly
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Production Build
```bash
# Install build tools (only needed once)
npm install

# Build minified assets for production
npm run build
# or
./build.sh

# Output: dist/styles.min.css (~60KB), dist/app.min.js (~24KB)
```

### Deployment
```bash
# Manual deployment to Vercel
vercel --prod

# Automatic: Push to main branch triggers Vercel build
git push origin main
```

## Architecture

### Static-First Design Philosophy

**Key principle:** Works without build tools in development, optimized bundle in production.

- **No frameworks:** Pure HTML/CSS/JavaScript with direct DOM manipulation
- **No runtime dependencies:** Only dev-time minification tools (clean-css-cli, terser)
- **Static data:** 416 participant records in JSON files (data/participants/)
- **IIFE modules:** Each page has isolated JavaScript module with page-guard pattern
- **Archive mode:** All interactive features (forms, donations, analytics) explicitly disabled

### File Organization

```
/
├── index.html, feeds.html, share.html    # Main pages
├── /js/
│   ├── data-loader.js                     # Shared data utility (window.DataLoader)
│   ├── homepage-static.js                 # Homepage IIFE (counter, feed)
│   ├── feeds-static.js                    # Feeds IIFE (pagination, grid)
│   └── share-static.js                    # Share IIFE (disabled sharing)
├── /css/
│   ├── main.css                           # Development entry (29 @imports)
│   ├── /base/                             # variables, reset, typography, animations
│   ├── /layout/                           # container, header, footer
│   ├── /components/                       # 20 component files
│   ├── /pages/                            # Page-specific styles
│   └── /utilities/                        # helpers, mobile, registration-state
├── /data/
│   ├── /config/site-config.json           # Feature flags, counts
│   └── /participants/                     # 416 anonymized records
└── /dist/                                 # Built assets (minified)
```

### JavaScript Module Pattern

Each page script uses a **page-guard IIFE pattern** to prevent cross-page execution:

```javascript
// Guard: Only runs on specific page
if (!document.getElementById("unique-element-id")) return;

(function () {
  // Private scope - isolated from other pages
  // Uses DataLoader for data access
})();
```

**DataLoader API:**
```javascript
await DataLoader.loadConfig()           // Site config + feature flags
await DataLoader.loadAllParticipants()  // 416 participant records
await DataLoader.loadRecentSignups()    // Activity feed
await DataLoader.loadComments()         // Community comments
DataLoader.getCount()                   // Participant count
```

### Build Process (build.sh)

**Sequential operations:**
1. Concatenate 26 CSS files in strict order (base → layout → components → pages → utilities)
2. Concatenate 4 JS files (data-loader → homepage → feeds → share)
3. Minify CSS with clean-css-cli (--with-rebase)
4. Minify JS with terser (aggressive: 3 passes, drop_console, toplevel mangle)
5. Output to dist/ folder with size report

**Critical:** CSS file order matters - base variables must load before components that reference them.

### Deployment Configuration

**vercel.json:**
- Build command: ./build.sh
- Clean URLs: /feeds → feeds.html
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Caching: /dist/* = 1 year, HTML = standard

**.vercelignore:**
- Excludes source files (css/, js/, build.sh)
- Deploys only: HTML, dist/, data/, images/

## Common Development Patterns

### Adding Archive Notices

Each static JS file includes `addArchiveNotice()` function that injects a banner:
```javascript
function addArchiveNotice() {
  const notice = document.createElement('div');
  notice.className = 'archive-notice';
  notice.innerHTML = 'ARCHIVED SITE: [functionality] has been disabled';
  // Insert at top of page
}
```

### Data Loading Pattern

All data access goes through DataLoader:
```javascript
// Load and use data
const config = await DataLoader.loadConfig();
const { participants } = await DataLoader.loadAllParticipants();

// All data is static JSON - no API calls
```

### Page-Specific Modifications

1. **Homepage (index.html + homepage-static.js):** Counter animation, live feed, thought bubbles, disabled signup form
2. **Feeds (feeds.html + feeds-static.js):** Participant grid with pagination (50/page), date formatting
3. **Share (share.html + share-static.js):** Disabled social buttons, campaign stats display

## CSS Architecture

**Modular system with 26 files:**
- Base layer: variables, reset, typography, animations
- Layout layer: container, header, footer
- Components: navigation, hero, counter, live-feed, forms, modal, etc.
- Utilities: helpers, mobile breakpoints, registration-state

**Loading strategy:**
- Development: Single main.css with 29 @import statements
- Production: Concatenated and minified dist/styles.min.css

**When adding CSS:** Add file path to build.sh CSS_FILES array in correct order category.

## Data Structure

**Site config (data/config/site-config.json):**
```json
{
  "finalCount": 416,
  "campaignStatus": "archived",
  "features": {
    "donations": false,
    "leaderboard": false,
    "forms": false
  }
}
```

**Participant format (anonymized):**
```json
{
  "name": "John D.",
  "first_name": "John",
  "last_name": "Doe",  // Anonymized to initial
  "comments": "Comment text",
  "timestamp": "2025-11-15T10:30:00Z"
}
```

## Security and Privacy

- Last names anonymized as initials only
- No email addresses stored in archive
- No tracking or analytics in archive mode
- All forms and interactive features disabled
- Security headers configured in vercel.json

## Migration Context

This static archive was created from a dynamic application with:
- Original: Vite + Node.js + PostgreSQL + API routes
- Current: Pure HTML/CSS/JS + JSON data files
- Migration preserved 416 participant records from database

Archive mode explicitly disables: form submissions, donations, user registration, analytics, social sharing, newsletter signups.

## Important Notes

- Do NOT create new build dependencies - this is intentionally dependency-free for archival purposes
- When editing HTML pages, ensure script/style references match environment (dev: source files, prod: /dist/ bundle)
- Always test with local HTTP server, not file:// protocol (CORS restrictions)
- CSS order in build.sh is critical - variables must load before components
- Each JS module has page-guard - do not remove unique element ID checks
