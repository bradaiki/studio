# In-App Notifications - Quick Start

## 🚀 Start Testing in 3 Steps

### 1. Start Backend
```bash
npx ampx sandbox
```

### 2. Start Frontend
```bash
npm start
```

### 3. Test Cross-Device
- **Device 1**: Open `http://localhost:8100` → Log in → Go to chat
- **Device 2**: Open on phone/another computer → Log in → Same chat
- **Send message** from Device 1
- **See notification** on Device 2 (1-2 seconds)

## ✅ What Works

- ✅ Cross-device notifications (different computers/phones)
- ✅ Cross-window notifications (same device, different windows)
- ✅ Real-time delivery via GraphQL subscriptions
- ✅ In-app toast at top of screen
- ✅ Click "View" to navigate to chat
- ✅ Works on web, iOS, Android
- ✅ No permission prompts needed

## 🔍 Quick Checks

### Is it working?
Open console (F12) and look for:
```
[Push Notifications] ✅ GraphQL subscription active
[Push Notifications] New message received via subscription
[InAppNotification] Toast presented successfully
```

### Not seeing notifications?
1. Check Profile → Developer Settings → Push Notifications is ON
2. Make sure you're not the sender (you won't see your own notifications)
3. Check console for errors
4. Make sure backend is running (`npx ampx sandbox`)

## 📱 Mobile Testing

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

## 📚 Full Documentation

- **Testing Guide**: `TEST_IN_APP_NOTIFICATIONS.md`
- **Complete Guide**: `IN_APP_NOTIFICATIONS_COMPLETE.md`
- **Cross-Device Details**: `CROSS_DEVICE_NOTIFICATIONS_READY.md`

## 🎯 Key Features

| Feature | Status |
|---------|--------|
| Cross-device | ✅ Works |
| Cross-window | ✅ Works |
| Real-time | ✅ 1-2 seconds |
| Web | ✅ Works |
| iOS | ✅ Works |
| Android | ✅ Works |
| No permissions | ✅ None needed |

## 🛠️ Settings

**Profile → Developer Settings:**
- **Push Notifications**: Enable/disable all notifications
- **Local Test Mode**: In-app only vs. Full mode (with Lambda)

## 💡 How It Works

```
Device A sends message
        ↓
GraphQL mutation → DynamoDB
        ↓
AWS AppSync triggers subscription
        ↓
Device B receives via WebSocket
        ↓
Shows toast notification (1-2 seconds)
```

## 🎉 Success!

When you see this in Device B's console:
```
[Push Notifications] ✅ Cross-device notification shown
```

And a toast appears at the top of the screen - **it's working!**
