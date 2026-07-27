# Push Notifications Setup Guide

This guide will help you set up push notifications for your Ionic app across web, iOS, and Android platforms.

## Overview

The push notification system consists of:
1. **Frontend Service** (`push-notification.service.ts`) - Handles device registration and notification display
2. **Integration Service** (`chat-push-integration.service.ts`) - Connects chat messages to push notifications
3. **Backend Lambda** (`send-push-notification`) - Sends notifications via FCM/APNs/Web Push
4. **Database Model** (`PushToken`) - Stores device tokens

## Prerequisites

### 1. Install Required Packages

```bash
# Capacitor Push Notifications
npm install @capacitor/push-notifications

# Optional: Local Notifications for foreground alerts
npm install @capacitor/local-notifications

# Sync Capacitor
npx cap sync
```

### 2. Firebase Cloud Messaging (FCM) Setup for Android

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add an Android app:
   - Package name: `com.yourapp.id` (from `capacitor.config.ts`)
   - Download `google-services.json`
   - Place in `android/app/google-services.json`
4. Get Server Key:
   - Go to Project Settings > Cloud Messaging
   - Copy the Server Key (Legacy)
   - Save for Lambda environment variables

### 3. Apple Push Notification Service (APNs) Setup for iOS

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with Push Notifications enabled
3. Create an APNs Key:
   - Certificates, Identifiers & Profiles > Keys
   - Create new key with APNs enabled
   - Download the `.p8` key file
   - Note the Key ID and Team ID
4. Configure Xcode:
   - Open `ios/App/App.xcworkspace`
   - Enable Push Notifications capability
   - Add Background Modes > Remote notifications

### 4. Web Push Setup (PWA)

1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Save the public and private keys for later use

## Backend Configuration

### 1. Add PushToken Model to Schema

Edit `amplify/data/resource.ts` and add:

```typescript
PushToken: a
  .model({
    userId: a.string().required(),
    token: a.string().required(),
    platform: a.enum(['ios', 'android', 'web']),
    deviceId: a.string(),
    endpoint: a.string(), // For web push
    isActive: a.boolean().default(true),
  })
  .authorization((allow: any) => [
    allow.authenticated().to(['read', 'create', 'update', 'delete']),
  ]),
```

### 2. Configure Lambda Environment Variables

Edit `amplify/functions/send-push-notification/resource.ts`:

```typescript
environment: {
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY || '',
  APNS_KEY_ID: process.env.APNS_KEY_ID || '',
  APNS_TEAM_ID: process.env.APNS_TEAM_ID || '',
  APNS_KEY: process.env.APNS_KEY || '', // Base64 encoded .p8 file
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
}
```

### 3. Set Environment Variables

Create `.env` file in your project root:

```bash
FCM_SERVER_KEY=your_fcm_server_key
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_KEY=base64_encoded_p8_file
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 4. Deploy Backend

```bash
npx ampx sandbox
# or for production
npx ampx pipeline-deploy --branch main
```

## Frontend Integration

### 1. Initialize Push Notifications in App Component

Edit `src/app/app.component.ts`:

```typescript
import { PushNotificationService } from './services/push-notification.service';

export class AppComponent implements OnInit {
  constructor(
    private pushNotificationService: PushNotificationService,
    // ... other services
  ) {}

  async ngOnInit() {
    // Initialize push notifications after user logs in
    await this.pushNotificationService.initialize();
  }
}
```

### 2. Integrate with Chat Service

Edit `src/app/services/chat.service.ts` to send push notifications when messages are sent.

Add to the `sendMessage` method (after successful message send):

```typescript
import { ChatPushIntegrationService } from './chat-push-integration.service';

constructor(
  // ... existing services
  private chatPushIntegration: ChatPushIntegrationService
) {}

async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
  // ... existing code ...
  
  const newMessage = await this.persistenceService.sendMessage(request);
  
  // Send push notifications to participants
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
  
  // ... rest of existing code ...
}
```

## Platform-Specific Configuration

### Android Configuration

1. Edit `android/app/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}

// Add at the bottom
apply plugin: 'com.google.gms.google-services'
```

2. Edit `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        // ... existing dependencies
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

3. Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <application>
        <!-- Add this for push notifications -->
        <service
            android:name=".MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### iOS Configuration

1. Edit `ios/App/App/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

2. Open Xcode and enable:
   - Signing & Capabilities > Push Notifications
   - Signing & Capabilities > Background Modes > Remote notifications

### Web Configuration (PWA)

1. Create `src/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

2. Register service worker in `src/index.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }
</script>
```

## Testing

### 1. Test on Android

```bash
npx cap run android
```

- Send a chat message
- Check device receives notification
- Tap notification to open chat

### 2. Test on iOS

```bash
npx cap run ios
```

- Ensure device is registered with APNs
- Send a chat message
- Check device receives notification

### 3. Test on Web

```bash
ionic serve
```

- Grant notification permission
- Send a chat message
- Check browser notification appears

## Troubleshooting

### Android Issues

1. **No notifications received**
   - Check `google-services.json` is in correct location
   - Verify FCM Server Key is correct
   - Check Android logs: `adb logcat`

2. **Permission denied**
   - Ensure app has notification permission
   - Check AndroidManifest.xml has correct permissions

### iOS Issues

1. **No notifications received**
   - Verify APNs certificate is valid
   - Check device is not in Do Not Disturb mode
   - Test with production APNs environment

2. **Registration failed**
   - Ensure Push Notifications capability is enabled
   - Check provisioning profile includes push notifications

### Web Issues

1. **Service worker not registered**
   - Check browser console for errors
   - Ensure HTTPS is used (required for service workers)

2. **Permission denied**
   - User must grant notification permission
   - Check browser notification settings

## Best Practices

1. **Handle Permission Gracefully**
   - Request permission at appropriate time
   - Explain why notifications are useful
   - Provide settings to disable

2. **Optimize Notification Content**
   - Keep messages concise
   - Include relevant context
   - Use appropriate icons and images

3. **Respect User Preferences**
   - Allow users to mute specific chats
   - Provide notification settings
   - Honor Do Not Disturb mode

4. **Monitor and Debug**
   - Log notification delivery
   - Track token registration
   - Monitor Lambda execution

5. **Security**
   - Never expose FCM/APNs keys in client code
   - Validate all requests in Lambda
   - Use proper IAM permissions

## Next Steps

1. Add notification preferences UI
2. Implement notification grouping
3. Add rich notifications with images
4. Implement notification actions (reply, mark as read)
5. Add analytics for notification engagement
