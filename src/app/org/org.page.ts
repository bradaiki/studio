import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OrganizationComponent, OrganizationInfo, Dojo, Event, SocialMedia } from '../components/organization/organization.component';
import { OrganizationsService, Organization } from '../services/organizations.service';
import { ChatMessagesComponent } from '../components/chat-messages/chat-messages.component';
import { ChatMessage } from '../models/chat.models';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, business } from 'ionicons/icons';

@Component({
  selector: 'app-org',
  templateUrl: './org.page.html',
  styleUrls: ['./org.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    OrganizationComponent,
    ChatMessagesComponent
  ]
})
export class OrgPage implements OnInit {
  organization: Organization | null = null;
  organizationInfo: OrganizationInfo | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private organizationsService: OrganizationsService
  ) {
    addIcons({business,arrowBack});
  }

  ngOnInit() {
    const orgId = this.route.snapshot.paramMap.get('id');
    if (orgId) {
      this.organization = this.organizationsService.getOrganizationById(orgId) || null;
      if (this.organization) {
        this.organizationInfo = this.convertToOrganizationInfo(this.organization);
      }
    }
  }

  onBack() {
    this.location.back();
  }

  // Event handlers for organization component
  onDojoClick(dojo: Dojo) {
    console.log('Dojo clicked:', dojo.name);
    this.router.navigate(['/dash/studios']);
  }

  onEventClick(event: Event) {
    console.log('Event clicked:', event.title);
    this.router.navigate(['/dash/event', event.id]);
  }

  onContactClick(phone: string) {
    window.open(`tel:${phone}`, '_self');
  }

  onWebsiteClick(website: string) {
    window.open(`https://${website}`, '_blank');
  }

  onEmailClick(email: string) {
    window.open(`mailto:${email}`, '_self');
  }

  onSocialClick(social: SocialMedia) {
    window.open(social.url, '_blank');
  }

  onFindDojoClick() {
    console.log('Find dojo clicked');
    this.router.navigate(['/dash/studios']);
  }

  // Convert Organization to OrganizationInfo for component compatibility
  private convertToOrganizationInfo(organization: Organization): OrganizationInfo {
    return {
      id: organization.id,
      name: organization.name,
      tagline: organization.tagline,
      mission: organization.mission,
      heroImage: organization.heroImage,
      philosophy: organization.philosophy,
      statistics: organization.statistics,
      programs: organization.programs,
      memberDojos: organization.memberDojos,
      upcomingEvents: organization.upcomingEvents,
      lineageFeatures: organization.lineageFeatures,
      contact: organization.contact,
      socialMedia: organization.socialMedia
    };
  }

  // Chat message handlers
  onChatMessageClick(message: ChatMessage) {
    console.log('Chat message clicked:', message);
    // In a real app, this might open a detailed message view or mark as read
  }

  onSendChatMessage(message: string) {
    console.log('Sending chat message:', message);
    // In a real app, this would send the message to a backend service
  }

  onLeaveChat(chatId: string) {
    console.log('Leaving chat:', chatId);
    // In a real app, this would call a service to leave the chat
  }

  onMuteChat(event: { chatId: string; isMuted: boolean }) {
    console.log('Chat mute status changed:', event);
    // In a real app, this would update the user's notification preferences
  }

  onChatInfo(chatId: string) {
    console.log('Show chat info for:', chatId);
    // In a real app, this might open a modal with chat details, participants, etc.
  }
}