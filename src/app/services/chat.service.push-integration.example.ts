/**
 * Example: How to integrate push notifications into chat.service.ts
 * 
 * Add this code to your existing chat.service.ts file
 */

// 1. Add import at the top of the file
import { ChatPushIntegrationService } from './chat-push-integration.service';

// 2. Add to constructor
constructor(
  private persistenceService: ChatPersistenceService, 
  private authStateService: AuthStateService,
  private accessControlService: AccessControlService,
  private chatPushIntegration: ChatPushIntegrationService // ADD THIS
) {
  console.log('ChatService constructor called');
  this.initializeService();
  this.subscribeToAuthChanges();
}

// 3. Modify the sendMessage method to include push notifications
async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
  console.log('=== SERVICE SEND MESSAGE ===');
  console.log('Request:', request);
  try {
    // ... existing authentication and permission checks ...

    if (!this.currentUserId || !this.currentUserName) {
      console.log('User not authenticated, retrying initialization...');
      await this.retryInitialization();
      
      if (!this.currentUserId || !this.currentUserName) {
        throw new Error('User not authenticated - please log in to send messages');
      }
    }

    const chat = this.getChatById(request.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const accessLevel = await this.accessControlService.checkChatAccess(request.chatId, this.currentUserId);
    
    if (!accessLevel.canWrite) {
      const errorMessage = this.getAccessDeniedMessage(accessLevel.accessReason, chat);
      console.error(`Message send denied for user ${this.currentUserId} to chat ${request.chatId}: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`User ${this.currentUserId} has ${accessLevel.accessReason} access to send message to chat ${request.chatId}`);
    console.log('Sending message to chat:', chat.name, 'via database');

    // Send message via persistence layer
    const newMessage = await this.persistenceService.sendMessage(request);
    
    // Add to local cache
    if (!this.localMessages[request.chatId]) {
      this.localMessages[request.chatId] = [];
    }
    this.localMessages[request.chatId].push(newMessage);

    // Update chat's last message info and interaction timestamp
    chat.lastMessageId = newMessage.id;
    chat.lastMessageAt = newMessage.timestamp;
    chat.updatedAt = new Date();

    // Update observables
    this.messagesSubject.next({ ...this.localMessages });
    this.chatsSubject.next([...this.localChats]);

    // ========== ADD THIS SECTION ==========
    // Send push notifications to all participants (except sender)
    try {
      await this.chatPushIntegration.notifyParticipants(
        chat.id,
        this.currentUserId,
        this.currentUserName,
        request.message,
        chat.participantIds
      );
      console.log('Push notifications sent to chat participants');
    } catch (pushError) {
      // Don't fail the message send if push notifications fail
      console.error('Failed to send push notifications:', pushError);
    }
    // ========== END NEW SECTION ==========

    console.log('Message successfully sent to database:', newMessage);
    console.log('=== END SERVICE SEND MESSAGE ===');
    return newMessage;
        
  } catch (error) {
    console.error('Failed to send message to database:', error);
    console.log('=== END SERVICE SEND MESSAGE (ERROR) ===');
    throw error;
  }
}

/**
 * Example: Initialize push notifications in app.component.ts
 */

/*
import { Component, OnInit } from '@angular/core';
import { PushNotificationService } from './services/push-notification.service';
import { AuthStateService } from './services/auth-state.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private pushNotificationService: PushNotificationService,
    private authStateService: AuthStateService
  ) {}

  async ngOnInit() {
    // Subscribe to auth state changes
    this.authStateService.currentUser$.subscribe(async (user) => {
      if (user) {
        // User logged in - initialize push notifications
        console.log('User logged in, initializing push notifications');
        await this.pushNotificationService.initialize();
      } else {
        // User logged out - remove device token
        console.log('User logged out, removing push token');
        await this.pushNotificationService.removeDeviceToken();
      }
    });
  }
}
*/

/**
 * Example: Add notification settings to user profile
 */

/*
// In your profile or settings page component

import { PushNotificationService } from '../services/push-notification.service';

export class SettingsPage {
  notificationsEnabled = false;

  constructor(private pushService: PushNotificationService) {}

  async ngOnInit() {
    this.notificationsEnabled = await this.pushService.areNotificationsEnabled();
  }

  async toggleNotifications() {
    if (this.notificationsEnabled) {
      await this.pushService.removeDeviceToken();
      this.notificationsEnabled = false;
    } else {
      await this.pushService.initialize();
      this.notificationsEnabled = await this.pushService.areNotificationsEnabled();
    }
  }
}
*/

/**
 * Example: Handle notification tap in chat page
 */

/*
// In your chat page component

import { ActivatedRoute } from '@angular/router';

export class ChatPage implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  async ngOnInit() {
    // Get chat ID from route (set by notification tap)
    const chatId = this.route.snapshot.paramMap.get('id');
    if (chatId) {
      // Load the chat
      await this.loadChat(chatId);
      
      // Mark messages as read
      await this.chatService.markMessagesAsRead(chatId);
    }
  }
}
*/
