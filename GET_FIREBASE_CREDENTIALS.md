# How to Get Firebase Credentials

## Quick Answer

You need to **create a Firebase project** to get these credentials. They're not something you "sign up" for separately - they're generated when you create a Firebase project.

## 3-Step Process

### 1. Create Firebase Project
- Go to: https://console.firebase.google.com/
- Click "Add project"
- Enter name → Create

### 2. Add Web App
- Click ⚙️ → Project settings
- Scroll to "Your apps" → Click Web icon (`</>`)
- Register app
- **Copy the config object shown**

### 3. Get VAPID Key
- Go to "Cloud Messaging" tab
- Under "Web Push certificates" → Click "Generate key pair"
- **Copy the key**

## What You'll Get

```javascript
// From Step 2:
apiKey: "AIzaSyC..."
authDomain: "your-project.firebaseapp.com"
projectId: "your-project-id"
storageBucket: "your-project.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123"

// From Step 3:
vapidKey: "BNxG...abc123"
```

## Easy Setup

Run this script and paste your values:
```bash
./scripts/setup-firebase-web-push.sh
```

## Full Guides

- **WEB_PUSH_QUICK_START.md** - 5-minute setup
- **FIREBASE_SETUP_VISUAL_GUIDE.md** - Visual walkthrough
- **WEB_PUSH_NOTIFICATIONS_SETUP.md** - Complete guide
