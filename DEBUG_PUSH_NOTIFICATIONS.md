# Debug Push Notifications

## Issue
Second window doesn't receive push notifications when a message is sent.

## Understanding Browser Notifications

**Important**: Browser notifications created with `new Notification()` only appear in the **same browser window** that creates them. They don't automatically appear in other windows or tabs.

To show notifications in **all windows**, you need to use:
1. **Service Worker** with `registration.showNotification()` - This shows system-level notifications
2. **Broadcast Channel API** - To communicate between windows
3. **SharedWorker** - To coordinate between tabs

## Current Implementation Issue

The current local test mode uses:
```typescript
const notification = new Notification(senderName, { ... });
```

This only shows in the **current window** (the one that sends the message), not in other windows.

## Solution Options

### Option 1: Use Service Worker (Recommended)

Service worker notifications appear system-wide, not just in one window.

**Steps**:
1. Register service worker
2. Use `registration.showNotification()` instead of `new Notification()`
3. Handle click events in service worker

### Option 2: Use Broadcast Channel

Send messages between windows so each window can show its own notification.

**Steps**:
1. Create BroadcastChannel
2. Send message when chat is sent
3. Each window listens and shows notification

### Option 3: Use Full Mode with Firebase

Firebase Cloud Messaging automatically handles multi-window notifications.

## Quick Test

### Test 1: Check if notification appears at all

In Window 1 (sender):
1. Open browser console
2. Send a chat message
3. Look for these logs:
   ```
   [Push Notifications] notifyParticipants called
   [Local Test Mode] sendLocalTestNotification called
   [Local Test Mode] Notification created successfully
   ```

### Test 2: Check permission in Window 2

In Window 2:
1. Open browser console
2. Type: `Notification.permission`
3. Should return: `"granted"`

### Test 3: Manual notification test

In Window 2 console:
```javascript
new Notification('Test', { body: 'This is a test' });
```

If this shows a notification, permissions are working.

## Why Second Window Doesn't See Notifications

**The Problem**: `new Notification()` is **window-scoped**, not **system-scoped**.

When you call `new Notification()` in Window 1, it only shows in Window 1's context. Window 2 has no idea it happened.

## Recommended Fix: Use Service Worker

Let me implement a proper solution using the service worker that's already set up.

### Implementation Plan

1. **In chat-push-integration.service.ts**:
   - Check if service worker is available
   - Use `navigator.serviceWorker.ready.then(reg => reg.showNotification())`
   - This will show system-level notifications

2. **Benefits**:
   - Notifications appear system-wide
   - Works across all windows/tabs
   - Persists even if all windows are closed
   - Proper notification center integration

## Current Debug Logs

When you send a message, check Window 1 console for:

```
[Push Notifications] notifyParticipants called: {
  chatId: "...",
  senderId: "...",
  senderName: "...",
  participantCount: 2,
  localTestMode: true,
  enabled: true
}
[Push Notifications] Using local test mode
[Local Test Mode] sendLocalTestNotification called: {...}
[Local Test Mode] Notification permission: granted
[Local Test Mode] Creating browser notification...
[Local Test Mode] Notification created successfully
[Local Test Mode] Browser notification shown successfully
```

If you see these logs, the notification IS being created, but only in Window 1.

## Next Steps

I'll implement a proper solution using the service worker to show notifications system-wide.
