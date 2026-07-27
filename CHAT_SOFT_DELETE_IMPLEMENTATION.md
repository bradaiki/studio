# Chat Soft Delete Implementation

## Overview
Implemented soft delete functionality for chats. When a chat is deleted, it's marked as deleted in the database instead of being permanently removed, and it no longer appears in any chat lists.

## Changes Made

### 1. Database Schema (`amplify/data/resource.ts`)
Added two new fields to the Chat model:
- `deletedAt: a.datetime()` - Timestamp when the chat was deleted
- `deletedBy: a.string()` - User ID of who deleted the chat

### 2. Chat Persistence Service (`src/app/services/chat-persistence.service.ts`)

#### Updated `deleteChat()` method:
- Changed from hard delete (removing records) to soft delete
- Now updates the chat with `deletedAt`, `deletedBy`, and sets `isActive: false`
- Preserves all messages, participants, and chat data in the database

#### Updated `loadUserChats()` method:
- Added filter: `deletedAt: { attributeExists: false }`
- Only loads chats that haven't been deleted
- Logs: "Loaded chats from database (excluding deleted)"

#### Updated `getChatById()` method:
- Checks if `result.data.deletedAt` exists
- Returns `null` if chat is deleted
- Prevents deleted chats from being accessed

### 3. Chat Service (`src/app/services/chat.service.ts`)
No changes needed - already removes deleted chats from local cache:
- Filters out from `localChats` array
- Removes from `localMessages` and `localParticipants` maps
- Updates all observables

## Benefits

1. **Data Preservation**: Messages and chat history are preserved in the database
2. **Audit Trail**: Can track who deleted a chat and when
3. **Potential Recovery**: Deleted chats could be restored if needed in the future
4. **Clean UI**: Deleted chats immediately disappear from all lists
5. **Database Integrity**: No cascading deletes needed for messages/participants

## Deployment Required

After these changes, you need to deploy the backend schema:

```bash
npx ampx sandbox
```

Or for production:

```bash
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

## Testing

1. Delete a chat from the chat list
2. Verify it disappears from recent chats
3. Verify it disappears from all chat lists
4. Verify you cannot access the chat by ID
5. Check database to confirm chat still exists with `deletedAt` timestamp
6. Verify other users can no longer see the deleted chat

## Future Enhancements

Potential features that could be added:
- Admin panel to view deleted chats
- Restore deleted chats functionality
- Auto-purge deleted chats after X days
- Per-user delete (hide for one user, not all)
