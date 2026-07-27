import { Component, OnInit, OnDestroy } from '@angular/core';

import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonBadge,
  IonList,
  IonItem,
  IonAvatar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  mail,
  checkmark,
  closeCircle,
  time,
  notifications,
  chatbubble,
  person,
  checkmarkCircle,
} from 'ionicons/icons';
import { ChatInvitationService } from '../../services/chat-invitation.service';
import { InAppNotificationService } from '../../services/in-app-notification.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss'],
  standalone: true,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonBadge,
    IonList,
    IonItem,
    IonAvatar,
  ],
})
export class NotificationModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  pendingInvitations: any[] = [];
  systemNotifications: any[] = [];
  private subscriptions: Subscription[] = [];
  private checkInterval: any;

  constructor(
    private invitationService: ChatInvitationService,
    private notificationService: InAppNotificationService,
    private router: Router,
  ) {
    addIcons({
      close,
      mail,
      checkmark,
      closeCircle,
      time,
      notifications,
      chatbubble,
      person,
      checkmarkCircle,
    });
  }

  ngOnInit() {
    // Check for pending items immediately
    this.checkForPendingItems();

    // Set up periodic checks every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkForPendingItems();
    }, 30000);

    // Subscribe to notification changes
    const notifSub = this.notificationService
      .getNotifications()
      .subscribe((notifications) => {
        this.systemNotifications = notifications.filter((n) => !n.read);
        this.updateModalState();
      });
    this.subscriptions.push(notifSub);
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async checkForPendingItems() {
    try {
      // Skip if user is not authenticated (guest tab)
      let currentUser: any;
      try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        currentUser = await getCurrentUser();
      } catch {
        // Not authenticated — nothing to check
        return;
      }

      console.log('[NotificationModal] Checking for pending items...');

      // Get pending invitations
      const invitations = await this.invitationService.getUserInvitations();
      console.log(
        '[NotificationModal] Found invitations:',
        invitations.length,
        invitations,
      );
      this.pendingInvitations = invitations;

      // Get unread notifications
      const notifSub = this.notificationService
        .getNotifications()
        .subscribe((notifications) => {
          this.systemNotifications = notifications.filter((n) => !n.read);
          console.log(
            '[NotificationModal] Found system notifications:',
            this.systemNotifications.length,
          );
          this.updateModalState();
        });
    } catch (error) {
      console.error(
        '[NotificationModal] Failed to check for pending items:',
        error,
      );
    }
  }

  updateModalState() {
    const hasPendingItems =
      this.pendingInvitations.length > 0 || this.systemNotifications.length > 0;
    console.log(
      '[NotificationModal] Update modal state - hasPendingItems:',
      hasPendingItems,
      'isOpen:',
      this.isOpen,
    );

    // Only auto-open if there are pending items and modal is not already open
    if (hasPendingItems && !this.isOpen) {
      console.log(
        '[NotificationModal] Opening modal with',
        this.pendingInvitations.length,
        'invitations and',
        this.systemNotifications.length,
        'notifications',
      );
      this.isOpen = true;
    }
  }

  get totalPendingCount(): number {
    return this.pendingInvitations.length + this.systemNotifications.length;
  }

  async acceptInvitation(invitationId: string) {
    try {
      await this.invitationService.acceptInvitation(invitationId);

      // Remove from local list
      this.pendingInvitations = this.pendingInvitations.filter(
        (inv) => inv.id !== invitationId,
      );

      // Close modal if no more pending items
      if (this.totalPendingCount === 0) {
        this.closeModal();
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  }

  async declineInvitation(invitationId: string) {
    try {
      await this.invitationService.declineInvitation(invitationId);

      // Remove from local list
      this.pendingInvitations = this.pendingInvitations.filter(
        (inv) => inv.id !== invitationId,
      );

      // Close modal if no more pending items
      if (this.totalPendingCount === 0) {
        this.closeModal();
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  }

  ignoreInvitation(invitationId: string) {
    // Just remove from display, don't decline
    this.pendingInvitations = this.pendingInvitations.filter(
      (inv) => inv.id !== invitationId,
    );

    // Close modal if no more pending items
    if (this.totalPendingCount === 0) {
      this.closeModal();
    }
  }

  async handleNotificationClick(notification: any) {
    // Mark as read
    this.notificationService.markAsRead(notification.id);

    // Remove from local list
    this.systemNotifications = this.systemNotifications.filter(
      (n) => n.id !== notification.id,
    );

    // Navigate if there's an action URL
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }

    // Close modal if no more pending items
    if (this.totalPendingCount === 0) {
      this.closeModal();
    }
  }

  dismissNotification(notificationId: string, event: Event) {
    event.stopPropagation();

    // Mark as read
    this.notificationService.markAsRead(notificationId);

    // Remove from local list
    this.systemNotifications = this.systemNotifications.filter(
      (n) => n.id !== notificationId,
    );

    // Close modal if no more pending items
    if (this.totalPendingCount === 0) {
      this.closeModal();
    }
  }

  closeModal() {
    this.isOpen = false;
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  isExpired(invitation: any): boolean {
    if (!invitation.expiresAt) return false;
    return new Date() > new Date(invitation.expiresAt);
  }

  getNotificationIcon(notification: any): string {
    // Determine icon based on title or content
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';

    if (title.includes('invitation') || title.includes('chat')) {
      return 'chatbubble';
    }
    if (title.includes('message') || message.includes('message')) {
      return 'mail';
    }
    return 'notifications';
  }

  getNotificationClass(notification: any): string {
    const title = notification.title?.toLowerCase() || '';

    if (title.includes('invitation') || title.includes('chat')) {
      return 'chat_invitation';
    }
    if (title.includes('message')) {
      return 'message';
    }
    return 'default';
  }
}
