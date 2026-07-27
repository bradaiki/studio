# Push Notifications Settings Guide

## ✅ Complete Implementation

Your push notification system now has a full settings UI in the Profile page with toggles for:
- Enable/Disable push notifications
- Switch between Local Test Mode and Full Mode
- Grant notification permissions
- View permission status

## Location

**Profile Page → Developer Settings Card**

Navigate to: `/tabs/profile` → Scroll to "Developer Settings"

## Features

### 1. Push Notification Mode Toggle

**Local Test Mode** (Default):
- Uses browser notifications directly
- No Firebase setup required
- Perfect for testing navigation
- Works with same user in multiple windows
- Icon: 🖥️ Desktop

**Full Mode** (Production):
- Uses Firebase Cloud Messaging
- Requires Firebase credentials
- Invokes Lambda function
- Stores push tokens in database
- Icon: ☁️ Cloud

**How to Toggle**:
- Click "Switch to Full" or "Switch to Local" button
- Toast notification confirms the change
- Setting persists in localStorage

### 2. Push Notifications Enable/Disable

**Toggle Switch**:
- Turn push notifications on/off
- When enabled, automatically requests permission
- Setting persists in localStorage
- Icon changes: 🔔 (enabled) / 🔕 (disabled)

### 3. Grant Permission Button

**Appears when**:
- Push notifications are enabled
- Permission has not been granted yet

**Click to**:
- Request browser notification permission
- Shows browser's native permission dialog
- Updates permission status immediately

### 4. Permission Status Display

**Shows current status**:
- ✅ "Permission granted" (green)
- ❌ "Permission denied" (red)
- ⏳ "Permission not requested yet" (gray)
- ⚠️ "Not supported in this browser" (warning)

## How to Use

### Quick Start (Local Testing)

1. **Navigate to Profile**
   - Go to `/tabs/profile`
   - Scroll to "Developer Settings"

2. **Enable Push Notifications**
   - Toggle "Push Notifications" to ON
   - Click "Grant Permission" button
   - Allow notifications in browser dialog

3. **Test It**
   - Open two browser windows
   - Send a chat message in Window 1
   - See notification in Window 2
   - Click notification → navigates to chat!

### Production Setup

1. **Add Firebase Credentials**
   - Edit `src/app/config/firebase.config.ts`
   - Add your Firebase project credentials
   - See `GET_FIREBASE_CREDENTIALS_VISUAL.md`

2. **Switch to Full Mode**
   - In Profile → Developer Settings
   - Click "Switch to Full" button
   - Confirms with toast notification

3. **Test with Real Devices**
   - Build for iOS/Android
   - Install on device
   - Send chat messages
   - Receive push notifications

## Settings Persistence

All settings are saved to `localStorage`:

```typescript
{
  enabled: boolean,        // Push notifications on/off
  debug: boolean,          // Debug logging
  localTestMode: boolean   // Local vs Full mode
}
```

Settings persist across:
- Page refreshes
- Browser restarts
- Different tabs

## UI Components

### Push Notification Mode

```html
<ion-item lines="full">
  <ion-icon [name]="isLocalPushMode() ? 'desktop' : 'cloud-done'" 
            slot="start" 
            [color]="isLocalPushMode() ? 'warning' : 'success'">
  </ion-icon>
  <ion-label>
    <h3>Push Notification Mode</h3>
    <p>{{ isLocalPushMode() ? 'Local test mode' : 'Full mode' }}</p>
  </ion-label>
  <ion-button (click)="onTogglePushMode()">
    Switch to {{ isLocalPushMode() ? 'Full' : 'Local' }}
  </ion-button>
</ion-item>
```

### Enable/Disable Toggle

```html
<ion-item lines="full">
  <ion-icon [name]="isPushEnabled() ? 'notifications' : 'notifications-off'" 
            slot="start" 
            [color]="isPushEnabled() ? 'primary' : 'medium'">
  </ion-icon>
  <ion-label>
    <h3>Push Notifications</h3>
    <p>{{ isPushEnabled() ? 'Enabled' : 'Disabled' }}</p>
  </ion-label>
  <ion-toggle [checked]="isPushEnabled()"
              (ionChange)="onTogglePushNotifications($event)">
  </ion-toggle>
</ion-item>
```

### Grant Permission Button

```html
<ion-item lines="full" *ngIf="isPushEnabled() && !hasNotificationPermission()">
  <ion-icon name="shield-checkmark" slot="start" color="warning"></ion-icon>
  <ion-label>
    <h3>Notification Permission</h3>
    <p>Click to grant browser notification permission</p>
  </ion-label>
  <ion-button fill="solid" 
              color="warning"
              (click)="onRequestNotificationPermission()">
    <ion-icon name="shield-checkmark" slot="start"></ion-icon>
    Grant Permission
  </ion-button>
</ion-item>
```

### Permission Status

```html
<ion-item lines="full" *ngIf="isPushEnabled()">
  <ion-icon [name]="hasNotificationPermission() ? 'checkmark-circle' : 'close-circle'" 
            slot="start" 
            [color]="hasNotificationPermission() ? 'success' : 'danger'">
  </ion-icon>
  <ion-label>
    <h3>Permission Status</h3>
    <p>{{ getNotificationPermissionStatus() }}</p>
  </ion-label>
</ion-item>
```

## Methods Added

### Profile Page TypeScript

```typescript
// Check if push notifications are enabled
isPushEnabled(): boolean {
  return isPushNotificationEnabled();
}

// Check if in local test mode
isLocalPushMode(): boolean {
  return isLocalTestMode();
}

// Check if browser permission is granted
hasNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

// Get human-readable permission status
getNotificationPermissionStatus(): string {
  switch (Notification.permission) {
    case 'granted': return 'Permission granted ✓';
    case 'denied': return 'Permission denied';
    case 'default': return 'Permission not requested yet';
    default: return 'Unknown status';
  }
}

// Toggle push notifications on/off
async onTogglePushNotifications(event: any) {
  const enabled = event.detail.checked;
  togglePushNotifications(enabled);
  // Shows toast notification
  // Requests permission if enabling
}

// Toggle between local and full mode
async onTogglePushMode() {
  const currentMode = isLocalTestMode();
  const newMode = !currentMode;
  toggleLocalTestMode(newMode);
  // Shows toast notification
}

// Request notification permission
async onRequestNotificationPermission() {
  const granted = await this.pushNotificationService.requestPermission();
  // Shows success toast or error alert
}
```

## Configuration File

**File**: `src/app/config/push-notification.config.ts`

```typescript
export interface PushNotificationConfig {
  enabled: boolean;
  debug: boolean;
  localTestMode: boolean;
}

// Load from localStorage
export const pushNotificationConfig = loadConfig();

// Helper functions
export function togglePushNotifications(enabled: boolean): void;
export function toggleLocalTestMode(localTestMode: boolean): void;
export function isPushNotificationEnabled(): boolean;
export function isLocalTestMode(): boolean;
```

## Testing the UI

### Test 1: Enable Push Notifications

1. Go to Profile → Developer Settings
2. Toggle "Push Notifications" to ON
3. **Expected**: 
   - Toast: "Push notifications enabled"
   - "Grant Permission" button appears
   - Permission dialog shows

### Test 2: Grant Permission

1. Click "Grant Permission" button
2. Click "Allow" in browser dialog
3. **Expected**:
   - Toast: "Notification permission granted!"
   - Permission status: "Permission granted ✓"
   - Button disappears

### Test 3: Toggle Mode

1. Click "Switch to Full" button
2. **Expected**:
   - Toast: "Switched to Full Mode (Firebase + Lambda)"
   - Icon changes to cloud
   - Color changes to green

### Test 4: Disable Push Notifications

1. Toggle "Push Notifications" to OFF
2. **Expected**:
   - Toast: "Push notifications disabled"
   - Icon changes to notifications-off
   - No notifications will be sent

## Troubleshooting

### "Grant Permission" button doesn't appear

**Possible causes**:
1. Push notifications are disabled
2. Permission already granted
3. Browser doesn't support notifications

**Solution**:
- Enable push notifications first
- Check permission status display

### Permission dialog doesn't show

**Possible causes**:
1. Permission already granted or denied
2. Browser blocked the dialog
3. Not on HTTPS (except localhost)

**Solution**:
- Check browser address bar for blocked icon
- Reset permission in browser settings
- Use HTTPS or localhost

### Mode toggle doesn't work

**Possible causes**:
1. localStorage is disabled
2. Browser privacy mode

**Solution**:
- Check browser console for errors
- Try in normal (non-incognito) mode
- Clear localStorage and try again

### Settings don't persist

**Possible causes**:
1. localStorage is cleared
2. Browser privacy settings
3. Incognito/private mode

**Solution**:
- Use normal browser mode
- Check browser storage settings
- Settings will reset to defaults

## Files Modified

1. ✅ `src/app/profile/profile.page.html` - Added UI components
2. ✅ `src/app/profile/profile.page.ts` - Added methods and imports
3. ✅ `src/app/config/push-notification.config.ts` - Made config dynamic
4. ✅ `src/app/services/push-notification.service.ts` - Added requestPermission method

## Summary

🎉 **Complete push notification settings UI is ready!**

**Features**:
- ✅ Toggle push notifications on/off
- ✅ Switch between Local and Full mode
- ✅ Grant notification permission with button
- ✅ View permission status
- ✅ Settings persist in localStorage
- ✅ Toast notifications for all actions
- ✅ Color-coded icons and status

**Location**: Profile → Developer Settings

**Test it**: Go to your profile page and try the new settings!

The UI is similar to the Data Source toggle, making it familiar and easy to use.
