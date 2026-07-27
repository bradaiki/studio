import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { 
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonChip,
  IonBadge,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendar, 
  location, 
  time,
  people,
  star,
  personOutline,
  cashOutline,
  informationCircleOutline,
  shareOutline,
  mapOutline,
  callOutline,
  bookOutline,
  ribbon
} from 'ionicons/icons';

export interface EventInfo {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string;
  location: string;
  address: string;
  type: 'seminar' | 'tournament' | 'testing' | 'workshop' | 'camp' | 'demonstration' | 'meetup';
  instructor: string;
  instructorRank: string;
  cost: string;
  maxParticipants?: number;
  currentParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  image: string;
  featured: boolean;
  tags: string[];
  organizer: string;
  contactEmail: string;
  contactPhone?: string;
  requirements?: string[];
  whatToBring?: string[];
}

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonChip,
    IonBadge,
    IonText
  ]
})
export class EventComponent {
  @Input() event!: EventInfo;
  @Input() showFullDescription: boolean = true;
  @Input() showRequirements: boolean = true;
  @Input() showWhatToBring: boolean = true;
  @Input() showTags: boolean = true;
  @Input() compact: boolean = false;

  @Output() registerClick = new EventEmitter<EventInfo>();
  @Output() shareClick = new EventEmitter<EventInfo>();
  @Output() contactClick = new EventEmitter<EventInfo>();
  @Output() directionsClick = new EventEmitter<EventInfo>();

  constructor() {
    addIcons({ 
      calendar, 
      location, 
      time,
      people,
      star,
      personOutline,
      cashOutline,
      informationCircleOutline,
      shareOutline,
      mapOutline,
      callOutline,
      bookOutline,
      ribbon
    });
  }

  onRegisterClick() {
    this.registerClick.emit(this.event);
  }

  onShareClick(event: Event) {
    event.stopPropagation();
    this.shareClick.emit(this.event);
  }

  onContactClick(event: Event) {
    event.stopPropagation();
    this.contactClick.emit(this.event);
  }

  onDirectionsClick(event: Event) {
    event.stopPropagation();
    this.directionsClick.emit(this.event);
  }

  getEventTypeColor(): string {
    switch (this.event.type) {
      case 'seminar': return 'primary';
      case 'tournament': return 'success';
      case 'testing': return 'warning';
      case 'workshop': return 'secondary';
      case 'camp': return 'tertiary';
      case 'demonstration': return 'medium';
      case 'meetup': return 'light';
      default: return 'medium';
    }
  }

  getDifficultyColor(): string {
    switch (this.event.difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      case 'all-levels': return 'primary';
      default: return 'medium';
    }
  }

  formatEventDate(): string {
    const date = new Date(this.event.date);
    return date.toLocaleDateString('en-US', { 
      weekday: this.compact ? 'short' : 'long',
      year: 'numeric', 
      month: this.compact ? 'short' : 'long', 
      day: 'numeric'
    });
  }

  formatEventTime(): string {
    const [hours, minutes] = this.event.time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  isEventSoldOut(): boolean {
    return this.event.maxParticipants ? this.event.currentParticipants >= this.event.maxParticipants : false;
  }

  getAvailabilityText(): string {
    if (!this.event.maxParticipants) return '';
    const remaining = this.event.maxParticipants - this.event.currentParticipants;
    if (remaining === 0) return 'Sold Out';
    if (remaining <= 5) return `${remaining} spots left`;
    return `${this.event.currentParticipants}/${this.event.maxParticipants} registered`;
  }

  getDisplayDescription(): string {
    if (this.showFullDescription || this.event.description.length <= 150) {
      return this.event.description;
    }
    return this.event.description.substring(0, 150) + '...';
  }

  getDisplayTags(): string[] {
    return this.compact ? this.event.tags.slice(0, 3) : this.event.tags;
  }

  getExtraTagsCount(): number {
    const displayCount = this.compact ? 3 : this.event.tags.length;
    return Math.max(0, this.event.tags.length - displayCount);
  }

  getDisplayRequirements(): string[] {
    if (!this.event.requirements) return [];
    return this.compact ? this.event.requirements.slice(0, 2) : this.event.requirements;
  }

  getDisplayWhatToBring(): string[] {
    if (!this.event.whatToBring) return [];
    return this.compact ? this.event.whatToBring.slice(0, 3) : this.event.whatToBring;
  }

  isMultiDay(): boolean {
    return !!(this.event.endDate && this.event.endDate !== this.event.date);
  }
}