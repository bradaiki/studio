import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EventsService, Event } from '../services/events.service';
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
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBack,
  calendar, 
  location as locationIcon, 
  time,
  people,
  star,
  trophy,
  school,
  ribbon,
  bookOutline,
  personOutline,
  cashOutline,
  informationCircleOutline,
  shareOutline,
  heartOutline,
  mapOutline,
  callOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-event',
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
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
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonBadge,
    ChatMessagesComponent
  ]
})
export class EventPage implements OnInit {
  event = signal<Event | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private eventsService: EventsService
  ) {
    addIcons({star,calendar,time,location:locationIcon,personOutline,cashOutline,ribbon,people,informationCircleOutline,bookOutline,mapOutline,callOutline,shareOutline,arrowBack,trophy,school,heartOutline});
  }

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.event.set(this.eventsService.getEventById(eventId) || null);
    }
  }

  onBack() {
    this.location.back();
  }

  getEventTypeColor(type: Event['type']): string {
    switch (type) {
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

  getDifficultyColor(difficulty: Event['difficulty']): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      case 'all-levels': return 'primary';
      default: return 'medium';
    }
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  formatEventTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  isEventSoldOut(): boolean {
    return this.event() ? this.eventsService.isEventSoldOut(this.event()!.id) : false;
  }

  getAvailabilityText(): string {
    return this.event() ? this.eventsService.getAvailabilityText(this.event()!.id) : '';
  }

  registerForEvent() {
    if (this.event() && this.eventsService.registerForEvent(this.event()!.id)) {
      console.log('Successfully registered for event:', this.event()!.title);
    } else {
      console.log('Failed to register for event');
    }
  }

  shareEvent() {
    if (this.event()) {
      console.log('Share event:', this.event()!.title);
    }
  }

  contactOrganizer() {
    if (this.event()) {
      window.open(`mailto:${this.event()!.contactEmail}?subject=Inquiry about ${this.event()!.title}`, '_self');
    }
  }

  getDirections() {
    if (this.event()) {
      const encodedAddress = encodeURIComponent(this.event()!.address);
      window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
    }
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
