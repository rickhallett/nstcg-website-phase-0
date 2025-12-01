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
├── /css/                    - Modular CSS files (26 files)
├── /data/
│   ├── /participants/       - Participant data (416 records)
│   └── /config/             - Site configuration
├── /dist/                   - Production minified assets
│   ├── styles.min.css       - Minified CSS (~60KB)
│   └── app.min.js           - Minified JavaScript (~24KB)
├── /docs/                   - Documentation
│   ├── deployment.md        - Deployment guide
│   └── migration-report.md  - Detailed migration analysis
└── /images/                 - Image assets
```

## Technical Details

- **Development** - Zero build process, works without npm or Node.js
- **Production** - Optional build script for minification (clean-css-cli, terser)
- **Runtime dependencies** - Zero (CDN libraries: Animate.css, Font Awesome)
- **Static data** - All data stored in JSON files, loaded via Fetch API
- **Browser compatibility** - Modern browsers (Chrome, Firefox, Safari, Edge)
- **Size** - Production bundle: ~84KB minified (styles + scripts)
- **Hosting** - Works on any static host (Vercel, Netlify, GitHub Pages, S3)

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
- Does not render email addresses or sensitive information
- Represents participants who opted to be publicly listed

## For Developers

### Specialized Agents

This project includes specialized agents in `.claude/agents/` for complex development tasks:

| Agent                           | Purpose                          | Use Cases                                                                             |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| **@css-module-architect**       | CSS architecture and build order | Adding CSS components, managing 26-file modular structure, fixing build order issues  |
| **@page-module-guardian**       | JavaScript module isolation      | Creating page scripts with page-guard pattern, IIFE isolation, DataLoader integration |
| **@static-data-steward**        | Data integrity and privacy       | Managing 416 participant records, ensuring privacy compliance, DataLoader patterns    |
| **@archive-compliance-officer** | Archive mode compliance          | Verifying disabled features, adding archive notices, maintaining historical integrity |
| **@build-pipeline-specialist**  | Build and deployment             | Running builds, debugging minification, optimizing bundles, Vercel deployment         |
| **@agent-architect**            | Agent creation                   | Creating new specialized agents for project-specific patterns                         |

**Usage with Claude Code:**

```bash
# Reference agents with @ prefix
@css-module-architect Add a new notification banner component

# Agents have deep knowledge of:
# - Project file structure and paths
# - Build order requirements
# - Privacy and compliance rules
# - Archive mode constraints
```

Each agent encodes project-specific expertise to eliminate repeated context explanation. See `CLAUDE.md` for detailed agent descriptions.

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

### Build Process (Optional)

For production deployment with optimized assets:

```bash
# Install build tools (one-time)
npm install

# Build minified assets
npm run build
# or
./build.sh

# Output: dist/styles.min.css (~60KB) + dist/app.min.js (~24KB)
```

The build script concatenates and minifies all CSS and JavaScript files. See `docs/deployment.md` for deployment instructions.

### Adding to Archive Notice

The archive notice is automatically added by each static JavaScript file. To modify the message, edit the `addArchiveNotice()` function in:

- `js/homepage-static.js`
- `js/feeds-static.js`
- `js/share-static.js`

## Migration History

This static archive was created from a dynamic Vite + Vercel + Neon (PostgreSQL) application through a systematic migration process:

1. **Phase 1:** Data extraction from Neon database to JSON files with anonymization
2. **Phase 2:** Backend elimination - API calls replaced with static file loading via DataLoader abstraction
3. **Phase 3:** Build system simplification - removed Vite, kept only minification tools
4. **Phase 4:** Feature disabling - forms, donations, analytics disabled with archive notices
5. **Phase 5:** Deployment optimization - configured for static hosting with security headers

**Key Achievement:** 100% data integrity preservation (416 participant records) with 99% attack surface reduction.

For a comprehensive analysis of the migration strategy, data integrity verification, and architectural patterns, see `docs/migration-report.md`.

## Documentation

Additional documentation is available in the `docs/` directory:

- **`docs/user-guide.md`** - Complete guide for non-technical users updating the website with AI assistants
- **`docs/deployment.md`** - Deployment guide for Vercel and other static hosts
- **`docs/migration-report.md`** - Comprehensive migration analysis including:
  - Original architecture reconstruction
  - Five-phase migration strategy
  - Data integrity verification
  - Functional equivalence assessment
  - Architectural patterns and trade-offs
  - Expert validation and recommendations

### For AI Assistants

- **`CLAUDE.md`** - Technical guidance for Claude Code when working in this repository
- **`llm.txt`** - AI assistant instruction file for non-technical users. Paste this into Claude/ChatGPT to get helpful guidance, complexity assessments, and clarifying questions when making website updates.

## License

MIT License - See original campaign materials for full details

## Contact

For historical inquiries about this campaign:

- North Swanage Traffic Consultation Group
- Community archive maintained for historical reference

---

**Note:** This is a preserved snapshot. The information reflects the state of the campaign as of December 2025. For current traffic information in Swanage, please contact local authorities or the Dorset Coast Forum.
