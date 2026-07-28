import { Component, OnInit, OnDestroy, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  StudioComponent,
  StudioInfo,
  Instructor,
} from '../components/studio/studio.component';
import { ChatMessagesComponent } from '../components/chat-messages/chat-messages.component';
import { ChatMessage } from '../models/chat.models';
import { StudiosService, Studio } from '../services/studios.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonSearchbar,
  IonChip,
  IonIcon,
  IonButton,
  IonLabel,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  home,
  close,
  add,
  list,
  location,
  checkmarkCircle,
  navigate,
  informationCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-studios',
  templateUrl: './studios.page.html',
  styleUrls: ['./studios.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonSearchbar,
    IonChip,
    IonIcon,
    IonButton,
    IonLabel,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonCard,
    IonCardContent,
    StudioComponent,
    ChatMessagesComponent,
    TranslateModule,
  ],
})
export class StudiosPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Keep as regular properties - used with [(ngModel)]
  selectedSegment: string = 'my-studios';
  searchTerm: string = '';
  viewMode: 'list' | 'map' = 'list';

  // Convert to signals
  filterMode = signal<'all' | 'single'>('all');
  filteredEntityId = signal<string | null>(null);
  filteredEntityName = signal<string | null>(null);
  studios = signal<Studio[]>([]);
  displayedStudios = signal<Studio[]>([]);

  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 6;
  private scrollStates = new Map<
    string,
    { page: number; displayed: Studio[] }
  >();
  private currentFilterKey = '';

  // Legacy single studio info for backward compatibility
  studioInfo: StudioInfo = {
    id: 'rising-sun-aikido',
    name: 'Rising Sun Aikido',
    description:
      "Rising Sun Aikido is Austin's premier traditional Aikido dojo, dedicated to preserving and teaching the authentic art of Aikido as developed by O-Sensei Morihei Ueshiba. Our dojo emphasizes the harmonious blending of physical technique with spiritual development. Whether you're a complete beginner or an experienced martial artist, our welcoming community provides a supportive environment for growth and learning. We focus on building confidence, improving fitness, and developing practical self-defense skills.",
    tagline: 'Traditional Aikido Training in Austin, Texas',
    heroImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
    address: '1234 Harmony Way, Austin, TX 78704',
    phone: '(512) 555-1234',
    email: 'info@risingsunaikido.org',
    website: 'risingsunaikido.org',
    benefits: [
      {
        icon: 'fitness',
        title: 'Physical Fitness',
        description:
          'Improve flexibility, balance, and core strength through dynamic movement',
      },
      {
        icon: 'shield',
        title: 'Self Defense',
        description:
          'Learn practical techniques for personal protection and confidence',
      },
      {
        icon: 'heart',
        title: 'Mental Wellness',
        description:
          'Reduce stress and develop mindfulness through focused practice',
      },
      {
        icon: 'people',
        title: 'Community',
        description:
          'Join a supportive community of practitioners from all walks of life',
      },
    ],
    instructors: [
      {
        id: '5',
        name: 'David Johnson',
        username: 'sensei_david',
        title: 'Chief Instructor',
        rank: '6th Dan',
        bio: 'Sensei Johnson has been practicing Aikido for over 25 years and teaching for 15 years. He emphasizes the philosophical aspects of Aikido alongside technical training.',
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        experience: '25+ years',
      },
      {
        id: '6',
        name: 'Maria Martinez',
        username: 'sensei_maria',
        title: 'Senior Instructor',
        rank: '4th Dan',
        bio: "Sensei Martinez specializes in youth instruction and has developed our comprehensive children's program. She brings energy and patience to every class.",
        image:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        experience: '18+ years',
      },
    ],
    schedule: [
      {
        id: 'demo_1',
        title: 'Adult Aikido',
        startDate: '2024-01-08',
        endDate: '',
        startTime: '18:30',
        endTime: '20:00',
        instructor: 'Sensei Johnson',
        level: 'All Levels',
        description: 'Traditional Aikido practice',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEnd: '2024-12-31',
        color: '#3880ff',
        location: 'Main Dojo',
      },
      {
        id: 'demo_2',
        title: 'Advanced Aikido',
        startDate: '2024-01-09',
        endDate: '',
        startTime: '19:00',
        endTime: '20:30',
        instructor: 'Sensei Johnson',
        level: '3rd Kyu & Above',
        description: 'Advanced techniques and applications',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEnd: '2024-12-31',
        color: '#f04141',
        location: 'Main Dojo',
      },
      {
        id: 'demo_3',
        title: 'Adult Aikido',
        startDate: '2024-01-10',
        endDate: '',
        startTime: '18:30',
        endTime: '20:00',
        instructor: 'Sensei Martinez',
        level: 'All Levels',
        description: 'Traditional Aikido practice',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEnd: '2024-12-31',
        color: '#3880ff',
        location: 'Main Dojo',
      },
      {
        id: 'demo_4',
        title: 'Weapons Training',
        startDate: '2024-01-11',
        endDate: '',
        startTime: '19:00',
        endTime: '20:30',
        instructor: 'Sensei Johnson',
        level: '2nd Kyu & Above',
        description: 'Bokken, Jo, and Tanto practice',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEnd: '2024-12-31',
        color: '#ffce00',
        location: 'Weapons Room',
      },
      {
        id: 'demo_5',
        title: 'Youth Aikido',
        startDate: '2024-01-13',
        endDate: '',
        startTime: '10:00',
        endTime: '11:30',
        instructor: 'Sensei Martinez',
        level: 'Ages 8-16',
        description: 'Aikido for young practitioners',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEnd: '2024-12-31',
        color: '#7044ff',
        location: 'Youth Room',
      },
      {
        id: 'demo_6',
        title: 'Adult Aikido',
        startDate: '2024-01-13',
        endDate: '',
        startTime: '12:00',
        endTime: '13:30',
        instructor: 'Sensei Johnson',
        level: 'All Levels',
        description: 'Weekend Aikido practice',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEnd: '2024-12-31',
        color: '#3880ff',
        location: 'Main Dojo',
      },
    ],
    pricing: [
      {
        name: 'Drop-In',
        price: '$25',
        description: 'Single class',
        features: [
          'Perfect for trying us out',
          'No commitment',
          'All levels welcome',
        ],
      },
      {
        name: 'Monthly',
        price: '$120',
        description: 'Unlimited classes',
        features: [
          'Best value for regular training',
          'Access to all classes',
          'Community events included',
        ],
        featured: true,
      },
      {
        name: 'Youth Program',
        price: '$80',
        description: 'Monthly (Ages 8-16)',
        features: [
          'Age-appropriate curriculum',
          'Character development focus',
          'Saturday classes',
        ],
      },
    ],
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studiosService: StudiosService,
    private sanitizer: DomSanitizer,
  ) {
    addIcons({
      home,
      close,
      list,
      location,
      checkmarkCircle,
      navigate,
      informationCircle,
      add,
    });
    console.log('[Studios Page] Constructor called');
  }

  ngOnInit() {
    console.log('[Studios Page] Initializing...');

    this.studios.set(this.studiosService.getAllStudios());
    console.log('[Studios Page] Loaded studios:', this.studios().length);

    this.studiosService.studios$
      .pipe(takeUntil(this.destroy$))
      .subscribe((studios) => {
        console.log('[Studios Page] Received studios update:', studios.length);
        this.studios.set(studios);
        this.updateDisplayedStudios();
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['filter'] === 'single' && params['entityId']) {
          this.filterMode.set('single');
          this.filteredEntityId.set(params['entityId']);
          this.filteredEntityName.set(params['entityName'] || null);
          this.searchTerm = params['entityName'] || '';
        } else {
          this.filterMode.set('all');
          this.filteredEntityId.set(null);
          this.filteredEntityName.set(null);
          if (params['search']) {
            this.searchTerm = params['search'];
          }
        }
        this.updateDisplayedStudios();
      });

    this.updateDisplayedStudios();
  }

  ionViewWillEnter() {
    console.log('[Studios Page] View will enter');
    if (this.studios().length === 0) {
      console.log('[Studios Page] No studios loaded, forcing refresh');
      this.studiosService.forceEmitLocalStudios();
    }
  }

  onInstructorClick(instructor: Instructor) {
    this.router.navigate(['/dash/people'], {
      queryParams: {
        instructor: instructor.username,
        search: instructor.name,
      },
    });
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

  onDirectionsClick(address: string) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  }

  onTrialClick() {
    console.log('Schedule free trial clicked');
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.updateDisplayedStudios();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
    if (this.viewMode === 'map') {
      this.displayedStudios.set(this.filteredStudios);
    } else {
      this.updateDisplayedStudios();
    }
  }

  onStudioClick(studio: Studio) {
    if (this.filteredStudios.length > 1) {
      this.router.navigate(['/dash/studio', studio.id]);
    }
  }

  get filteredStudios(): Studio[] {
    if (this.filterMode() === 'single' && this.filteredEntityId()) {
      return this.studios().filter(
        (studio) => studio.id === this.filteredEntityId(),
      );
    }

    let filtered: Studio[] = [];

    switch (this.selectedSegment) {
      case 'my-studios':
        filtered = this.studiosService.getUserStudios();
        break;
      case 'discover':
      default:
        filtered = this.studios();
        break;
    }

    if (this.searchTerm.trim()) {
      const searchResults = this.studiosService.searchStudios(this.searchTerm);

      if (this.selectedSegment === 'my-studios') {
        const userStudioIds = this.studiosService
          .getUserStudios()
          .map((s) => s.id);
        filtered = searchResults.filter((studio) =>
          userStudioIds.includes(studio.id),
        );
      } else {
        filtered = searchResults;
      }
    }

    return filtered;
  }

  private updateDisplayedStudios() {
    const filtered = this.filteredStudios;

    if (this.viewMode === 'map') {
      this.displayedStudios.set(filtered);
      return;
    }

    const filterKey = `${this.filterMode()}:${this.filteredEntityId()}:${this.selectedSegment}:${this.searchTerm}`;

    if (filterKey !== this.currentFilterKey) {
      this.currentFilterKey = filterKey;

      if (!this.scrollStates.has(filterKey)) {
        this.scrollStates.set(filterKey, { page: 0, displayed: [] });
      }

      const state = this.scrollStates.get(filterKey)!;

      if (state.displayed.length === 0) {
        this.loadInitialStudios(state, filtered);
      }

      this.displayedStudios.set(state.displayed);
    }
  }

  private loadInitialStudios(
    state: { page: number; displayed: Studio[] },
    source: Studio[],
  ) {
    state.page = 0;
    state.displayed = [];
    this.loadMoreStudiosForState(state, source);
  }

  private loadMoreStudiosForState(
    state: { page: number; displayed: Studio[] },
    source: Studio[],
  ) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newStudios = source.slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newStudios];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const filtered = this.filteredStudios;
      const state = this.scrollStates.get(this.currentFilterKey);
      if (state) {
        this.loadMoreStudiosForState(state, filtered);
        this.displayedStudios.set(state.displayed);
      }

      event.target.complete();

      if (this.displayedStudios().length >= filtered.length) {
        event.target.disabled = true;
      }
    }, 500);
  }

  get isFiltered(): boolean {
    return this.filterMode() === 'single';
  }

  get showLegacyStudio(): boolean {
    return this.filteredStudios.length === 0 && this.filterMode() === 'all';
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.updateDisplayedStudios();
  }

  onSearchClear() {
    this.searchTerm = '';
  }

  clearFilter() {
    this.filterMode.set('all');
    this.filteredEntityId.set(null);
    this.filteredEntityName.set(null);
    this.searchTerm = '';
    this.router.navigate(['/tabs/studios']);
  }

  trackByStudioId(_index: number, studio: Studio): string {
    return studio.id;
  }

  convertToStudioInfo(studio: Studio): StudioInfo {
    const enrichedStudio = this.studiosService.enrichStudio(studio);

    return {
      id: enrichedStudio.id,
      name: enrichedStudio.name,
      description: enrichedStudio.description,
      tagline: enrichedStudio.tagline,
      heroImage: enrichedStudio.heroImage,
      address: enrichedStudio.address,
      phone: enrichedStudio.phone,
      email: enrichedStudio.email,
      website: enrichedStudio.website,
      benefits: enrichedStudio.benefits,
      instructors: enrichedStudio.instructors.map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
        username: instructor.username,
        title: instructor.title,
        rank: instructor.rank,
        bio: instructor.bio,
        image: instructor.image,
        experience: instructor.experience,
        email: instructor.email,
        phone: instructor.phone,
        specialties: instructor.specialties,
        certifications: instructor.certifications,
        isActive: instructor.isActive,
      })),
      headInstructor: enrichedStudio.headInstructor
        ? {
            id: enrichedStudio.headInstructor.id,
            name: enrichedStudio.headInstructor.name,
            username: enrichedStudio.headInstructor.username,
            title: enrichedStudio.headInstructor.title,
            rank: enrichedStudio.headInstructor.rank,
            bio: enrichedStudio.headInstructor.bio,
            image: enrichedStudio.headInstructor.image,
            experience: enrichedStudio.headInstructor.experience,
            email: enrichedStudio.headInstructor.email,
            phone: enrichedStudio.headInstructor.phone,
            specialties: enrichedStudio.headInstructor.specialties,
            certifications: enrichedStudio.headInstructor.certifications,
            isActive: enrichedStudio.headInstructor.isActive,
          }
        : undefined,
      studioChief: enrichedStudio.studioChief
        ? {
            id: enrichedStudio.studioChief.id,
            name: enrichedStudio.studioChief.name,
            username: enrichedStudio.studioChief.username,
            title: enrichedStudio.studioChief.title,
            rank: enrichedStudio.studioChief.rank,
            bio: enrichedStudio.studioChief.bio,
            image: enrichedStudio.studioChief.image,
            experience: enrichedStudio.studioChief.experience,
            email: enrichedStudio.studioChief.email,
            phone: enrichedStudio.studioChief.phone,
            specialties: enrichedStudio.studioChief.specialties,
            certifications: enrichedStudio.studioChief.certifications,
            isActive: enrichedStudio.studioChief.isActive,
          }
        : undefined,
      schedule: enrichedStudio.schedule,
      pricing: enrichedStudio.pricing,
      isMember: enrichedStudio.isMember,
      isInstructor: enrichedStudio.isInstructor,
      isStudioChief: enrichedStudio.isStudioChief,
    };
  }

  onCreateStudio() {
    this.router.navigate(['/dash/studio-form/new']);
  }

  onEditStudio(studioId: string) {
    this.router.navigate(['/dash/studio-form', studioId]);
  }

  onChatMessageClick(message: ChatMessage) {
    console.log('Chat message clicked:', message);
  }

  onSendChatMessage(message: string) {
    console.log('Sending chat message:', message);
  }

  getMapEmbedUrl(): SafeResourceUrl {
    const studiosWithLocations = this.filteredStudios.filter(
      (studio) => studio.address,
    );

    let url: string;

    if (studiosWithLocations.length === 0) {
      url =
        'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3048.4!2d-97.7431!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus';
    } else if (studiosWithLocations.length === 1) {
      const studio = studiosWithLocations[0];
      const encodedAddress = encodeURIComponent(studio.address);
      url = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4!2d-97.7431!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDE2JzAyLjAiTiA5N8KwNDQnMzUuMiJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=${encodedAddress}`;
    } else {
      const centerLocation = this.getCenterLocation(studiosWithLocations);
      const encodedLocation = encodeURIComponent(
        `aikido dojo ${centerLocation}`,
      );
      url = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4!2d-97.7431!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDE2JzAyLjAiTiA5N8KwNDQnMzUuMiJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=${encodedLocation}`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private getCenterLocation(studios: Studio[]): string {
    if (studios.length > 0) {
      return studios[0].location;
    }
    return 'United States';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.scrollStates.clear();
  }
}
