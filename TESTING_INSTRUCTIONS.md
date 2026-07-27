# Testing Instructions - Organizations and Events Fix

## What Was Fixed

1. **Organizations Seeding** - Organizations now properly seed to the database
2. **Events Visibility** - Events are now visible in the UI after seeding
3. **Events Filtering** - Event type filtering works correctly

## How to Test

### Step 1: Clear Existing Data (Optional)
If you want to start fresh, you can delete existing records from the AWS console.

### Step 2: Switch to Database Mode
1. Open the app
2. Navigate to the Arts page
3. Look for the data source toggle button in the header
4. Click to switch to **database mode** (cloud icon)
5. The button should show a cloud icon when in database mode

### Step 3: Seed the Database
1. While on the Arts page in database mode
2. Click the **seed button** (cloud-upload icon) in the header
3. Wait for the loading spinner
4. You should see a success toast showing:
   - 5 arts
   - 11 organizations
   - 107 studios
   - 154 people
   - 153 posts
   - 23 events

### Step 4: Verify Organizations
1. Navigate to the **Organizations page** (Orgs tab)
2. You should see **11 organizations** displayed
3. Each organization should have:
   - Name
   - Description
   - Headquarters location
   - Member count
   - Website
   - Contact email
4. Try searching for an organization
5. Scroll down to test infinite scroll

### Step 5: Verify Events
1. Navigate to the **Events page** (Events tab)
2. You should see **23 events** displayed
3. Each event should have:
   - Title (includes type: Seminar, Workshop, Tournament, or Meetup)
   - Date and time
   - Location
   - Cost
   - Organizer
   - Image
4. Test the filter buttons at the top:
   - **All** - Shows all 23 events
   - **Seminar** - Shows only seminar events
   - **Workshop** - Shows only workshop events
   - **Tournament** - Shows only tournament events
   - **Meetup** - Shows only meetup events
5. Try searching for an event
6. Scroll down to test infinite scroll

### Step 6: Verify Data Source Toggle
1. Switch back to **mock mode** (phone icon)
2. Organizations page should show mock organizations
3. Events page should show mock events
4. Switch back to **database mode** (cloud icon)
5. Organizations and events should reload from database

## Expected Results

### Organizations Page (Database Mode)
- ✅ Shows 11 organizations from database
- ✅ No hardcoded demo data visible
- ✅ Search works
- ✅ Infinite scroll works
- ✅ Empty state shows when database is empty

### Events Page (Database Mode)
- ✅ Shows 23 events from database
- ✅ Events display with correct date/time
- ✅ Event type filtering works (Seminar, Workshop, Tournament, Meetup)
- ✅ Search works
- ✅ Infinite scroll works
- ✅ Empty state shows when database is empty

### Data Source Toggle
- ✅ Mock mode shows local mock data
- ✅ Database mode shows data from DynamoDB
- ✅ Toggle persists across page refreshes
- ✅ All pages respect the global toggle setting

## Troubleshooting

### Organizations Not Showing
1. Check browser console for errors
2. Verify you're in database mode (cloud icon)
3. Verify seeding completed successfully
4. Check AWS console to confirm records exist

### Events Not Showing
1. Check browser console for errors
2. Verify you're in database mode (cloud icon)
3. Verify seeding completed successfully
4. Try clicking "All" filter to reset filters

### Seeding Fails
1. Check that you're authenticated
2. Check browser console for specific error messages
3. Verify AWS credentials are configured correctly
4. Check that Amplify backend is deployed

## Browser Console Logs

You should see these logs when everything is working:

### When Switching to Database Mode
```
Loading organizations from database
Successfully loaded organizations from database
Loading events from database
Successfully loaded X events from database
```

### When Seeding
```
Seeding arts...
Seeding organizations...
Seeding studios...
Seeding people...
Seeding posts...
Seeding events...
```

### When Switching to Mock Mode
```
Loading organizations from mock data
Loaded 11 mock organizations
Loading events from mock data
Loaded 23 mock events
```

## Files Changed

1. `src/app/services/data-seeding.service.ts` - Fixed organizations seeding
2. `src/app/services/events.service.ts` - Fixed events loading and transformation
3. `src/app/events/events.page.ts` - Fixed to use observable subscription

## Status

✅ All fixes implemented
✅ Build successful
✅ No compilation errors
✅ Ready for testing
