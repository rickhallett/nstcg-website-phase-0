# NSTCG Website - Deployment Guide

## Vercel Deployment

This static archive is configured for automatic deployment to Vercel.

### First Time Setup

1. **Install Vercel CLI** (optional, for manual deployments):
   ```bash
   npm i -g vercel
   ```

2. **Link to Vercel project**:
   ```bash
   vercel link
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Automatic Deployment

The site is configured to auto-deploy when you push to the main branch:

1. Push changes to GitHub
2. Vercel automatically builds and deploys
3. Build command: `./build.sh`
4. Output: Root directory with built `dist/` folder

### Build Process

The build script (`build.sh`):
- Concatenates all CSS files in order
- Concatenates all JS files
- Minifies CSS with clean-css
- Minifies and uglifies JS with terser (aggressive mode)
- Outputs to `dist/` folder

**Build outputs:**
- `dist/styles.min.css` - Minified CSS (~60KB)
- `dist/app.min.js` - Minified and uglified JS (~24KB)

### Manual Build

To build locally:
```bash
./build.sh
```

### Configuration Files

- `vercel.json` - Vercel deployment configuration
- `package.json` - Dependencies for build tools
- `.vercelignore` - Files excluded from deployment
- `.gitignore` - Files excluded from git

### Security Headers

Configured security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Caching

- `/dist/*` files: 1 year cache (immutable)
- HTML files: Standard caching

### Clean URLs

Vercel is configured for clean URLs:
- `/feeds` → serves `feeds.html`
- `/share` → serves `share.html`

## Troubleshooting

**Build fails:**
- Ensure `build.sh` is executable: `chmod +x build.sh`
- Check that all CSS/JS files exist
- Verify npx is available

**404 errors:**
- Check that HTML files are in root directory
- Verify vercel.json rewrites configuration

**Missing styles/scripts:**
- Ensure build completed successfully
- Check that `dist/` folder contains minified files
- Verify HTML files reference `/dist/styles.min.css` and `/dist/app.min.js`
