# Push Notifications for Chat System

## Overview

This implementation provides cross-platform push notifications for your chat system using Ionic Capacitor and AWS Amplify. When a user sends a message in a chat, all other participants receive a push notification on their device (iOS, Android, or web).

## Architecture

```
┌─────────────────┐
│  User Sends     │
│  Chat Message   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  ChatService.sendMessage()      │
│  - Saves message to database    │
│  - Calls push integration       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  ChatPushIntegrationService     │
│  - Gets chat participants       │
│  - Calls Lambda function        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AWS Lambda Function            │
│  - Queries push tokens          │
│  - Sends to FCM (Android)       │
│  - Sends to APNs (iOS)          │
│  - Sends to Web Push (PWA)      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  User Devices                   │
│  - Receive notification         │
│  - Tap to open chat             │
└─────────────────────────────────┘
```

## Files Created

### Frontend Services
- `src/app/services/push-notification.service.ts` - Main push notification service
- `src/app/services/chat-push-integration.service.ts` - Integration with chat system
- `src/app/services/chat.service.push-integration.example.ts` - Integration examples

### Backend Functions
- `amplify/functions/send-push-notification/handler.ts` - Lambda function
- `amplify/functions/send-push-notification/resource.ts` - Lambda configuration
- `amplify/functions/send-push-notification/package.json` - Lambda dependencies

### Database Schema
- `amplify/data/push-token-schema.ts` - PushToken model definition

### Documentation
- `PUSH_NOTIFICATIONS_SETUP.md` - Detailed setup guide
- `PUSH_NOTIFICATIONS_README.md` - This file
- `.env.example` - Environment variable template

### Scripts
- `scripts/setup-push-notifications.sh` - Automated setup script

## Quick Start

### 1. Run Setup Script

```bash
./scripts/setup-push-notifications.sh
```

This will install required packages and sync Capacitor.

### 2. Configure Push Services

#### Android (FCM)
1. Create Firebase project at https://console.firebase.google.com/
2. Add Android app with your package name
3. Download `google-services.json` to `android/app/`
4. Get Server Key from Project Settings > Cloud Messaging

#### iOS (APNs)
1. Create APNs Key at https://developer.apple.com/
2. Download `.p8` key file
3. Note Key ID and Team ID
4. Enable Push Notifications in Xcode

#### Web (VAPID)
```bash
npx web-push generate-vapid-keys
```

### 3. Set Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
# Edit .env with your actual keys
```

### 4. Update Database Schema

Add the PushToken model to `amplify/data/resource.ts`:

```typescript
PushToken: a
  .model({
    userId: a.string().required(),
    token: a.string().required(),
    platform: a.enum(['ios', 'android', 'web']),
    deviceId: a.string(),
    endpoint: a.string(),
    isActive: a.boolean().default(true),
  })
  .authorization((allow: any) => [
    allow.authenticated().to(['read', 'create', 'update', 'delete']),
  ]),
```

### 5. Deploy Backend

```bash
npx ampx sandbox
```

### 6. Integrate with Chat Service

Add to `src/app/services/chat.service.ts`:

```typescript
import { ChatPushIntegrationService } from './chat-push-integration.service';

constructor(
  // ... existing services
  private chatPushIntegration: ChatPushIntegrationService
) {}

async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
  // ... existing code to send message ...
  
  const newMessage = await this.persistenceService.sendMessage(request);
  
  // Send push notifications
  const chat = this.getChatById(request.chatId);
  if (chat) {
    await this.chatPushIntegration.notifyParticipants(
      chat.id,
      this.currentUserId!,
      this.currentUserName!,
      request.message,
      chat.participantIds
    );
  }
  
  // ... rest of code ...
}
```

### 7. Initialize in App Component

Add to `src/app/app.component.ts`:

```typescript
import { PushNotificationService } from './services/push-notification.service';

constructor(
  private pushNotificationService: PushNotificationService,
  private authStateService: AuthStateService
) {}

async ngOnInit() {
  this.authStateService.currentUser$.subscribe(async (user) => {
    if (user) {
      await this.pushNotificationService.initialize();
    }
  });
}
```

## Features

### ✅ Cross-Platform Support
- iOS (via APNs)
- Android (via FCM)
- Web/PWA (via Web Push API)

### ✅ Automatic Token Management
- Registers device on login
- Stores tokens in database
- Removes tokens on logout
- Handles token refresh

### ✅ Smart Notification Handling
- Foreground notifications (app open)
- Background notifications (app closed)
- Notification tap handling
- Deep linking to specific chats

### ✅ User Experience
- Shows sender name and message preview
- Navigates to chat on tap
- Respects notification permissions
- Handles permission requests gracefully

## Testing

### Test on Android
```bash
npx cap run android
```

1. Login to the app
2. Grant notification permission
3. Send a message from another device
4. Verify notification appears
5. Tap notification to open chat

### Test on iOS
```bash
npx cap run ios
```

1. Login to the app
2. Grant notification permission
3. Send a message from another device
4. Verify notification appears
5. Tap notification to open chat

### Test on Web
```bash
ionic serve
```

1. Login to the app
2. Grant notification permission in browser
3. Send a message from another device
4. Verify browser notification appears
5. Click notification to open chat

## Customization

### Notification Content

Edit `amplify/functions/send-push-notification/handler.ts`:

```typescript
const fcmPayload = {
  notification: {
    title: notification.title, // Customize title
    body: notification.body,   // Customize body
    sound: 'default',          // Custom sound
    badge: '1',                // Badge count
    icon: 'custom_icon'        // Custom icon
  },
  data: {
    chatId: notification.chatId,
    // Add custom data
  }
};
```

### Notification Actions

Add action buttons to notifications:

```typescript
const fcmPayload = {
  notification: {
    // ... existing fields
    click_action: 'OPEN_CHAT'
  },
  data: {
    actions: JSON.stringify([
      { action: 'reply', title: 'Reply' },
      { action: 'mark_read', title: 'Mark as Read' }
    ])
  }
};
```

### Notification Preferences

Add user preferences for notification settings:

```typescript
// In your settings page
async updateNotificationPreferences(chatId: string, enabled: boolean) {
  await this.chatService.updateChatPreferences({
    userId: this.currentUserId,
    chatId: chatId,
    isMuted: !enabled
  });
}
```

## Troubleshooting

### No notifications received

1. **Check permissions**: Ensure notification permission is granted
2. **Verify tokens**: Check device token is saved to database
3. **Check Lambda logs**: View CloudWatch logs for errors
4. **Test credentials**: Verify FCM/APNs keys are correct

### Notifications not opening chat

1. **Check deep linking**: Verify route is correct in notification data
2. **Check navigation**: Ensure router is configured properly
3. **Test manually**: Try navigating to chat URL directly

### iOS notifications not working

1. **Check certificate**: Verify APNs certificate is valid
2. **Check bundle ID**: Ensure it matches your app
3. **Check environment**: Use correct APNs environment (dev/prod)
4. **Check device**: Test on physical device, not simulator

### Android notifications not working

1. **Check google-services.json**: Verify file is in correct location
2. **Check FCM key**: Ensure Server Key is correct
3. **Check package name**: Verify it matches Firebase project
4. **Check logs**: Use `adb logcat` to view errors

## Performance Considerations

### Batch Notifications
For large chats, consider batching notifications:

```typescript
// Send in batches of 1000
const batchSize = 1000;
for (let i = 0; i < tokens.length; i += batchSize) {
  const batch = tokens.slice(i, i + batchSize);
  await sendBatch(batch);
}
```

### Rate Limiting
Implement rate limiting to prevent spam:

```typescript
// Limit to 1 notification per chat per minute
const lastNotification = await getLastNotificationTime(chatId);
if (Date.now() - lastNotification < 60000) {
  console.log('Rate limit exceeded, skipping notification');
  return;
}
```

### Token Cleanup
Regularly clean up invalid tokens:

```typescript
// Remove tokens that fail delivery
if (result.failure > 0) {
  await removeInvalidTokens(result.failedTokens);
}
```

## Security

### Token Storage
- Tokens are stored securely in database
- Only accessible by authenticated users
- Encrypted in transit and at rest

### Lambda Security
- Uses IAM roles for AWS service access
- Environment variables for sensitive keys
- Input validation on all requests

### Client Security
- Tokens never exposed in client code
- All push requests go through backend
- User authentication required

## Cost Estimation

### AWS Lambda
- Free tier: 1M requests/month
- After: $0.20 per 1M requests
- Typical cost: < $1/month for small apps

### Firebase Cloud Messaging
- Free for unlimited notifications
- No cost for FCM usage

### Apple Push Notification Service
- Free for unlimited notifications
- $99/year for Apple Developer Program

## Next Steps

1. **Add notification preferences UI**
   - Allow users to mute specific chats
   - Configure notification sounds
   - Set quiet hours

2. **Implement rich notifications**
   - Add images to notifications
   - Show sender avatar
   - Include message attachments

3. **Add notification actions**
   - Quick reply from notification
   - Mark as read action
   - Delete message action

4. **Implement notification grouping**
   - Group by chat
   - Show message count
   - Expandable notifications

5. **Add analytics**
   - Track notification delivery
   - Monitor open rates
   - Measure engagement

## Support

For detailed setup instructions, see `PUSH_NOTIFICATIONS_SETUP.md`

For integration examples, see `src/app/services/chat.service.push-integration.example.ts`

For issues or questions, check the troubleshooting section above.
