import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import {
  Chat,
  ChatMessage,
  ChatParticipant,
  ChatUnreadCount,
  CreateChatRequest,
  SendMessageRequest,
  ChatLoadOptions,
  ChatSettings,
  ChatInvitation,
  CreateInvitationRequest,
  ChatTypeConversionRequest
} from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatPersistenceService {
  private client = generateClient<Schema>();

  constructor() {
    console.log('Chat persistence service initialized');
  }

  private convertToDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return new Date();
  }

  private convertToOptionalDate(value: any): Date | undefined {
    if (!value) return undefined;
    return this.convertToDate(value);
  }

  // ==================== CHAT PERSISTENCE ====================

  /**
   * Create a new chat in the database
   */
  async createChat(request: CreateChatRequest): Promise<Chat> {
    try {
      const user = await getCurrentUser();
      const userId = user.userId;

      // Determine access control settings based on request
      const accessLevel = request.accessLevel || (request.type === 'studio' ? 'public' : 'private');
      const invitationRequired = request.invitationRequired ?? (accessLevel === 'private');
      const studioMembershipRequired = request.studioMembershipRequired ?? false;

      // Validate private chat requirements
      if (accessLevel === 'private' && invitationRequired && request.participantIds.length === 0) {
        throw new Error('Private chats with invitation requirements must have initial participants specified');
      }

      const defaultSettings: ChatSettings = {
        allowLeaving: true,
        allowMuting: true,
        allowInviting: request.type === 'group' || accessLevel === 'private',
        isPublic: accessLevel === 'public',
        maxParticipants: request.type === 'studio' ? 1000 : 50
      };

      const chatData = {
        name: request.name,
        description: request.description,
        type: request.type,
        studioId: request.studioId,
        participantIds: [userId, ...request.participantIds],
        createdBy: userId,
        isActive: true,
        settings: JSON.stringify({ ...defaultSettings, ...request.settings }),
        accessLevel,
        invitationRequired,
        studioMembershipRequired
      };

      const result = await this.client.models.Chat.create(chatData);

      if (result.errors) {
        throw new Error(`Failed to create chat: ${result.errors.map(e => e.message).join(', ')}`);
      }

      if (!result.data) {
        throw new Error('No data returned from chat creation');
      }

      // Create participant records for all users
      const chatId = result.data.id;
      await this.createInitialParticipants(chatId, [userId, ...request.participantIds], userId);

      // For private chats with invitation requirements, create invitations for initial participants
      if (accessLevel === 'private' && invitationRequired && request.participantIds.length > 0) {
        await this.createInitialInvitations(chatId, request.participantIds, userId);
      }

      // Convert to our Chat interface
      const chat: Chat = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        type: result.data.type as 'studio' | 'private' | 'group',
        studioId: result.data.studioId || undefined,
        participantIds: (result.data.participantIds || []).filter((id): id is string => id !== null),
        createdBy: result.data.createdBy,
        // @ts-ignore - GraphQL schema type issue
        createdAt: this.convertToDate(result.data.createdAt as any),
        // @ts-ignore - GraphQL schema type issue
        updatedAt: this.convertToDate(result.data.updatedAt as any),
        lastMessageId: result.data.lastMessageId || undefined,
        // @ts-ignore - GraphQL schema type issue
        lastMessageAt: this.convertToOptionalDate(result.data.lastMessageAt),
        isActive: result.data.isActive ?? true,
        settings: JSON.parse((result.data.settings as string) || '{}'),
        accessLevel: result.data.accessLevel as 'public' | 'private' | 'restricted' || 'public',
        invitationRequired: result.data.invitationRequired ?? false,
        studioMembershipRequired: result.data.studioMembershipRequired ?? false
      };

      console.log('Chat created in database with access control:', chat);
      return chat;
    } catch (error) {
      console.error('Failed to create chat in database:', error);
      throw error;
    }
  }

  /**
   * Load all chats for the current user
   */
  async loadUserChats(): Promise<Chat[]> {
    try {
      const user = await getCurrentUser();
      const userId = user.userId;

      // Query chats where user is a participant and chat is not deleted
      const result = await this.client.models.Chat.list({
        filter: {
          participantIds: { contains: userId },
          isActive: { eq: true },
          deletedAt: { attributeExists: false }
        }
      });

      if (result.errors) {
        throw new Error(`Failed to load chats: ${result.errors.map(e => e.message).join(', ')}`);
      }

      const chats: Chat[] = (result.data || []).map(chatData => ({
        id: chatData.id,
        name: chatData.name,
        description: chatData.description || undefined,
        type: chatData.type as 'studio' | 'private' | 'group',
        studioId: chatData.studioId || undefined,
        participantIds: (chatData.participantIds || []).filter((id): id is string => id !== null),
        createdBy: chatData.createdBy,
        // @ts-ignore - GraphQL schema type issue
        createdAt: this.convertToDate(chatData.createdAt as any),
        // @ts-ignore - GraphQL schema type issue
        updatedAt: this.convertToDate(chatData.updatedAt as any),
        lastMessageId: chatData.lastMessageId || undefined,
        // @ts-ignore - GraphQL schema type issue
        lastMessageAt: this.convertToOptionalDate(chatData.lastMessageAt),
        isActive: chatData.isActive ?? true,
        settings: JSON.parse((chatData.settings as string) || '{}'),
        accessLevel: chatData.accessLevel as 'public' | 'private' | 'restricted' || 'public',
        invitationRequired: chatData.invitationRequired ?? false,
        studioMembershipRequired: chatData.studioMembershipRequired ?? false
      }));

      console.log('Loaded chats from database (excluding deleted):', chats.length);
      return chats;
    } catch (error) {
      console.error('Failed to load chats from database:', error);
      throw error;
    }
  }

  /**
   * Update chat settings
   */
  async updateChatSettings(chatId: string, settings: Partial<ChatSettings>): Promise<boolean> {
    try {
      // First get the current chat to merge settings
      const currentChat = await this.client.models.Chat.get({ id: chatId });
      
      if (currentChat.errors || !currentChat.data) {
        throw new Error('Chat not found');
      }

      const currentSettings = JSON.parse((currentChat.data.settings as string) || '{}');
      const updatedSettings = { ...currentSettings, ...settings };

      const result = await this.client.models.Chat.update({
        id: chatId,
        settings: JSON.stringify(updatedSettings)
      });

      if (result.errors) {
        throw new Error(`Failed to update chat settings: ${result.errors.map(e => e.message).join(', ')}`);
      }

      console.log('Chat settings updated in database:', chatId);
      return true;
    } catch (error) {
      console.error('Failed to update chat settings in database:', error);
      return false;
    }
  }

  // ==================== MESSAGE PERSISTENCE ====================

  /**
   * Load messages for a specific chat with pagination
   */
  async loadMessages(chatId: string, options: ChatLoadOptions = {}, currentUserId?: string): Promise<ChatMessage[]> {
    try {
      const pageSize = options.pageSize || 50;
      
      let filter: any = { chatId: { eq: chatId } };
      
      // Add pagination filters if provided
      if (options.beforeMessageId) {
        // In a real implementation, you'd need to handle pagination properly
        // This is a simplified version
        filter.id = { lt: options.beforeMessageId };
      }

      const result = await this.client.models.ChatMessage.list({
        filter,
        limit: pageSize
      });

      if (result.errors) {
        throw new Error(`Failed to load messages: ${result.errors.map(e => e.message).join(', ')}`);
      }

      // Get current user ID - use provided one or fetch from auth
      let userId = currentUserId;
      if (!userId) {
        const user = await getCurrentUser();
        userId = user.userId;
      }

      const messages: ChatMessage[] = (result.data || []).map(msgData => ({
        id: msgData.id,
        chatId: msgData.chatId,
        senderId: msgData.senderId,
        senderName: msgData.senderName,
        senderAvatar: msgData.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msgData.senderName || 'User')}&background=92949c&color=fff&size=150`,
        message: msgData.message,
        // @ts-ignore - GraphQL schema type issue
        timestamp: this.convertToDate(msgData.createdAt as any),
        isRead: msgData.isRead ?? false,
        isOwn: msgData.senderId === userId,
        messageType: (msgData.messageType as 'text' | 'image' | 'file' | 'system') || 'text',
        replyToId: msgData.replyToId || undefined,
        // @ts-ignore - GraphQL schema type issue
        editedAt: this.convertToOptionalDate(msgData.editedAt),
        // @ts-ignore - GraphQL schema type issue
        deletedAt: this.convertToOptionalDate(msgData.deletedAt)
      }));

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      console.log('Loaded messages from database:', messages.length);
      console.log('Current user ID for ownership:', userId);
      console.log('Message ownership breakdown:', {
        own: messages.filter(m => m.isOwn).length,
        others: messages.filter(m => !m.isOwn).length
      });
      
      // Debug: Log first few messages with ownership info
      messages.slice(0, 3).forEach((msg, index) => {
        console.log(`Message ${index}: senderId=${msg.senderId}, isOwn=${msg.isOwn}, senderName=${msg.senderName}`);
      });

      return messages;
    } catch (error) {
      console.error('Failed to load messages from database:', error);
      throw error;
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const user = await getCurrentUser();
      const userId = user.userId;
      const userName = user.username || 'Unknown User';
      
      // For now, use a default avatar. In a real app, this would come from user profile
      const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3880ff&color=fff&size=150`;

      const messageData = {
        chatId: request.chatId,
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        message: request.message,
        messageType: request.messageType || 'text',
        replyToId: request.replyToId,
        isRead: false // Will be marked as read for sender separately
      };

      console.log('Creating message with data:', messageData);

      const result = await this.client.models.ChatMessage.create(messageData);

      if (result.errors) {
        throw new Error(`Failed to send message: ${result.errors.map(e => e.message).join(', ')}`);
      }

      if (!result.data) {
        throw new Error('No data returned from message creation');
      }

      // Update the chat's last message info
      await this.client.models.Chat.update({
        id: request.chatId,
        lastMessageId: result.data.id,
        lastMessageAt: result.data.createdAt
      });

      // Create the message object
      const message: ChatMessage = {
        id: result.data.id,
        chatId: result.data.chatId,
        senderId: result.data.senderId,
        senderName: result.data.senderName,
        senderAvatar: result.data.senderAvatar || userAvatar,
        message: result.data.message,
        // @ts-ignore - GraphQL schema type issue
        timestamp: this.convertToDate(result.data.createdAt as any),
        isRead: true, // Own messages are always read
        isOwn: true,
        messageType: (result.data.messageType as 'text' | 'image' | 'file' | 'system') || 'text',
        replyToId: result.data.replyToId || undefined
      };

      console.log('Message sent to database:', message);
      return message;
    } catch (error) {
      console.error('Failed to send message to database:', error);
      throw error;
    }
  }

  /**
   * Delete a chat from the database (soft delete)
   */
  async deleteChat(chatId: string): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      const userId = user.userId;

      // Soft delete: mark the chat as deleted instead of removing it
      const result = await this.client.models.Chat.update({
        id: chatId,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        isActive: false
      });

      if (result.errors) {
        throw new Error(`Failed to delete chat: ${result.errors.map(e => e.message).join(', ')}`);
      }

      console.log('Chat soft deleted from database:', chatId);
      return true;
    } catch (error) {
      console.error('Failed to delete chat from database:', error);
      throw error;
    }
  }
  async markMessagesAsRead(chatId: string, messageIds?: string[]): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      const userId = user.userId;

      if (messageIds && messageIds.length > 0) {
        // Mark specific messages as read
        const updatePromises = messageIds.map(messageId =>
          this.client.models.ChatMessage.update({
            id: messageId,
            isRead: true
          })
        );

        await Promise.all(updatePromises);
      } else {
        // Mark all unread messages in the chat as read
        const unreadMessages = await this.client.models.ChatMessage.list({
          filter: {
            chatId: { eq: chatId },
            isRead: { eq: false },
            senderId: { ne: userId } // Don't update own messages
          }
        });

        if (unreadMessages.data) {
          const updatePromises = unreadMessages.data.map(message =>
            this.client.models.ChatMessage.update({
              id: message.id,
              isRead: true
            })
          );

          await Promise.all(updatePromises);
        }
      }

      // Update unread count
      await this.updateUnreadCount(chatId, userId);

      console.log('Messages marked as read in database:', chatId);
      return true;
    } catch (error) {
      console.error('Failed to mark messages as read in database:', error);
      return false;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const result = await this.client.models.ChatMessage.update({
        id: messageId,
        message: '[Message deleted]',
        deletedAt: new Date().toISOString()
      });

      if (result.errors) {
        throw new Error(`Failed to delete message: ${result.errors.map(e => e.message).join(', ')}`);
      }

      console.log('Message deleted in database:', messageId);
      return true;
    } catch (error) {
      console.error('Failed to delete message in database:', error);
      return false;
    }
  }

  // ==================== PARTICIPANT PERSISTENCE ====================

  /**
   * Load participants for a specific chat
   */
  async loadParticipants(chatId: string): Promise<ChatParticipant[]> {
    try {
      const result = await this.client.models.ChatParticipant.list({
        filter: {
          chatId: { eq: chatId },
          isActive: { eq: true }
        }
      });

      if (result.errors) {
        throw new Error(`Failed to load participants: ${result.errors.map(e => e.message).join(', ')}`);
      }

      const participants: ChatParticipant[] = (result.data || []).map(participantData => ({
        id: participantData.id,
        chatId: participantData.chatId,
        userId: participantData.userId,
        userName: participantData.userName,
        userAvatar: participantData.userAvatar || undefined,
        role: (participantData.role as 'admin' | 'moderator' | 'member') || 'member',
        // @ts-ignore - GraphQL schema type issue
        joinedAt: this.convertToDate(participantData.joinedAt as any),
        // @ts-ignore - GraphQL schema type issue
        lastReadAt: this.convertToOptionalDate(participantData.lastReadAt as any),
        isMuted: participantData.isMuted ?? false,
        isActive: participantData.isActive ?? true
      }));

      console.log('Loaded participants from database:', participants.length);
      return participants;
    } catch (error) {
      console.error('Failed to load participants from database:', error);
      throw error;
    }
  }

  /**
   * Add participant to chat
   */
  async addParticipant(chatId: string, userId: string, userName: string, userAvatar?: string): Promise<boolean> {
    try {
      // Create participant record
      const participantData = {
        chatId,
        userId,
        userName,
        userAvatar,
        role: 'member' as 'admin' | 'moderator' | 'member',
        joinedAt: new Date().toISOString(),
        isMuted: false,
        isActive: true
      };

      const result = await this.client.models.ChatParticipant.create(participantData);

      if (result.errors) {
        throw new Error(`Failed to add participant: ${result.errors.map(e => e.message).join(', ')}`);
      }

      // Update chat's participant list
      const chat = await this.client.models.Chat.get({ id: chatId });
      if (chat.data) {
        const updatedParticipantIds = [...chat.data.participantIds, userId];
        await this.client.models.Chat.update({
          id: chatId,
          participantIds: updatedParticipantIds
        });
      }

      console.log('Participant added to database:', chatId, userId);
      return true;
    } catch (error) {
      console.error('Failed to add participant to database:', error);
      return false;
    }
  }

  /**
   * Remove participant from chat
   */
  async removeParticipant(chatId: string, userId: string): Promise<boolean> {
    try {
      // Find and deactivate participant record
      const participants = await this.client.models.ChatParticipant.list({
        filter: {
          chatId: { eq: chatId },
          userId: { eq: userId }
        }
      });

      if (participants.data && participants.data.length > 0) {
        await this.client.models.ChatParticipant.update({
          id: participants.data[0].id,
          isActive: false
        });
      }

      // Update chat's participant list
      const chat = await this.client.models.Chat.get({ id: chatId });
      if (chat.data) {
        const updatedParticipantIds = chat.data.participantIds.filter(id => id !== userId);
        await this.client.models.Chat.update({
          id: chatId,
          participantIds: updatedParticipantIds
        });
      }

      console.log('Participant removed from database:', chatId, userId);
      return true;
    } catch (error) {
      console.error('Failed to remove participant from database:', error);
      return false;
    }
  }

  /**
   * Toggle mute status for a participant
   */
  async toggleMuteParticipant(chatId: string, userId: string, isMuted: boolean): Promise<boolean> {
    try {
      const participants = await this.client.models.ChatParticipant.list({
        filter: {
          chatId: { eq: chatId },
          userId: { eq: userId }
        }
      });

      if (participants.data && participants.data.length > 0) {
        await this.client.models.ChatParticipant.update({
          id: participants.data[0].id,
          isMuted
        });

        console.log('Participant mute status updated in database:', chatId, userId, isMuted);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to update participant mute status in database:', error);
      return false;
    }
  }

  // ==================== UNREAD COUNT PERSISTENCE ====================

  /**
   * Get unread count for a user in a specific chat
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const result = await this.client.models.ChatUnreadCount.list({
        filter: {
          chatId: { eq: chatId },
          userId: { eq: userId }
        }
      });

      if (result.data && result.data.length > 0) {
        return result.data[0].unreadCount ?? 0;
      }

      return 0;
    } catch (error) {
      console.error('Failed to get unread count from database:', error);
      return 0;
    }
  }

  /**
   * Update unread count for a user in a specific chat
   */
  async updateUnreadCount(chatId: string, userId: string): Promise<void> {
    try {
      // Count unread messages for this user in this chat
      const unreadMessages = await this.client.models.ChatMessage.list({
        filter: {
          chatId: { eq: chatId },
          isRead: { eq: false },
          senderId: { ne: userId } // Don't count own messages
        }
      });

      const unreadCount = unreadMessages.data?.length || 0;

      // Check if unread count record exists
      const existingCount = await this.client.models.ChatUnreadCount.list({
        filter: {
          chatId: { eq: chatId },
          userId: { eq: userId }
        }
      });

      if (existingCount.data && existingCount.data.length > 0) {
        // Update existing record
        await this.client.models.ChatUnreadCount.update({
          id: existingCount.data[0].id,
          unreadCount,
          lastReadAt: new Date().toISOString()
        });
      } else {
        // Create new record
        await this.client.models.ChatUnreadCount.create({
          chatId,
          userId,
          unreadCount,
          lastReadAt: new Date().toISOString()
        });
      }

      console.log('Unread count updated in database:', chatId, userId, unreadCount);
    } catch (error) {
      console.error('Failed to update unread count in database:', error);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Create initial participant records when a chat is created
   */
  private async createInitialParticipants(chatId: string, participantIds: string[], createdBy: string): Promise<void> {
    try {
      const participantPromises = participantIds.map(async (userId, index) => {
        // In a real app, you'd fetch user details from a user service
        const userName = userId === createdBy ? 'Chat Creator' : `User ${userId}`;
        const role = userId === createdBy ? 'admin' : 'member';

        return this.client.models.ChatParticipant.create({
          chatId,
          userId,
          userName,
          role: role as 'admin' | 'moderator' | 'member',
          joinedAt: new Date().toISOString(),
          isMuted: false,
          isActive: true
        });
      });

      await Promise.all(participantPromises);
      console.log('Initial participants created for chat:', chatId);
    } catch (error) {
      console.error('Failed to create initial participants:', error);
    }
  }

  // ==================== INVITATION PERSISTENCE ====================

  /**
   * Create a new chat invitation
   */
  async createInvitation(request: CreateInvitationRequest): Promise<ChatInvitation> {
    try {
      const user = await getCurrentUser();
      const invitedBy = user.userId;

      const invitationData = {
        chatId: request.chatId,
        invitedUserId: request.invitedUserId,
        invitedBy,
        invitedAt: new Date().toISOString(),
        status: 'pending' as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: request.expiresAt?.toISOString(),
        message: request.message
      };

      const result = await this.client.models.ChatInvitation.create(invitationData);

      if (result.errors) {
        throw new Error(`Failed to create invitation: ${result.errors.map(e => e.message).join(', ')}`);
      }

      if (!result.data) {
        throw new Error('No data returned from invitation creation');
      }

      const invitation: ChatInvitation = {
        id: result.data.id,
        chatId: result.data.chatId,
        invitedUserId: result.data.invitedUserId,
        invitedBy: result.data.invitedBy,
        invitedAt: this.convertToDate(result.data.invitedAt as any),
        status: result.data.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(result.data.expiresAt),
        message: result.data.message || undefined
      };

      console.log('Chat invitation created in database:', invitation);
      return invitation;
    } catch (error) {
      console.error('Failed to create chat invitation in database:', error);
      throw error;
    }
  }

  /**
   * Update invitation status
   */
  async updateInvitationStatus(invitationId: string, status: 'accepted' | 'declined' | 'revoked'): Promise<boolean> {
    try {
      const result = await this.client.models.ChatInvitation.update({
        id: invitationId,
        status
      });

      if (result.errors) {
        throw new Error(`Failed to update invitation status: ${result.errors.map(e => e.message).join(', ')}`);
      }

      console.log('Invitation status updated in database:', invitationId, status);
      return true;
    } catch (error) {
      console.error('Failed to update invitation status in database:', error);
      return false;
    }
  }

  /**
   * Get invitations for a specific user
   */
  async getInvitationsByUser(userId: string): Promise<ChatInvitation[]> {
    try {
      const result = await this.client.models.ChatInvitation.list({
        filter: {
          invitedUserId: { eq: userId },
          status: { eq: 'pending' }
        }
      });

      if (result.errors) {
        throw new Error(`Failed to get user invitations: ${result.errors.map(e => e.message).join(', ')}`);
      }

      const invitations: ChatInvitation[] = (result.data || []).map(invitationData => ({
        id: invitationData.id,
        chatId: invitationData.chatId,
        invitedUserId: invitationData.invitedUserId,
        invitedBy: invitationData.invitedBy,
        invitedAt: this.convertToDate(invitationData.invitedAt as any),
        status: invitationData.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(invitationData.expiresAt),
        message: invitationData.message || undefined
      }));

      console.log('Loaded user invitations from database:', invitations.length);
      return invitations;
    } catch (error) {
      console.error('Failed to get user invitations from database:', error);
      throw error;
    }
  }

  /**
   * Get invitations for a specific chat
   */
  async getInvitationsByChat(chatId: string): Promise<ChatInvitation[]> {
    try {
      const result = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: chatId }
        }
      });

      if (result.errors) {
        throw new Error(`Failed to get chat invitations: ${result.errors.map(e => e.message).join(', ')}`);
      }

      const invitations: ChatInvitation[] = (result.data || []).map(invitationData => ({
        id: invitationData.id,
        chatId: invitationData.chatId,
        invitedUserId: invitationData.invitedUserId,
        invitedBy: invitationData.invitedBy,
        invitedAt: this.convertToDate(invitationData.invitedAt as any),
        status: invitationData.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(invitationData.expiresAt),
        message: invitationData.message || undefined
      }));

      console.log('Loaded chat invitations from database:', invitations.length);
      return invitations;
    } catch (error) {
      console.error('Failed to get chat invitations from database:', error);
      throw error;
    }
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    try {
      const now = new Date();
      
      // Get all pending invitations that have expired
      const result = await this.client.models.ChatInvitation.list({
        filter: {
          status: { eq: 'pending' },
          expiresAt: { lt: now.toISOString() }
        }
      });

      if (result.errors) {
        throw new Error(`Failed to get expired invitations: ${result.errors.map(e => e.message).join(', ')}`);
      }

      let cleanedCount = 0;
      if (result.data && result.data.length > 0) {
        // Update expired invitations to 'revoked' status
        const updatePromises = result.data.map(invitation =>
          this.client.models.ChatInvitation.update({
            id: invitation.id,
            status: 'revoked' as 'pending' | 'accepted' | 'declined' | 'revoked'
          })
        );

        await Promise.all(updatePromises);
        cleanedCount = result.data.length;
      }

      console.log('Cleaned up expired invitations:', cleanedCount);
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
      return 0;
    }
  }

  /**
   * Get invitation by ID
   */
  async getInvitationById(invitationId: string): Promise<ChatInvitation | null> {
    try {
      const result = await this.client.models.ChatInvitation.get({ id: invitationId });

      if (result.errors || !result.data) {
        return null;
      }

      const invitation: ChatInvitation = {
        id: result.data.id,
        chatId: result.data.chatId,
        invitedUserId: result.data.invitedUserId,
        invitedBy: result.data.invitedBy,
        invitedAt: this.convertToDate(result.data.invitedAt as any),
        status: result.data.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(result.data.expiresAt),
        message: result.data.message || undefined
      };

      console.log('Loaded invitation from database:', invitation);
      return invitation;
    } catch (error) {
      console.error('Failed to get invitation by ID from database:', error);
      return null;
    }
  }

  // ==================== CHAT TYPE CONVERSION ====================

  /**
   * Convert chat type and access control settings
   */
  async convertChatType(request: ChatTypeConversionRequest): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      const userId = user.userId;

      // Get current chat to verify permissions
      const currentChat = await this.client.models.Chat.get({ id: request.chatId });
      
      if (currentChat.errors || !currentChat.data) {
        throw new Error('Chat not found');
      }

      // Verify user has permission to modify chat (creator or admin)
      if (currentChat.data.createdBy !== userId) {
        // Check if user is admin participant
        const participants = await this.client.models.ChatParticipant.list({
          filter: {
            chatId: { eq: request.chatId },
            userId: { eq: userId },
            role: { eq: 'admin' },
            isActive: { eq: true }
          }
        });

        if (!participants.data || participants.data.length === 0) {
          throw new Error('Insufficient permissions to modify chat type');
        }
      }

      // Handle conversion from public to private - requires confirmation
      if (currentChat.data.accessLevel === 'public' && request.newAccessLevel === 'private' && !request.confirmationRequired) {
        throw new Error('Converting public chat to private requires explicit confirmation');
      }

      // Update chat access control settings
      const updateData: any = {
        id: request.chatId,
        accessLevel: request.newAccessLevel,
        invitationRequired: request.invitationRequired ?? (request.newAccessLevel === 'private'),
        studioMembershipRequired: request.studioMembershipRequired ?? false
      };

      // Update settings to reflect new access level
      const currentSettings = JSON.parse((currentChat.data.settings as string) || '{}');
      const updatedSettings = {
        ...currentSettings,
        isPublic: request.newAccessLevel === 'public',
        allowInviting: request.newAccessLevel === 'private' || currentSettings.allowInviting
      };
      updateData.settings = JSON.stringify(updatedSettings);

      const result = await this.client.models.Chat.update(updateData);

      if (result.errors) {
        throw new Error(`Failed to convert chat type: ${result.errors.map(e => e.message).join(', ')}`);
      }

      // If converting to private with invitation requirements, create invitations for existing participants
      if (request.newAccessLevel === 'private' && (request.invitationRequired ?? true)) {
        await this.migrateExistingParticipantsToInvitations(request.chatId, userId);
      }

      console.log('Chat type converted successfully:', request.chatId, request.newAccessLevel);
      return true;
    } catch (error) {
      console.error('Failed to convert chat type:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID with access control fields
   */
  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const result = await this.client.models.Chat.get({ id: chatId });

      if (result.errors || !result.data) {
        return null;
      }

      // Check if chat is deleted
      if (result.data.deletedAt) {
        console.log('Chat is deleted, returning null:', chatId);
        return null;
      }

      const chat: Chat = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        type: result.data.type as 'studio' | 'private' | 'group',
        studioId: result.data.studioId || undefined,
        participantIds: (result.data.participantIds || []).filter((id): id is string => id !== null),
        createdBy: result.data.createdBy,
        // @ts-ignore - GraphQL schema type issue
        createdAt: this.convertToDate(result.data.createdAt as any),
        // @ts-ignore - GraphQL schema type issue
        updatedAt: this.convertToDate(result.data.updatedAt as any),
        lastMessageId: result.data.lastMessageId || undefined,
        // @ts-ignore - GraphQL schema type issue
        lastMessageAt: this.convertToOptionalDate(result.data.lastMessageAt),
        isActive: result.data.isActive ?? true,
        settings: JSON.parse((result.data.settings as string) || '{}'),
        accessLevel: result.data.accessLevel as 'public' | 'private' | 'restricted' || 'public',
        invitationRequired: result.data.invitationRequired ?? false,
        studioMembershipRequired: result.data.studioMembershipRequired ?? false
      };

      return chat;
    } catch (error) {
      console.error('Failed to get chat by ID:', error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Create initial invitations for private chats
   */
  private async createInitialInvitations(chatId: string, participantIds: string[], invitedBy: string): Promise<void> {
    try {
      const invitationPromises = participantIds.map(userId => 
        this.client.models.ChatInvitation.create({
          chatId,
          invitedUserId: userId,
          invitedBy,
          invitedAt: new Date().toISOString(),
          status: 'accepted' as 'pending' | 'accepted' | 'declined' | 'revoked', // Auto-accept for initial participants
          message: 'You have been added to this private chat'
        })
      );

      await Promise.all(invitationPromises);
      console.log('Initial invitations created for private chat:', chatId);
    } catch (error) {
      console.error('Failed to create initial invitations:', error);
    }
  }

  /**
   * Migrate existing participants to invitation-based access when converting to private
   */
  private async migrateExistingParticipantsToInvitations(chatId: string, convertedBy: string): Promise<void> {
    try {
      // Get all active participants except the one who converted the chat
      const participants = await this.client.models.ChatParticipant.list({
        filter: {
          chatId: { eq: chatId },
          isActive: { eq: true },
          userId: { ne: convertedBy }
        }
      });

      if (participants.data && participants.data.length > 0) {
        const invitationPromises = participants.data.map(participant =>
          this.client.models.ChatInvitation.create({
            chatId,
            invitedUserId: participant.userId,
            invitedBy: convertedBy,
            invitedAt: new Date().toISOString(),
            status: 'accepted' as 'pending' | 'accepted' | 'declined' | 'revoked', // Auto-accept existing participants
            message: 'This chat has been converted to private. Your access has been preserved.'
          })
        );

        await Promise.all(invitationPromises);
        console.log('Migrated existing participants to invitation-based access:', chatId);
      }
    } catch (error) {
      console.error('Failed to migrate existing participants to invitations:', error);
    }
  }
}