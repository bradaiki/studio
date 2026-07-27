# Push Notifications Dependencies

## Required NPM Packages

### Frontend (Ionic/Angular)

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@capacitor/push-notifications": "^8.0.0",
    "@capacitor/local-notifications": "^8.0.0"
  }
}
```

Install with:
```bash
npm install @capacitor/push-notifications @capacitor/local-notifications
```

**Note**: These packages are already installed and configured for Capacitor 8.

### Backend (Lambda Function)

The Lambda function requires these packages (already in `amplify/functions/send-push-notification/package.json`):

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "apn": "^2.2.0",
    "web-push": "^3.6.0"
  }
}
```

Install in Lambda directory:
```bash
cd amplify/functions/send-push-notification
npm install
cd ../../..
```

## Platform-Specific Dependencies

### Android

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}

apply plugin: 'com.google.gms.google-services'
```

Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### iOS

No additional dependencies required. Push notifications are built into iOS.

### Web

For Web Push, you may want to add Firebase to your web app:

```bash
npm install firebase
```

Then configure in your app:

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
```

## Optional Dependencies

### For Enhanced Features

```bash
# Device information
npm install @capacitor/device

# App state detection
npm install @capacitor/app

# Haptics for notification feedback
npm install @capacitor/haptics

# Badge count management
npm install @capacitor/badge
```

## Capacitor Sync

After installing packages, always sync Capacitor:

```bash
npx cap sync
```

This will:
- Copy web assets to native projects
- Update native dependencies
- Configure native projects

## Verification

Verify installations:

```bash
# Check Capacitor plugins
npx cap ls

# Should show:
# @capacitor/push-notifications
# @capacitor/local-notifications (if installed)
```

## Troubleshooting

### Package conflicts

If you encounter version conflicts:

```bash
npm install --legacy-peer-deps
```

### Capacitor version mismatch

Ensure all Capacitor packages use the same version:

```bash
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/push-notifications@latest
npx cap sync
```

### Native build errors

Clean and rebuild:

```bash
# Android
cd android
./gradlew clean
cd ..

# iOS
cd ios/App
pod install
cd ../..
```

## Complete Installation Command

Run all installations at once:

```bash
# Install frontend packages
npm install @capacitor/push-notifications @capacitor/local-notifications

# Install Lambda packages
cd amplify/functions/send-push-notification && npm install && cd ../../..

# Sync Capacitor
npx cap sync

# Optional: Install additional packages
npm install @capacitor/device @capacitor/app @capacitor/haptics @capacitor/badge

echo "Installation complete!"
```
