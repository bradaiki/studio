import { Component, OnInit, OnDestroy, signal } from '@angular/core';

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
  IonFabButton,
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
    TranslateModule,
  ],
})
export class PeoplePage implements OnInit, OnDestroy {
  // Keep as regular properties - used with [(ngModel)]
  selectedSegment: string = 'discover';
  searchTerm: string = '';

  // Convert to signals
  currentUser = signal<any>(null);
  people = signal<Person[]>([]);
  displayedPeople = signal<Person[]>([]);
  currentUserProfile = signal<Person | null>(null);
  filterMode = signal<'all' | 'single'>('all');
  filteredEntityId = signal<string | null>(null);
  filteredEntityName = signal<string | null>(null);

  private profileLoaded = false;
  private userSubscription?: Subscription;

  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 10;
  private scrollStates = new Map<
    string,
    { page: number; displayed: Person[] }
  >();
  private currentFilterKey = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private peopleService: PeopleService,
    private authStateService: AuthStateService,
  ) {
    addIcons({ person, close, personCircle, chevronForward });
  }

  ngOnInit() {
    this.loadPeople();

    this.peopleService.people$.subscribe((people) => {
      this.people.set(people);
      console.log('[People Page] People loaded:', people.length);

      if (this.displayedPeople().length === 0 && people.length > 0) {
        console.log('[People Page] Initial load - updating displayed people');
        this.updateDisplayedPeople();
      } else if (people.length > 0) {
        this.updateDisplayedPeople();
      }
    });

    this.userSubscription = this.authStateService.currentUser$.subscribe(
      async (user) => {
        this.currentUser.set(user);
        if (user && !this.profileLoaded) {
          this.profileLoaded = true;
          this.currentUserProfile.set(await this.loadCurrentUserProfile());
        } else if (!user) {
          this.profileLoaded = false;
          this.currentUserProfile.set(null);
        }
      },
    );

    this.route.queryParams.subscribe((params) => {
      if (params['filter'] === 'single' && params['entityId']) {
        this.filterMode.set('single');
        this.filteredEntityId.set(params['entityId']);
        this.filteredEntityName.set(params['entityName'] || null);
        this.searchTerm = params['entityName'] || params['username'] || '';
      } else {
        this.filterMode.set('all');
        this.filteredEntityId.set(null);
        this.filteredEntityName.set(null);
        if (params['search']) {
          this.searchTerm = params['search'];
        }
      }

      if (params['instructor']) {
        console.log('Viewing instructor:', params['instructor']);
      }

      this.updateDisplayedPeople();
    });
  }

  private async loadPeople() {
    console.log('[People Page] Loading people from service');
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
    let filtered = this.people();

    if (this.filterMode() === 'single' && this.filteredEntityId()) {
      filtered = filtered.filter(
        (person) => person.id === this.filteredEntityId(),
      );
      return filtered;
    }

    switch (this.selectedSegment) {
      case 'following':
        filtered = this.peopleService.getFollowedPeople();
        break;
      case 'discover':
      default:
        filtered = this.people();
        if (this.currentUser() && this.currentUserProfile()) {
          filtered = filtered.filter(
            (person) => person.id !== this.currentUserProfile()!.id,
          );
        }
        break;
    }

    if (this.searchTerm.trim()) {
      filtered = this.peopleService.searchPeople(this.searchTerm);

      if (this.selectedSegment === 'following') {
        filtered = filtered.filter((person) => person.isFollowing);
      } else if (this.selectedSegment === 'discover') {
        if (this.currentUser() && this.currentUserProfile()) {
          filtered = filtered.filter(
            (person) => person.id !== this.currentUserProfile()!.id,
          );
        }
      }
    }

    return filtered;
  }

  private updateDisplayedPeople() {
    const filtered = this.filteredPeople;

    const filterKey = `${this.filterMode()}:${this.filteredEntityId()}:${this.selectedSegment}:${this.searchTerm}`;

    const filterChanged = filterKey !== this.currentFilterKey;
    this.currentFilterKey = filterKey;

    if (!this.scrollStates.has(filterKey)) {
      this.scrollStates.set(filterKey, { page: 0, displayed: [] });
    }

    const state = this.scrollStates.get(filterKey)!;

    if (state.displayed.length === 0 || filterChanged) {
      console.log(
        '[People Page] Loading initial people for filter:',
        filterKey,
      );
      this.loadInitialPeople(state, filtered);
    }

    this.displayedPeople.set(state.displayed);
    console.log(
      '[People Page] Displayed people count:',
      this.displayedPeople().length,
    );
  }

  private loadInitialPeople(
    state: { page: number; displayed: Person[] },
    source: Person[],
  ) {
    state.page = 0;
    state.displayed = [];
    this.loadMorePeopleForState(state, source);
  }

  private loadMorePeopleForState(
    state: { page: number; displayed: Person[] },
    source: Person[],
  ) {
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
        this.displayedPeople.set(state.displayed);
      }

      event.target.complete();

      if (this.displayedPeople().length >= filtered.length) {
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
  }

  onPersonProfile(person: Person) {
    console.log('View profile:', person.username);
    this.router.navigate(['/dash/profile', person.id]);
  }

  clearFilter() {
    this.filterMode.set('all');
    this.filteredEntityId.set(null);
    this.filteredEntityName.set(null);
    this.searchTerm = '';
    this.router.navigate(['/tabs/people']);
  }

  get isFiltered(): boolean {
    return this.filterMode() === 'single';
  }

  async loadCurrentUserProfile(): Promise<Person | null> {
    if (!this.currentUser()) return null;

    try {
      const user = await this.authStateService.getCurrentUser();
      if (user?.userId) {
        const person = await this.peopleService.getPersonByIdAsync(user.userId);
        if (person) {
          return person;
        }
      }
    } catch (error) {
      console.error('Error loading current user profile:', error);
    }

    return (
      this.people().find(
        (person) =>
          person.username === this.currentUser().username ||
          person.name === this.currentUser().username ||
          (this.currentUser().signInDetails?.loginId &&
            (person.username === this.currentUser().signInDetails.loginId ||
              person.name
                .toLowerCase()
                .includes(
                  this.currentUser().signInDetails.loginId.split('@')[0],
                ))),
      ) || null
    );
  }

  async navigateToMyProfile() {
    try {
      const user = await this.authStateService.getCurrentUser();
      if (user?.userId) {
        const person = await this.peopleService.getPersonByIdAsync(user.userId);
        if (person) {
          this.router.navigate(['/dash/profile', person.id]);
        } else {
          this.router.navigate(['/dash/profile']);
        }
      } else {
        this.router.navigate(['/dash/profile']);
      }
    } catch (error) {
      console.error('Error navigating to profile:', error);
      this.router.navigate(['/dash/profile']);
    }
  }
}
