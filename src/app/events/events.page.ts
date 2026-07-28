import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventsService, Event } from '../services/events.service';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonSearchbar,
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
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonText,
  IonButtons,
  IonBackButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { 
  calendar, 
  location, 
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
  filterOutline,
  addOutline,
  mapOutline,
  callOutline,
  home,
  close
} from 'ionicons/icons';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonSearchbar,
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
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonText,
    IonButtons,
    IonBackButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    TranslateModule
  ],
})
export class EventsPage implements OnInit {
  // Keep as regular properties - used with [(ngModel)]
  searchTerm: string = '';
  selectedFilter: string = 'all';

  // Convert to signals
  filterMode = signal<'all' | 'single'>('all');
  filteredEntityId = signal<string | null>(null);
  filteredEntityName = signal<string | null>(null);
  allEvents = signal<Event[]>([]);
  filteredEvents = signal<Event[]>([]);
  displayedEvents = signal<Event[]>([]);
  
  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 8;
  private scrollStates = new Map<string, { page: number; displayed: Event[] }>();
  private currentFilterKey = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eventsService: EventsService
  ) {
    addIcons({ 
      calendar, 
      location, 
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
      filterOutline,
      addOutline,
      mapOutline,
      callOutline,
      home,
      close
    });
  }

  ngOnInit() {
    this.eventsService.events$.subscribe(events => {
      this.allEvents.set(events);
      this.filterEvents();
    });
    
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'single' && params['eventId']) {
        this.filterMode.set('single');
        this.filteredEntityId.set(params['eventId']);
        this.filteredEntityName.set(params['eventName'] || null);
        this.searchTerm = params['eventName'] || '';
      } else {
        this.filterMode.set('all');
        this.filteredEntityId.set(null);
        this.filteredEntityName.set(null);
        if (params['search']) {
          this.searchTerm = params['search'];
        }
      }
      this.filterEvents();
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterEvents();
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.filterEvents();
  }

  filterEvents() {
    let filtered = [...this.allEvents()];

    if (this.filterMode() === 'single' && this.filteredEntityId()) {
      filtered = filtered.filter(event => event.id === this.filteredEntityId());
    } else {
      if (this.searchTerm) {
        filtered = this.eventsService.searchEvents(this.searchTerm);
      }

      if (this.selectedFilter !== 'all') {
        if (this.selectedFilter === 'featured') {
          filtered = filtered.filter(event => event.featured);
        } else {
          filtered = filtered.filter(event => event.type === this.selectedFilter);
        }
      }
    }

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.filteredEvents.set(filtered);
    this.updateDisplayedEvents();
  }

  private updateDisplayedEvents() {
    const filtered = this.filteredEvents();
    
    const filterKey = `${this.filterMode()}:${this.filteredEntityId()}:${this.selectedFilter}:${this.searchTerm}`;
    
    const filterChanged = filterKey !== this.currentFilterKey;
    const state = this.scrollStates.get(filterKey);
    const needsReload = !state || state.displayed.length === 0;
    
    if (filterChanged || needsReload) {
      this.currentFilterKey = filterKey;
      
      if (!this.scrollStates.has(filterKey)) {
        this.scrollStates.set(filterKey, { page: 0, displayed: [] });
      }
      
      const currentState = this.scrollStates.get(filterKey)!;
      
      if (currentState.displayed.length === 0 || needsReload) {
        this.loadInitialEvents(currentState, filtered);
      }
      
      this.displayedEvents.set(currentState.displayed);
    }
  }

  private loadInitialEvents(state: { page: number; displayed: Event[] }, source: Event[]) {
    state.page = 0;
    state.displayed = [];
    this.loadMoreEventsForState(state, source);
  }

  private loadMoreEventsForState(state: { page: number; displayed: Event[] }, source: Event[]) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newEvents = source.slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newEvents];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const filtered = this.filteredEvents();
      const state = this.scrollStates.get(this.currentFilterKey);
      if (state) {
        this.loadMoreEventsForState(state, filtered);
        this.displayedEvents.set(state.displayed);
      }
      
      event.target.complete();
      
      if (this.displayedEvents().length >= filtered.length) {
        event.target.disabled = true;
      }
    }, 500);
  }

  get isFiltered(): boolean {
    return this.filterMode() === 'single';
  }

  clearFilter() {
    this.filterMode.set('all');
    this.filteredEntityId.set(null);
    this.filteredEntityName.set(null);
    this.searchTerm = '';
    this.selectedFilter = 'all';
    this.router.navigate(['/dash/events']);
    this.filterEvents();
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

  isEventSoldOut(event: Event): boolean {
    return this.eventsService.isEventSoldOut(event.id);
  }

  getAvailabilityText(event: Event): string {
    return this.eventsService.getAvailabilityText(event.id);
  }

  registerForEvent(event: Event) {
    if (this.eventsService.registerForEvent(event.id)) {
      console.log('Successfully registered for event:', event.title);
    } else {
      console.log('Failed to register for event:', event.title);
    }
  }

  onEventClick(event: Event) {
    this.router.navigate(['/dash/event', event.id]);
  }

  shareEvent(event: Event) {
    console.log('Share event:', event.title);
  }

  contactOrganizer(event: Event) {
    window.open(`mailto:${event.contactEmail}?subject=Inquiry about ${event.title}`, '_self');
  }

  getDirections(event: Event) {
    const encodedAddress = encodeURIComponent(event.address);
    window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
  }
}
