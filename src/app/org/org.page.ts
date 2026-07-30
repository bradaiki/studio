import { Component, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  OrganizationComponent,
  OrganizationInfo,
  Dojo,
  Event,
  SocialMedia,
} from '../components/organization/organization.component';
import {
  OrganizationsService,
  Organization,
} from '../services/organizations.service';
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
  IonBackButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, business } from 'ionicons/icons';

@Component({
  selector: 'app-org',
  templateUrl: './org.page.html',
  styleUrls: ['./org.page.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonSpinner,
    OrganizationComponent,
    ChatMessagesComponent,
  ],
})
export class OrgPage implements OnInit {
  organization = signal<Organization | null>(null);
  organizationInfo = signal<OrganizationInfo | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private organizationsService: OrganizationsService,
  ) {
    addIcons({ business, arrowBack });
  }

  ngOnInit() {
    const orgId = this.route.snapshot.paramMap.get('id');
    if (orgId) {
      // Try to load immediately (may work if data already cached)
      this.tryLoadOrganization(orgId);

      // Also subscribe to organizations$ in case data loads later (e.g., page refresh)
      this.organizationsService.organizations$.subscribe(orgs => {
        if (!this.organization() && orgs.length > 0) {
          this.tryLoadOrganization(orgId);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  private tryLoadOrganization(orgId: string) {
    const org = this.organizationsService.getOrganizationById(orgId) || null;
    this.organization.set(org);
    if (org) {
      this.organizationInfo.set(this.convertToOrganizationInfo(org));
    }
    this.loading.set(false);
  }

  onBack() {
    this.location.back();
  }

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

  onEditOrganization(orgId: string) {
    this.router.navigate(['/dash/org-form', orgId]);
  }

  private convertToOrganizationInfo(
    organization: Organization,
  ): OrganizationInfo {
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
      socialMedia: organization.socialMedia,
    };
  }

  onChatMessageClick(message: ChatMessage) {
    console.log('Chat message clicked:', message);
  }

  onSendChatMessage(message: string) {
    console.log('Sending chat message:', message);
  }

  onLeaveChat(chatId: string) {
    console.log('Leaving chat:', chatId);
  }

  onMuteChat(event: { chatId: string; isMuted: boolean }) {
    console.log('Chat mute status changed:', event);
  }

  onChatInfo(chatId: string) {
    console.log('Show chat info for:', chatId);
  }
}
