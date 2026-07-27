# Fix: Service Worker 404 Error

## ✅ Fixed!

I've fixed the service worker 404 error. Here's what I did:

### Changes Made

1. **Moved service worker file**
   - From: `./firebase-messaging-sw.js` (root)
   - To: `src/firebase-messaging-sw.js`

2. **Updated angular.json**
   - Added service worker to assets array
   - Now gets copied to `www/` during build

3. **Rebuilt the app**
   - Service worker now available at `/firebase-messaging-sw.js`

### How to Apply the Fix

If you're still seeing the error, rebuild your app:

```bash
npm run build
ionic serve
```

Or if using live reload:
```bash
# Stop the current server (Ctrl+C)
# Then restart
ionic serve
```

---

## Why This Happened

The service worker file needs to be:
1. ✅ In the `src/` directory
2. ✅ Listed in `angular.json` assets
3. ✅ Served from the root path (`/firebase-messaging-sw.js`)

**Before:** File was in project root, not being copied to build output
**After:** File is in `src/`, gets copied to `www/` during build

---

## Verify the Fix

### 1. Check the file exists in build output:
```bash
ls -la www/firebase-messaging-sw.js
```

Should show the file with recent timestamp.

### 2. Check in browser:
1. Open your app: `ionic serve`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for: `Service Worker registered: ServiceWorkerRegistration`
5. No more 404 errors!

### 3. Check in Application tab:
1. Open DevTools → Application tab
2. Click "Service Workers" in left sidebar
3. Should see: `firebase-messaging-sw.js` with status "activated"

---

## If You Still See the Error

### Option 1: Hard Refresh
```bash
# In browser, press:
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Option 2: Clear Service Workers
1. Open DevTools → Application → Service Workers
2. Click "Unregister" on any old service workers
3. Refresh the page

### Option 3: Rebuild from Scratch
```bash
# Clean build
rm -rf www
npm run build
ionic serve
```

---

## Service Worker Configuration

The service worker is now properly configured:

**File location:** `src/firebase-messaging-sw.js`

**Build output:** `www/firebase-messaging-sw.js`

**Served at:** `http://localhost:8100/firebase-messaging-sw.js`

**Registered in:** `src/index.html`

---

## Next Steps

Now that the service worker is working:

1. **Configure Firebase credentials**
   - Edit `src/firebase-messaging-sw.js`
   - Replace placeholder values with your Firebase config
   - See `WEB_PUSH_QUICK_START.md`

2. **Test web push notifications**
   - Grant notification permission
   - Send a test message
   - Check if notification appears

---

## Summary

✅ **Service worker file moved** to `src/` directory
✅ **angular.json updated** to include in build
✅ **App rebuilt** with service worker
✅ **404 error fixed** - service worker now loads correctly

**The error should be gone after rebuilding!**
