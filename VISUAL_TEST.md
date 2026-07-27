# Visual Test - Where to Look for Notifications

## Important: Notifications Appear OUTSIDE the Browser!

Service worker notifications don't appear in the browser window. They appear in your **operating system's notification center**.

## Where to Look

### macOS
- **Top-right corner** of your screen
- Click the notification icon (looks like stacked lines)
- Or notifications slide in from the right side

### Windows 10/11
- **Bottom-right corner** (system tray area)
- Click the notification icon (speech bubble)
- Or notifications slide up from the bottom-right

### Linux (Ubuntu/GNOME)
- **Top-center** of screen
- Notifications slide down from the top

## What You WON'T See in Window 2

❌ Nothing in the browser console
❌ Nothing in the network tab
❌ Nothing in the application tab
❌ Nothing in the browser window itself

## What You WILL See

✅ A notification in your OS notification center
✅ It looks like a system notification (not a browser popup)
✅ It has the sender's name as the title
✅ It has the message text as the body
✅ It has your app icon

## Simple Test

### Step 1: Test Your OS Notifications

**In Window 1 console, run this:**
```javascript
navigator.serviceWorker.ready.then(reg => 
  reg.showNotification('🔔 TEST NOTIFICATION', {
    body: 'Look at your screen corners! This should appear in your OS notification center.',
    icon: '/assets/icon/icon.png',
    requireInteraction: true  // Stays visible until you interact
  })
);
```

**Now look around your screen:**
- macOS: Top-right corner
- Windows: Bottom-right corner
- Linux: Top-center

**Do you see a notification?**

### If YES:
Great! Service worker notifications work. Now test the app.

### If NO:
Your OS notifications might be disabled. Check:

**macOS:**
1. System Preferences → Notifications
2. Find your browser (Chrome/Firefox/Safari)
3. Make sure "Allow Notifications" is checked

**Windows:**
1. Settings → System → Notifications
2. Find your browser
3. Make sure notifications are enabled

**Linux:**
1. Settings → Notifications
2. Make sure notifications are enabled

## Step 2: Test the App

### In Window 1:
1. Open browser console
2. Navigate to a chat
3. Send a message
4. Look for this log:
   ```
   ✅ Service worker notification shown successfully - should appear in ALL windows!
   ```

### In Window 2:
1. **Don't look at the browser window**
2. **Look at your screen corners** (where OS notifications appear)
3. You should see a notification with:
   - Title: Your name (the sender)
   - Body: The message you sent
   - Icon: Your app icon

### Click the Notification:
- Window 2 should come to focus
- It should navigate to the chat
- You should see the message

## Debugging

### Check 1: Is Service Worker Active?

**In BOTH windows, run:**
```javascript
navigator.serviceWorker.controller ? 'Active ✅' : 'Not Active ❌'
```

**Both should say**: `Active ✅`

**If either says** `Not Active ❌`:
1. Close that window
2. Open a new window
3. Wait 5 seconds
4. Check again

### Check 2: Can Service Worker Show Notifications?

**In Window 1 console:**
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Showing test notification...');
  return reg.showNotification('Test', { 
    body: 'Testing service worker notifications',
    requireInteraction: true 
  });
}).then(() => {
  console.log('✅ Notification shown! Check your screen corners!');
}).catch(err => {
  console.error('❌ Error:', err);
});
```

**Look at your screen corners** - do you see "Test" notification?

### Check 3: What Logs Do You See?

**When you send a message in Window 1, you should see:**
```
=== CALLING PUSH NOTIFICATIONS ===
[Push Notifications] notifyParticipants called
[Push Notifications] Using local test mode
[Local Test Mode] sendLocalTestNotification called
[Local Test Mode] Notification permission: granted
[Local Test Mode] Checking service worker...
[Local Test Mode] Service worker ready, showing notification via SW
✅ Service worker notification shown successfully - should appear in ALL windows!
```

**If you see** `⚠️ Service worker not controlling page yet`:
- Service worker isn't active
- Run Check 1 above

**If you see** `⚠️ Regular notification created (only visible in THIS window)`:
- Using fallback mode
- Service worker isn't working
- Run Check 2 above

## Common Misunderstandings

### ❌ "I don't see anything in Window 2"
**Correct!** You won't see anything IN the window. Look at your screen corners (OS notification center).

### ❌ "Nothing in the console"
**Correct!** Window 2's console won't show anything. The notification is system-level.

### ❌ "No network requests"
**Correct!** Window 2 doesn't make any requests. The notification comes from the service worker.

### ✅ "I see a notification in my OS notification center"
**Perfect!** That's exactly where it should appear.

## Screenshot Guide

### What It Looks Like

**macOS:**
```
┌─────────────────────────────────┐
│  🔔 Your Name                   │
│  Hey, this is a test message    │
│  [App Icon]                     │
└─────────────────────────────────┘
```
Appears in top-right corner

**Windows:**
```
┌─────────────────────────────────┐
│  [App Icon] Your Name           │
│  Hey, this is a test message    │
└─────────────────────────────────┘
```
Slides up from bottom-right

## Still Not Seeing It?

### Try This Extreme Test:

1. **Minimize Window 2** (so you can't see the browser at all)
2. **In Window 1**: Send a message
3. **Look at your screen** - anywhere on your screen
4. **Do you see a notification pop up?**

If you see it: ✅ It's working!
If you don't: ❌ Something is wrong

### If You Don't See It:

**Run this diagnostic:**
```javascript
// In Window 1 console
console.log('=== DIAGNOSTIC ===');
console.log('1. SW Controller:', navigator.serviceWorker.controller ? 'Active' : 'Inactive');
console.log('2. Permission:', Notification.permission);

navigator.serviceWorker.ready.then(reg => {
  console.log('3. SW Ready:', !!reg);
  console.log('4. Attempting notification...');
  
  return reg.showNotification('🚨 DIAGNOSTIC TEST', {
    body: 'If you see this ANYWHERE on your screen, notifications work!',
    requireInteraction: true,
    tag: 'diagnostic'
  });
}).then(() => {
  console.log('5. ✅ Notification command sent successfully');
  console.log('6. NOW LOOK AT YOUR SCREEN CORNERS!');
}).catch(err => {
  console.error('5. ❌ Error:', err);
});
```

**After running this:**
- Look at ALL corners of your screen
- Look at your taskbar/menu bar
- Look for ANY notification popup

**If you see the diagnostic test notification:**
- Service worker works!
- The app should work too
- Send a message and look for the notification

**If you DON'T see the diagnostic test notification:**
- OS notifications might be disabled
- Check your system settings
- Make sure browser notifications are allowed

## Summary

**What to expect:**
1. Send message in Window 1
2. Notification appears in **OS notification center** (screen corners)
3. Window 2 browser shows **nothing** (that's normal)
4. Click notification → Window 2 comes to focus and navigates

**Where to look:**
- ❌ Not in the browser window
- ❌ Not in the console
- ❌ Not in the network tab
- ✅ In your OS notification center (screen corners)

The key is: **Look at your screen, not at the browser window!**
