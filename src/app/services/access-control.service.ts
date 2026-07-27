import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import { Chat } from '../models/chat.models';
import { ChatErrorHandlerService } from './chat-error-handler.service';
import { ChatLoadingStateService } from './chat-loading-state.service';

export interface ChatAccessLevel {
  canView: boolean;
  canRead: boolean;
  canWrite: boolean;
  canInvite: boolean;
  canManage: boolean;
  accessReason: 'public' | 'invited' | 'studio_member' | 'admin' | 'creator';
}

export interface ChatInvitation {
  id: string;
  chatId: string;
  invitedUserId: string;
  invitedUserHandle?: string; // User's @handle for display
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  expiresAt?: Date;
  message?: string;
}

export enum ChatAccessError {
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVITATION_REQUIRED = 'INVITATION_REQUIRED',
  MEMBERSHIP_REQUIRED = 'MEMBERSHIP_REQUIRED',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_REVOKED = 'INVITATION_REVOKED',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  INVALID_INVITATION = 'INVALID_INVITATION'
}

export class ChatAccessException extends Error {
  constructor(
    public errorCode: ChatAccessError,
    public chatId: string,
    public userId: string,
    message?: string
  ) {
    super(message || errorCode);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AccessControlService {
  private client = generateClient<Schema>();

  constructor(
    private errorHandler: ChatErrorHandlerService,
    private loadingState: ChatLoadingStateService
  ) {
    console.log('AccessControlService initialized');
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

  /**
   * Check comprehensive access permissions for a user to a specific chat
   */
  async checkChatAccess(chatId: string, userId: string): Promise<ChatAccessLevel> {
    const operationKey = `check_access_${chatId}_${userId}`;
    
    try {
      // Start loading state
      await this.loadingState.startLoading(
        operationKey,
        'Checking chat access',
        'Verifying permissions...'
      );

      console.log('Checking chat access for user:', userId, 'chat:', chatId);

      // Check offline cache first
      if (this.loadingState.shouldUseCachedData()) {
        const cachedPermissions = this.loadingState.getCachedAccessPermissions(chatId, userId);
        if (cachedPermissions) {
          console.log('Using cached access permissions (offline mode)');
          await this.loadingState.stopLoading(operationKey);
          return {
            canView: cachedPermissions.canView,
            canRead: cachedPermissions.canRead,
            canWrite: cachedPermissions.canWrite,
            canInvite: cachedPermissions.canInvite,
            canManage: cachedPermissions.canManage,
            accessReason: cachedPermissions.accessReason as any
          };
        }
      }

      // Update loading progress
      this.loadingState.updateLoadingProgress(operationKey, 25, 'Loading chat details...');

      // Get the chat details
      const chatResult = await this.client.models.Chat.get({ id: chatId });
      
      if (chatResult.errors || !chatResult.data) {
        await this.loadingState.stopLoading(operationKey);
        throw new ChatAccessException(
          ChatAccessError.CHAT_NOT_FOUND,
          chatId,
          userId,
          'Chat not found'
        );
      }

      const chat = chatResult.data;
      
      // Update loading progress
      this.loadingState.updateLoadingProgress(operationKey, 50, 'Checking permissions...');

      let accessLevel: ChatAccessLevel;

      // Check if user is the creator (full access)
      if (chat.createdBy === userId) {
        accessLevel = {
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: true,
          canManage: true,
          accessReason: 'creator'
        };
      }
      // Check if chat is public
      else if (chat.accessLevel === 'public' || (!chat.invitationRequired && !chat.studioMembershipRequired)) {
        accessLevel = {
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        };
      }
      // For private chats, check if user has an accepted invitation
      else if (chat.invitationRequired || chat.accessLevel === 'private') {
        this.loadingState.updateLoadingProgress(operationKey, 75, 'Checking invitations...');
        const hasValidInvitation = await this.hasValidInvitation(chatId, userId);
        
        if (hasValidInvitation) {
          accessLevel = {
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'invited'
          };
        } else {
          accessLevel = {
            canView: false,
            canRead: false,
            canWrite: false,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          };
        }
      }
      // Check studio membership if required
      else if (chat.studioMembershipRequired && chat.studioId) {
        this.loadingState.updateLoadingProgress(operationKey, 75, 'Checking studio membership...');
        const isStudioMember = await this.isStudioMember(chat.studioId, userId);
        
        if (isStudioMember) {
          accessLevel = {
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'studio_member'
          };
        } else {
          accessLevel = {
            canView: false,
            canRead: false,
            canWrite: false,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          };
        }
      }
      // Check if user is in participant list (legacy support)
      else {
        const participantIds = chat.participantIds || [];
        if (participantIds.includes(userId)) {
          accessLevel = {
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'invited'
          };
        } else {
          // No access
          accessLevel = {
            canView: false,
            canRead: false,
            canWrite: false,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          };
        }
      }

      // Cache the result for offline use
      this.loadingState.cacheAccessPermissions(chatId, userId, accessLevel);

      // Complete loading
      this.loadingState.updateLoadingProgress(operationKey, 100, 'Access check complete');
      await this.loadingState.stopLoading(operationKey);

      return accessLevel;

    } catch (error) {
      await this.loadingState.stopLoading(operationKey);
      console.error('Error checking chat access:', error);
      
      if (error instanceof ChatAccessException) {
        throw error;
      }
      
      // Use error handler for graceful degradation
      return await this.errorHandler.handleGeneralError(
        error,
        'checking chat access',
        {
          showToast: false, // Don't show toast for access checks
          logError: true,
          fallbackValue: {
            canView: false,
            canRead: false,
            canWrite: false,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          }
        }
      );
    }
  }

  /**
   * Simple check if user can access a chat (view and read)
   */
  async canUserAccessChat(chatId: string, userId: string): Promise<boolean> {
    const operationKey = `can_access_${chatId}_${userId}`;
    
    try {
      // For quick access checks, don't show loading spinner but track state
      await this.loadingState.startLoading(
        operationKey,
        'Checking access',
        undefined,
        false // No spinner for quick checks
      );

      // Check offline cache first for quick response
      if (this.loadingState.shouldUseCachedData()) {
        const cachedPermissions = this.loadingState.getCachedAccessPermissions(chatId, userId);
        if (cachedPermissions) {
          await this.loadingState.stopLoading(operationKey);
          return cachedPermissions.canView && cachedPermissions.canRead;
        }
      }

      const access = await this.checkChatAccess(chatId, userId);
      await this.loadingState.stopLoading(operationKey);
      return access.canView && access.canRead;
    } catch (error) {
      await this.loadingState.stopLoading(operationKey);
      console.error('Error checking user chat access:', error);
      
      // Use error handler for graceful degradation
      return await this.errorHandler.handleAccessControlError(
        error,
        'checking user chat access',
        {
          showToast: false, // Don't show toast for access checks
          logError: true,
          fallbackValue: false
        }
      );
    }
  }

  /**
   * Check if user can send messages to a chat
   */
  async canUserSendMessage(chatId: string, userId: string): Promise<boolean> {
    try {
      const access = await this.checkChatAccess(chatId, userId);
      return access.canWrite;
    } catch (error) {
      console.error('Error checking user message permissions:', error);
      
      // Use error handler for graceful degradation
      return await this.errorHandler.handleAccessControlError(
        error,
        'checking message permissions',
        {
          showToast: false, // Don't show toast for permission checks
          logError: true,
          fallbackValue: false
        }
      );
    }
  }

  /**
   * Invite a user to a private chat
   */
  async inviteUserToChat(chatId: string, userId: string, invitedBy: string): Promise<ChatInvitation> {
    const operationKey = `invite_user_${chatId}_${userId}`;
    
    try {
      // Start loading with spinner for user-initiated actions
      await this.loadingState.startLoading(
        operationKey,
        'Sending invitation',
        'Preparing invitation...',
        true // Show spinner for user actions
      );

      console.log('Inviting user to chat:', { chatId, userId, invitedBy });

      // Update progress
      this.loadingState.updateLoadingProgress(operationKey, 20, 'Checking permissions...');

      // Check if inviter has permission to invite
      const inviterAccess = await this.checkChatAccess(chatId, invitedBy);
      if (!inviterAccess.canInvite && !inviterAccess.canManage && inviterAccess.accessReason !== 'creator') {
        await this.loadingState.stopLoading(operationKey);
        throw new ChatAccessException(
          ChatAccessError.ACCESS_DENIED,
          chatId,
          invitedBy,
          'You do not have permission to invite users to this chat'
        );
      }

      // Update progress
      this.loadingState.updateLoadingProgress(operationKey, 40, 'Checking existing access...');

      // Check if user is already a member or has a pending invitation
      const existingAccess = await this.canUserAccessChat(chatId, userId);
      if (existingAccess) {
        await this.loadingState.stopLoading(operationKey);
        throw new ChatAccessException(
          ChatAccessError.ALREADY_MEMBER,
          chatId,
          userId,
          'User already has access to this chat'
        );
      }

      // Update progress
      this.loadingState.updateLoadingProgress(operationKey, 60, 'Checking pending invitations...');

      // Check for existing pending invitation
      const existingInvitation = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: chatId },
          invitedUserId: { eq: userId },
          status: { eq: 'pending' }
        }
      });

      if (existingInvitation.data && existingInvitation.data.length > 0) {
        await this.loadingState.stopLoading(operationKey);
        throw new ChatAccessException(
          ChatAccessError.ALREADY_MEMBER,
          chatId,
          userId,
          'User already has a pending invitation'
        );
      }

      // Update progress
      this.loadingState.updateLoadingProgress(operationKey, 80, 'Creating invitation...');

      // Create the invitation
      const invitationData = {
        chatId,
        invitedUserId: userId,
        invitedBy,
        invitedAt: new Date().toISOString(),
        status: 'pending' as const,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      const result = await this.client.models.ChatInvitation.create(invitationData);

      if (result.errors || !result.data) {
        await this.loadingState.stopLoading(operationKey);
        throw new Error(`Failed to create invitation: ${result.errors?.map(e => e.message).join(', ')}`);
      }

      const invitation: ChatInvitation = {
        id: result.data.id,
        chatId: result.data.chatId,
        invitedUserId: result.data.invitedUserId,
        invitedBy: result.data.invitedBy,
        invitedAt: this.convertToDate(result.data.invitedAt),
        status: result.data.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(result.data.expiresAt),
        message: result.data.message || undefined
      };

      // Complete loading
      this.loadingState.updateLoadingProgress(operationKey, 100, 'Invitation sent!');
      await this.loadingState.stopLoading(operationKey);

      console.log('Chat invitation created:', invitation);
      return invitation;

    } catch (error) {
      await this.loadingState.stopLoading(operationKey);
      console.error('Error inviting user to chat:', error);
      
      if (error instanceof ChatAccessException) {
        // Re-throw access exceptions with user-friendly handling
        throw await this.errorHandler.handleAccessControlError(
          error,
          'inviting user to chat',
          {
            showToast: true,
            logError: false, // Already logged above
            fallbackValue: undefined
          }
        );
      }
      
      // Handle other errors with network/general error handling
      throw await this.errorHandler.handleGeneralError(
        error,
        'inviting user to chat',
        {
          showToast: true,
          logError: false, // Already logged above
          fallbackValue: undefined
        }
      );
    }
  }

  /**
   * Revoke user access to a chat
   */
  async revokeUserAccess(chatId: string, userId: string, revokedBy: string): Promise<void> {
    try {
      console.log('Revoking user access to chat:', { chatId, userId, revokedBy });

      // Check if revoker has permission to revoke access
      const revokerAccess = await this.checkChatAccess(chatId, revokedBy);
      if (!revokerAccess.canManage && revokerAccess.accessReason !== 'creator') {
        throw new ChatAccessException(
          ChatAccessError.ACCESS_DENIED,
          chatId,
          revokedBy,
          'You do not have permission to revoke access to this chat'
        );
      }

      // Cannot revoke access from the chat creator
      const chatResult = await this.client.models.Chat.get({ id: chatId });
      if (chatResult.data && chatResult.data.createdBy === userId) {
        throw new ChatAccessException(
          ChatAccessError.ACCESS_DENIED,
          chatId,
          userId,
          'Cannot revoke access from chat creator'
        );
      }

      // Revoke any pending invitations
      const pendingInvitations = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: chatId },
          invitedUserId: { eq: userId },
          status: { eq: 'pending' }
        }
      });

      if (pendingInvitations.data) {
        for (const invitation of pendingInvitations.data) {
          await this.client.models.ChatInvitation.update({
            id: invitation.id,
            status: 'revoked'
          });
        }
      }

      // Revoke accepted invitations
      const acceptedInvitations = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: chatId },
          invitedUserId: { eq: userId },
          status: { eq: 'accepted' }
        }
      });

      if (acceptedInvitations.data) {
        for (const invitation of acceptedInvitations.data) {
          await this.client.models.ChatInvitation.update({
            id: invitation.id,
            status: 'revoked'
          });
        }
      }

      // Remove from participant list if present
      if (chatResult.data) {
        const updatedParticipantIds = (chatResult.data.participantIds || []).filter(id => id !== userId);
        await this.client.models.Chat.update({
          id: chatId,
          participantIds: updatedParticipantIds
        });
      }

      // Deactivate participant record
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

      console.log('User access revoked from chat:', chatId, userId);

    } catch (error) {
      console.error('Error revoking user access:', error);
      
      if (error instanceof ChatAccessException) {
        throw error;
      }
      
      throw new ChatAccessException(
        ChatAccessError.ACCESS_DENIED,
        chatId,
        userId,
        'Failed to revoke user access'
      );
    }
  }

  /**
   * Check if user has a valid (accepted, non-expired) invitation to a chat
   */
  private async hasValidInvitation(chatId: string, userId: string): Promise<boolean> {
    try {
      const invitations = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: chatId },
          invitedUserId: { eq: userId },
          status: { eq: 'accepted' }
        }
      });

      if (!invitations.data || invitations.data.length === 0) {
        return false;
      }

      // Check if any invitation is still valid (not expired)
      const now = new Date();
      return invitations.data.some(invitation => {
        if (!invitation.expiresAt) return true; // No expiration
        return new Date(invitation.expiresAt) > now;
      });

    } catch (error) {
      console.error('Error checking invitation validity:', error);
      return false;
    }
  }

  /**
   * Get all chat invitations for a user (including accepted ones for join date tracking)
   */
  async getAllUserChatInvitations(userId: string): Promise<ChatInvitation[]> {
    try {
      console.log('Getting all chat invitations for user:', userId);

      const invitationsResult = await this.client.models.ChatInvitation.list({
        filter: {
          invitedUserId: { eq: userId }
        }
      });

      if (invitationsResult.errors || !invitationsResult.data) {
        console.error('Error fetching all invitations:', invitationsResult.errors);
        return [];
      }

      const invitations: ChatInvitation[] = invitationsResult.data.map(invitation => ({
        id: invitation.id,
        chatId: invitation.chatId,
        invitedUserId: invitation.invitedUserId,
        invitedBy: invitation.invitedBy,
        invitedAt: this.convertToDate(invitation.invitedAt),
        status: invitation.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(invitation.expiresAt),
        message: invitation.message || undefined
      }));

      console.log('Found', invitations.length, 'total invitations for user:', userId);
      return invitations;

    } catch (error) {
      console.error('Error getting all user chat invitations:', error);
      return [];
    }
  }

  /**
   * Get all chat invitations for a user
   */
  async getUserChatInvitations(userId: string): Promise<ChatInvitation[]> {
    try {
      console.log('Getting chat invitations for user:', userId);

      const invitationsResult = await this.client.models.ChatInvitation.list({
        filter: {
          invitedUserId: { eq: userId }
        }
      });

      if (invitationsResult.errors || !invitationsResult.data) {
        console.error('Error fetching invitations:', invitationsResult.errors);
        return [];
      }

      const invitations: ChatInvitation[] = invitationsResult.data.map(invitation => ({
        id: invitation.id,
        chatId: invitation.chatId,
        invitedUserId: invitation.invitedUserId,
        invitedBy: invitation.invitedBy,
        invitedAt: this.convertToDate(invitation.invitedAt),
        status: invitation.status as 'pending' | 'accepted' | 'declined' | 'revoked',
        expiresAt: this.convertToOptionalDate(invitation.expiresAt),
        message: invitation.message || undefined
      }));

      // Filter out expired invitations and update their status
      const now = new Date();
      const validInvitations: ChatInvitation[] = [];

      for (const invitation of invitations) {
        if (invitation.expiresAt && invitation.expiresAt < now && invitation.status === 'pending') {
          // Mark expired invitation as revoked
          try {
            await this.client.models.ChatInvitation.update({
              id: invitation.id,
              status: 'revoked'
            });
            invitation.status = 'revoked';
          } catch (error) {
            console.error('Error updating expired invitation:', error);
          }
        }
        validInvitations.push(invitation);
      }

      console.log('Found', validInvitations.length, 'invitations for user:', userId);
      return validInvitations;

    } catch (error) {
      console.error('Error getting user chat invitations:', error);
      return [];
    }
  }

  /**
   * Accept a chat invitation
   */
  async acceptChatInvitation(invitationId: string): Promise<void> {
    try {
      console.log('Accepting chat invitation:', invitationId);

      // Get the invitation details
      const invitationResult = await this.client.models.ChatInvitation.get({ id: invitationId });
      
      if (invitationResult.errors || !invitationResult.data) {
        throw new ChatAccessException(
          ChatAccessError.INVALID_INVITATION,
          '',
          '',
          'Invitation not found'
        );
      }

      const invitation = invitationResult.data;

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        throw new ChatAccessException(
          ChatAccessError.INVITATION_REVOKED,
          invitation.chatId,
          invitation.invitedUserId,
          `Invitation is ${invitation.status}`
        );
      }

      // Check if invitation has expired
      if (invitation.expiresAt) {
        const expirationDate = new Date(invitation.expiresAt);
        if (expirationDate < new Date()) {
          // Mark as revoked and throw error
          await this.client.models.ChatInvitation.update({
            id: invitationId,
            status: 'revoked'
          });
          
          throw new ChatAccessException(
            ChatAccessError.INVITATION_EXPIRED,
            invitation.chatId,
            invitation.invitedUserId,
            'Invitation has expired'
          );
        }
      }

      // Update invitation status to accepted
      await this.client.models.ChatInvitation.update({
        id: invitationId,
        status: 'accepted'
      });

      // Add user to chat participants if not already present
      const chatResult = await this.client.models.Chat.get({ id: invitation.chatId });
      
      if (chatResult.data) {
        const currentParticipants = chatResult.data.participantIds || [];
        if (!currentParticipants.includes(invitation.invitedUserId)) {
          const updatedParticipants = [...currentParticipants, invitation.invitedUserId];
          await this.client.models.Chat.update({
            id: invitation.chatId,
            participantIds: updatedParticipants
          });
        }

        // Create or update ChatParticipant record
        const existingParticipants = await this.client.models.ChatParticipant.list({
          filter: {
            chatId: { eq: invitation.chatId },
            userId: { eq: invitation.invitedUserId }
          }
        });

        if (existingParticipants.data && existingParticipants.data.length > 0) {
          // Reactivate existing participant
          await this.client.models.ChatParticipant.update({
            id: existingParticipants.data[0].id,
            isActive: true,
            joinedAt: new Date().toISOString()
          });
        } else {
          // Create new participant record
          await this.client.models.ChatParticipant.create({
            chatId: invitation.chatId,
            userId: invitation.invitedUserId,
            userName: invitation.invitedUserId, // Use userId as userName for now
            joinedAt: new Date().toISOString(),
            isActive: true
          });
        }
      }

      console.log('Chat invitation accepted:', invitationId);

      // TODO: Send notification to chat members about new participant
      // This would integrate with the notification system when available

    } catch (error) {
      console.error('Error accepting chat invitation:', error);
      
      if (error instanceof ChatAccessException) {
        throw error;
      }
      
      throw new ChatAccessException(
        ChatAccessError.ACCESS_DENIED,
        '',
        '',
        'Failed to accept chat invitation'
      );
    }
  }

  /**
   * Decline a chat invitation
   */
  async declineChatInvitation(invitationId: string): Promise<void> {
    try {
      console.log('Declining chat invitation:', invitationId);

      // Get the invitation details
      const invitationResult = await this.client.models.ChatInvitation.get({ id: invitationId });
      
      if (invitationResult.errors || !invitationResult.data) {
        throw new ChatAccessException(
          ChatAccessError.INVALID_INVITATION,
          '',
          '',
          'Invitation not found'
        );
      }

      const invitation = invitationResult.data;

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        throw new ChatAccessException(
          ChatAccessError.INVITATION_REVOKED,
          invitation.chatId,
          invitation.invitedUserId,
          `Invitation is ${invitation.status}`
        );
      }

      // Update invitation status to declined
      await this.client.models.ChatInvitation.update({
        id: invitationId,
        status: 'declined'
      });

      console.log('Chat invitation declined:', invitationId);

    } catch (error) {
      console.error('Error declining chat invitation:', error);
      
      if (error instanceof ChatAccessException) {
        throw error;
      }
      
      throw new ChatAccessException(
        ChatAccessError.ACCESS_DENIED,
        '',
        '',
        'Failed to decline chat invitation'
      );
    }
  }

  /**
   * Check if user is a member of a studio
   */
  private async isStudioMember(studioId: string, userId: string): Promise<boolean> {
    try {
      const memberships = await this.client.models.StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: userId },
          isActive: { eq: true }
        }
      });

      return !!(memberships.data && memberships.data.length > 0);

    } catch (error) {
      console.error('Error checking studio membership:', error);
      return false;
    }
  }
}