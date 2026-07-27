import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonSearchbar,
  IonChip,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonAvatar,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { PersonComponent } from '../components/person/person.component';
import { PeopleService, Person } from '../services/people.service';
import { AuthStateService } from '../services/auth-state.service';
import { addIcons } from 'ionicons';
import { person, close, personCircle, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-people',
  templateUrl: 'people.page.html',
  styleUrls: ['people.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonSegment, 
    IonSegmentButton, 
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonText,
    IonSearchbar,
    IonChip,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonAvatar,
    IonFab,
    IonFabButton,
    PersonComponent,
    TranslateModule
  ]
})
export class PeoplePage implements OnInit, OnDestroy {
  selectedSegment: string = 'discover';
  searchTerm: string = '';
  currentUser: any = null;
  
  people: Person[] = [];
  displayedPeople: Person[] = [];
  currentUserProfile: Person | null = null;
  private profileLoaded = false; // Flag to prevent multiple loads
  private userSubscription?: Subscription;
  
  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 10;
  private scrollStates = new Map<string, { page: number; displayed: Person[] }>();
  private currentFilterKey = '';

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private peopleService: PeopleService,
    private authStateService: AuthStateService
  ) {
    // Add icons
    addIcons({ person, close, personCircle, chevronForward });
  }

  // Add properties for single entity filtering
  filterMode: 'all' | 'single' = 'all';
  filteredEntityId: string | null = null;
  filteredEntityName: string | null = null;

  ngOnInit() {
    // Load people from service
    this.loadPeople();
    
    // Subscribe to people service changes (including data source toggle)
    this.peopleService.people$.subscribe(people => {
      this.people = people;
      console.log('[People Page] People loaded:', people.length);
      
      // If no people are displayed yet and we have people, update display
      if (this.displayedPeople.length === 0 && people.length > 0) {
        console.log('[People Page] Initial load - updating displayed people');
        this.updateDisplayedPeople();
      } else if (people.length > 0) {
        // Update existing display
        this.updateDisplayedPeople();
      }
    });
    
    // Subscribe to current user - only load profile once
    this.userSubscription = this.authStateService.currentUser$.subscribe(async user => {
      this.currentUser = user;
      if (user && !this.profileLoaded) {
        // Load current user's person profile from database only once
        this.profileLoaded = true;
        this.currentUserProfile = await this.loadCurrentUserProfile();
      } else if (!user) {
        // Reset if user logs out
        this.profileLoaded = false;
        this.currentUserProfile = null;
      }
    });
    
    // Check if we're navigating to a specific person or filtering
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'single' && params['entityId']) {
        this.filterMode = 'single';
        this.filteredEntityId = params['entityId'];
        this.filteredEntityName = params['entityName'] || null;
        this.searchTerm = params['entityName'] || params['username'] || '';
      } else {
        this.filterMode = 'all';
        this.filteredEntityId = null;
        this.filteredEntityName = null;
        if (params['search']) {
          this.searchTerm = params['search'];
        }
      }
      
      if (params['instructor']) {
        // Optionally scroll to the instructor or highlight them
        console.log('Viewing instructor:', params['instructor']);
      }
      
      this.updateDisplayedPeople();
    });
  }

  private async loadPeople() {
    console.log('[People Page] Loading people from service');
    // Just trigger a refresh - the subscription will update the UI
    await this.peopleService.refreshPeopleFromAPI();
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.updateDisplayedPeople();
  }

  async handleRefresh(event: any) {
    try {
      console.log('Refreshing people...');
      await this.loadPeople();
      event.target.complete();
    } catch (error) {
      console.error('Error refreshing people:', error);
      event.target.complete();
    }
  }

  get filteredPeople(): Person[] {
    let filtered = this.people;
    
    // If in single entity mode, filter to show only that entity
    if (this.filterMode === 'single' && this.filteredEntityId) {
      filtered = filtered.filter(person => person.id === this.filteredEntityId);
      return filtered;
    }
    
    // Filter by segment
    switch (this.selectedSegment) {
      case 'following':
        filtered = this.peopleService.getFollowedPeople();
        break;
      case 'discover':
      default:
        filtered = this.people;
        // Exclude current user from discover list
        if (this.currentUser && this.currentUserProfile) {
          filtered = filtered.filter(person => person.id !== this.currentUserProfile!.id);
        }
        break;
    }
    
    // Filter by search term
    if (this.searchTerm.trim()) {
      filtered = this.peopleService.searchPeople(this.searchTerm);
      
      // Apply segment filter to search results
      if (this.selectedSegment === 'following') {
        filtered = filtered.filter(person => person.isFollowing);
      } else if (this.selectedSegment === 'discover') {
        // Exclude current user from discover search results
        if (this.currentUser && this.currentUserProfile) {
          filtered = filtered.filter(person => person.id !== this.currentUserProfile!.id);
        }
      }
    }
    
    return filtered;
  }

  private updateDisplayedPeople() {
    const filtered = this.filteredPeople;
    
    // Create unique key for this filter combination
    const filterKey = `${this.filterMode}:${this.filteredEntityId}:${this.selectedSegment}:${this.searchTerm}`;
    
    // Check if filter changed
    const filterChanged = filterKey !== this.currentFilterKey;
    this.currentFilterKey = filterKey;
    
    // Get or create state for this filter
    if (!this.scrollStates.has(filterKey)) {
      this.scrollStates.set(filterKey, { page: 0, displayed: [] });
    }
    
    const state = this.scrollStates.get(filterKey)!;
    
    // If state is empty or filter changed, load initial items
    if (state.displayed.length === 0 || filterChanged) {
      console.log('[People Page] Loading initial people for filter:', filterKey);
      this.loadInitialPeople(state, filtered);
    }
    
    this.displayedPeople = state.displayed;
    console.log('[People Page] Displayed people count:', this.displayedPeople.length);
  }

  private loadInitialPeople(state: { page: number; displayed: Person[] }, source: Person[]) {
    state.page = 0;
    state.displayed = [];
    this.loadMorePeopleForState(state, source);
  }

  private loadMorePeopleForState(state: { page: number; displayed: Person[] }, source: Person[]) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newPeople = source.slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newPeople];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const filtered = this.filteredPeople;
      const state = this.scrollStates.get(this.currentFilterKey);
      if (state) {
        this.loadMorePeopleForState(state, filtered);
        this.displayedPeople = state.displayed;
      }
      
      event.target.complete();
      
      // Disable infinite scroll when all items are loaded
      if (this.displayedPeople.length >= filtered.length) {
        event.target.disabled = true;
      }
    }, 500);
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.updateDisplayedPeople();
  }

  onSearchClear() {
    this.searchTerm = '';
  }

  trackByPersonId(_index: number, person: Person): string {
    return person.id;
  }

  onPersonFollow(person: Person) {
    this.peopleService.toggleFollow(person.id);
    console.log('Follow toggled for:', person.username);
  }

  onPersonMessage(person: Person) {
    console.log('Message person:', person.username);
    // In a real app, this would open a message dialog or navigate to messages
  }

  onPersonProfile(person: Person) {
    console.log('View profile:', person.username);
    this.router.navigate(['/dash/profile', person.id]);
  }

  clearFilter() {
    this.filterMode = 'all';
    this.filteredEntityId = null;
    this.filteredEntityName = null;
    this.searchTerm = '';
    // Update URL to remove query parameters
    this.router.navigate(['/tabs/people']);
  }

  get isFiltered(): boolean {
    return this.filterMode === 'single';
  }

  async loadCurrentUserProfile(): Promise<Person | null> {
    if (!this.currentUser) return null;
    
    try {
      const user = await this.authStateService.getCurrentUser();
      if (user?.userId) {
        // Try to load from database
        const person = await this.peopleService.getPersonByIdAsync(user.userId);
        if (person) {
          return person;
        }
      }
    } catch (error) {
      console.error('Error loading current user profile:', error);
    }
    
    // Fallback to searching in local cache
    return this.people.find(person => 
      person.username === this.currentUser.username ||
      person.name === this.currentUser.username ||
      (this.currentUser.signInDetails?.loginId && 
       (person.username === this.currentUser.signInDetails.loginId ||
        person.name.toLowerCase().includes(this.currentUser.signInDetails.loginId.split('@')[0])))
    ) || null;
  }

  async navigateToMyProfile() {
    try {
      // Get current user
      const user = await this.authStateService.getCurrentUser();
      if (user?.userId) {
        // Try to load person from database
        const person = await this.peopleService.getPersonByIdAsync(user.userId);
        if (person) {
          // Navigate to profile page with the database-loaded person
          this.router.navigate(['/dash/profile', person.id]);
        } else {
          // Fallback to profile page if no person record exists
          this.router.navigate(['/dash/profile']);
        }
      } else {
        // No user logged in, go to profile page
        this.router.navigate(['/dash/profile']);
      }
    } catch (error) {
      console.error('Error navigating to profile:', error);
      // Fallback to profile page on error
      this.router.navigate(['/dash/profile']);
    }
  }
}
