# Test Push Notification Navigation - Quick Guide

## Quick Test (5 minutes)

### Prerequisites
- App is running (`npm start`)
- Firebase credentials are configured
- Push notifications are enabled

### Test Steps

1. **Open two browser windows**
   - Window 1: Your app (logged in as User A)
   - Window 2: Your app (logged in as User B)

2. **Start a chat**
   - In Window 1: Navigate to a chat with User B
   - Send a message

3. **Check Window 2**
   - You should see a notification appear
   - Click the notification
   - **Expected**: Window 2 focuses and navigates to the chat

4. **Verify**
   - Window 2 should show the chat conversation
   - You should see the message from User A

## Detailed Test Scenarios

### Scenario 1: App is Open and Focused

**Setup**:
- Open app in browser
- Navigate to any page (not the chat page)

**Test**:
1. Send a chat message from another device/window
2. Notification appears
3. Click notification

**Expected Result**:
- App stays in current window
- Navigates to the chat
- Chat opens with the new message visible

**Check Console**:
```
Received message from service worker: {type: 'NAVIGATE_TO_CHAT', chatId: '...'}
Navigating to: /tabs/chat/...
```

### Scenario 2: App is Open in Background Tab

**Setup**:
- Open app in browser tab
- Switch to a different tab

**Test**:
1. Send a chat message
2. Notification appears
3. Click notification

**Expected Result**:
- App tab comes to foreground
- Navigates to the chat
- Chat opens with the new message

**Check Console**:
```
Notification clicked: {...}
Opening URL: /tabs/chat/...
```

### Scenario 3: App is Closed

**Setup**:
- Close all app windows/tabs

**Test**:
1. Send a chat message
2. Notification appears
3. Click notification

**Expected Result**:
- New browser window opens
- App loads
- Navigates directly to the chat
- Chat opens with the new message

**Check URL**:
```
http://localhost:8100/tabs/chat/[chat-id]
```

### Scenario 4: Multiple Notifications

**Setup**:
- Close app or switch to different tab

**Test**:
1. Send message in Chat A
2. Send message in Chat B
3. Send message in Chat C
4. Three notifications appear
5. Click notification for Chat B

**Expected Result**:
- App opens/focuses
- Navigates to Chat B (not A or C)
- Chat B opens with the new message

### Scenario 5: Native App (iOS/Android)

**Setup**:
- Build and install app on device
- Put app in background

**Test**:
1. Send a chat message
2. Push notification appears on device
3. Tap the notification

**Expected Result**:
- App comes to foreground
- Navigates to the chat
- Chat opens with the new message

## Debug Checklist

### Before Testing

- [ ] Firebase credentials are configured in `firebase.config.ts`
- [ ] Push notifications are enabled in `push-notification.config.ts`
- [ ] Service worker is registered (check DevTools → Application → Service Workers)
- [ ] Notification permission is granted (check browser settings)
- [ ] Lambda function is deployed (check `amplify_outputs.json`)

### During Testing

- [ ] Open browser console (F12)
- [ ] Check for service worker logs
- [ ] Verify notification data includes `chatId`
- [ ] Watch for navigation logs
- [ ] Check network tab for Lambda invocation

### After Testing

- [ ] Verify chat opens correctly
- [ ] Check message is visible
- [ ] Verify no console errors
- [ ] Test on different browsers (Chrome, Firefox, Safari)

## Console Logs to Look For

### Successful Flow

```
1. [Push Notifications] Sending push notifications to chat participants
2. [Push Notifications] Lambda invoked successfully
3. Received background message: {...}
4. Notification clicked: {...}
5. Opening URL: /tabs/chat/...
6. Received message from service worker: {...}
7. Navigating to: /tabs/chat/...
```

### If Something Goes Wrong

**No notification appears**:
```
[Push Notifications] Lambda function not deployed yet
```
→ Run `npx ampx sandbox`

**Notification appears but doesn't navigate**:
```
Error: Cannot read property 'chatId' of undefined
```
→ Check Lambda function includes `chatId` in data

**Navigation goes to wrong page**:
```
Navigating to: /tabs/chat/undefined
```
→ Verify `chatId` is passed correctly

## Quick Fixes

### Fix 1: Service Worker Not Registered

```bash
# Clear browser cache
# Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Or in DevTools → Application → Service Workers → Unregister → Reload
```

### Fix 2: Notification Permission Denied

```javascript
// In browser console:
Notification.requestPermission().then(console.log);
// Should return 'granted'
```

### Fix 3: Navigation Not Working

```typescript
// Check router is working:
// In browser console:
window.location.href = '/tabs/chat/test-id';
// Should navigate
```

## Test Automation

### Automated Test Script

You can test programmatically:

```typescript
// In browser console:

// 1. Simulate notification click
const mockNotification = {
  data: {
    chatId: 'test-chat-id',
    route: '/tabs/chat/test-chat-id'
  }
};

// 2. Send message to app
navigator.serviceWorker.controller.postMessage({
  type: 'NAVIGATE_TO_CHAT',
  chatId: 'test-chat-id',
  route: '/tabs/chat/test-chat-id'
});

// 3. Check if navigation happened
setTimeout(() => {
  console.log('Current URL:', window.location.pathname);
  // Should be: /tabs/chat/test-chat-id
}, 1000);
```

## Performance Testing

### Test Notification Delivery Speed

```typescript
// In chat service, add timing:
const startTime = Date.now();
await this.chatPushIntegrationService.notifyParticipants(...);
const endTime = Date.now();
console.log(`Notification sent in ${endTime - startTime}ms`);
```

**Expected**: < 2000ms (2 seconds)

### Test Navigation Speed

```typescript
// In app component:
const navStartTime = Date.now();
this.router.navigate(['/tabs/chat', chatId]).then(() => {
  const navEndTime = Date.now();
  console.log(`Navigation took ${navEndTime - navStartTime}ms`);
});
```

**Expected**: < 500ms

## Browser Compatibility

### Tested Browsers

- ✅ Chrome 90+ (Desktop & Mobile)
- ✅ Firefox 88+ (Desktop & Mobile)
- ✅ Safari 14+ (Desktop & Mobile)
- ✅ Edge 90+
- ⚠️ Opera (should work, not tested)
- ❌ IE 11 (not supported)

### Browser-Specific Notes

**Chrome**:
- Best support for service workers
- Notifications work in background tabs

**Firefox**:
- Requires HTTPS (or localhost)
- May need explicit permission

**Safari**:
- iOS Safari requires Add to Home Screen for notifications
- Desktop Safari 16+ has better support

## Summary

To test push notification navigation:

1. **Quick Test**: Open two windows, send message, click notification
2. **Verify**: App navigates to the correct chat
3. **Check Console**: Look for navigation logs
4. **Test Scenarios**: Open, background, closed
5. **Debug**: Use console logs and DevTools

The feature is ready to use! Just send a chat message and click the notification to see it in action.
