# AWS Amplify Routing Fix

## Problem
When navigating directly to routes like `/dash/studios` or refreshing the page on AWS Amplify hosting, you get a 404 error. This happens because AWS is looking for a physical file instead of letting Angular handle the client-side routing.

## Solution Applied

### 1. Created `_redirects` file
- Location: `src/_redirects`
- Content: `/* /index.html 200`
- This tells AWS Amplify to redirect all routes to `index.html` with a 200 status code

### 2. Updated `angular.json`
- Added the `_redirects` file to the assets array
- This ensures the file is copied to the `www` directory during build

### 3. Created `amplify.yml`
- Configured build settings for AWS Amplify
- Added security headers
- Set correct output directory (`www`)

## Source Maps for Debugging

Source maps are now enabled in production builds to help debug TypeScript in AWS:
- Scripts source maps: ✓ Enabled
- Styles source maps: ✓ Enabled  
- Vendor source maps: ✓ Enabled

This allows you to see original TypeScript code in browser DevTools instead of minified JavaScript.

**Note:** Source maps increase bundle size. If you need to disable them for performance, remove the `sourceMap` configuration from the production build in `angular.json`.

## Deploy Steps

1. **Rebuild your app:**
   ```bash
   npm run build
   ```

2. **Verify the `_redirects` file exists in `www` directory:**
   ```bash
   ls -la www/_redirects
   ```

3. **Check that source maps are generated:**
   ```bash
   ls -la www/*.map
   ```

4. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Fix AWS Amplify routing and enable source maps"
   git push
   ```

5. **AWS Amplify will automatically redeploy**

## Alternative: Manual Amplify Console Configuration

If the `_redirects` file doesn't work, you can also configure redirects in the Amplify Console:

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Rewrites and redirects"
4. Add a new rule:
   - Source address: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - Target address: `/index.html`
   - Type: `200 (Rewrite)`

## Testing

After deployment, test these URLs directly:
- `https://your-app.amplifyapp.com/dash/studios`
- `https://your-app.amplifyapp.com/dash/feed`
- `https://your-app.amplifyapp.com/dash/people`

All should load correctly without 404 errors.

## Debugging with Source Maps

1. Open Chrome DevTools (F12)
2. Go to the Sources tab
3. You'll see your original TypeScript files under `webpack://`
4. Set breakpoints and debug as if running locally
5. Console errors will show TypeScript line numbers instead of minified JS

**Security Note:** Source maps expose your TypeScript code. If this is a concern, you can:
- Use a separate staging environment with source maps
- Disable source maps in production and only enable for debugging
- Use error tracking services like Sentry that can use source maps server-side
