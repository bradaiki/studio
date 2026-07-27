import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import { ChatInvitation } from '../models/chat.models';
import { InAppNotificationService } from './in-app-notification.service';

export interface SendInvitationRequest {
  chatId: string;
  invitedUserId: string;
  message?: string;
  expiresAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatInvitationService {
  private client = generateClient<Schema>();

  constructor(
    private notificationService: InAppNotificationService
  ) {
    console.log('ChatInvitationService initialized');
  }

  /**
   * Send a chat invitation to a user
   */
  async sendInvitation(request: SendInvitationRequest): Promise<ChatInvitation> {
    try {
      const currentUser = await getCurrentUser();
      const inviterId = currentUser.userId;

      // Check if invitation already exists
      const existingInvitations = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: request.chatId },
          invitedUserId: { eq: request.invitedUserId },
          status: { eq: 'pending' }
        }
      });

      if (existingInvitations.data && existingInvitations.data.length > 0) {
        throw new Error('User already has a pending invitation to this chat');
      }

      // Create the invitation
      const result = await this.client.models.ChatInvitation.create({
        chatId: request.chatId,
        invitedUserId: request.invitedUserId,
        invitedBy: inviterId,
        invitedAt: new Date().toISOString(),
        status: 'pending',
        expiresAt: request.expiresAt?.toISOString(),
        message: request.message
      });

      if (result.errors || !result.data) {
        throw new Error('Failed to create invitation');
      }

      const invitation: ChatInvitation = {
        id: result.data.id,
        chatId: result.data.chatId,
        invitedUserId: result.data.invitedUserId,
        invitedBy: result.data.invitedBy,
        invitedAt: new Date(result.data.invitedAt),
        status: result.data.status as any,
        expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
        message: result.data.message || undefined
      };

      // Send in-app notification to the invited user
      await this.notificationService.showNotification(
        'Chat Invitation',
        request.message || 'You have been invited to join a chat',
        request.chatId,
        `/chat/${request.chatId}`
      );

      console.log('Chat invitation sent successfully:', invitation.id);
      return invitation;
    } catch (error) {
      console.error('Failed to send chat invitation:', error);
      throw error;
    }
  }

  /**
   * Accept a chat invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Get the invitation
      const invitationResult = await this.client.models.ChatInvitation.get({ id: invitationId });
      
      if (invitationResult.errors || !invitationResult.data) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationResult.data;

      // Verify the invitation is for the current user
      if (invitation.invitedUserId !== userId) {
        throw new Error('This invitation is not for you');
      }

      // Check if invitation is expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        throw new Error('This invitation has expired');
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        throw new Error('This invitation is no longer valid');
      }

      // Update invitation status to accepted
      await this.client.models.ChatInvitation.update({
        id: invitationId,
        status: 'accepted'
      });

      // Add user to chat participants
      const chatResult = await this.client.models.Chat.get({ id: invitation.chatId });
      
      if (chatResult.data) {
        const currentParticipants = chatResult.data.participantIds || [];
        if (!currentParticipants.includes(userId)) {
          await this.client.models.Chat.update({
            id: invitation.chatId,
            participantIds: [...currentParticipants, userId]
          });
        }

        // Create ChatParticipant record
        await this.client.models.ChatParticipant.create({
          chatId: invitation.chatId,
          userId: userId,
          userName: currentUser.username || 'User',
          role: 'member',
          joinedAt: new Date().toISOString(),
          isActive: true
        });
      }

      // Send notification to inviter
      await this.notificationService.showNotification(
        'Invitation Accepted',
        'Your chat invitation was accepted',
        invitation.chatId,
        `/chat/${invitation.chatId}`
      );

      console.log('Chat invitation accepted successfully');
    } catch (error) {
      console.error('Failed to accept chat invitation:', error);
      throw error;
    }
  }

  /**
   * Decline a chat invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Get the invitation
      const invitationResult = await this.client.models.ChatInvitation.get({ id: invitationId });
      
      if (invitationResult.errors || !invitationResult.data) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationResult.data;

      // Verify the invitation is for the current user
      if (invitation.invitedUserId !== userId) {
        throw new Error('This invitation is not for you');
      }

      // Update invitation status to declined
      await this.client.models.ChatInvitation.update({
        id: invitationId,
        status: 'declined'
      });

      // Send notification to inviter
      await this.notificationService.showNotification(
        'Invitation Declined',
        'Your chat invitation was declined'
      );

      console.log('Chat invitation declined successfully');
    } catch (error) {
      console.error('Failed to decline chat invitation:', error);
      throw error;
    }
  }

  /**
   * Revoke a chat invitation (by inviter)
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Get the invitation
      const invitationResult = await this.client.models.ChatInvitation.get({ id: invitationId });
      
      if (invitationResult.errors || !invitationResult.data) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationResult.data;

      // Verify the current user is the inviter
      if (invitation.invitedBy !== userId) {
        throw new Error('You can only revoke invitations you sent');
      }

      // Update invitation status to revoked
      await this.client.models.ChatInvitation.update({
        id: invitationId,
        status: 'revoked'
      });

      // Send notification to invited user
      await this.notificationService.showNotification(
        'Invitation Revoked',
        'A chat invitation was revoked'
      );

      console.log('Chat invitation revoked successfully');
    } catch (error) {
      console.error('Failed to revoke chat invitation:', error);
      throw error;
    }
  }

  /**
   * Get all invitations for a specific chat with user details
   */
  async getChatInvitations(chatId: string): Promise<ChatInvitation[]> {
    try {
      const result = await this.client.models.ChatInvitation.list({
        filter: {
          chatId: { eq: chatId },
          status: { eq: 'pending' }
        }
      });

      if (result.errors || !result.data) {
        return [];
      }

      // Enrich invitations with user handles
      const invitations = await Promise.all(
        result.data.map(async (inv) => {
          let userHandle = inv.invitedUserId;
          
          // Try to get the user's handle from Person model
          try {
            const personResult = await this.client.models.Person.list({
              filter: {
                or: [
                  { userId: { eq: inv.invitedUserId } },
                  { id: { eq: inv.invitedUserId } }
                ]
              }
            });

            if (personResult.data && personResult.data.length > 0) {
              userHandle = `@${personResult.data[0].handle}`;
            }
          } catch (error) {
            console.error('Failed to fetch user handle:', error);
          }

          return {
            id: inv.id,
            chatId: inv.chatId,
            invitedUserId: inv.invitedUserId,
            invitedUserHandle: userHandle,
            invitedBy: inv.invitedBy,
            invitedAt: new Date(inv.invitedAt),
            status: inv.status as any,
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
            message: inv.message || undefined
          };
        })
      );

      return invitations;
    } catch (error) {
      console.error('Failed to get chat invitations:', error);
      return [];
    }
  }

  /**
   * Get all invitations for the current user
   */
  async getUserInvitations(): Promise<ChatInvitation[]> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;
      console.log('[ChatInvitation] Getting invitations for user:', userId);

      const result = await this.client.models.ChatInvitation.list({
        filter: {
          invitedUserId: { eq: userId },
          status: { eq: 'pending' }
        }
      });

      console.log('[ChatInvitation] Query result:', result.data?.length || 0, 'invitations found');

      if (result.errors || !result.data) {
        console.log('[ChatInvitation] Errors or no data:', result.errors);
        return [];
      }

      // Filter out expired invitations
      const now = new Date();
      const validInvitations = result.data
        .filter(inv => !inv.expiresAt || new Date(inv.expiresAt) > now)
        .map(inv => ({
          id: inv.id,
          chatId: inv.chatId,
          invitedUserId: inv.invitedUserId,
          invitedBy: inv.invitedBy,
          invitedAt: new Date(inv.invitedAt),
          status: inv.status as any,
          expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
          message: inv.message || undefined
        }));
      
      console.log('[ChatInvitation] Returning', validInvitations.length, 'valid invitations');
      return validInvitations;
    } catch (error) {
      console.error('[ChatInvitation] Failed to get user invitations:', error);
      return [];
    }
  }

  /**
   * Ignore an invitation (for now - doesn't decline, just hides it temporarily)
   */
  async ignoreInvitation(invitationId: string): Promise<void> {
    // This is a client-side only operation
    // We could store ignored invitations in local storage
    // For now, we'll just log it
    console.log('Invitation ignored (client-side only):', invitationId);
  }
}
