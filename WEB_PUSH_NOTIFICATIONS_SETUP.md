# Web Push Notifications Setup Guide

## Overview

Web push notifications require Firebase Cloud Messaging (FCM) configuration. This guide will walk you through getting the required credentials.

---

## Step 1: Create/Access Firebase Project

### 1.1 Go to Firebase Console
Visit: https://console.firebase.google.com/

### 1.2 Create a New Project (or use existing)
1. Click **"Add project"** or select existing project
2. Enter project name (e.g., "Aiki Studio")
3. Enable/disable Google Analytics (optional)
4. Click **"Create project"**

---

## Step 2: Add Web App to Firebase Project

### 2.1 Register Web App
1. In Firebase Console, click the **⚙️ gear icon** → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. Enter app nickname (e.g., "Aiki Web App")
5. Check **"Also set up Firebase Hosting"** (optional)
6. Click **"Register app"**

### 2.2 Copy Firebase Configuration
You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Save these values!** You'll need them in the next steps.

---

## Step 3: Enable Cloud Messaging

### 3.1 Enable FCM API
1. In Firebase Console, go to **Project settings** → **Cloud Messaging** tab
2. Under **"Cloud Messaging API (Legacy)"**, note the **Server key**
3. Save this for your backend Lambda function

### 3.2 Generate VAPID Key (for Web Push)
1. Still in **Cloud Messaging** tab
2. Scroll to **"Web Push certificates"** section
3. Click **"Generate key pair"**
4. Copy the **Key pair** (starts with "B...")
5. Save this as your VAPID public key

---

## Step 4: Configure Your App

### 4.1 Install Firebase SDK

```bash
npm install firebase
```

### 4.2 Create Firebase Config File

Create `src/app/config/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const vapidKey = "YOUR_VAPID_PUBLIC_KEY";
```

**Replace the placeholder values with your actual Firebase config values from Step 2.2**

### 4.3 Update Push Notification Service

Update `src/app/services/push-notification.service.ts` to use Firebase for web:

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, vapidKey } from '../config/firebase.config';

// In the initializeWebPush method:
private async initializeWebPush(): Promise<void> {
  if (!('Notification' in window)) {
    console.log('Web notifications not supported');
    return;
  }

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Web notification permission granted');
      
      // Get FCM token
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      
      // Save token to your backend
      await this.saveDeviceToken(token);
      
      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        this.handleForegroundNotification(payload as any);
      });
      
      this.isInitialized = true;
    }
  } catch (error) {
    console.error('Failed to initialize web push:', error);
  }
}
```

### 4.4 Create Service Worker

Create `public/firebase-messaging-sw.js` in your project root:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/assets/icon/icon.png',
    badge: '/assets/icon/badge.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  // Open the app
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
```

**Replace the placeholder values with your actual Firebase config**

### 4.5 Register Service Worker

Update `src/index.html` to register the service worker:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- existing head content -->
</head>
<body>
  <app-root></app-root>
  
  <!-- Register Firebase Messaging Service Worker -->
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
</body>
</html>
```

---

## Step 5: Update Environment Variables

Add to your `.env` file:

```bash
# Firebase Configuration (for web push)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_VAPID_KEY=your_vapid_public_key

# FCM Server Key (for backend)
FCM_SERVER_KEY=your_fcm_server_key
```

---

## Step 6: Copy Service Worker to Build Output

### 6.1 Update angular.json

Add the service worker to assets in `angular.json`:

```json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/assets",
              "src/manifest.json",
              "src/firebase-messaging-sw.js"
            ]
          }
        }
      }
    }
  }
}
```

### 6.2 Move Service Worker

Move `firebase-messaging-sw.js` to `src/` directory so it gets copied during build.

---

## Step 7: Test Web Push Notifications

### 7.1 Build and Serve

```bash
npm run build
npx http-server www -p 8080
```

Or use Ionic serve:
```bash
ionic serve
```

### 7.2 Test in Browser

1. Open your app in Chrome/Firefox
2. Grant notification permission when prompted
3. Check browser console for FCM token
4. Send a test message from Firebase Console:
   - Go to **Cloud Messaging** → **Send test message**
   - Paste your FCM token
   - Send the message

---

## Quick Setup Script

I'll create a script to help you set this up:

```bash
#!/bin/bash
# Run this after getting your Firebase config

echo "Firebase Web Push Setup"
echo "======================="
echo ""
echo "Please enter your Firebase configuration values:"
echo ""

read -p "API Key: " API_KEY
read -p "Auth Domain: " AUTH_DOMAIN
read -p "Project ID: " PROJECT_ID
read -p "Storage Bucket: " STORAGE_BUCKET
read -p "Messaging Sender ID: " SENDER_ID
read -p "App ID: " APP_ID
read -p "VAPID Key: " VAPID_KEY

# Create firebase config file
cat > src/app/config/firebase.config.ts << EOF
export const firebaseConfig = {
  apiKey: "$API_KEY",
  authDomain: "$AUTH_DOMAIN",
  projectId: "$PROJECT_ID",
  storageBucket: "$STORAGE_BUCKET",
  messagingSenderId: "$SENDER_ID",
  appId: "$APP_ID"
};

export const vapidKey = "$VAPID_KEY";
EOF

echo ""
echo "✅ Firebase config created at src/app/config/firebase.config.ts"
echo ""
echo "Next steps:"
echo "1. Update firebase-messaging-sw.js with your config"
echo "2. Run: npm install firebase"
echo "3. Test with: ionic serve"
```

---

## Troubleshooting

### "Messaging: We are unable to register the default service worker"
- Ensure service worker is in the correct location
- Check that it's being served from the root path
- Verify HTTPS is being used (required for service workers)

### "Permission denied"
- User must grant notification permission
- Check browser notification settings
- Try in incognito mode to reset permissions

### "Invalid VAPID key"
- Ensure you copied the full VAPID key from Firebase
- Check for extra spaces or characters
- Regenerate key if needed

### Service worker not registering
- Check browser console for errors
- Verify file path is correct
- Ensure HTTPS is used (localhost is OK)

---

## Summary Checklist

- [ ] Create Firebase project
- [ ] Add web app to Firebase
- [ ] Copy Firebase config values
- [ ] Enable Cloud Messaging
- [ ] Generate VAPID key
- [ ] Install Firebase SDK (`npm install firebase`)
- [ ] Create `firebase.config.ts` with your values
- [ ] Create `firebase-messaging-sw.js` with your values
- [ ] Update `push-notification.service.ts`
- [ ] Register service worker in `index.html`
- [ ] Update `angular.json` assets
- [ ] Add to `.env` file
- [ ] Test in browser

---

## Where to Get Each Value

| Value | Where to Find It |
|-------|-----------------|
| apiKey | Firebase Console → Project Settings → General → Web apps |
| authDomain | Same as above |
| projectId | Same as above |
| storageBucket | Same as above |
| messagingSenderId | Same as above |
| appId | Same as above |
| vapidKey | Firebase Console → Project Settings → Cloud Messaging → Web Push certificates |
| FCM Server Key | Firebase Console → Project Settings → Cloud Messaging → Server key |

---

## Next Steps

After setup:
1. Test web notifications in browser
2. Integrate with your chat system
3. Test sending messages and receiving notifications
4. Deploy to production with HTTPS

For Android/iOS setup, see `PUSH_NOTIFICATIONS_SETUP.md`
