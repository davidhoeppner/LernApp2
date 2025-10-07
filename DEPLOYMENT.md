# Deployment Guide

This document provides comprehensive instructions for deploying the Simple Learning App to various hosting platforms.

## Prerequisites

- Node.js 18 or higher
- npm package manager
- Git for version control

## Build Configuration

The app uses Vite for building and bundling. The production build is optimized with:

- Code splitting for vendor libraries (marked, highlight.js)
- Asset optimization and hashing for cache busting
- Minification with esbuild
- Source maps for debugging
- Modern ES2015+ target for smaller bundles
- Organized asset structure (js, images, fonts)

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized files in the `dist` directory with:

- Minified JavaScript and CSS
- Hashed filenames for cache invalidation
- Optimized images and assets
- Source maps for debugging

To preview the production build locally:

```bash
npm run preview
```

This starts a local server at `http://localhost:4173` to test the production build.

## Deployment Options

### Option 1: Netlify (Recommended)

**Configuration file:** `netlify.toml` (already included)

#### Via Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod
```

#### Via Git Integration (Automatic):

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Netlify will auto-detect settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

**Features:**

- Automatic deployments on git push
- Preview deployments for pull requests
- Custom domain support
- Free SSL certificates
- CDN distribution
- SPA routing configured automatically

### Option 2: Vercel

**Configuration file:** `vercel.json` (already included)

#### Via Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Via Git Integration (Automatic):

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your repository
5. Vercel will auto-detect Vite framework:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
6. Click "Deploy"

**Features:**

- Automatic deployments on git push
- Preview deployments for branches
- Edge network for fast global delivery
- Free SSL certificates
- Analytics and Web Vitals monitoring

### Option 3: GitHub Pages

**Configuration file:** `.github/workflows/deploy.yml` (already included)

#### Via GitHub Actions (Automatic):

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment":
   - Source: Select "GitHub Actions"
4. Push to main branch - deployment happens automatically

#### Manual Deployment:

```bash
# Install gh-pages
npm install -g gh-pages

# Build the project
npm run build

# Deploy to gh-pages branch
npx gh-pages -d dist
```

**Important for GitHub Pages:**
If deploying to `https://username.github.io/repo-name/`, update the base path:

```bash
# Set base path for repository deployment
VITE_BASE_PATH=/repo-name/ npm run build
```

For custom domain or `username.github.io`, use:

```bash
VITE_BASE_PATH=/ npm run build
```

**Features:**

- Free hosting for public repositories
- Automatic deployments via GitHub Actions
- Custom domain support
- HTTPS enabled by default

### Option 4: Static Hosting (AWS S3, Azure, DigitalOcean, etc.)

#### General Steps:

1. Build the project:

```bash
npm run build
```

2. Upload the contents of the `dist` directory to your hosting service

3. Configure your hosting to:
   - Serve `index.html` as the default document
   - Redirect all routes to `index.html` (for SPA routing)
   - Set cache headers for assets (1 year for hashed files)
   - Enable HTTPS
   - Enable compression (gzip/brotli)

## Environment Variables

Configure the base path for different deployment scenarios:

```bash
# For GitHub Pages with repo name
VITE_BASE_PATH=/your-repo-name/ npm run build

# For root domain (Netlify, Vercel, custom domain)
VITE_BASE_PATH=/ npm run build

# Default (root)
npm run build
```

The base path is configured in `vite.config.js` and defaults to `/`.

## Post-Deployment Checklist

After deploying, verify the following:

- [ ] App loads correctly at the deployed URL
- [ ] All routes work correctly (home, modules, quizzes, progress)
- [ ] Theme switching works (light/dark mode)
- [ ] localStorage persistence works
- [ ] Module content renders with syntax highlighting
- [ ] Quizzes function correctly
- [ ] Progress tracking saves and loads
- [ ] Test on mobile devices (iOS and Android)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check accessibility with screen reader
- [ ] Verify all assets load correctly (images, fonts, icons)
- [ ] Test browser back/forward navigation
- [ ] Verify 404 handling redirects to home
- [ ] Check console for errors
- [ ] Test with slow network (throttling)
- [ ] Verify reduced motion preference is respected

## Troubleshooting

### Routes not working (404 errors)

**Problem:** Navigating directly to routes like `/modules` or `/quiz` returns 404.

**Solution:** Configure your hosting to serve `index.html` for all routes:

- Netlify: Already configured in `netlify.toml`
- Vercel: Already configured in `vercel.json`
- GitHub Pages: Works automatically with hash routing
- Custom hosting: Add rewrite rule to serve `index.html` for all paths

### Assets not loading

**Problem:** CSS, JS, or images fail to load.

**Solution:**

- Check that the `base` path in `vite.config.js` matches your deployment URL
- Verify asset paths in browser dev tools Network tab
- For GitHub Pages with repo name, ensure `VITE_BASE_PATH` is set correctly

### Blank page after deployment

**Problem:** App shows blank page or loading spinner forever.

**Solution:**

- Check browser console for errors
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Ensure build completed successfully without errors
- Check that `index.html` is being served correctly

## Support and Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Netlify Documentation](https://docs.netlify.com)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
