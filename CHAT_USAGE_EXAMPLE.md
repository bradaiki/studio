# Chat System Usage Examples

This document provides practical examples of how to integrate and use the chat system in your application.

## 🏗️ Basic Integration

### 1. Studio Page Integration

Update your studio page to include chat functionality:

```typescript
// src/app/studio-detail/studio.page.ts
import { Component, OnInit } from '@angular/core';
import { ChatMessagesComponent } from '../components/chat-messages/chat-messages.component';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-studio',
  templateUrl: './studio.page.html',
  styleUrls: ['./studio.page.scss'],
  standalone: true,
  imports: [
    // ... existing imports
    ChatMessagesComponent
  ]
})
export class StudioPage implements OnInit {
  studio: any; // Your studio object

  constructor(
    private chatService: ChatService
    // ... other services
  ) {}

  ngOnInit() {
    // ... existing initialization
  }

  // Chat event handlers
  onChatMessageClick(message: any) {
    console.log('Message clicked:', message);
  }

  onSendChatMessage(messageText: string) {
    console.log('Message sent:', messageText);
    // Optional: Add custom logic after message is sent
  }

  onLeaveChat(chatId: string) {
    console.log('User left chat:', chatId);
    // Optional: Handle user leaving chat
  }

  onMuteChat(event: { chatId: string; isMuted: boolean }) {
    console.log('Chat mute toggled:', event);
    // Optional: Handle mute status change
  }

  onChatInfo(chatId: string) {
    console.log('Chat info requested:', chatId);
    // Optional: Show chat information modal
  }
}
```

```html
<!-- src/app/studio-detail/studio.page.html -->
<ion-content>
  <!-- Existing studio content -->
  <div class="studio-info">
    <!-- Studio details -->
  </div>

  <!-- Chat section -->
  <div class="studio-chat-section">
    <app-chat-messages
      [studioId]="studio?.id"
      [studioName]="studio?.name"
      [maxHeight]="'400px'"
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
  </div>
</ion-content>
```

### 2. Chat List Page

Create a dedicated chat list page:

```typescript
// src/app/chats/chats.page.ts
import { Component } from '@angular/core';
import { ChatListComponent } from '../components/chat-list/chat-list.component';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  standalone: true,
  imports: [
    ChatListComponent,
    // ... other imports
  ]
})
export class ChatsPage {
  constructor() {}
}
```

```html
<!-- src/app/chats/chats.page.html -->
<app-chat-list></app-chat-list>
```

## 🎯 Advanced Usage

### 1. Creating Custom Chats

```typescript
// In any component
import { ChatService } from '../services/chat.service';

export class MyComponent {
  constructor(private chatService: ChatService) {}

  async createGroupChat() {
    try {
      const newChat = await this.chatService.createChat({
        name: 'Training Partners',
        description: 'Chat for training partners',
        type: 'group',
        participantIds: ['user1', 'user2', 'user3'],
        settings: {
          allowLeaving: true,
          allowMuting: true,
          allowInviting: true,
          isPublic: false,
          maxParticipants: 20
        }
      });
      
      console.log('Group chat created:', newChat);
    } catch (error) {
      console.error('Failed to create group chat:', error);
    }
  }

  async createPrivateChat(otherUserId: string) {
    try {
      const privateChat = await this.chatService.createChat({
        name: 'Private Chat',
        type: 'private',
        participantIds: [otherUserId],
        settings: {
          allowLeaving: false,
          allowMuting: true,
          allowInviting: false,
          isPublic: false,
          maxParticipants: 2
        }
      });
      
      console.log('Private chat created:', privateChat);
    } catch (error) {
      console.error('Failed to create private chat:', error);
    }
  }
}
```

### 2. Listening to Chat Updates

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../services/chat.service';

export class MyComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  unreadCount = 0;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    // Listen to all chats
    const chatsSub = this.chatService.chats$.subscribe(chats => {
      console.log('Chats updated:', chats.length);
    });

    // Listen to unread counts
    const unreadSub = this.chatService.unreadCounts$.subscribe(counts => {
      this.unreadCount = counts.reduce((total, count) => total + count.unreadCount, 0);
    });

    // Listen to chat list with full details
    const chatListSub = this.chatService.getChatList().subscribe(chatList => {
      console.log('Chat list updated:', chatList);
    });

    this.subscriptions.push(chatsSub, unreadSub, chatListSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### 3. Message Search

```typescript
export class SearchComponent {
  constructor(private chatService: ChatService) {}

  async searchMessages(query: string) {
    try {
      const results = await this.chatService.searchMessages({
        query: query,
        // Optional filters
        chatId: 'specific-chat-id',
        senderId: 'specific-user-id',
        messageType: 'text',
        fromDate: new Date('2024-01-01'),
        toDate: new Date()
      });
      
      console.log('Search results:', results);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
}
```

## 🎨 UI Customization

### 1. Custom Chat Styling

```scss
// Custom styles for chat messages
.studio-chat-section {
  margin: 20px 0;
  
  app-chat-messages {
    --chat-background: var(--ion-color-light);
    --message-bubble-own: var(--ion-color-primary);
    --message-bubble-other: var(--ion-color-light-shade);
    
    .chat-messages-card {
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}
```

### 2. Compact Mode Usage

```html
<!-- Use compact mode in sidebars or small spaces -->
<app-chat-messages
  [studioId]="studio.id"
  [studioName]="studio.name"
  [compact]="true"
  [maxHeight]="'200px'"
  [showHeader]="false">
</app-chat-messages>
```

## 🔧 Configuration Options

### 1. Chat Settings

```typescript
// Configure chat behavior
const chatSettings = {
  allowLeaving: true,      // Users can leave the chat
  allowMuting: true,       // Users can mute notifications
  allowInviting: false,    // Users can invite others (admin only)
  isPublic: false,         // Chat is private
  maxParticipants: 100     // Maximum number of participants
};
```

### 2. Component Configuration

```html
<app-chat-messages
  [studioId]="studio.id"
  [studioName]="studio.name"
  [maxHeight]="'350px'"     <!-- Maximum height of chat container -->
  [showHeader]="true"       <!-- Show/hide chat header -->
  [compact]="false"         <!-- Compact mode (shows only last 3 messages) -->
  [canLeave]="true"         <!-- Show leave chat option -->
  [canMute]="true">         <!-- Show mute chat option -->
</app-chat-messages>
```

## 🚀 Performance Tips

### 1. Lazy Loading

```typescript
// Load chat components only when needed
const ChatMessagesComponent = await import('../components/chat-messages/chat-messages.component');
```

### 2. Pagination

```typescript
// Load messages with pagination
async loadMoreMessages(chatId: string, beforeMessageId?: string) {
  const messages = await this.chatService.loadMessages(chatId, {
    pageSize: 20,
    beforeMessageId: beforeMessageId
  });
  return messages;
}
```

### 3. Memory Management

```typescript
// Always unsubscribe to prevent memory leaks
ngOnDestroy() {
  this.subscriptions.forEach(sub => sub.unsubscribe());
}
```

## 🔒 Security Best Practices

### 1. Input Validation

```typescript
// Validate message content before sending
validateMessage(message: string): boolean {
  if (!message || message.trim().length === 0) return false;
  if (message.length > 1000) return false; // Max length
  // Add more validation as needed
  return true;
}

async sendMessage(message: string) {
  if (!this.validateMessage(message)) {
    console.error('Invalid message');
    return;
  }
  
  // Send message
  await this.chatService.sendMessage({
    chatId: this.chatId,
    message: message.trim()
  });
}
```

### 2. Permission Checks

```typescript
// Check user permissions before actions
canUserLeaveChat(chat: Chat, userId: string): boolean {
  return chat.settings.allowLeaving && 
         chat.participantIds.includes(userId) &&
         chat.createdBy !== userId; // Creator cannot leave
}

canUserMuteChat(chat: Chat, userId: string): boolean {
  return chat.settings.allowMuting && 
         chat.participantIds.includes(userId);
}
```

## 🧪 Testing

### 1. Mock Data Testing

```typescript
// The system automatically provides mock data for testing
// No additional setup required for development

// To test with specific scenarios:
const mockChat = {
  id: 'test-chat',
  name: 'Test Chat',
  type: 'group' as const,
  participantIds: ['user1', 'user2'],
  // ... other properties
};
```

### 2. Integration Testing

```typescript
// Test chat creation
it('should create a new chat', async () => {
  const chatService = TestBed.inject(ChatService);
  
  const newChat = await chatService.createChat({
    name: 'Test Chat',
    type: 'group',
    participantIds: ['user1', 'user2']
  });
  
  expect(newChat.name).toBe('Test Chat');
  expect(newChat.type).toBe('group');
});
```

## 📱 Mobile Optimization

### 1. Touch Interactions

```scss
// Optimize for mobile touch
.chat-item {
  min-height: 60px; // Minimum touch target size
  
  &:active {
    background-color: var(--ion-color-light-shade);
  }
}
```

### 2. Responsive Design

```scss
// Responsive chat layout
@media (max-width: 768px) {
  .studio-chat-section {
    margin: 10px;
    
    app-chat-messages {
      --max-height: 300px; // Smaller on mobile
    }
  }
}
```

## 🔄 Migration from Existing Chat

If you have existing chat functionality:

### 1. Gradual Migration

```typescript
// Keep existing chat working while migrating
export class StudioPage {
  useNewChatSystem = true; // Feature flag

  constructor(
    private chatService: ChatService,
    private legacyChatService: LegacyChatService
  ) {}

  getChatService() {
    return this.useNewChatSystem ? this.chatService : this.legacyChatService;
  }
}
```

### 2. Data Migration

```typescript
// Migrate existing chat data
async migrateLegacyChats() {
  const legacyChats = await this.legacyChatService.getAllChats();
  
  for (const legacyChat of legacyChats) {
    await this.chatService.createChat({
      name: legacyChat.name,
      type: 'studio',
      studioId: legacyChat.studioId,
      participantIds: legacyChat.members
    });
  }
}
```

This comprehensive chat system provides a solid foundation for real-time communication in your Aikido studio management application. The modular design allows for easy customization and extension as your needs grow.