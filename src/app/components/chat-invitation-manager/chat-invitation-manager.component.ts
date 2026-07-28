import { Component, input, output, signal, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonChip,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSearchbar,
  IonAvatar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  send,
  personAdd,
  mail,
  checkmark,
  closeCircle,
  time,
  search,
  atOutline,
} from 'ionicons/icons';
import { ChatInvitationService } from '../../services/chat-invitation.service';
import { ChatInvitation } from '../../models/chat.models';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';

@Component({
  selector: 'app-chat-invitation-manager',
  templateUrl: './chat-invitation-manager.component.html',
  styleUrls: ['./chat-invitation-manager.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonChip,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSearchbar,
    IonAvatar,
  ],
})
export class ChatInvitationManagerComponent implements OnInit {
  chatId = input.required<string>();
  chatName = input.required<string>();
  isOpen = input<boolean>(false);
  isOpenChange = output<boolean>();
  invitationSent = output<void>();

  // Invitation form - KEEP as regular properties (used with ngModel)
  inviteeHandle: string = '';
  selectedUser: any = null;
  invitationMessage: string = '';
  expirationDays: number = 7;

  // User search - KEEP as regular properties (used with ngModel)
  searchTerm: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;

  // Pending invitations for this chat
  pendingInvitations = signal<ChatInvitation[]>([]);

  private client = generateClient<Schema>();

  constructor(
    private invitationService: ChatInvitationService,
    private toastController: ToastController,
  ) {
    addIcons({
      close,
      send,
      personAdd,
      mail,
      checkmark,
      closeCircle,
      time,
      search,
      atOutline,
    });
  }

  ngOnInit() {
    if (this.chatId()) {
      this.loadPendingInvitations();
    }
  }

  async loadPendingInvitations() {
    try {
      const invitations = await this.invitationService.getChatInvitations(
        this.chatId(),
      );
      this.pendingInvitations.set(invitations);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
    }
  }

  async sendInvitation() {
    if (!this.inviteeHandle.trim() && !this.selectedUser) {
      await this.showToast('Please enter a handle or select a user', 'warning');
      return;
    }

    try {
      // If handle is provided, look up the user
      let userId = this.selectedUser?.userId;
      let handle = this.inviteeHandle.trim();

      if (!userId && handle) {
        // Remove @ if user included it
        handle = handle.replace(/^@/, '');

        // Look up user by handle
        const personResult = await this.client.models.Person.list({
          filter: {
            handle: { eq: handle },
          },
        });

        if (
          personResult.errors ||
          !personResult.data ||
          personResult.data.length === 0
        ) {
          await this.showToast(
            `User with handle @${handle} not found`,
            'danger',
          );
          return;
        }

        const person = personResult.data[0];
        userId = person.userId || person.id;
      }

      if (!userId) {
        await this.showToast('Could not find user', 'danger');
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.expirationDays);

      await this.invitationService.sendInvitation({
        chatId: this.chatId(),
        invitedUserId: userId,
        message: this.invitationMessage.trim() || undefined,
        expiresAt,
      });

      await this.showToast('Invitation sent successfully', 'success');

      // Reset form
      this.inviteeHandle = '';
      this.selectedUser = null;
      this.invitationMessage = '';
      this.searchTerm = '';
      this.searchResults = [];

      // Reload invitations
      await this.loadPendingInvitations();

      // Emit event
      this.invitationSent.emit();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      await this.showToast('Failed to send invitation', 'danger');
    }
  }

  async revokeInvitation(invitationId: string) {
    try {
      await this.invitationService.revokeInvitation(invitationId);
      await this.showToast('Invitation revoked', 'success');
      await this.loadPendingInvitations();
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      await this.showToast('Failed to revoke invitation', 'danger');
    }
  }

  async searchUsers() {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    try {
      // Remove @ if user included it
      const searchHandle = this.searchTerm.trim().replace(/^@/, '');

      // Search for users by handle or display name
      const result = await this.client.models.Person.list({
        filter: {
          or: [
            { handle: { contains: searchHandle } },
            { displayName: { contains: this.searchTerm.trim() } },
          ],
        },
      });

      if (result.data) {
        this.searchResults = result.data.slice(0, 10).map((person) => ({
          id: person.id,
          userId: person.userId || person.id,
          handle: person.handle,
          name: person.displayName,
          avatar: person.profileImage,
          bio: person.bio,
        }));
      } else {
        this.searchResults = [];
      }
    } catch (error) {
      console.error('Failed to search users:', error);
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.inviteeHandle = user.handle;
    this.searchTerm = `@${user.handle}`;
    this.searchResults = [];
  }

  closeModal() {
    this.isOpenChange.emit(false);
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return timestamp.toLocaleDateString();
  }

  isExpired(invitation: ChatInvitation): boolean {
    if (!invitation.expiresAt) return false;
    return new Date() > invitation.expiresAt;
  }

  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger' = 'success',
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
