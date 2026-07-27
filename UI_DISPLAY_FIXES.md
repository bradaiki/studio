# UI Display Fixes - Organizations and Studios

## Issues Reported

1. **Organizations not displaying** - Count shows correctly but no organizations visible in web app or Android app
2. **Studios not displaying on Android** - Studios show in web app but not in Android Ionic app

## Root Causes & Fixes

### 1. Organizations Not Displaying

**Problem:** The `updateDisplayedOrganizations()` method only triggered when the filter key changed. When organizations were first loaded from the service, the filter key hadn't changed yet, so the initial load didn't happen.

**Fix:** Modified the logic to also check if a reload is needed (when state is empty or doesn't exist):

```typescript
// Check if filter changed OR if we need to reload data
const filterChanged = filterKey !== this.currentFilterKey;
const state = this.scrollStates.get(filterKey);
const needsReload = !state || state.displayed.length === 0;

if (filterChanged || needsReload) {
  // Load initial items
}
```

**File:** `src/app/orgs/orgs.page.ts`

### 2. Studios Not Displaying on Android

**Likely Cause:** The default segment is "my-studios" which filters for studios where the user is a member, instructor, or studio chief. If none of the seeded studios have these flags set to true, the list will be empty.

**Debugging Added:** Added console logging to help identify the issue:
- Logs when studios are received from service
- Logs how many studios match each segment filter
- Logs how many studios are displayed

**File:** `src/app/studios-list/studios-list.page.ts`

## Testing Instructions

### Check Browser Console

After deploying these changes, check the browser console for these logs:

#### Organizations Page
```
[Orgs Page] Received organizations from service: 11
[Orgs Page] Filtered organizations: 11
[Orgs Page] Displayed organizations: 6
```

If you see:
- `Received: 11` but `Displayed: 0` → The updateDisplayedOrganizations fix should resolve this
- `Received: 0` → The service isn't loading data (check auth mode fix)

#### Studios List Page
```
[Studios List] Received studios from service: 107
[Studios List] My studios filtered: 0 from 107
[Studios List] Displaying initial studios: 0
```

If you see:
- `My studios filtered: 0` → None of the studios have membership flags set
- Switch to "Nearby" segment to see all studios
- Or update seeded data to set some studios with `isMember: true`

### Quick Fixes for Testing

#### To See Studios on Android

**Option 1:** Change the default segment to "nearby":
```typescript
// In studios-list.page.ts
selectedSegment: string = 'nearby'; // Changed from 'my-studios'
```

**Option 2:** Update the seeding service to mark some studios as member studios:
```typescript
// In data-seeding.service.ts, seedStudios method
const studioToCreate = {
  // ... other fields
  isMember: index < 10, // Mark first 10 studios as member studios
};
```

#### To See Organizations

The fix in `orgs.page.ts` should resolve this. If not, check:
1. Are organizations being loaded? (Check service logs)
2. Is the observable emitting? (Check subscription logs)
3. Is the template rendering? (Check for template errors)

## Template Verification

### Organizations Template (`orgs.page.html`)

The template shows organizations when:
```html
<div class="organizations-list" *ngIf="displayedOrganizations.length > 0">
```

And shows empty state when:
```html
<div *ngIf="filteredOrganizations.length === 0 && !showLegacyOrganization">
```

Make sure `displayedOrganizations` is being populated by the TypeScript logic.

### Studios Template (`studios-list.page.html`)

The template shows studios when:
```html
<ion-card *ngFor="let studio of displayedStudios">
```

Make sure `displayedStudios` is being populated by the segment filter logic.

## Additional Debugging

If issues persist, add these temporary logs:

### In OrganizationsService
```typescript
private async loadOrganizationsFromAPI(): Promise<void> {
  console.log('[Orgs Service] Loading from:', this.dataSourceService.isUsingMockData() ? 'mock' : 'database');
  // ... existing code
  console.log('[Orgs Service] Loaded organizations:', this.allOrganizations.length);
  this.organizationsSubject.next(this.allOrganizations);
}
```

### In StudiosService
```typescript
private async loadStudiosFromAPI(): Promise<void> {
  console.log('[Studios Service] Loading from:', this.dataSourceService.isUsingMockData() ? 'mock' : 'database');
  // ... existing code
  console.log('[Studios Service] Loaded studios:', this.allStudios.length);
  this.studiosSubject.next(this.allStudios);
}
```

## Files Modified

1. ✅ `src/app/orgs/orgs.page.ts` - Fixed updateDisplayedOrganizations logic
2. ✅ `src/app/studios-list/studios-list.page.ts` - Added debugging logs

## Expected Results After Fix

### Web App
- ✅ Organizations should display (6 initially, more on scroll)
- ✅ Studios should display based on selected segment

### Android App
- ✅ Organizations should display (same as web)
- ✅ Studios should display when switching to "Nearby" segment
- ⚠️ "My Studios" may be empty if no membership flags are set

## Next Steps

1. Deploy the changes
2. Test on web app - organizations should now display
3. Test on Android app - check console logs
4. If studios still don't show on Android:
   - Switch to "Nearby" segment
   - Or update default segment to "nearby"
   - Or update seeding to set membership flags

## Status

✅ Organizations display fix implemented
✅ Studios debugging logs added
✅ No compilation errors
✅ Ready for testing
