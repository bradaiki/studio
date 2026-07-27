# In-App Chat Notifications - Complete Implementation

## Overview

The chat system now uses **in-app notifications** (Ionic Toast) that work across **all devices and computers**. This provides a consistent experience across web, iOS, and Android platforms.

## How It Works

### 1. **In-App Notification Service** (`in-app-notification.service.ts`)
- Shows toast notifications at the top of the screen
- Stores notification history (last 50 notifications)
- Tracks unread count
- Provides "View" button to navigate directly to the chat
- Persists notifications in localStorage
- Auto-cleans notifications older than 7 days

### 2. **Chat Push Integration** (`chat-push-integration.service.ts`)
- **GraphQL Subscription**: Listens for new messages in real-time across ALL devices
- **BroadcastChannel**: Notifies other windows/tabs on the same device
- Prevents sender from seeing their own notification
- Works in both local test mode and full mode (with Lambda)

### 3. **Cross-Device Communication**
- Uses **AWS Amplify GraphQL subscriptions** for real-time updates
- When a message is sent from Device A, Device B receives it instantly via subscription
- Works across different computers, phones, tablets, etc.
- No polling required - true real-time push

### 4. **Cross-Window Communication** (Same Device)
- Uses BroadcastChannel API for same-device, different-window notifications
- When you send a message in Window 1, Window 2 receives a notification
- Works seamlessly across multiple tabs/windows on the same computer

## Features

✅ **In-app toast notifications** - Visible within the application UI
✅ **Cross-device** - Works across different computers, phones, tablets
✅ **Cross-platform** - Works on web, iOS, and Android
✅ **Cross-window** - Notifications appear in all open windows/tabs on same device
✅ **Real-time** - Uses GraphQL subscriptions for instant delivery
✅ **Navigation** - Click "View" to go directly to the chat
✅ **Notification history** - View past notifications
✅ **Unread count** - Track unread notifications
✅ **Auto-cleanup** - Removes notifications older than 7 days
✅ **Sender filtering** - You don't see notifications for your own messages
✅ **Persistent** - Notifications saved in localStorage
✅ **No polling** - True push notifications via WebSocket

## Testing Instructions

### Cross-Device Testing (Different Computers/Phones)

1. **Device 1 (Computer):**
   ```bash
   npm start
   ```
   - Log in as User A
   - Navigate to a chat

2. **Device 2 (Phone or Different Computer):**
   - Open browser and go to your app URL
   - Log in as User B
   - Navigate to the same chat

3. **Send a Message:**
   - In Device 1, send a message
   - Device 2 should show a toast notification at the top **instantly**
   - Click "View" to navigate to the chat

4. **Verify Real-Time:**
   - The notification should appear within 1-2 seconds
   - No page refresh needed
   - Works even if Device 2 is on a different network

### Web Testing (Multiple Windows - Same Computer)

1. **Open Window 1:**
   ```bash
   npm start
   ```
   - Log in as User A
   - Navigate to a chat

2. **Open Window 2:**
   - Open a new browser window (not tab)
   - Go to `http://localhost:8100`
   - Log in as User B (or same user)
   - Navigate to the same chat

3. **Send a Message:**
   - In Window 1, send a message
   - Window 2 should show a toast notification at the top
   - Click "View" to navigate to the chat

### Mobile Testing (iOS/Android)

1. **Build for iOS:**
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **Build for Android:**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

3. **Test on Device:**
   - Install app on two devices
   - Log in with different users
   - Send messages and verify notifications appear

## Configuration

### Enable/Disable Notifications

In Profile → Developer Settings:

- **Push Notifications Toggle**: Enable/disable all notifications
- **Local Test Mode**: Use in-app notifications only (no Firebase/Lambda)
- **Full Mode**: Use in-app notifications + Lambda for mobile push

### Settings Persistence

Settings are stored in localStorage:
- `push_notification_enabled`: true/false
- `push_notification_local_test_mode`: true/false

## API Reference

### InAppNotificationService

```typescript
// Show a notification
await inAppNotificationService.showNotification(
  'John Doe',           // title (sender name)
  'Hello!',             // message
  'chat-123',           // chatId (optional)
  '/tabs/chat/chat-123' // route (optional)
);

// Get notifications observable
inAppNotificationService.getNotifications().subscribe(notifications => {
  console.log('Notifications:', notifications);
});

// Get unread count
inAppNotificationService.getUnreadCount().subscribe(count => {
  console.log('Unread:', count);
});

// Mark as read
inAppNotificationService.markAsRead('notification-id');

// Mark all as read
inAppNotificationService.markAllAsRead();

// Clear all
inAppNotificationService.clearAll();

// Cleanup old notifications
inAppNotificationService.cleanupOldNotifications();
```

### ChatPushIntegrationService

```typescript
// Send notification to all participants
await chatPushIntegrationService.notifyParticipants(
  'chat-123',           // chatId
  'user-456',           // senderId
  'John Doe',           // senderName
  'Hello everyone!',    // message
  ['user-789', 'user-012'] // participantIds
);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Service                             │
│  (sends message, calls notifyParticipants)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            ChatPushIntegrationService                        │
│  - Checks if notifications enabled                          │
│  - Broadcasts to other windows via BroadcastChannel         │
│  - Calls InAppNotificationService                           │
│  - (Optional) Invokes Lambda for mobile push                │
│  - Listens to GraphQL subscriptions for cross-device        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            InAppNotificationService                          │
│  - Shows Ionic Toast notification                           │
│  - Stores notification in history                           │
│  - Updates unread count                                     │
│  - Handles navigation on click                              │
└─────────────────────────────────────────────────────────────┘
```

## Real-Time Flow (Cross-Device)

```
Device A (Sender)                    AWS AppSync                    Device B (Receiver)
─────────────────                    ──────────                     ───────────────────
1. User sends message
2. ChatService.sendMessage()
3. GraphQL mutation ──────────────►  4. Store in DynamoDB
                                     5. Trigger subscription ──────►  6. GraphQL subscription
                                                                      7. ChatPushIntegration
                                                                      8. Check if not sender
                                                                      9. Show toast notification
                                                                     10. User clicks "View"
                                                                     11. Navigate to chat
```

## BroadcastChannel Flow (Same Device)

```
Window 1 (Sender)                    Window 2 (Receiver)
─────────────────                    ───────────────────
1. User sends message
2. ChatService calls 
   notifyParticipants()
3. BroadcastChannel.postMessage()  ──────────►  4. BroadcastChannel.onmessage
                                                5. Check if not sender
                                                6. Show toast notification
                                                7. User clicks "View"
                                                8. Navigate to chat
```

## Mobile Push Notifications (Full Mode)

When **Full Mode** is enabled:

1. **Web users** receive in-app toast notifications
2. **Mobile users** receive:
   - Native push notifications (via Firebase/APNs)
   - In-app toast notifications (when app is open)

### Lambda Function

The Lambda function (`send-push-notification`) handles:
- Querying push tokens from DynamoDB
- Sending push notifications via Firebase Cloud Messaging
- Filtering out the sender's devices

## Troubleshooting

### Notifications Not Appearing

1. **Check if enabled:**
   - Go to Profile → Developer Settings
   - Verify "Push Notifications" is ON

2. **Check console logs:**
   ```
   [Push Notifications] notifyParticipants called
   [Local In-App] Sending notification
   [InAppNotification] Showing notification
   [InAppNotification] Toast presented successfully
   ```

3. **Check BroadcastChannel:**
   - Open console in both windows
   - Should see "Broadcast message sent" in Window 1
   - Should see "Received broadcast" in Window 2

### Notifications Not Appearing in Other Windows

1. **Verify BroadcastChannel support:**
   - Check browser compatibility
   - BroadcastChannel works in Chrome, Firefox, Edge, Safari 15.4+

2. **Check if same origin:**
   - Both windows must be on same domain/port
   - `localhost:8100` ≠ `127.0.0.1:8100`

### Sender Seeing Own Notifications

1. **Check user ID:**
   - Verify `currentUserId` is set correctly
   - Check console: `[Push Notifications] Current user ID: ...`

2. **Check sender ID:**
   - Verify `senderId` is passed correctly to `notifyParticipants()`

## Future Enhancements

- [ ] Add notification sound
- [ ] Add vibration on mobile
- [ ] Add notification badge on tab bar
- [ ] Add notification center UI
- [ ] Add notification preferences per chat
- [ ] Add "Do Not Disturb" mode
- [ ] Add notification grouping by chat
- [ ] Add rich notifications with images

## Files Modified

- ✅ `src/app/services/in-app-notification.service.ts` - NEW
- ✅ `src/app/services/chat-push-integration.service.ts` - UPDATED
- ✅ `src/app/app.component.ts` - UPDATED
- ✅ `src/global.scss` - UPDATED (added toast styles)

## Files No Longer Needed

- ❌ `src/firebase-messaging-sw.js` - Not used for in-app notifications
- ❌ Service worker registration - Removed from app.component.ts

## Summary

The in-app notification system provides a clean, consistent experience across all platforms. Users see toast notifications at the top of the screen with a "View" button to navigate directly to the chat. The system works seamlessly across multiple browser windows and integrates with the existing Lambda function for mobile push notifications.
