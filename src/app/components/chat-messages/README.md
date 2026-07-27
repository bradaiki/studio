# Chat Messages Component

A reusable chat messages component for displaying and sending messages within studio contexts with infinite scroll support.

## Features

- **Real-time messaging interface** with message bubbles
- **Infinite scroll** for loading older messages as you scroll up
- **User avatars and timestamps** for better context
- **Unread message indicators** with badge counts
- **Chat management** with mute/unmute and leave chat options
- **Responsive design** that works on mobile and desktop
- **Compact mode** for smaller spaces
- **Message status indicators** (sent/read)
- **Auto-scrolling** to latest messages
- **Keyboard shortcuts** (Enter to send)
- **Pagination** with configurable page size

## Usage

```html
<app-chat-messages
  [studioId]="studio.id"
  [studioName]="studio.name"
  [maxHeight]="'350px'"
  [showHeader]="true"
  [compact]="false"
  [canLeave]="true"
  [canMute]="true"
  (messageClick)="onChatMessageClick($event)"
  (sendMessage)="onSendChatMessage($event)"
  (leaveChat)="onLeaveChat($event)"
  (muteChat)="onMuteChat($event)"
  (chatInfo)="onChatInfo($event)">
</app-chat-messages>
```

## Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `studioId` | string | `''` | ID of the studio for context |
| `studioName` | string | `''` | Name of the studio displayed in header |
| `maxHeight` | string | `'400px'` | Maximum height of the messages container |
| `showHeader` | boolean | `true` | Whether to show the chat header |
| `compact` | boolean | `false` | Compact mode shows only last 3 messages |
| `canLeave` | boolean | `true` | Whether user can leave the chat |
| `canMute` | boolean | `true` | Whether user can mute the chat |

## Outputs

| Event | Type | Description |
|-------|------|-------------|
| `messageClick` | `ChatMessage` | Emitted when a message is clicked |
| `sendMessage` | `string` | Emitted when a new message is sent |
| `leaveChat` | `string` | Emitted when user leaves the chat (chatId) |
| `muteChat` | `{chatId: string, isMuted: boolean}` | Emitted when mute status changes |
| `chatInfo` | `string` | Emitted when user requests chat info (chatId) |

## ChatMessage Interface

```typescript
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isOwn: boolean;
}
```

## Chat Management

The component includes a dropdown menu (three dots) in the header with the following options:

### **Mute/Unmute Chat**
- **Mute**: Disables message input and shows muted indicator
- **Unmute**: Re-enables message input and removes muted indicator
- **Visual Feedback**: Muted icon appears next to chat title
- **Input Disabled**: Message input becomes non-interactive when muted

### **Leave Chat**
- **Confirmation Dialog**: Shows alert before leaving
- **Destructive Action**: Clearly marked in red
- **Event Emission**: Notifies parent component to handle leaving

### **Chat Info**
- **Details Access**: Opens chat information (participants, settings, etc.)
- **Context Aware**: Provides relevant chat metadata

### **Permissions**
- **`canLeave`**: Controls whether leave option is shown
- **`canMute`**: Controls whether mute option is shown
- **Flexible**: Can be configured per chat type

## Infinite Scroll

The component automatically loads older messages when the user scrolls to the top:
- **Page Size**: 20 messages per load (configurable)
- **Position**: Top of the messages container
- **Loading Indicator**: Shows "Loading older messages..." with spinner
- **Auto-disable**: Stops loading when all messages are retrieved
- **Scroll Position**: Maintains scroll position when new messages are loaded

## Performance

- **Lazy Loading**: Only loads recent messages initially
- **Efficient Rendering**: Uses virtual scrolling concepts
- **Memory Management**: Manages message arrays efficiently
- **Smooth Scrolling**: Preserves scroll position during loads

## Styling

The component uses CSS custom properties for theming:
- `--ion-color-primary` for message bubbles and accents
- `--ion-color-light` for backgrounds
- `--ion-color-medium` for secondary text
- Supports both light and dark themes

## Integration

Currently integrated into:
- **Studios Page**: Shows chat for the displayed studio
- Can be easily added to other pages like studio detail, profile, etc.

## Future Enhancements

- Real-time updates via WebSocket
- Message reactions and replies
- File/image sharing
- Message search and filtering
- Push notifications for new messages
- Message threading
- Typing indicators
- Message editing and deletion