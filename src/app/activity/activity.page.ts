import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ActivitiesService, Activity } from '../services/activities.service';
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
  IonLabel,
  IonSpinner, IonText
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
  callOutline,
  repeat,
  checkmarkCircle, 
  mail 
} from 'ionicons/icons';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
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
    IonLabel,
    IonSpinner, IonText,
    ChatMessagesComponent
  ]
})
export class ActivityPage implements OnInit {
  activity = signal<Activity | null>(null);
  loading = signal(true);
  notFound = signal(false);

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private activitiesService: ActivitiesService
  ) {
    addIcons({repeat,star,time,location:locationIcon,personOutline,school,calendar,people,cashOutline,checkmarkCircle,mail,callOutline,shareOutline,mapOutline,informationCircleOutline,arrowBack,trophy,ribbon,bookOutline,heartOutline});
  }

  ngOnInit() {
    const activityId = this.route.snapshot.paramMap.get('id');
    if (activityId) {
      // Try to load immediately (may work if data already cached)
      this.tryLoadActivity(activityId);

      // Also subscribe to activities$ in case data loads later (e.g., page refresh)
      this.activitiesService.activities$.subscribe(activities => {
        if (!this.activity() && activities.length > 0) {
          this.tryLoadActivity(activityId);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  private tryLoadActivity(activityId: string) {
    const found = this.activitiesService.getActivityById(activityId) || null;
    this.activity.set(found);
    if (!found) {
      // Only mark not found if service has data loaded
      this.activitiesService.activities$.subscribe(activities => {
        if (activities.length > 0) {
          this.notFound.set(true);
        }
      }).unsubscribe();
    } else {
      this.notFound.set(false);
    }
    this.loading.set(false);
  }

  onBack() {
    this.location.back();
  }

  getActivityTypeColor(type: Activity['type']): string {
    switch (type) {
      case 'class': return 'primary';
      case 'event': return 'secondary';
      default: return 'medium';
    }
  }

  getCategoryColor(category: Activity['category']): string {
    switch (category) {
      case 'regular-class': return 'primary';
      case 'seminar': return 'success';
      case 'tournament': return 'warning';
      case 'testing': return 'danger';
      case 'workshop': return 'secondary';
      case 'camp': return 'tertiary';
      case 'demonstration': return 'medium';
      case 'meetup': return 'light';
      case 'special-class': return 'primary';
      default: return 'medium';
    }
  }

  getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      case 'all-levels': return 'primary';
      default: return 'medium';
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  getRecurringDaysText(days: number[]): string {
    if (!days || days.length === 0) return '';
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(dayIndex => dayNames[dayIndex]).join(', ');
  }

  isActivityFull(): boolean {
    const a = this.activity();
    return a ? 
      (a.maxParticipants !== undefined && 
       a.currentParticipants >= a.maxParticipants) : false;
  }

  getAvailabilityText(): string {
    const a = this.activity();
    if (!a) return '';
    
    if (a.maxParticipants) {
      const available = a.maxParticipants - a.currentParticipants;
      if (available <= 0) {
        return 'Full';
      } else if (available <= 3) {
        return `${available} spots left`;
      } else {
        return `${available} spots available`;
      }
    }
    return 'Open enrollment';
  }

  registerForActivity() {
    const a = this.activity();
    if (a && this.activitiesService.registerForActivity(a.id)) {
      console.log('Successfully registered for activity:', a.title);
    } else {
      console.log('Failed to register for activity');
    }
  }

  shareActivity() {
    const a = this.activity();
    if (a) {
      console.log('Share activity:', a.title);
    }
  }

  contactInstructor() {
    const a = this.activity();
    if (a && a.contactEmail) {
      window.open(`mailto:${a.contactEmail}?subject=Inquiry about ${a.title}`, '_self');
    }
  }

  getDirections() {
    const a = this.activity();
    if (a && a.address) {
      const encodedAddress = encodeURIComponent(a.address);
      window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
    }
  }

  // Chat message handlers
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
