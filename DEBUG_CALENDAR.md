# Debug Calendar View

## Steps to Debug

1. **Open the browser console** (F12 or Cmd+Option+I)

2. **Navigate to**: `http://localhost:8100/dash/studio/studio_1`

3. **Check the console logs** - You should see:
   ```
   🔍 Studio page ngOnInit called
   🔍 Studio ID from route: studio_1
   🔍 Initial scheduleView: calendar
   🔍 Found studio: Denver Aikido Dojo
   🔍 Loaded activities count: [number]
   🔍 Schedule view after load: calendar
   ```

4. **Run in console**:
   ```javascript
   getScheduleView()
   ```
   
   This should return:
   ```javascript
   {
     scheduleView: "calendar",
     activitiesCount: [number],
     studioName: "Denver Aikido Dojo"
   }
   ```

5. **Check what's visible on the page**:
   - Do you see the "Class Schedule" card?
   - Do you see the Calendar/List toggle buttons?
   - What view is currently showing?

6. **Try manually switching**:
   - Click the "List" button
   - Check console for: `🔍 changeScheduleView called, new value: list`
   - Click the "Calendar" button
   - Check console for: `🔍 changeScheduleView called, new value: calendar`

## Common Issues

### Issue 1: Schedule card not visible
- Check if you're scrolled down enough
- Check if the page loaded correctly (studio name in header)

### Issue 2: Toggle buttons not visible
- Check browser console for errors
- Verify FormsModule is imported
- Check if ion-segment is rendering

### Issue 3: Calendar shows but is empty
- Check activities count in console
- Verify `studioActivities.length > 0`
- Check if activities are for the current week

### Issue 4: Infinite loop in chats
- Don't click on the "Chats" tab
- The loop is likely in `hasAccessToChats()` or related methods
- Will fix separately

## What to Report

Please provide:
1. Console log output
2. Result of `getScheduleView()`
3. Screenshot of what you see
4. Any error messages in console
