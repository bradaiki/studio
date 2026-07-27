# Test Service Worker Notifications

## The Issue

You're seeing notifications in Window 1 (sender) but not Window 2 (receiver).

This means we're using **regular notifications** (`new Notification()`) instead of **service worker notifications** (`registration.showNotification()`).

## Quick Test

### In Window 1 Console:

```javascript
// Test 1: Check if service worker is registered
navigator.serviceWorker.controller
```

**Expected**: Should return a `ServiceWorker` object
**If null**: Service worker not active

```javascript
// Test 2: Check if service worker is ready
navigator.serviceWorker.ready.then(reg => console.log('Ready:', reg))
```

**Expected**: Should log "Ready: ServiceWorkerRegistration"
**If error**: Service worker not registered

```javascript
// Test 3: Try to show a notification via service worker
navigator.serviceWorker.ready.then(reg => 
  reg.showNotification('Test from SW', {
    body: 'This should appear in ALL windows',
    icon: '/assets/icon/icon.png'
  })
)
```

**Expected**: Notification appears in OS notification center (visible from both windows)
**If error**: Service worker can't show notifications

### In Window 2 Console:

Run the same Test 3:
```javascript
navigator.serviceWorker.ready.then(reg => 
  reg.showNotification('Test from Window 2', {
    body: 'Testing from second window',
    icon: '/assets/icon/icon.png'
  })
)
```

**Expected**: Notification appears in OS notification center

## What the Logs Tell Us

### If you see in Window 1:
```
[Local Test Mode] Using service worker for notification
[Local Test Mode] Service worker notification shown successfully
```

**This means**: Service worker IS being used, but something else is wrong.

### If you see in Window 1:
```
[Local Test Mode] Service worker notification failed, falling back to regular notification
[Local Test Mode] Creating regular browser notification...
```

**This means**: Service worker failed, using fallback (only shows in current window).

## Common Issues

### Issue 1: Service Worker Not Registered

**Check**: Look for this log on page load:
```
[Service Worker] Registered successfully
```

**If missing**:
1. Hard refresh both windows (Cmd+Shift+R or Ctrl+Shift+R)
2. Check: `http://localhost:8100/firebase-messaging-sw.js` - should load the file
3. Restart dev server

### Issue 2: Service Worker Registered But Not Active

**Check**:
```javascript
navigator.serviceWorker.controller
```

**If null**:
1. Hard refresh the page
2. Wait a few seconds
3. Check again

### Issue 3: Service Worker Active But Can't Show Notifications

**Check**:
```javascript
navigator.serviceWorker.ready.then(reg => 
  reg.showNotification('Test', { body: 'Test' })
).catch(err => console.error('Error:', err))
```

**If error**: Check the error message

## The Real Test

### Step 1: In Window 1 Console
```javascript
// This should show in BOTH windows
navigator.serviceWorker.ready.then(reg => 
  reg.showNotification('Multi-Window Test', {
    body: 'If you see this in Window 2, service worker works!',
    icon: '/assets/icon/icon.png',
    tag: 'test-notification'
  })
)
```

### Step 2: Look at Window 2

**Do you see the notification?**

**YES** → Service worker works! The issue is in our code
**NO** → Service worker notifications aren't working system-wide

## If Service Worker Works But App Doesn't

This means the code is falling back to regular notifications instead of using the service worker.

**Check the logs when sending a message:**

Look for:
```
[Local Test Mode] Using service worker for notification
```

**If you see**:
```
[Local Test Mode] Service worker notification failed
```

**Then check the error** - it will tell us why the service worker call failed.

## Debugging the Service Worker Call

Add this to Window 1 console to see what's happening:

```javascript
// Override console.log to see all logs
const originalLog = console.log;
console.log = function(...args) {
  if (args[0] && args[0].includes('Local Test Mode')) {
    originalLog.apply(console, ['>>> FOUND:', ...args]);
  }
  originalLog.apply(console, args);
};
```

Then send a message and look for the `>>> FOUND:` logs.

## Expected Behavior

When service worker notifications work correctly:

1. **Window 1**: Send message
2. **Service Worker**: Creates notification
3. **OS**: Shows notification in notification center
4. **Window 2**: Can see the notification (it's system-level)
5. **Click**: Opens/focuses app and navigates to chat

## What to Share

If it's still not working, share:

1. **Window 1 console logs** when sending a message
2. **Result of**:
   ```javascript
   navigator.serviceWorker.controller
   ```
3. **Result of manual test**:
   ```javascript
   navigator.serviceWorker.ready.then(reg => 
     reg.showNotification('Manual Test', { body: 'Testing' })
   )
   ```
4. **Do you see the manual test notification in Window 2?**

This will tell me exactly what's wrong!
