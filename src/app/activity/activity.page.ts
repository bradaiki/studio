import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  IonLabel
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
    ChatMessagesComponent
  ]
})
export class ActivityPage implements OnInit {
  activity: Activity | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private activitiesService: ActivitiesService
  ) {
    addIcons({
      repeat,
      star,
      time,
      location: locationIcon,
      personOutline,
      school,
      calendar,
      people,
      cashOutline,
      checkmarkCircle,
      mail,
      callOutline,
      shareOutline,
      mapOutline,
      informationCircleOutline,
      arrowBack,
      trophy,
      ribbon,
      bookOutline,
      heartOutline
    });
  }

  ngOnInit() {
    const activityId = this.route.snapshot.paramMap.get('id');
    if (activityId) {
      this.activity = this.activitiesService.getActivityById(activityId) || null;
    }
  }

  onBack() {
    // Navigate back to the previous page (could be studio detail, events, etc.)
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
    return this.activity ? 
      (this.activity.maxParticipants !== undefined && 
       this.activity.currentParticipants >= this.activity.maxParticipants) : false;
  }

  getAvailabilityText(): string {
    if (!this.activity) return '';
    
    if (this.activity.maxParticipants) {
      const available = this.activity.maxParticipants - this.activity.currentParticipants;
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
    if (this.activity && this.activitiesService.registerForActivity(this.activity.id)) {
      console.log('Successfully registered for activity:', this.activity.title);
      // In real app, would show success message and handle payment
    } else {
      console.log('Failed to register for activity');
      // In real app, would show error message
    }
  }

  shareActivity() {
    if (this.activity) {
      console.log('Share activity:', this.activity.title);
      // In real app, would open share dialog
    }
  }

  contactInstructor() {
    if (this.activity && this.activity.contactEmail) {
      window.open(`mailto:${this.activity.contactEmail}?subject=Inquiry about ${this.activity.title}`, '_self');
    }
  }

  getDirections() {
    if (this.activity && this.activity.address) {
      const encodedAddress = encodeURIComponent(this.activity.address);
      window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
    }
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