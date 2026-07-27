import { Component, Input, OnInit } from '@angular/core';

import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonChip,
  IonAvatar,
  IonText,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, time, person } from 'ionicons/icons';
import { StudioMembershipService } from '../../services/studio-membership.service';
import { StudioJoinRequest } from '../../models/studio-membership.models';

@Component({
  selector: 'app-studio-join-requests',
  templateUrl: './studio-join-requests.component.html',
  styleUrls: ['./studio-join-requests.component.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonChip,
    IonAvatar,
    IonText,
    IonSpinner,
  ],
})
export class StudioJoinRequestsComponent implements OnInit {
  @Input() studioId!: string;

  joinRequests: StudioJoinRequest[] = [];
  loading = false;
  processingRequestId: string | null = null;

  constructor(
    private membershipService: StudioMembershipService,
    private toastController: ToastController,
  ) {
    addIcons({ checkmarkCircle, closeCircle, time, person });
  }

  async ngOnInit() {
    await this.loadJoinRequests();
  }

  async loadJoinRequests() {
    this.loading = true;
    try {
      console.log(
        '[StudioJoinRequests] Loading requests for studio:',
        this.studioId,
      );
      this.joinRequests = await this.membershipService.getStudioJoinRequests(
        this.studioId,
      );
      console.log(
        '[StudioJoinRequests] Loaded',
        this.joinRequests.length,
        'requests:',
        this.joinRequests,
      );
    } catch (error) {
      console.error('[StudioJoinRequests] Failed to load requests:', error);
      await this.showToast('Failed to load join requests', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async approveRequest(request: StudioJoinRequest) {
    this.processingRequestId = request.id;
    try {
      await this.membershipService.approveJoinRequest(request.id);
      await this.showToast(
        `${request.userName} has been added to the studio`,
        'success',
      );
      await this.loadJoinRequests();
    } catch (error) {
      console.error('[StudioJoinRequests] Failed to approve request:', error);
      await this.showToast('Failed to approve request', 'danger');
    } finally {
      this.processingRequestId = null;
    }
  }

  async rejectRequest(request: StudioJoinRequest) {
    this.processingRequestId = request.id;
    try {
      await this.membershipService.rejectJoinRequest(request.id);
      await this.showToast('Request rejected', 'warning');
      await this.loadJoinRequests();
    } catch (error) {
      console.error('[StudioJoinRequests] Failed to reject request:', error);
      await this.showToast('Failed to reject request', 'danger');
    } finally {
      this.processingRequestId = null;
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
