# Test Push Notifications Locally - Right Now!

## ✅ Local Test Mode Enabled

I've added a **local test mode** that lets you test push notification navigation immediately, without needing Firebase credentials or multiple users!

## How It Works

When `localTestMode: true` is set:
- Bypasses Lambda function and Firebase
- Shows browser notifications directly
- Includes navigation data (chatId, route)
- Works with same user in multiple windows
- Tests the navigation functionality

## Quick Test (2 minutes)

### Step 1: Open Two Browser Windows

1. Open your app: `http://localhost:8100`
2. Open a second window: `http://localhost:8100` (same URL)
3. Log in with the same user in both windows

### Step 2: Grant Notification Permission

In **Window 2**:
- When prompted, click "Allow" for notifications
- If not prompted, check browser settings

### Step 3: Send a Message

In **Window 1**:
1. Navigate to any chat
2. Send a message
3. Watch Window 2!

### Step 4: Click the Notification

In **Window 2**:
- A browser notification should appear
- Click the notification
- **Result**: Window 2 navigates to the chat! ✅

## What You'll See

### In Window 1 (Sender)
```
[Push Notifications] Sending push notifications to chat participants
[Local Test Mode] Showing browser notification
[Local Test Mode] Browser notification shown successfully
```

### In Window 2 (Receiver)
- Browser notification appears with:
  - Title: Sender's name
  - Body: Message text
  - Icon: App icon
- Click notification → Navigates to chat

## Configuration

**File**: `src/app/config/push-notification.config.ts`

```typescript
export const pushNotificationConfig = {
  enabled: true,
  debug: true,
  localTestMode: true  // ← Set to false for production
};
```

## Important Notes

### Same User in Multiple Windows
✅ **This works!** Local test mode shows notifications in all windows, even for the same user.

### Different Users
✅ **Also works!** You can test with different users if you want.

### Browser Requirements
- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Works (may need HTTPS)
- Edge: ✅ Full support

### Notification Permission
If you don't see the permission prompt:
1. Check browser address bar for notification icon
2. Or go to browser settings → Site settings → Notifications
3. Allow notifications for `localhost:8100`

## Troubleshooting

### No notification appears

**Check 1**: Notification permission
```javascript
// In browser console:
Notification.permission
// Should return: "granted"
```

**Check 2**: Local test mode enabled
```javascript
// In browser console:
// Check the config file shows localTestMode: true
```

**Check 3**: Browser console logs
```
[Local Test Mode] Showing browser notification
[Local Test Mode] Browser notification shown successfully
```

### Notification appears but doesn't navigate

**Check**: Click handler
- Make sure you click the notification itself
- Not just dismiss it
- Should see window focus and navigate

### Permission denied

**Fix**: Reset permission
1. Chrome: Settings → Privacy → Site Settings → Notifications
2. Find `localhost:8100`
3. Change to "Allow"
4. Reload page

## Testing Different Scenarios

### Test 1: Basic Navigation
1. Send message in Window 1
2. Click notification in Window 2
3. Verify: Window 2 navigates to chat

### Test 2: Multiple Chats
1. Send message in Chat A
2. Send message in Chat B
3. Click notification for Chat B
4. Verify: Navigates to Chat B (not A)

### Test 3: App in Background
1. Send message in Window 1
2. Switch to different tab in Window 2
3. Notification appears
4. Click notification
5. Verify: Window 2 comes to foreground and navigates

### Test 4: Multiple Notifications
1. Send 3 messages quickly
2. Multiple notifications appear
3. Click any notification
4. Verify: Navigates to correct chat

## When to Disable Local Test Mode

Disable local test mode when:
- ✅ You've tested navigation locally
- ✅ You're ready to add Firebase credentials
- ✅ You want to test real push notifications
- ✅ You're deploying to production

**To disable**:
```typescript
// In push-notification.config.ts
localTestMode: false
```

## Comparison: Local vs Production

| Feature | Local Test Mode | Production Mode |
|---------|----------------|-----------------|
| Firebase needed | ❌ No | ✅ Yes |
| Push tokens stored | ❌ No | ✅ Yes |
| Lambda queries DB | ❌ No | ✅ Yes |
| Browser notifications | ✅ Yes | ✅ Yes |
| Navigation works | ✅ Yes | ✅ Yes |
| Works offline | ❌ No | ❌ No |
| Works on mobile | ❌ No | ✅ Yes |
| Same user testing | ✅ Yes | ❌ No |

## Console Logs

### Successful Test

```
[Push Notifications] Sending push notifications to chat participants: {
  chatId: "...",
  senderId: "...",
  participantCount: 2
}
[Local Test Mode] Showing browser notification
[Local Test Mode] Browser notification shown successfully
```

### If Permission Denied

```
[Local Test Mode] Notification permission denied
```

### If Browser Not Supported

```
[Local Test Mode] Browser notifications not supported
```

## Next Steps

### After Testing Locally

1. ✅ Verify navigation works
2. ✅ Test different scenarios
3. ✅ Confirm click handling works

### When Ready for Production

1. Set `localTestMode: false`
2. Add Firebase credentials
3. Store push tokens in database
4. Update Lambda to query tokens
5. Test with real devices

## Summary

🎉 **You can test push notification navigation right now!**

**What works**:
- ✅ Browser notifications appear
- ✅ Clicking navigates to chat
- ✅ Works with same user in multiple windows
- ✅ No Firebase setup needed
- ✅ No multiple users needed

**How to test**:
1. Open two browser windows
2. Send a message in Window 1
3. Click notification in Window 2
4. Watch it navigate to the chat!

**Current config**:
- `localTestMode: true` ← Enabled for testing
- `enabled: true` ← Push notifications on
- `debug: true` ← Detailed logs

Try it now! Open two windows and send a message. 🚀
