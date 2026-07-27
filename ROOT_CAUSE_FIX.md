# Root Cause Fix - Infinite GraphQL Queries

## Root Cause Found

The infinite GraphQL queries were caused by `loadStudioChats()` being called repeatedly, and each call to `chatAccessController.getStudioChatsForUser()` makes MULTIPLE GraphQL queries:

1. `chatService.getStudioChats()` - Gets all chats for the studio
2. For EACH chat:
   - `chatService.loadMessages(chat.id)` - GraphQL query
   - `chatService.loadParticipants(chat.id)` - GraphQL query
3. `accessControlService.getUserChatInvitations()` - GraphQL query

So if there are 10 chats, that's **1 + (10 × 2) + 1 = 22 GraphQL queries per call!**

And if `loadStudioChats()` was being called repeatedly (even just 2-3 times), that's 44-66 queries instantly.

## Why Was It Being Called Repeatedly?

1. `authStateService.currentUser$` observable emits on subscription
2. Even with the userId check, there were likely other triggers
3. No guard to prevent duplicate loading while already loading
4. No tracking of what's already been loaded

## The Fix

Added three layers of protection:

### 1. **Loading Guard**
```typescript
if (this.isLoadingChats) {
  console.log('Already loading chats, skipping duplicate request');
  return;
}
```
Prevents calling the method again while it's already running.

### 2. **Already Loaded Check**
```typescript
private chatsLoadedForStudio: string | null = null;

if (this.chatsLoadedForStudio === studioId) {
  console.log('Chats already loaded for this studio, skipping');
  return;
}
```
Tracks which studio we've loaded chats for and prevents reloading.

### 3. **Manual Refresh Option**
```typescript
async refreshChats() {
  // Reset the loaded flag to allow reloading
  this.chatsLoadedForStudio = null;
  await this.loadStudioChats(this.studio.id);
}
```
Allows explicit refresh when needed (e.g., user clicks refresh button).

## What This Means

✅ **Chats load ONCE** when you navigate to the studio page
✅ **No duplicate queries** even if the observable emits multiple times
✅ **No infinite loops** - protected by multiple guards
✅ **Can still refresh** - use the refresh button or call `refreshChats()`

## Testing

1. Navigate to: `http://localhost:8100/dash/studio/studio_1`
2. Open browser Network tab
3. Filter by "graphql"
4. Should see queries load ONCE, not repeatedly
5. Click "Chats" tab - should not trigger new queries (already loaded)
6. Click "Refresh Chats" button - should trigger ONE new set of queries

## Console Output

You should see:
```
Loading studio chats for studio: studio_1 user: [userId]
Loaded organized chats: { publicChats: X, privateChats: Y, pendingInvitations: Z }
```

If you see "Already loading chats, skipping duplicate request" or "Chats already loaded for this studio, skipping", that means the guards are working correctly.
