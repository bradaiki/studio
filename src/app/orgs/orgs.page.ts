import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  OrganizationComponent,
  OrganizationInfo,
  Dojo,
  Event,
  SocialMedia,
} from '../components/organization/organization.component';
import {
  OrganizationsService,
  Organization,
} from '../services/organizations.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonChip,
  IonIcon,
  IonButton,
  IonLabel,
  IonText,
  IonFab,
  IonFabButton,
  IonButtons,
  IonBackButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { home, close } from 'ionicons/icons';

@Component({
  selector: 'app-orgs',
  templateUrl: 'orgs.page.html',
  styleUrls: ['orgs.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonChip,
    IonIcon,
    IonButton,
    IonLabel,
    IonText,
    IonFab,
    IonFabButton,
    IonButtons,
    IonBackButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    OrganizationComponent,
    TranslateModule,
  ],
})
export class OrgsPage implements OnInit {
  searchTerm: string = '';
  filterMode: 'all' | 'single' = 'all';
  filteredEntityId: string | null = null;
  filteredEntityName: string | null = null;

  organizations: Organization[] = [];
  displayedOrganizations: Organization[] = [];

  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 6;
  private scrollStates = new Map<
    string,
    { page: number; displayed: Organization[] }
  >();
  private currentFilterKey = '';

  // Legacy single organization info for backward compatibility
  organizationInfo: OrganizationInfo = {
    id: 'asu',
    name: 'Aikido Schools of Ueshiba',
    tagline: 'Preserving the Art of Peace Through Traditional Aikido',
    mission:
      'Aikido Schools of Ueshiba (ASU) is dedicated to preserving and transmitting the authentic teachings of Aikido as developed by its founder, Morihei Ueshiba O-Sensei. We maintain the highest standards of technical excellence and spiritual development through our network of affiliated dojos worldwide. Founded to honor the legacy of O-Sensei, ASU continues the lineage through direct transmission from Yamada Sensei and other senior instructors who trained directly under the founder. Our commitment is to preserve the true spirit of Aikido while making it accessible to practitioners of all backgrounds.',
    heroImage:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
    philosophy: {
      quote: 'The Way of the Warrior is to stop trouble before it starts.',
      attribution: '— Morihei Ueshiba O-Sensei, Founder of Aikido',
      description:
        'Aikido is more than a martial art—it is a path of personal development that teaches us to harmonize with the forces around us rather than oppose them. Through dedicated practice, we cultivate not only physical technique but also mental clarity and spiritual growth.',
      image:
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    },
    statistics: [
      { number: '150+', label: 'Member Dojos' },
      { number: '15K+', label: 'Active Students' },
      { number: '25', label: 'Countries' },
      { number: '50+', label: 'Years' },
    ],
    programs: [
      {
        name: 'Traditional Aikido',
        description:
          "Classical Aikido training following O-Sensei's original teachings",
        level: 'All Levels',
        duration: 'Ongoing',
        certification: 'Dan/Kyu Rankings',
      },
      {
        name: 'Instructor Certification',
        description:
          'Comprehensive teacher training program for qualified practitioners',
        level: '2nd Dan Minimum',
        duration: '2 Years',
        certification: 'Teaching License',
      },
      {
        name: 'Youth Development',
        description:
          'Character-building martial arts program for children and teens',
        level: 'Ages 6-17',
        duration: 'Progressive',
        certification: 'Youth Rankings',
      },
      {
        name: 'Weapons Training',
        description: 'Traditional weapons including jo, bokken, and tanto',
        level: '3rd Kyu+',
        duration: 'Advanced Study',
        certification: 'Weapons Proficiency',
      },
    ],
    memberDojos: [
      {
        id: '1',
        name: 'Rising Sun Aikido',
        location: 'Austin, TX',
        instructor: 'David Johnson',
        rank: '6th Dan',
        students: 85,
        established: '2010',
        image:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop',
      },
      {
        id: '2',
        name: 'Mountain View Aikido',
        location: 'Denver, CO',
        instructor: 'Sarah Williams',
        rank: '5th Dan',
        students: 120,
        established: '2008',
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      },
      {
        id: '3',
        name: 'Pacific Aikido Center',
        location: 'Seattle, WA',
        instructor: 'Michael Chen',
        rank: '7th Dan',
        students: 200,
        established: '1995',
        image:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop',
      },
      {
        id: '4',
        name: 'Desert Wind Aikido',
        location: 'Phoenix, AZ',
        instructor: 'Lisa Rodriguez',
        rank: '4th Dan',
        students: 65,
        established: '2015',
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      },
    ],
    upcomingEvents: [
      {
        id: '1',
        title: 'Annual Summer Seminar',
        date: '2024-07-15',
        location: 'Austin, TX',
        type: 'seminar',
        instructor: 'Yamada Sensei (8th Dan)',
        cost: '$150',
      },
      {
        id: '2',
        title: 'Regional Dan Testing',
        date: '2024-06-20',
        location: 'Denver, CO',
        type: 'testing',
        instructor: 'Testing Board',
        cost: '$200',
      },
      {
        id: '3',
        title: 'Weapons Workshop',
        date: '2024-06-08',
        location: 'Seattle, WA',
        type: 'workshop',
        instructor: 'Michael Chen Sensei',
        cost: '$75',
      },
      {
        id: '4',
        title: 'Youth Tournament',
        date: '2024-08-10',
        location: 'Phoenix, AZ',
        type: 'tournament',
        instructor: 'Various Instructors',
        cost: '$50',
      },
    ],
    lineageFeatures: [
      {
        icon: 'book-outline',
        title: 'Traditional Curriculum',
        description:
          "Authentic techniques preserved from O-Sensei's original teachings",
      },
      {
        icon: 'ribbon',
        title: 'International Recognition',
        description:
          'Ranks and certifications recognized by Aikikai Foundation',
      },
      {
        icon: 'star',
        title: 'Continuous Learning',
        description: 'Regular seminars with senior instructors from Japan',
      },
    ],
    contact: {
      email: 'info@asu.org',
      phone: '+1 (212) 586-9014',
      website: 'asu.org',
    },
    socialMedia: [
      { platform: 'facebook', url: 'https://facebook.com/asu' },
      { platform: 'instagram', url: 'https://instagram.com/asu' },
      { platform: 'twitter', url: 'https://twitter.com/asu' },
    ],
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private organizationsService: OrganizationsService,
  ) {
    addIcons({ home, close });
  }

  ngOnInit() {
    // Subscribe to organizations$ observable for automatic updates
    this.organizationsService.organizations$.subscribe((organizations) => {
      console.log(
        '[Orgs Page] Received organizations from service:',
        organizations.length,
      );
      this.organizations = organizations;
      this.updateDisplayedOrganizations();
    });

    // Check if we're filtering to a specific organization
    this.route.queryParams.subscribe((params) => {
      if (params['filter'] === 'single' && params['entityId']) {
        this.filterMode = 'single';
        this.filteredEntityId = params['entityId'];
        this.filteredEntityName = params['entityName'] || null;
        this.searchTerm = params['entityName'] || '';
      } else {
        this.filterMode = 'all';
        this.filteredEntityId = null;
        this.filteredEntityName = null;
        if (params['search']) {
          this.searchTerm = params['search'];
        }
      }
      this.updateDisplayedOrganizations();
    });
  }

  // Event handlers for organization component
  onDojoClick(dojo: Dojo) {
    console.log('Dojo clicked:', dojo.name);
    this.router.navigate(['/dash/studios']);
  }

  onEventClick(event: Event) {
    console.log('Event clicked:', event.title);
    // In real app, would open registration form or external link
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

  onSocialClick(social: SocialMedia) {
    window.open(social.url, '_blank');
  }

  onFindDojoClick() {
    console.log('Find dojo clicked');
    this.router.navigate(['/dash/studios']);
  }

  // New methods for handling multiple organizations
  get filteredOrganizations(): Organization[] {
    let filtered: Organization[];

    // If in single entity mode, filter to show only that entity
    if (this.filterMode === 'single' && this.filteredEntityId) {
      filtered = this.organizations.filter(
        (org) => org.id === this.filteredEntityId,
      );
    } else if (this.searchTerm.trim()) {
      // Filter by search term
      filtered = this.organizationsService.searchOrganizations(this.searchTerm);
    } else {
      filtered = this.organizations;
    }

    return filtered;
  }

  private updateDisplayedOrganizations() {
    const filtered = this.filteredOrganizations;
    console.log('[Orgs Page] Filtered organizations:', filtered.length);

    // Create unique key for this filter combination
    const filterKey = `${this.filterMode}:${this.filteredEntityId}:${this.searchTerm}`;

    // Check if filter changed OR if we need to reload data
    const filterChanged = filterKey !== this.currentFilterKey;
    const state = this.scrollStates.get(filterKey);
    const needsReload = !state || state.displayed.length === 0;

    if (filterChanged || needsReload) {
      this.currentFilterKey = filterKey;

      // Get or create state for this filter
      if (!this.scrollStates.has(filterKey)) {
        this.scrollStates.set(filterKey, { page: 0, displayed: [] });
      }

      const currentState = this.scrollStates.get(filterKey)!;

      // If state is empty or data changed, load initial items
      if (currentState.displayed.length === 0 || needsReload) {
        this.loadInitialOrganizations(currentState, filtered);
      }

      this.displayedOrganizations = currentState.displayed;
      console.log(
        '[Orgs Page] Displayed organizations:',
        this.displayedOrganizations.length,
      );
    }
  }

  private loadInitialOrganizations(
    state: { page: number; displayed: Organization[] },
    source: Organization[],
  ) {
    state.page = 0;
    state.displayed = [];
    this.loadMoreOrganizationsForState(state, source);
  }

  private loadMoreOrganizationsForState(
    state: { page: number; displayed: Organization[] },
    source: Organization[],
  ) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newOrgs = source.slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newOrgs];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const filtered = this.filteredOrganizations;
      const state = this.scrollStates.get(this.currentFilterKey);
      if (state) {
        this.loadMoreOrganizationsForState(state, filtered);
        this.displayedOrganizations = state.displayed;
      }

      event.target.complete();

      // Disable infinite scroll when all items are loaded
      if (this.displayedOrganizations.length >= filtered.length) {
        event.target.disabled = true;
      }
    }, 500);
  }

  get isFiltered(): boolean {
    return this.filterMode === 'single';
  }

  get showLegacyOrganization(): boolean {
    // Never show legacy organization - always use data from service
    return false;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.updateDisplayedOrganizations();
  }

  onSearchClear() {
    this.searchTerm = '';
  }

  clearFilter() {
    this.filterMode = 'all';
    this.filteredEntityId = null;
    this.filteredEntityName = null;
    this.searchTerm = '';
    // Update URL to remove query parameters
    this.router.navigate(['/dash/orgs']);
  }

  trackByOrganizationId(_index: number, organization: Organization): string {
    return organization.id;
  }

  onOrganizationClick(organization: Organization) {
    // Navigate to individual organization page
    this.router.navigate(['/dash/org', organization.id]);
  }

  // Convert Organization to OrganizationInfo for component compatibility
  convertToOrganizationInfo(organization: Organization): OrganizationInfo {
    return {
      id: organization.id,
      name: organization.name,
      tagline: organization.tagline,
      mission: organization.mission,
      heroImage: organization.heroImage,
      philosophy: organization.philosophy,
      statistics: organization.statistics,
      programs: organization.programs,
      memberDojos: organization.memberDojos,
      upcomingEvents: organization.upcomingEvents,
      lineageFeatures: organization.lineageFeatures,
      contact: organization.contact,
      socialMedia: organization.socialMedia,
    };
  }

  onCreateOrganization() {
    this.router.navigate(['/dash/org-form/new']);
  }

  onEditOrganization(orgId: string) {
    this.router.navigate(['/dash/org-form', orgId]);
  }
}
