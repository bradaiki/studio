# Chat Layout Fix - Messages and Input Always Visible

## Problem
The chat messages container and message input area were hidden behind `*ngIf="hasReadAccess && !accessError"` conditions. When `currentChatAccess` was null or `hasReadAccess` returned false, the entire chat interface disappeared, making it impossible to see or use the chat.

## Solution

### 1. Made Messages Container Always Visible
- Removed `*ngIf="hasReadAccess && !accessError"` from `.messages-container`
- Moved the condition to `.messages-list` inside the container
- Added a `.no-access-message` div that shows when there's no access
- The container now always renders with proper height and layout

### 2. Made Message Input Always Visible
- Removed `*ngIf="hasReadAccess && !accessError"` from `.message-input-container`
- Added `[disabled]="isMessageInputDisabled || !hasWriteAccess"` to the textarea
- Added `[disabled]="!canSendMessage || !hasWriteAccess"` to the send button
- The input is now always visible but disabled when user doesn't have write access

### 3. Added No Access Message
- Shows "Select a chat to start messaging" or the access error message
- Centered in the messages container
- Provides clear feedback to the user

### 4. Updated CSS
Added styling for `.no-access-message`:
```scss
.no-access-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
}
```

### 5. Fixed Imports
- Added `IonText` to component imports
- Fixed duplicate `informationCircle` icon in addIcons

## Benefits

1. **Always Visible**: Chat interface is always visible regardless of access state
2. **Clear Feedback**: Users see why they can't send messages (no access, read-only, etc.)
3. **Better UX**: No confusing blank spaces or missing UI elements
4. **Proper Layout**: Flexbox layout works correctly with container always present
5. **Graceful Degradation**: Input is disabled but visible when user lacks write access

## Testing

1. Open chat component without selecting a chat - should see "Select a chat to start messaging"
2. Select a chat with read access - should see messages and disabled input
3. Select a chat with write access - should see messages and enabled input
4. Select a chat with no access - should see access error message and disabled input

## Technical Details

**Before:**
```html
<div class="messages-container" *ngIf="hasReadAccess && !accessError">
  <!-- messages -->
</div>
<div class="message-input-container" *ngIf="hasReadAccess && !accessError">
  <!-- input -->
</div>
```

**After:**
```html
<div class="messages-container">
  <div class="messages-list" *ngIf="hasReadAccess && !accessError">
    <!-- messages -->
  </div>
  <div class="no-access-message" *ngIf="!hasReadAccess || accessError">
    <!-- feedback message -->
  </div>
</div>
<div class="message-input-container">
  <ion-textarea [disabled]="isMessageInputDisabled || !hasWriteAccess">
  </ion-textarea>
  <ion-button [disabled]="!canSendMessage || !hasWriteAccess">
  </ion-button>
</div>
```

The layout now works correctly with the flexbox structure in `.chat-content`.
