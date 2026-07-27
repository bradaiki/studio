# Push Notification Navigation - Quick Reference

## ✅ Feature: Click notification → Navigate to chat

## How to Test (30 seconds)

1. Open app in two browser windows
2. Send a chat message from Window 1
3. Click notification in Window 2
4. **Result**: Window 2 navigates to the chat ✅

## What Was Implemented

### Service Worker (`src/firebase-messaging-sw.js`)
- Handles notification clicks
- Extracts chatId from notification data
- Sends navigation message to app
- Opens/focuses app window

### App Component (`src/app/app.component.ts`)
- Listens for service worker messages
- Receives navigation requests
- Uses Angular Router to navigate
- Works for all notification types

### Push Service (`src/app/services/push-notification.service.ts`)
- Handles native app notifications (iOS/Android)
- Navigates on notification tap
- Includes click handlers for web notifications

### Lambda Function (`amplify/functions/send-push-notification/handler.ts`)
- Includes chatId in notification data
- Includes route path for navigation
- Sends to all platforms (Web, iOS, Android)

## Notification Data Structure

Every notification includes:
```json
{
  "title": "Sender Name",
  "body": "Message text...",
  "data": {
    "chatId": "chat-uuid-here",
    "route": "/tabs/chat/chat-uuid-here"
  }
}
```

## Platform Support

| Platform | Click Handler | Status |
|----------|--------------|--------|
| Web | Service Worker | ✅ |
| iOS | Capacitor Plugin | ✅ |
| Android | Capacitor Plugin | ✅ |

## Console Logs

### Successful Navigation (Web)
```
Notification clicked: {...}
Opening URL: /tabs/chat/...
Received message from service worker: {...}
Navigating to: /tabs/chat/...
```

### Successful Navigation (Native)
```
Push notification action performed: {...}
Notification tapped: {...}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Notification doesn't appear | Check Firebase credentials |
| Notification appears but no navigation | Check browser console for errors |
| Wrong chat opens | Verify chatId in notification data |
| Works on web but not native | Check Capacitor plugin installed |

## Quick Debug

```javascript
// In browser console:
// Test navigation manually
navigator.serviceWorker.controller.postMessage({
  type: 'NAVIGATE_TO_CHAT',
  chatId: 'test-id',
  route: '/tabs/chat/test-id'
});
```

## Files Modified

1. `src/firebase-messaging-sw.js` - Click handler
2. `src/app/app.component.ts` - Message listener
3. `src/app/services/push-notification.service.ts` - Web notification clicks
4. Already had: Lambda function with navigation data

## Configuration

No configuration needed! It works automatically when:
- ✅ Push notifications are enabled
- ✅ Firebase credentials are configured
- ✅ Lambda function is deployed

## Summary

When a user receives a push notification about a chat message and clicks it, the app automatically opens and navigates to that specific chat. This works on web, iOS, and Android, whether the app is open, in the background, or closed.

**Test it now**: Send a chat message and click the notification!
