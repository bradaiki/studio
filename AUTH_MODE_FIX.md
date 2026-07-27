# Auth Mode Fix - Database Records Not Appearing in UI

## Problem

Events, organizations, and studios were successfully seeded to the database but were not appearing in the UI. The browser console showed no errors, but the data wasn't loading.

## Root Cause

The services were using `authMode: 'iam'` to list records from the database, but the Amplify schema is configured with `defaultAuthorizationMode: 'userPool'`. This mismatch caused the API requests to fail silently or return empty results.

```typescript
// amplify/data/resource.ts
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',  // ← Requires authenticated user
  },
});
```

## Solution

Changed all services to use `authMode: 'userPool'` for all database operations (list, create, update, delete).

## Files Modified

### 1. StudiosService (`src/app/services/studios.service.ts`)
- Changed `list()` from `authMode: 'iam'` to `authMode: 'userPool'`
- Already had `userPool` for create, update, delete operations

### 2. EventsService (`src/app/services/events.service.ts`)
- Changed `list()` from `authMode: 'iam'` to `authMode: 'userPool'`

### 3. OrganizationsService (`src/app/services/organizations.service.ts`)
- Changed `list()` from `authMode: 'iam'` to `authMode: 'userPool'`
- Changed `update()` from `authMode: 'iam'` to `authMode: 'userPool'`
- Changed `delete()` from `authMode: 'iam'` to `authMode: 'userPool'`

### 4. PostsService (`src/app/services/posts.service.ts`)
- Changed `list()` from `authMode: 'iam'` to `authMode: 'userPool'`
- Changed `update()` from `authMode: 'iam'` to `authMode: 'userPool'`
- Changed `delete()` from `authMode: 'iam'` to `authMode: 'userPool'`

### 5. ArtsService (`src/app/services/arts.service.ts`)
- Changed client initialization from `authMode: 'iam'` to `authMode: 'userPool'`
- Removed dynamic authMode logic
- Changed `list()` to always use `authMode: 'userPool'`

### 6. PeopleService (`src/app/services/people.service.ts`)
- Removed dynamic authMode logic
- Changed `list()` to always use `authMode: 'userPool'`

### 7. FavoritesService (`src/app/services/favorites.service.ts`)
- Changed `list()` from `authMode: 'iam'` to `authMode: 'userPool'`

## Why This Matters

### IAM vs UserPool Auth Modes

- **IAM**: Used for server-to-server communication or unauthenticated access
- **UserPool**: Used for authenticated user access via Cognito

When the schema's `defaultAuthorizationMode` is set to `userPool`, all operations must be performed by authenticated users. Using `authMode: 'iam'` in this context will fail because:

1. The request doesn't include valid Cognito user credentials
2. The schema's authorization rules expect a user context
3. The API Gateway rejects the request or returns empty results

## Testing

After this fix, you should be able to:

1. ✅ Switch to database mode (cloud icon)
2. ✅ Seed the database (cloud-upload icon)
3. ✅ See organizations on the Organizations page
4. ✅ See events on the Events page
5. ✅ See studios on the Studios page
6. ✅ See posts on the Feed page
7. ✅ See people on the People page
8. ✅ See arts on the Arts page

## Important Notes

### Authentication Required

All database operations now require the user to be authenticated. This means:

- Users must be logged in to view database records
- Guest/unauthenticated access will not work
- The schema authorization rules enforce this at the API level

### Schema Authorization Rules

The schema allows:
- **Guests**: Read-only access (but requires proper authMode)
- **Authenticated users**: Full CRUD access

```typescript
.authorization((allow: any) => [
  allow.guest().to(['read']),
  allow.authenticated().to(['read', 'create', 'update', 'delete']),
])
```

However, since `defaultAuthorizationMode` is `userPool`, even guest read operations must go through the user pool authentication flow.

## Alternative Approaches

If you want to support unauthenticated access, you would need to:

1. Change the schema's `defaultAuthorizationMode` to `iam`
2. Configure IAM roles for unauthenticated users
3. Update the authorization rules to properly handle both IAM and UserPool access

For now, the simplest solution is to require authentication for all database operations.

## Status

✅ All services updated to use `authMode: 'userPool'`
✅ No compilation errors
✅ Ready for testing
