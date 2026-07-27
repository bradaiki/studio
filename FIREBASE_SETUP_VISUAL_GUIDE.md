# Firebase Setup - Visual Guide

## 🎯 Where to Find Your Firebase Configuration

### Step 1: Firebase Console Homepage
```
┌─────────────────────────────────────────────────────┐
│  Firebase Console                                   │
│  https://console.firebase.google.com/               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [+ Add project]  ← Click here to create new       │
│                                                     │
│  Or select existing project:                        │
│  ┌─────────────────────────────────────┐          │
│  │  📁 Your Project Name               │          │
│  └─────────────────────────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step 2: Project Settings
```
┌─────────────────────────────────────────────────────┐
│  Your Project                                       │
├─────────────────────────────────────────────────────┤
│  ⚙️ [Settings] ← Click gear icon                   │
│     └─ Project settings                            │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  General  |  Cloud Messaging  |  ...          │ │
│  ├───────────────────────────────────────────────┤ │
│  │                                               │ │
│  │  Your apps                                    │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐                  │ │
│  │  │ iOS │  │ Web │  │ And │ ← Click Web       │ │
│  │  └─────┘  └─────┘  └─────┘                  │ │
│  │                                               │ │
│  │  If no web app, click: [</>] Add app         │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Step 3: Web App Configuration
```
┌─────────────────────────────────────────────────────┐
│  Add Firebase to your web app                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  App nickname: [Aiki Web App        ]              │
│                                                     │
│  [Register app]                                     │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  Add Firebase SDK                                   │
│                                                     │
│  const firebaseConfig = {                          │
│    apiKey: "AIzaSyC..."           ← COPY THIS     │
│    authDomain: "project.firebaseapp.com"           │
│    projectId: "your-project-id"                    │
│    storageBucket: "project.appspot.com"            │
│    messagingSenderId: "123456789"                  │
│    appId: "1:123456789:web:abc123"                 │
│  };                                                 │
│                                                     │
│  [Continue to console]                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step 4: Cloud Messaging Tab
```
┌─────────────────────────────────────────────────────┐
│  Project Settings                                   │
├─────────────────────────────────────────────────────┤
│  General  |  [Cloud Messaging]  |  ...  ← Click    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Cloud Messaging API (Legacy)                       │
│  ┌───────────────────────────────────────────────┐ │
│  │  Server key                                   │ │
│  │  AAAA...xyz123                  [Copy] ←─────┼─┼─ FCM Server Key
│  │                                               │ │
│  │  Sender ID                                    │ │
│  │  123456789                                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Web Push certificates                              │
│  ┌───────────────────────────────────────────────┐ │
│  │  Key pair                                     │ │
│  │  BNxG...abc123                  [Copy] ←─────┼─┼─ VAPID Key
│  │                                               │ │
│  │  [Generate key pair]  ← If no key exists     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Configuration Checklist

Copy these values from Firebase Console:

```
✓ API Key:              AIzaSyC...
✓ Auth Domain:          your-project.firebaseapp.com
✓ Project ID:           your-project-id
✓ Storage Bucket:       your-project.appspot.com
✓ Messaging Sender ID:  123456789
✓ App ID:               1:123456789:web:abc123
✓ VAPID Key:            BNxG...abc123
✓ FCM Server Key:       AAAA...xyz123
```

---

## 🎯 Where Each Value Goes

### In Your App (Frontend)

**File: `src/app/config/firebase.config.ts`**
```typescript
export const firebaseConfig = {
  apiKey: "...",           // ← From General tab
  authDomain: "...",       // ← From General tab
  projectId: "...",        // ← From General tab
  storageBucket: "...",    // ← From General tab
  messagingSenderId: "...", // ← From General tab
  appId: "..."             // ← From General tab
};

export const vapidKey = "..."; // ← From Cloud Messaging tab
```

**File: `src/firebase-messaging-sw.js`**
```javascript
firebase.initializeApp({
  apiKey: "...",           // ← Same as above
  authDomain: "...",       // ← Same as above
  projectId: "...",        // ← Same as above
  storageBucket: "...",    // ← Same as above
  messagingSenderId: "...", // ← Same as above
  appId: "..."             // ← Same as above
});
```

### In Your Backend (Lambda)

**File: `.env`**
```bash
FCM_SERVER_KEY=AAAA...xyz123  # ← From Cloud Messaging tab
```

---

## 🚀 Quick Setup Command

```bash
# Run this script and paste your values when prompted
./scripts/setup-firebase-web-push.sh
```

The script will create all necessary files with your configuration!

---

## 🔍 Visual Flow

```
Firebase Console
      ↓
   Get Config
      ↓
   Run Script
      ↓
Files Created:
  • firebase.config.ts
  • firebase-messaging-sw.js
  • .env (updated)
      ↓
   Test App
      ↓
Grant Permission
      ↓
Receive Notifications! 🎉
```

---

## 💡 Pro Tips

1. **Keep Keys Secret**: Never commit `.env` or config files with real keys to git
2. **Use Environment Variables**: In production, use environment variables
3. **Test Locally First**: Use `ionic serve` to test before deploying
4. **Check Console**: Browser console shows helpful error messages

---

## 🆘 Need Help?

See detailed guides:
- **WEB_PUSH_QUICK_START.md** - 5-minute setup
- **WEB_PUSH_NOTIFICATIONS_SETUP.md** - Complete guide
- **PUSH_NOTIFICATIONS_SETUP.md** - All platforms
