import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { IonicModule, ToastController } from '@ionic/angular';

import {
  AccessControlService,
  ChatInvitation,
} from '../../services/access-control.service';
import { Chat } from '../../models/chat.models';

@Component({
  selector: 'app-chat-invitation-notification',
  templateUrl: './chat-invitation-notification.component.html',
  styleUrls: ['./chat-invitation-notification.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class ChatInvitationNotificationComponent implements OnInit {
  @Input() invitation!: ChatInvitation;
  @Input() chatName?: string;
  @Input() inviterName?: string;
  @Output() invitationAccepted = new EventEmitter<ChatInvitation>();
  @Output() invitationDeclined = new EventEmitter<ChatInvitation>();

  // Component state
  isProcessing = false;
  isExpired = false;

  constructor(
    private accessControlService: AccessControlService,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.checkExpiration();
  }

  /**
   * Check if invitation has expired
   */
  private checkExpiration() {
    if (this.invitation.expiresAt) {
      this.isExpired = this.invitation.expiresAt < new Date();
    }
  }

  /**
   * Accept the chat invitation
   */
  async acceptInvitation() {
    if (
      this.isProcessing ||
      this.isExpired ||
      this.invitation.status !== 'pending'
    ) {
      return;
    }

    try {
      this.isProcessing = true;

      await this.accessControlService.acceptChatInvitation(this.invitation.id);

      // Update local state
      this.invitation.status = 'accepted';

      await this.showSuccessToast(
        `Joined ${this.chatName || 'chat'} successfully!`,
      );

      // Emit event
      this.invitationAccepted.emit(this.invitation);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);

      let errorMessage = 'Failed to accept invitation';
      if (error.message) {
        errorMessage = error.message;
      }

      await this.showErrorToast(errorMessage);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Decline the chat invitation
   */
  async declineInvitation() {
    if (this.isProcessing || this.invitation.status !== 'pending') {
      return;
    }

    try {
      this.isProcessing = true;

      // Note: In a full implementation, we'd have a declineInvitation method
      // For now, we'll just update the local state and emit the event
      this.invitation.status = 'declined';

      await this.showSuccessToast('Invitation declined');

      // Emit event
      this.invitationDeclined.emit(this.invitation);
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      await this.showErrorToast('Failed to decline invitation');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get the display name for the inviter
   */
  getInviterDisplayName(): string {
    return this.inviterName || this.invitation.invitedBy || 'Someone';
  }

  /**
   * Get the display name for the chat
   */
  getChatDisplayName(): string {
    return this.chatName || 'a chat';
  }

  /**
   * Get the formatted invitation date
   */
  getFormattedInvitationDate(): string {
    return this.invitation.invitedAt.toLocaleDateString();
  }

  /**
   * Get the formatted expiration date
   */
  getFormattedExpirationDate(): string {
    if (!this.invitation.expiresAt) {
      return 'No expiration';
    }
    return this.invitation.expiresAt.toLocaleDateString();
  }

  /**
   * Check if invitation can be acted upon
   */
  canActOnInvitation(): boolean {
    return (
      this.invitation.status === 'pending' &&
      !this.isExpired &&
      !this.isProcessing
    );
  }

  /**
   * Get status color for the invitation
   */
  getStatusColor(): string {
    if (this.isExpired) return 'medium';

    switch (this.invitation.status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'danger';
      case 'revoked':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Get status text for the invitation
   */
  getStatusText(): string {
    if (this.isExpired) return 'Expired';

    switch (this.invitation.status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'revoked':
        return 'Revoked';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get icon for the invitation status
   */
  getStatusIcon(): string {
    if (this.isExpired) return 'time-outline';

    switch (this.invitation.status) {
      case 'pending':
        return 'hourglass-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'declined':
        return 'close-circle-outline';
      case 'revoked':
        return 'ban-outline';
      default:
        return 'help-circle-outline';
    }
  }

  /**
   * Show success toast
   */
  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Show error toast
   */
  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }
}
