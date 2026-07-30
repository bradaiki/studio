import { Component, input, output, signal, OnInit } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { FavoritesService } from '../../services/favorites.service';
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
  IonText,
  IonChip,
  IonList,
  IonAvatar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  location,
  time,
  call,
  mail,
  globe,
  star,
  starOutline,
  people,
  fitness,
  shield,
  heart,
  calendar,
  checkmark,
  trophy,
  school,
  chevronForward,
  person,
  create,
} from 'ionicons/icons';

export interface StudioInfo {
  id: string;
  name: string;
  description: string;
  tagline: string;
  heroImage: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  benefits: Benefit[];
  instructors: Instructor[];
  headInstructor?: Instructor;
  studioChief?: Instructor;
  schedule: ClassSchedule[];
  pricing: PricingOption[];
  isMember?: boolean;
  isInstructor?: boolean;
  isStudioChief?: boolean;
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  rank: string;
  bio: string;
  image: string;
  experience: string;
  username: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  certifications?: string[];
  isActive?: boolean;
}

export interface ClassSchedule {
  id?: string;
  title: string; // Class name/type
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  startTime: string; // Time in HH:mm format
  endTime: string; // Time in HH:mm format
  instructor: string;
  level: string;
  description?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceEnd?: string; // ISO date string
  color?: string; // For calendar display
  location?: string; // Specific room/area in studio
}

export interface PricingOption {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-studio',
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.scss'],
  standalone: true,
  imports: [
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
    IonText,
    IonChip,
    IonList,
    IonAvatar,
  ],
})
export class StudioComponent implements OnInit {
  studio = input.required<StudioInfo>();
  showHero = input<boolean>(true);
  showAbout = input<boolean>(true);
  showBenefits = input<boolean>(true);
  showInstructors = input<boolean>(true);
  showSchedule = input<boolean>(true);
  showPricing = input<boolean>(true);
  showContact = input<boolean>(true);
  compact = input<boolean>(false);

  instructorClick = output<Instructor>();
  contactClick = output<string>();
  websiteClick = output<string>();
  emailClick = output<string>();
  directionsClick = output<string>();
  trialClick = output<void>();
  editClick = output<string>();

  isFavorited = signal<boolean>(false);

  constructor(public favoritesService: FavoritesService) {
    addIcons({
      location,
      time,
      call,
      mail,
      globe,
      star,
      starOutline,
      people,
      fitness,
      shield,
      heart,
      calendar,
      checkmark,
      trophy,
      school,
      chevronForward,
      person,
      create,
    });
  }

  ngOnInit() {
    this.isFavorited.set(this.favoritesService.isFavorite(this.studio().id));
    this.favoritesService.favorites$.subscribe(() => {
      this.isFavorited.set(this.favoritesService.isFavorite(this.studio().id));
    });
  }

  async toggleFavorite(event: MouseEvent) {
    event.stopPropagation();
    await this.favoritesService.toggleFavorite(this.studio().id, 'studio');
  }

  onInstructorClick(instructor: Instructor) {
    this.instructorClick.emit(instructor);
  }

  onContactClick() {
    this.contactClick.emit(this.studio().phone);
  }

  onWebsiteClick() {
    this.websiteClick.emit(this.studio().website);
  }

  onEmailClick() {
    this.emailClick.emit(this.studio().email);
  }

  onDirectionsClick() {
    this.directionsClick.emit(this.studio().address);
  }

  onTrialClick() {
    this.trialClick.emit();
  }

  getDisplayBenefits(): Benefit[] {
    return this.compact()
      ? this.studio().benefits.slice(0, 2)
      : this.studio().benefits;
  }

  getDisplayInstructors(): Instructor[] {
    return this.compact()
      ? this.studio().instructors.slice(0, 1)
      : this.studio().instructors;
  }

  getDisplaySchedule(): ClassSchedule[] {
    return this.compact()
      ? this.studio().schedule.slice(0, 3)
      : this.studio().schedule;
  }

  getDisplayPricing(): PricingOption[] {
    return this.compact() ? this.studio().pricing.slice(0, 2) : this.studio().pricing;
  }

  formatScheduleTime(scheduleItem: ClassSchedule): string {
    const startTime = this.formatTime(scheduleItem.startTime);
    const endTime = this.formatTime(scheduleItem.endTime);
    const dayName = this.getDayName(scheduleItem.startDate);

    if (scheduleItem.isRecurring) {
      return `${dayName}s ${startTime} - ${endTime}`;
    } else {
      const date = new Date(scheduleItem.startDate);
      return `${date.toLocaleDateString()} ${startTime} - ${endTime}`;
    }
  }

  private formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private getDayName(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  }

  getScheduleChipColor(scheduleItem: ClassSchedule): string {
    if (scheduleItem.level.toLowerCase().includes('beginner')) return 'success';
    if (scheduleItem.level.toLowerCase().includes('advanced')) return 'danger';
    if (scheduleItem.level.toLowerCase().includes('kyu')) return 'warning';
    return 'primary';
  }

  onEditClick(event: MouseEvent) {
    event.stopPropagation();
    this.editClick.emit(this.studio().id);
  }
}
