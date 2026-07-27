# Debug Checklist - Push Notifications Not Working

## What You're Seeing
- GraphQL queries (message being sent)
- No push notification invocations
- No console logs about push notifications

## Step-by-Step Debug

### Step 1: Check if Push Notifications are Enabled

**In Browser Console:**
```javascript
localStorage.getItem('pushNotificationConfig')
```

**Expected Output:**
```json
{"enabled":true,"debug":true,"localTestMode":true}
```

**If you see `null` or `enabled: false`:**
1. Go to Profile → Developer Settings
2. Toggle "Push Notifications" to ON
3. Refresh the page
4. Try again

### Step 2: Check Service Injection

**In Browser Console:**
```javascript
// This won't work directly, but we can check if the service exists
// by looking for its logs
```

**Look for this log on page load:**
```
ChatService constructor called
ChatPushIntegrationService initialized
```

**If you don't see these:**
- The services aren't being initialized
- Check browser console for errors on page load

### Step 3: Send a Message and Check Logs

**When you send a message, you should see:**

```
=== SERVICE SEND MESSAGE ===
Request: {chatId: "...", message: "..."}
=== CALLING PUSH NOTIFICATIONS ===
Chat: [Chat Name] ID: [chat-id]
Participants: ["user1", "user2"]
Sender: [your-user-id] [your-name]
[Push Notifications] notifyParticipants called: {...}
[Push Notifications] Using local test mode
[Local Test Mode] sendLocalTestNotification called: {...}
[Local Test Mode] Notification permission: granted
[Local Test Mode] Using service worker for notification
[Local Test Mode] Service worker notification shown successfully
=== PUSH NOTIFICATIONS COMPLETED ===
```

### Step 4: If You Don't See "CALLING PUSH NOTIFICATIONS"

**Possible Causes:**

1. **Chat not found**
   - Check: `Chat not found` error in console
   - Fix: Make sure you're in a valid chat

2. **User not authenticated**
   - Check: `User not authenticated` error
   - Fix: Log out and log back in

3. **Service not injected**
   - Check: TypeScript errors on page load
   - Fix: Restart dev server

### Step 5: If You See "CALLING" but Not "notifyParticipants called"

This means the service method isn't being executed.

**Check:**
```javascript
// In console, check if service exists
// We can't access it directly, but we can check the logs
```

**Possible Causes:**
1. Service method is throwing an error immediately
2. Service isn't properly injected
3. TypeScript compilation error

### Step 6: Check Push Notification Config

**In Browser Console:**
```javascript
// Check if config is loaded
console.log('Config check - open Profile → Developer Settings to see current state');
```

**In Profile → Developer Settings:**
- Push Notifications toggle should be ON (blue)
- Push Notification Mode should show "Local test mode"
- Permission Status should show "Permission granted ✓"

### Step 7: Manual Test

**In Browser Console:**
```javascript
// Test if notifications work at all
if (Notification.permission === 'granted') {
  new Notification('Test', { body: 'Manual test notification' });
} else {
  console.log('Permission:', Notification.permission);
}
```

**If this shows a notification:**
- Notifications are working
- The issue is in the service call

**If this doesn't show a notification:**
- Permission issue
- Go to Profile → Developer Settings → Grant Permission

### Step 8: Check Service Worker

**In Browser Console:**
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker Ready:', reg);
  return reg.showNotification('SW Test', { body: 'Testing service worker' });
});
```

**If this shows a notification:**
- Service worker is working
- The issue is in the service call

**If this fails:**
- Service worker not registered
- Check: `[Service Worker] Registered successfully` log on page load

## Common Issues and Fixes

### Issue 1: No Logs at All

**Symptoms:**
- No "SERVICE SEND MESSAGE" log
- No "CALLING PUSH NOTIFICATIONS" log

**Cause:**
- Message isn't being sent through the service
- Using mock mode instead of database mode

**Fix:**
1. Check data source: Profile → Developer Settings
2. Should be "Using database (cloud)"
3. If it says "Using local mock data", switch to Database

### Issue 2: "Chat not found" Error

**Symptoms:**
- See "Chat not found" in console
- No push notification call

**Cause:**
- Chat doesn't exist in the service's cache
- Using wrong chat ID

**Fix:**
1. Refresh the page
2. Navigate to the chat again
3. Try sending a message

### Issue 3: Push Notifications Disabled

**Symptoms:**
- See "CALLING PUSH NOTIFICATIONS"
- See "Push notifications disabled"

**Cause:**
- Config has `enabled: false`

**Fix:**
1. Go to Profile → Developer Settings
2. Toggle "Push Notifications" to ON
3. Refresh page
4. Try again

### Issue 4: Permission Denied

**Symptoms:**
- See "Notification permission: denied"

**Cause:**
- Browser blocked notifications

**Fix:**
1. Click the lock icon in address bar
2. Find "Notifications" setting
3. Change to "Allow"
4. Refresh page
5. Try again

## Quick Diagnostic Script

**Run this in browser console:**

```javascript
console.log('=== PUSH NOTIFICATION DIAGNOSTIC ===');
console.log('1. Config:', localStorage.getItem('pushNotificationConfig'));
console.log('2. Permission:', Notification.permission);
console.log('3. Service Worker:', 'serviceWorker' in navigator ? 'Supported' : 'Not supported');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    console.log('4. SW Ready:', !!reg);
  }).catch(err => {
    console.log('4. SW Error:', err);
  });
}

// Test notification
if (Notification.permission === 'granted') {
  new Notification('Diagnostic Test', { 
    body: 'If you see this, notifications work!' 
  });
  console.log('5. Test notification sent');
} else {
  console.log('5. Cannot test - permission not granted');
}
```

## What to Share for Help

If it's still not working, share these logs:

1. **Config check:**
   ```javascript
   localStorage.getItem('pushNotificationConfig')
   ```

2. **Permission check:**
   ```javascript
   Notification.permission
   ```

3. **Console logs when sending a message** (copy all logs)

4. **Network tab** - any errors?

5. **Data source** - Mock or Database?

## Expected Working Flow

When everything works, you should see:

```
=== SERVICE SEND MESSAGE ===
=== CALLING PUSH NOTIFICATIONS ===
[Push Notifications] notifyParticipants called
[Push Notifications] Using local test mode
[Local Test Mode] sendLocalTestNotification called
[Local Test Mode] Notification permission: granted
[Local Test Mode] Using service worker for notification
[Local Test Mode] Service worker notification shown successfully
=== PUSH NOTIFICATIONS COMPLETED ===
```

And a notification should appear in your OS notification center.
