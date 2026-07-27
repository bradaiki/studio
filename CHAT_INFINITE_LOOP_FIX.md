# Chat Infinite GraphQL Query Loop Fix

## Problem
When users navigated to any page (especially the dash/feed page), the application would endlessly query for chat lists, chat participants, and chat messages, causing performance issues and excessive API calls.

## Root Cause
1. **ChatService Initialization**: The `ChatService` is a singleton service (`providedIn: 'root'`) that gets initialized when first injected
2. **Component Dependencies**: The `StudioPage` imports `ChatMessagesComponent`, which injects `ChatService`, triggering initialization
3. **No Caching**: The `loadUserChats()` method had no caching mechanism, so it would load chats from the database every time it was called
4. **No Concurrent Call Prevention**: Multiple calls to `loadUserChats()` could happen simultaneously, each triggering a cascade of GraphQL queries
5. **Cascade Effect**: For each chat loaded, the service would immediately load messages and participants, multiplying the number of queries

## Solution Implemented

### 1. Added Loading Flag (`isLoadingChats`)
- Prevents concurrent calls to `loadUserChats()`
- If a load is already in progress, subsequent calls return the cached data immediately

### 2. Added Caching with Timestamp
- `chatsLoadTimestamp`: Tracks when chats were last loaded
- `CHATS_CACHE_DURATION`: 5-minute cache duration (same as PeopleService)
- If chats were loaded recently (within 5 minutes), returns cached data instead of querying database

### 3. Optimized Message/Participant Loading
- Changed from sequential `for` loop to `Promise.allSettled()` for parallel loading
- Added checks to skip loading if data already exists in cache
- Prevents one failure from blocking other loads

### 4. Added Cache Reset on Logout
- `clearUserData()` now resets `isLoadingChats` flag and `chatsLoadTimestamp`
- Ensures clean state when user logs out

### 5. Added Manual Refresh Method
- `refreshUserChats()`: Allows forcing a refresh by clearing cache timestamp
- Useful for when user explicitly wants to reload chats

## Code Changes

### File: `src/app/services/chat.service.ts`

#### Added Properties:
```typescript
private isLoadingChats = false; // Flag to prevent concurrent loadUserChats calls
private chatsLoadTimestamp: number = 0; // Timestamp of last successful chat load
private readonly CHATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
```

#### Modified `loadUserChats()`:
- Added concurrent call prevention
- Added cache check with timestamp
- Changed to `Promise.allSettled()` for parallel loading
- Added cache existence checks before loading messages/participants
- Updates cache timestamp on successful load

#### Modified `clearUserData()`:
- Resets `isLoadingChats` flag
- Resets `chatsLoadTimestamp`

#### Added `refreshUserChats()`:
- Clears cache timestamp
- Calls `loadUserChats()` to force refresh

## Testing
To verify the fix:
1. Open browser DevTools Network tab
2. Filter for GraphQL requests
3. Navigate to the dash/feed page
4. Verify that chat queries only happen once
5. Navigate away and back within 5 minutes
6. Verify that no new queries are made (using cache)
7. Wait 5+ minutes and navigate back
8. Verify that queries are made again (cache expired)

## Benefits
- **Reduced API Calls**: Chats are cached for 5 minutes, dramatically reducing database queries
- **Better Performance**: Concurrent call prevention stops query cascades
- **Improved UX**: Faster page loads due to caching
- **Consistent Pattern**: Matches the caching pattern used in PeopleService

## Related Files
- `src/app/services/chat.service.ts` - Main fix implementation
- `src/app/services/people.service.ts` - Reference for caching pattern
- `src/app/studio/studio.page.ts` - Component that triggers ChatService initialization

## Status
✅ **FIXED** - Infinite loop prevented with caching and concurrent call prevention
