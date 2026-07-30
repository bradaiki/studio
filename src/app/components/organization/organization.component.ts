import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonChip,
  IonList,
  IonBadge,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  globe, 
  people, 
  school, 
  trophy, 
  calendar, 
  location, 
  star,
  ribbon,
  bookOutline,
  flagOutline,
  shieldCheckmarkOutline,
  chevronForward,
  call,
  mail,
  logoFacebook,
  logoInstagram,
  logoTwitter,
  create
} from 'ionicons/icons';

export interface OrganizationInfo {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  heroImage: string;
  philosophy?: {
    quote: string;
    attribution: string;
    description: string;
    image?: string;
  };
  statistics: Statistic[];
  programs: Program[];
  memberDojos: Dojo[];
  upcomingEvents: Event[];
  lineageFeatures: LineageFeature[];
  contact: ContactInfo;
  socialMedia: SocialMedia[];
}

export interface Statistic {
  number: string;
  label: string;
}

export interface Program {
  name: string;
  description: string;
  level: string;
  duration: string;
  certification: string;
}

export interface Dojo {
  id: string;
  name: string;
  location: string;
  instructor: string;
  rank: string;
  students: number;
  established: string;
  image: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: 'seminar' | 'tournament' | 'testing' | 'workshop' | 'meetup';
  instructor: string;
  cost: string;
}

export interface LineageFeature {
  icon: string;
  title: string;
  description: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string;
}

export interface SocialMedia {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
  url: string;
  username?: string;
}

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonChip,
    IonList,
    IonBadge,
    IonText
  ]
})
export class OrganizationComponent {
  organization = input.required<OrganizationInfo>();
  showHero = input(true);
  showMission = input(true);
  showStatistics = input(true);
  showPrograms = input(true);
  showMemberDojos = input(true);
  showEvents = input(true);
  showLineage = input(true);
  showPhilosophy = input(true);
  showContact = input(true);
  showEditButton = input(false);
  compact = input(false);

  dojoClick = output<Dojo>();
  eventClick = output<Event>();
  contactClick = output<string>();
  websiteClick = output<string>();
  emailClick = output<string>();
  socialClick = output<SocialMedia>();
  findDojoClick = output<void>();
  editClick = output<string>();

  constructor() {
    addIcons({ 
      globe, 
      people, 
      school, 
      trophy, 
      calendar, 
      location, 
      star,
      ribbon,
      bookOutline,
      flagOutline,
      shieldCheckmarkOutline,
      chevronForward,
      call,
      mail,
      logoFacebook,
      logoInstagram,
      logoTwitter,
      create
    });
  }

  onDojoClick(dojo: Dojo) {
    this.dojoClick.emit(dojo);
  }

  onEventClick(event: Event) {
    this.eventClick.emit(event);
  }

  onContactClick() {
    this.contactClick.emit(this.organization().contact.phone);
  }

  onWebsiteClick() {
    this.websiteClick.emit(this.organization().contact.website);
  }

  onEmailClick() {
    this.emailClick.emit(this.organization().contact.email);
  }

  onSocialClick(social: SocialMedia) {
    this.socialClick.emit(social);
  }

  onFindDojoClick() {
    this.findDojoClick.emit();
  }

  getDisplayStatistics(): Statistic[] {
    return this.compact() ? this.organization().statistics.slice(0, 2) : this.organization().statistics;
  }

  getDisplayPrograms(): Program[] {
    return this.compact() ? this.organization().programs.slice(0, 2) : this.organization().programs;
  }

  getDisplayDojos(): Dojo[] {
    return this.compact() ? this.organization().memberDojos.slice(0, 2) : this.organization().memberDojos;
  }

  getDisplayEvents(): Event[] {
    return this.compact() ? this.organization().upcomingEvents.slice(0, 2) : this.organization().upcomingEvents;
  }

  getDisplayLineageFeatures(): LineageFeature[] {
    return this.compact() ? this.organization().lineageFeatures.slice(0, 2) : this.organization().lineageFeatures;
  }

  getEventTypeColor(type: Event['type']): string {
    switch (type) {
      case 'seminar': return 'primary';
      case 'tournament': return 'success';
      case 'testing': return 'warning';
      case 'workshop': return 'secondary';
      case 'meetup': return 'light';
      default: return 'medium';
    }
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  getSocialIcon(platform: SocialMedia['platform']): string {
    switch (platform) {
      case 'facebook': return 'logo-facebook';
      case 'instagram': return 'logo-instagram';
      case 'twitter': return 'logo-twitter';
      default: return 'globe';
    }
  }

  onEditClick(event: MouseEvent) {
    event.stopPropagation();
    this.editClick.emit(this.organization().id);
  }
}
