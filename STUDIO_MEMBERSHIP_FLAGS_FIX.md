# Studio Membership Flags Fix

## Issue

Studios were not appearing in the Android app because the default "My Studios" segment filters for studios where the user has membership (`isMember`, `isInstructor`, or `isStudioChief` flags). The seeded studios didn't have these flags set, resulting in an empty list.

## Solution

Updated both the seeding service and mock data service to automatically set membership flags on a subset of studios:

- **First 15 studios**: `isMember: true` (user is a member)
- **First 8 studios**: `isInstructor: true` (user is an instructor)
- **First 3 studios**: `isStudioChief: true` (user is the studio chief)

This creates a realistic distribution where:
- 15 studios show in "My Studios" segment (any membership)
- The user has instructor privileges at 8 studios
- The user is the chief at 3 studios

## Files Modified

### 1. DataSeedingService (`src/app/services/data-seeding.service.ts`)

Modified `seedStudios()` method to add membership flags based on index:

```typescript
const studioToCreate = {
  // ... other fields
  isMember: index < 15,
  isInstructor: index < 8,
  isStudioChief: index < 3
};
```

### 2. MockDataService (`src/app/services/mock-data.service.ts`)

Modified `getMockStudios()` method to add the same flags for consistency in mock mode:

```typescript
this.cachedStudios = generateMockStudios(107).map((studio, index) => ({
  ...studio,
  id: `mock-studio-${index + 1}`,
  isMember: index < 15,
  isInstructor: index < 8,
  isStudioChief: index < 3
}));
```

## Testing

After deploying and seeding the database:

### Web App
1. Navigate to Studios page
2. Default "My Studios" segment should show 15 studios
3. Switch to "Favorites" to see verified studios
4. Switch to "Nearby" to see all 107 studios

### Android App
1. Navigate to Studios page
2. Default "My Studios" segment should show 15 studios
3. Console should log: `[Studios List] My studios filtered: 15 from 107`
4. All segments should work correctly

## Segment Breakdown

After seeding with these changes:

| Segment | Filter Logic | Expected Count |
|---------|-------------|----------------|
| My Studios | `isMember \|\| isInstructor \|\| isStudioChief` | 15 studios |
| Favorites | `verified === true` | Varies (depends on verified flag) |
| Nearby | All studios | 107 studios |

## Re-seeding Required

**Important:** You need to re-seed the database for these changes to take effect:

1. Switch to database mode (cloud icon)
2. Click the seed button (cloud-upload icon)
3. Wait for success message
4. Navigate to Studios page
5. Verify "My Studios" shows 15 studios

## Mock Mode

The changes also apply to mock mode, so you'll see the same behavior when using local mock data.

## Future Enhancements

For a production app, you would:

1. **Use real membership data**: Query `StudioMembership` table to determine actual user memberships
2. **Dynamic favorites**: Integrate with `FavoritesService` to show actually favorited studios
3. **Geolocation**: Use device location to show truly nearby studios
4. **User preferences**: Allow users to customize which studios appear in "My Studios"

## Status

✅ Seeding service updated with membership flags
✅ Mock data service updated for consistency
✅ No compilation errors
✅ Build successful
✅ Ready for re-seeding and testing
