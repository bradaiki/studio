# Test Push Notifications - Step by Step

## What Was Fixed

1. ✅ Added detailed debug logging
2. ✅ Implemented service worker notifications (system-wide)
3. ✅ Registered service worker in app component
4. ✅ Fallback to regular notifications if service worker fails

## How to Test Right Now

### Step 1: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm start
```

This ensures the service worker is properly loaded.

### Step 2: Open Two Browser Windows

1. Window 1: `http://localhost:8100`
2. Window 2: `http://localhost:8100`

### Step 3: Grant Permissions in BOTH Windows

**In Window 1**:
1. Go to Profile → Developer Settings
2. Toggle "Push Notifications" ON
3. Click "Grant Permission"
4. Allow notifications

**In Window 2**:
1. Go to Profile → Developer Settings  
2. Toggle "Push Notifications" ON
3. Click "Grant Permission"
4. Allow notifications

### Step 4: Check Service Worker Registration

**In Window 1 Console**:
```javascript
navigator.serviceWorker.ready.then(reg => console.log('SW Ready:', reg));
```

**In Window 2 Console**:
```javascript
navigator.serviceWorker.ready.then(reg => console.log('SW Ready:', reg));
```

Both should show "SW Ready" with a registration object.

### Step 5: Send a Test Message

**In Window 1**:
1. Navigate to any chat
2. Send a message
3. Watch the console

**Expected Console Output in Window 1**:
```
[Push Notifications] notifyParticipants called: {...}
[Push Notifications] Using local test mode
[Local Test Mode] sendLocalTestNotification called: {...}
[Local Test Mode] Notification permission: granted
[Local Test Mode] Using service worker for notification
[Local Test Mode] Service worker notification shown successfully
```

**Expected Result**:
- A system notification should appear
- It should be visible even if you're looking at Window 2
- Click it to navigate to the chat

### Step 6: Check Window 2

**In Window 2**:
- You should see the notification appear (system-level)
- It's not in the browser, it's in your OS notification center
- Click it to navigate to the chat

## Troubleshooting

### Issue: "Service worker notification failed"

**Check**:
1. Service worker is registered:
   ```javascript
   navigator.serviceWorker.controller
   // Should return a ServiceWorker object
   ```

2. Service worker file exists:
   - Open: `http://localhost:8100/firebase-messaging-sw.js`
   - Should show the service worker code

**Fix**:
- Hard refresh both windows (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Restart dev server

### Issue: "Notification permission: default"

**Fix**:
- Go to Profile → Developer Settings
- Click "Grant Permission" button
- Allow in browser dialog

### Issue: No notification appears at all

**Check Console for**:
```
[Push Notifications] notifyParticipants called
```

If you don't see this, the chat service isn't calling the push notification service.

**Check**:
1. Push notifications are enabled in settings
2. You're logged in
3. You're in a valid chat

### Issue: Notification only appears in Window 1

This means service worker notifications aren't working, but regular notifications are.

**Check**:
```javascript
// In console:
navigator.serviceWorker.ready
  .then(reg => reg.showNotification('Test', { body: 'Testing' }))
```

If this shows a notification, service worker is working.

## Understanding the Behavior

### Service Worker Notifications (Preferred)
- Appear in OS notification center
- Visible across all windows/tabs
- Persist even if browser is closed
- This is what we're using now

### Regular Notifications (Fallback)
- Only appear in the window that creates them
- Don't show in other windows
- This is the fallback if service worker fails

## Debug Commands

### Check if service worker is active
```javascript
navigator.serviceWorker.controller
```

### Check notification permission
```javascript
Notification.permission
```

### Test service worker notification
```javascript
navigator.serviceWorker.ready.then(reg => 
  reg.showNotification('Test', {
    body: 'This is a test',
    icon: '/assets/icon/icon.png'
  })
);
```

### Check push notification config
```javascript
// In Window 1 console:
localStorage.getItem('pushNotificationConfig')
```

Should show:
```json
{"enabled":true,"debug":true,"localTestMode":true}
```

## Expected Flow

1. **Window 1**: User sends chat message
2. **ChatService**: Calls `notifyParticipants()`
3. **ChatPushIntegrationService**: Checks local test mode = true
4. **Service Worker**: Shows system notification
5. **OS**: Displays notification in notification center
6. **Window 2**: Sees the notification (system-level)
7. **User**: Clicks notification
8. **Service Worker**: Handles click, sends message to app
9. **App**: Navigates to chat

## Summary

The key fix is using **service worker notifications** instead of regular notifications:

**Before**: `new Notification()` - only shows in current window
**After**: `registration.showNotification()` - shows system-wide

Now when you send a message in Window 1, the notification should appear in your OS notification center and be visible from Window 2.

Try it now!
