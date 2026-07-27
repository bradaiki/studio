# Test In-App Notifications - Quick Guide

## What You'll See

When someone sends you a chat message, you'll see a **toast notification** at the **top of the screen** that looks like this:

```
┌─────────────────────────────────────────────────────────┐
│ John Doe                                      [View] │
│ Hey, how are you doing?                    [Dismiss] │
└─────────────────────────────────────────────────────────┘
```

- **Title**: Sender's name
- **Message**: First 100 characters of the message
- **View Button**: Click to go directly to the chat
- **Dismiss Button**: Close the notification

## Quick Test (Different Devices) ⭐ RECOMMENDED

This tests the **real cross-device functionality** using GraphQL subscriptions.

### Step 1: Device 1 (Your Computer)
```bash
npm start
```
- Log in as User A
- Go to any chat

### Step 2: Device 2 (Phone or Another Computer)
- Open browser on your phone or another computer
- Go to your app URL:
  - Local: `http://your-computer-ip:8100` (find your IP with `ipconfig` or `ifconfig`)
  - Deployed: Your production URL
- Log in as User B
- Go to the same chat

### Step 3: Send a Message
- In Device 1, type and send a message
- **Look at the top of Device 2** - you should see a toast notification appear **within 1-2 seconds**!
- This works even if devices are on different networks!

### Step 4: Click "View"
- Click the "View" button in the notification
- You should be taken directly to the chat

## Quick Test (Same Computer, 2 Windows)

This tests the **BroadcastChannel** functionality for same-device notifications.

### Step 1: Open Window 1
```bash
npm start
```
- Log in as any user
- Go to any chat

### Step 2: Open Window 2
- Open a **new browser window** (Cmd+N on Mac, Ctrl+N on Windows)
- Go to `http://localhost:8100`
- Log in (can be same user or different user)
- Go to the same chat

### Step 3: Send a Message
- In Window 1, type and send a message
- **Look at the top of Window 2** - you should see a toast notification appear!

### Step 4: Click "View"
- Click the "View" button in the notification
- You should be taken directly to the chat

## What's Different from Before?

### Before (OS Notifications)
- ❌ Notifications appeared in screen corners (macOS top-right, Windows bottom-right)
- ❌ Required service worker to be active
- ❌ Required notification permissions
- ❌ Didn't work consistently across platforms
- ❌ Only worked on same device

### Now (In-App Notifications)
- ✅ Notifications appear **inside the app** at the top
- ✅ No service worker needed
- ✅ No permission prompts
- ✅ Works on web, iOS, and Android
- ✅ Consistent experience everywhere
- ✅ **Works across different devices and computers** via GraphQL subscriptions
- ✅ Real-time delivery (1-2 seconds)

## Mobile Testing

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```
- Run on two iOS devices
- Send messages between them
- Toast notifications appear at the top of the screen

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```
- Run on two Android devices
- Send messages between them
- Toast notifications appear at the top of the screen

## Troubleshooting

### "I don't see any notification"

1. **Check if enabled:**
   - Go to Profile → Developer Settings
   - Make sure "Push Notifications" toggle is ON

2. **Check console:**
   - Open browser console (F12)
   - Look for: `[Push Notifications] ✅ Cross-device notification shown`
   - Or: `[InAppNotification] Toast presented successfully`

3. **Check if you're the sender:**
   - You won't see notifications for your own messages
   - This is intentional to avoid spam

4. **Check GraphQL subscription:**
   - Console should show: `[Push Notifications] Setting up GraphQL message subscription`
   - And: `[Push Notifications] ✅ GraphQL subscription active`

### "Notification appears in Window 1 but not Window 2 (same device)"

1. **Check BroadcastChannel:**
   - Open console in both windows
   - Window 1 should show: `[Local In-App] Broadcast message sent`
   - Window 2 should show: `[Push Notifications] Received broadcast`

2. **Check same origin:**
   - Both windows must use the same URL
   - `localhost:8100` works
   - Don't mix `localhost` and `127.0.0.1`

### "Notification doesn't appear on Device 2 (different device)"

1. **Check GraphQL subscription:**
   - Open console on Device 2
   - Should see: `[Push Notifications] New message received via subscription`

2. **Check network connection:**
   - Both devices must have internet access
   - GraphQL subscriptions use WebSocket (port 443)

3. **Check authentication:**
   - Make sure Device 2 is logged in
   - Check console for auth errors

4. **Check Amplify backend:**
   - Make sure backend is deployed: `npx ampx sandbox`
   - Check `amplify_outputs.json` exists

### "Notification doesn't navigate to chat"

1. **Check route:**
   - Console should show: `[InAppNotification] Notification clicked`
   - Should navigate to `/tabs/chat/{chatId}`

2. **Check chat ID:**
   - Verify the chat ID is valid
   - Check if you have access to the chat

## Settings

### Profile → Developer Settings

**Push Notifications Toggle:**
- ON: Notifications enabled
- OFF: Notifications disabled

**Local Test Mode:**
- ON: In-app notifications only (no Firebase/Lambda)
- OFF: In-app notifications + Lambda for mobile push

## Expected Console Output

### Device 1 (Sender)
```
[Push Notifications] notifyParticipants called
[Local In-App] Sending notification
[Local In-App] Skipping notification for sender
[Local In-App] Broadcast message sent to other windows
```

### Device 2 (Receiver - Different Device)
```
[Push Notifications] New message received via subscription
[InAppNotification] Showing notification
[InAppNotification] Toast presented successfully
[Push Notifications] ✅ Cross-device notification shown
```

### Window 2 (Receiver - Same Device)
```
[Push Notifications] Received broadcast
[InAppNotification] Showing notification
[InAppNotification] Toast presented successfully
```

### When Clicking "View"
```
[InAppNotification] Notification clicked
Navigating to: /tabs/chat/chat-123
```

## Success Criteria

✅ Toast notification appears at top of screen
✅ Shows sender name and message
✅ Has "View" and "Dismiss" buttons
✅ Clicking "View" navigates to chat
✅ Works across multiple windows (same device)
✅ **Works across different devices (different computers/phones)**
✅ **Real-time delivery (1-2 seconds)**
✅ Sender doesn't see their own notification
✅ Works on web, iOS, and Android

## How It Works Technically

### Cross-Device (GraphQL Subscription)
1. Device 1 sends a message
2. Message is saved to DynamoDB via GraphQL mutation
3. AWS AppSync triggers a subscription event
4. Device 2's GraphQL subscription receives the event via WebSocket
5. ChatPushIntegrationService shows the notification
6. Total time: 1-2 seconds

### Same Device (BroadcastChannel)
1. Window 1 sends a message
2. ChatPushIntegrationService broadcasts via BroadcastChannel
3. Window 2 receives the broadcast
4. Shows notification immediately
5. Total time: < 100ms

## Next Steps

Once basic notifications work:
1. ✅ Test on different devices (computers, phones)
2. ✅ Test with multiple users
3. Test with different chat types (direct, group, studio)
4. Customize notification appearance (optional)
5. Add notification sound (optional)
6. Add notification badge (optional)

## Need Help?

Check the full documentation: `IN_APP_NOTIFICATIONS_COMPLETE.md`
