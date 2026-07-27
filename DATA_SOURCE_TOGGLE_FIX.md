# Data Source Toggle Fix

## Problem
The data source toggle button in the settings page wasn't actually switching the application's data source between mock and database modes.

## Root Cause Analysis
The issue was in the `onToggleDataSource()` method in `profile.page.ts`:

1. **Race Condition**: The method was manually updating `this.dataSource` immediately after calling `dataSourceService.setDataSource()`, which could cause a race condition with the subscription that also updates this property.

2. **No Visual Feedback**: There was no loading indicator to show that the data was being reloaded, making it unclear if the toggle was working.

3. **Insufficient Logging**: While there was some logging, it wasn't clear enough to debug the issue.

## Solution Implemented

### 1. Enhanced Subscription Logging
Added console logging in the `ngOnInit()` subscription to track when the data source changes:

```typescript
this.dataSourceService.dataSource$.subscribe(source => {
  console.log('[Profile ngOnInit] Data source changed to:', source);
  this.dataSource = source;
});
```

### 2. Improved Toggle Method
Updated `onToggleDataSource()` to:
- Show a loading indicator while services reload data
- Remove manual `this.dataSource` assignment (let the subscription handle it)
- Add a 1-second delay to allow services to complete their reload
- Provide better visual feedback with the loading spinner

```typescript
async onToggleDataSource() {
  const currentSource = this.dataSource;
  const newSource: DataSource = currentSource === 'mock' ? 'database' : 'mock';
  
  console.log('[Profile] Toggling data source from', currentSource, 'to', newSource);
  
  // Show loading indicator
  const loading = await this.loadingController.create({
    message: `Switching to ${newSource === 'mock' ? 'Mock Data' : 'Database'}...`,
    spinner: 'crescent',
    duration: 1500
  });
  await loading.present();
  
  // Toggle the data source - this will trigger all service subscriptions
  this.dataSourceService.setDataSource(newSource);
  
  // Wait a moment for services to reload
  setTimeout(async () => {
    await loading.dismiss();
    
    console.log('[Profile] Data source updated to:', this.dataSourceService.getCurrentSource());
    
    const toast = await this.toastController.create({
      message: `Switched to ${newSource === 'mock' ? 'Mock Data' : 'Database'} mode`,
      duration: 2000,
      color: newSource === 'mock' ? 'warning' : 'tertiary',
      position: 'top',
      icon: newSource === 'mock' ? 'phone-portrait' : 'cloud'
    });
    toast.present();
  }, 1000);
}
```

## How It Works Now

1. **User clicks toggle button** → `onToggleDataSource()` is called
2. **Loading spinner appears** → Shows "Switching to Mock Data/Database..."
3. **Service updates data source** → `dataSourceService.setDataSource(newSource)` is called
4. **Observable emits** → `dataSource$` emits the new value
5. **All services react** → Each service's subscription to `dataSource$` triggers `loadFromAPI()`
6. **Services reload data** → Arts, Studios, Events, Organizations, Posts, and People services all reload
7. **Profile page updates** → The subscription in `ngOnInit()` updates `this.dataSource`
8. **Loading dismisses** → After 1 second, loading spinner disappears
9. **Toast notification** → Success message shows the new mode

## Services That React to Toggle

All these services subscribe to `dataSource$` and automatically reload when it changes:

- `ArtsService`
- `StudiosService`
- `EventsService`
- `OrganizationsService`
- `PostsService`
- `PeopleService`

## Testing

To test the fix:

1. Open the app and navigate to Profile → Settings tab
2. Look for the "Developer Settings" card
3. Click the "Switch to Mock/Database" button
4. You should see:
   - A loading spinner with message
   - Console logs showing the data source change
   - A success toast notification
   - Data in all pages (Arts, Studios, Events, etc.) should update to reflect the new source

## Files Modified

- `src/app/profile/profile.page.ts`
  - Enhanced `ngOnInit()` subscription with logging
  - Improved `onToggleDataSource()` method with loading indicator and better flow

## Build Status

✅ Build successful with no TypeScript errors
✅ No diagnostic issues found
