# Database Seeding Fixes - Organizations and Events

## Issues Fixed

### 1. Organizations Not Seeding
**Problem:** Organizations were failing to seed because the mock data included a `heroImage` field that doesn't exist in the Organization schema.

**Solution:** Modified `seedOrganizations()` in `DataSeedingService` to transform the data and exclude the `heroImage` field before creating records.

**Changes:**
- `src/app/services/data-seeding.service.ts` - Added data transformation to match schema exactly

### 2. Events Not Visible in UI
**Problem:** Events were being seeded to the database but not visible in the UI because:
1. The Event schema uses `startDate` and `endDate` as datetime fields, but the Event interface expects separate `date` and `time` fields
2. The Event schema doesn't have a `type` field, but the UI filters by type
3. EventsPage was not subscribing to the events$ observable

**Solution:** 
1. Modified `EventsService.loadEventsFromAPI()` to properly transform database events:
   - Extract date from `startDate` datetime
   - Extract time from `startDate` datetime
   - Infer event type from title (seminar, workshop, tournament, meetup)
   - Map database fields to Event interface fields
2. Modified `EventsPage.ngOnInit()` to subscribe to `events$` observable for automatic updates

**Changes:**
- `src/app/services/events.service.ts` - Added data transformation and type inference
- `src/app/events/events.page.ts` - Changed from direct service call to observable subscription

## How It Works Now

### Organizations
1. Mock data includes `heroImage` for display purposes
2. When seeding, `heroImage` is excluded to match schema
3. OrganizationsService properly loads from database in database mode
4. Organizations page subscribes to `organizations$` for automatic updates

### Events
1. Events are seeded with `startDate` and `endDate` as datetime strings
2. EventsService transforms database events to match UI expectations:
   - Splits datetime into separate date and time
   - Infers type from title keywords
   - Maps all required fields
3. Events page subscribes to `events$` for automatic updates
4. Events are properly filtered by type in the UI

## Testing

To verify the fixes:

1. **Switch to database mode** (cloud icon on arts page)
2. **Seed the database** (cloud-upload icon on arts page)
3. **Check organizations page** - Should show 11 organizations from database
4. **Check events page** - Should show 23 events from database
5. **Filter events by type** - Should work correctly (seminar, workshop, tournament, meetup)

## Data Flow

```
Mock Data (shared-mock-data.ts)
    ↓
DataSeedingService (transforms data)
    ↓
DynamoDB (stores in schema format)
    ↓
Service (loads and transforms back)
    ↓
Observable (emits to subscribers)
    ↓
Page Component (displays data)
```

## Files Modified

1. `src/app/services/data-seeding.service.ts` - Fixed organizations seeding
2. `src/app/services/events.service.ts` - Fixed events loading and transformation
3. `src/app/events/events.page.ts` - Fixed to use observable subscription

## Status

✅ Organizations seeding - FIXED
✅ Events visibility - FIXED
✅ Events filtering - WORKING
✅ Observable subscriptions - WORKING
✅ Data source toggle - WORKING
