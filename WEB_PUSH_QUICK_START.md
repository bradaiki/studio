# Web Push Notifications - Quick Start

## 🚀 5-Minute Setup

### Step 1: Create Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name → Click **"Continue"**
4. Disable Google Analytics (optional) → Click **"Create project"**

### Step 2: Add Web App (1 minute)

1. Click the **⚙️ gear icon** → **"Project settings"**
2. Scroll to **"Your apps"** → Click **Web icon** (`</>`)
3. Enter nickname (e.g., "Aiki Web") → Click **"Register app"**
4. **Copy the config object** (you'll need this!)

```javascript
// It looks like this:
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 3: Get Keys (1 minute)

1. Still in **Project settings** → Go to **"Cloud Messaging"** tab
2. Under **"Web Push certificates"** → Click **"Generate key pair"**
3. Copy the **VAPID key** (starts with "B...")
4. Copy the **Server key** (under "Cloud Messaging API (Legacy)")

### Step 4: Run Setup Script (1 minute)

```bash
./scripts/setup-firebase-web-push.sh
```

Paste your values when prompted. The script will:
- Create `firebase.config.ts`
- Create `firebase-messaging-sw.js`
- Update `.env` file
- Install Firebase SDK

### Step 5: Test (30 seconds)

```bash
ionic serve
```

Grant notification permission when prompted!

---

## 📋 What You Need

From Firebase Console, you need these 8 values:

| Value | Where to Find |
|-------|--------------|
| API Key | Project Settings → General → Your apps |
| Auth Domain | Same as above |
| Project ID | Same as above |
| Storage Bucket | Same as above |
| Messaging Sender ID | Same as above |
| App ID | Same as above |
| VAPID Key | Project Settings → Cloud Messaging → Web Push certificates |
| FCM Server Key | Project Settings → Cloud Messaging → Server key |

---

## 🎯 Quick Commands

```bash
# 1. Run setup script
./scripts/setup-firebase-web-push.sh

# 2. Install Firebase (if not done by script)
npm install firebase

# 3. Test
ionic serve
```

---

## ✅ Verification

After setup, check:
- [ ] `src/app/config/firebase.config.ts` exists
- [ ] `src/firebase-messaging-sw.js` exists
- [ ] `.env` has Firebase values
- [ ] `firebase` package installed
- [ ] Browser asks for notification permission
- [ ] Console shows FCM token

---

## 🔧 Troubleshooting

**"Service worker not found"**
- Add `src/firebase-messaging-sw.js` to `angular.json` assets

**"Permission denied"**
- Check browser notification settings
- Try incognito mode

**"Invalid VAPID key"**
- Regenerate key in Firebase Console
- Copy the full key (starts with "B...")

---

## 📚 Full Documentation

For detailed instructions, see:
- **WEB_PUSH_NOTIFICATIONS_SETUP.md** - Complete guide
- **PUSH_NOTIFICATIONS_SETUP.md** - All platforms

---

## 🎉 That's It!

You're now ready to receive web push notifications!

Next: Integrate with your chat system to send notifications when messages arrive.
