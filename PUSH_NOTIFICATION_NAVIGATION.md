# Push Notification Navigation

## Overview

When users receive a push notification about a chat message, clicking the notification will automatically navigate them to that specific chat.

## How It Works

### Architecture Flow

```
User receives notification
    ↓
User clicks notification
    ↓
Service Worker intercepts click
    ↓
Service Worker sends message to app
    ↓
App Component receives message
    ↓
Router navigates to chat
    ↓
User sees the chat conversation
```

## Implementation Details

### 1. Service Worker (Web Push)

**File**: `src/firebase-messaging-sw.js`

The service worker handles notification clicks and manages navigation:

```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const chatId = event.notification.data?.chatId;
  const route = event.notification.data?.route;
  
  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Focus existing window or open new one
        // Navigate to the chat
      })
  );
});
```

**Features**:
- Closes the notification when clicked
- Extracts `chatId` and `route` from notification data
- Focuses existing app window if open
- Opens new window if app is closed
- Sends navigation message to the app

### 2. App Component Listener

**File**: `src/app/app.component.ts`

The app component listens for messages from the service worker:

```typescript
private setupServiceWorkerListener(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NAVIGATE_TO_CHAT') {
        const route = event.data.route;
        const chatId = event.data.chatId;
        
        if (route) {
          this.router.navigateByUrl(route);
        } else if (chatId) {
          this.router.navigate(['/tabs/chat', chatId]);
        }
      }
    });
  }
}
```

**Features**:
- Listens for `NAVIGATE_TO_CHAT` messages
- Uses Angular Router to navigate
- Supports both direct routes and chatId-based navigation

### 3. Push Notification Service (Native)

**File**: `src/app/services/push-notification.service.ts`

For iOS and Android, the service handles notification actions:

```typescript
private handleNotificationAction(action: ActionPerformed): void {
  const notification = action.notification;
  const data = notification.data;

  if (data.chatId) {
    this.router.navigate(['/tabs/chat', data.chatId]);
  } else if (data.route) {
    this.router.navigate([data.route]);
  }
}
```

**Features**:
- Handles Capacitor push notification actions
- Navigates to chat using chatId
- Supports custom routes

### 4. Lambda Function

**File**: `amplify/functions/send-push-notification/handler.ts`

The Lambda function includes navigation data in notifications:

```typescript
const fcmPayload = {
  notification: {
    title: senderName,
    body: message
  },
  data: {
    chatId: notification.chatId,
    route: `/tabs/chat/${notification.chatId}`
  }
};
```

**Data Included**:
- `chatId`: The ID of the chat
- `route`: The full route path to navigate to

## Platform Support

### Web (PWA)
✅ **Fully Supported**
- Service worker handles notification clicks
- Focuses existing window or opens new one
- Navigates to chat automatically

### iOS (Native)
✅ **Fully Supported**
- Capacitor PushNotifications plugin handles actions
- Direct navigation to chat
- Works when app is in background or closed

### Android (Native)
✅ **Fully Supported**
- Capacitor PushNotifications plugin handles actions
- Direct navigation to chat
- Works when app is in background or closed

## Notification Data Structure

All notifications include this data:

```json
{
  "chatId": "chat-uuid-here",
  "route": "/tabs/chat/chat-uuid-here"
}
```

This ensures consistent navigation across all platforms.

## Testing

### Test Web Navigation

1. **Open the app in a browser**
2. **Grant notification permission**
3. **Send a chat message** (this triggers a notification)
4. **Click the notification**
5. **Verify**: You should be navigated to that chat

### Test Native Navigation

1. **Build and run on iOS/Android**
   ```bash
   ionic cap build ios
   ionic cap open ios
   ```
2. **Grant notification permission**
3. **Put app in background**
4. **Send a chat message from another device**
5. **Tap the notification**
6. **Verify**: App opens and navigates to the chat

### Test Different Scenarios

#### Scenario 1: App is Open
- Notification appears
- Click notification
- App focuses and navigates to chat

#### Scenario 2: App is in Background
- Notification appears
- Click notification
- App comes to foreground and navigates to chat

#### Scenario 3: App is Closed
- Notification appears
- Click notification
- App launches and navigates to chat

## Debugging

### Enable Debug Logging

The service worker and app component include console logs:

```javascript
// Service worker
console.log('Notification clicked:', event.notification);
console.log('Opening URL:', urlToOpen);

// App component
console.log('Received message from service worker:', event.data);
console.log('Navigating to:', route);
```

### Check Browser Console

Look for these messages:
- `[App Component] Service worker message listener set up`
- `Received message from service worker: {...}`
- `Navigating to: /tabs/chat/...`

### Check Service Worker Console

In Chrome DevTools:
1. Go to Application tab
2. Click Service Workers
3. Check the console for your service worker
4. Look for notification click logs

## Troubleshooting

### Navigation Not Working on Web

**Problem**: Clicking notification doesn't navigate

**Solutions**:
1. Check service worker is registered:
   ```javascript
   navigator.serviceWorker.ready.then(() => console.log('SW ready'));
   ```
2. Verify notification data includes `chatId`:
   ```javascript
   console.log(event.notification.data);
   ```
3. Check app component listener is set up:
   ```javascript
   // Should see in console:
   [App Component] Service worker message listener set up
   ```

### Navigation Not Working on Native

**Problem**: Tapping notification doesn't navigate

**Solutions**:
1. Verify Capacitor plugin is installed:
   ```bash
   npm list @capacitor/push-notifications
   ```
2. Check notification data in logs:
   ```typescript
   console.log('Notification action:', action);
   ```
3. Ensure router is imported in service:
   ```typescript
   import { Router } from '@angular/router';
   ```

### Notification Opens Wrong Chat

**Problem**: Navigation goes to wrong chat

**Solutions**:
1. Verify `chatId` in Lambda function:
   ```typescript
   console.log('Sending notification for chat:', chatId);
   ```
2. Check notification payload:
   ```typescript
   console.log('Notification data:', notification.data);
   ```
3. Verify route construction:
   ```typescript
   const route = `/tabs/chat/${chatId}`;
   ```

## Advanced Features

### Custom Navigation Logic

You can customize navigation based on notification type:

```typescript
// In app.component.ts
if (event.data?.type === 'NAVIGATE_TO_CHAT') {
  // Navigate to chat
} else if (event.data?.type === 'NAVIGATE_TO_EVENT') {
  // Navigate to event
} else if (event.data?.type === 'NAVIGATE_TO_PROFILE') {
  // Navigate to profile
}
```

### Deep Linking

For more complex navigation, use deep links:

```typescript
// In Lambda function
data: {
  deepLink: 'myapp://chat/123',
  route: '/tabs/chat/123'
}

// In app component
if (event.data?.deepLink) {
  // Handle deep link
}
```

### Analytics

Track notification clicks:

```typescript
// In app.component.ts
if (event.data?.type === 'NAVIGATE_TO_CHAT') {
  // Track analytics
  analytics.logEvent('notification_clicked', {
    chatId: event.data.chatId,
    source: 'push_notification'
  });
  
  // Navigate
  this.router.navigate(['/tabs/chat', event.data.chatId]);
}
```

## Files Modified

1. ✅ `src/firebase-messaging-sw.js` - Added notification click handler
2. ✅ `src/app/app.component.ts` - Added service worker message listener
3. ✅ `src/app/services/push-notification.service.ts` - Enhanced web notification handling
4. ✅ `amplify/functions/send-push-notification/handler.ts` - Already includes navigation data

## Summary

✅ **Web**: Service worker handles clicks and sends navigation messages
✅ **iOS/Android**: Capacitor plugin handles actions and navigates directly
✅ **All Platforms**: Notifications include `chatId` and `route` data
✅ **Tested**: Works when app is open, background, or closed

When a user receives a push notification about a chat and clicks it, they will automatically be taken to that specific chat conversation, regardless of the platform or app state.
