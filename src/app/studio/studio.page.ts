import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location as AngularLocation } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { StudiosService, Studio } from '../services/studios.service';
import { ActivitiesService, Activity } from '../services/activities.service';
import { PeopleService, Person } from '../services/people.service';
import { StudioMembershipService } from '../services/studio-membership.service';
import { ChatMessagesComponent } from '../components/chat-messages/chat-messages.component';
import { ChatAccessController, OrganizedStudioChats } from '../services/chat-access-controller.service';
import { SimpleStudioJoinComponent } from '../components/simple-studio-join/simple-studio-join.component';
import { AuthStateService } from '../services/auth-state.service';
import { JoinRequestService } from '../services/join-request.service';
import { InstructorPermissionService } from '../services/instructor-permission.service';
import { InstructorJoinReviewModalComponent } from '../components/instructor-join-review-modal/instructor-join-review-modal.component';
import { setupInstructorTestEnvironment, checkInstructorStatus } from '../utils/setup-instructor-data';
import { TranslationService } from '../services/translation.service';
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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonChip,
  IonAvatar,
  IonSpinner,
  IonText,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBack, home, chatbubbles, people, lockClosed, globe, person, warning, refresh, mail, checkmarkCircle,
  location as locationIcon, call, navigate, map, grid, list, repeat, time, calendar, card, chevronBack, 
  chevronForward, star, personCircle, school, settings, personAdd
} from 'ionicons/icons';

@Component({
  selector: 'app-studio',
  templateUrl: './studio.page.html',
  styleUrls: ['./studio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonBadge,
    IonChip,
    IonAvatar,
    IonSpinner,
    IonText,
    ChatMessagesComponent
  ]
})
export class StudioPage implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  
  loading = signal(true);
  notFound = signal(false);
  
  studio: Studio = {
    id: '',
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    tagline: '',
    heroImage: '',
    verified: false,
    memberCount: 0,
    established: '',
    instructors: [],
    schedule: [],
    pricing: [],
    benefits: [],
    isMember: false,
    isInstructor: false,
    isStudioChief: false
  };

  // Schedule display properties
  scheduleView: 'list' | 'calendar' = 'calendar'; // Default to calendar view
  currentDate: Date = new Date();
  studioActivities = signal<Activity[]>([]);
  studioStudents = signal<Person[]>([]);
  
  // Cached map URL to prevent infinite refresh
  cachedMapUrl: SafeResourceUrl | null = null;
  
  // View selection for studio vs chats
  selectedView: 'studio' | 'chats' = 'studio';
  
  // Chat-related properties
  organizedChats: OrganizedStudioChats | null = null;
  isLoadingChats = signal(false);
  chatLoadError = signal(false);
  currentUserId: string | null = null;
  totalChatCount = signal(0);
  pendingInvitationCount = signal(0);
  hasChatsAccess = signal(false);
  private chatsLoadedForStudio: string | null = null; // Track which studio we've loaded chats for
  private preventScrollDuringChatLoad = false; // Flag to prevent scroll during chat initialization
  
  // Calendar data
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months = ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Time slots for hourly calendar view
  timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  // Instructor permissions and join request management
  canReviewRequests = signal(false);
  pendingRequestCount = signal(0);
  isLoadingPermissions = signal(false);
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: AngularLocation,
    private studiosService: StudiosService,
    private activitiesService: ActivitiesService,
    private peopleService: PeopleService,
    private studioMembershipService: StudioMembershipService,
    private sanitizer: DomSanitizer,
    private modalController: ModalController,
    private toastController: ToastController,
    private chatAccessController: ChatAccessController,
    private authStateService: AuthStateService,
    private instructorPermissionService: InstructorPermissionService,
    private joinRequestService: JoinRequestService,
    private translationService: TranslationService
  ) {
    addIcons({checkmarkCircle,home,arrowBack,personAdd,grid,list,repeat,time,person,location:locationIcon,calendar,card,chevronBack,chevronForward,people,call,mail,globe,navigate,map,settings,star,personCircle,school,chatbubbles,lockClosed,warning,refresh});
  }

  ngOnInit() {
    const studioId = this.route.snapshot.paramMap.get('id');
    
    if (studioId) {
      // Try to load immediately (may work if data already cached)
      this.tryLoadStudio(studioId);

      // Also subscribe to studios$ in case data loads later (e.g., page refresh)
      const studiosSub = this.studiosService.studios$.subscribe(studios => {
        if (!this.studio.id && studios.length > 0) {
          this.tryLoadStudio(studioId);
        }
      });
      this.subscriptions.push(studiosSub);
    } else {
      this.loading.set(false);
    }
  }

  private tryLoadStudio(studioId: string) {
    const foundStudio = this.studiosService.getStudioById(studioId);
      
    if (foundStudio) {
      this.studio = foundStudio;
      this.notFound.set(false);
      this.loading.set(false);
      console.log('[StudioPage] Initial studio data:', this.studio.name, 'Instructors:', this.studio.instructors.length);
        
      // Load full studio data with members
      this.studiosService.loadStudioWithMembers(studioId).then(enrichedStudio => {
        if (enrichedStudio) {
          this.studio = enrichedStudio;
          console.log('[StudioPage] Enriched studio data loaded. Instructors:', this.studio.instructors.length);
        } else {
          console.error('[StudioPage] Failed to load enriched studio data');
        }
      }).catch(error => {
        console.error('[StudioPage] Error loading studio members:', error);
      });
        
      this.loadStudioActivities(studioId);
      this.loadStudioStudents(studioId);
        
      // Cache the map URL to prevent infinite refresh
      this.cachedMapUrl = this.generateStudioMapUrl();
        
      // Initialize instructor permissions
      this.initializeInstructorPermissions(studioId);
        
      // Initialize chat integration
      this.initializeChatIntegration(studioId);
    } else {
      // Only mark not found after service has loaded data
      const sub = this.studiosService.studios$.subscribe(studios => {
        if (studios.length > 0) {
          this.notFound.set(true);
          this.loading.set(false);
        }
      });
      sub.unsubscribe();
      // If subscribe+unsubscribe didn't set it (no data yet), keep loading
      if (!this.notFound()) {
        // loading stays true, waiting for studios$ to emit
      }
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ionViewWillEnter() {
    // Scroll to top when entering the page to prevent auto-scroll to chat
    if (this.content) {
      this.content.scrollToTop(0);
    }
    
    // Reload activities when entering the page to ensure fresh data
    if (this.studio) {
      this.loadStudioActivities(this.studio.id);
      this.loadStudioStudents(this.studio.id);
    }
  }

  /**
   * Initialize instructor permissions and join request management
   */
  private async initializeInstructorPermissions(studioId: string): Promise<void> {
    try {
      // Subscribe to auth state changes to check permissions
      const authSub = this.authStateService.currentUser$.subscribe(async user => {
        this.currentUserId = user?.userId || null;
        
        if (this.currentUserId) {
          await this.checkInstructorPermissions(studioId);
        } else {
          // Clear permissions when user is not authenticated
          this.canReviewRequests.set(false);
          this.pendingRequestCount.set(0);
        }
      });
      
      this.subscriptions.push(authSub);

    } catch (error) {
      console.error('Error initializing instructor permissions:', error);
      this.canReviewRequests.set(false);
      this.pendingRequestCount.set(0);
    }
  }

  /**
   * Check instructor permissions for the current user
   */
  async checkInstructorPermissions(studioId?: string): Promise<void> {
    const targetStudioId = studioId || this.studio?.id;
    
    if (!targetStudioId || !this.currentUserId) {
      this.canReviewRequests.set(false);
      this.pendingRequestCount.set(0);
      return;
    }

    try {
      this.isLoadingPermissions.set(true);

      // Check if user can manage requests
      this.canReviewRequests.set(await this.instructorPermissionService.canManageRequests(
        targetStudioId, 
        this.currentUserId
      ));

      console.log(`User ${this.currentUserId} can review requests for studio ${targetStudioId}:`, this.canReviewRequests());

      // If user can review requests, get pending request count
      if (this.canReviewRequests()) {
        await this.refreshPendingRequestCount(targetStudioId);
        
        // Subscribe to permission changes for real-time updates
        const permissionSub = this.instructorPermissionService
          .subscribeToPermissionChanges(targetStudioId, this.currentUserId)
          .subscribe((canManage: boolean) => {
            console.log('Permission change detected:', canManage);
            this.canReviewRequests.set(canManage);
            
            if (!canManage) {
              this.pendingRequestCount.set(0);
            } else {
              // Refresh count when permissions are granted
              this.refreshPendingRequestCount(targetStudioId);
            }
          });
        
        this.subscriptions.push(permissionSub);
        
        // Subscribe to real-time pending request updates
        const requestUpdatesSub = this.joinRequestService
          .subscribeToRequestUpdates(targetStudioId)
          .subscribe(requests => {
            console.log('Real-time request update received:', requests.length, 'pending requests');
            this.pendingRequestCount.set(requests.length);
          });
        
        this.subscriptions.push(requestUpdatesSub);
      } else {
        this.pendingRequestCount.set(0);
      }

    } catch (error) {
      console.error('Error checking instructor permissions:', error);
      this.canReviewRequests.set(false);
      this.pendingRequestCount.set(0);
    } finally {
      this.isLoadingPermissions.set(false);
    }
  }

  /**
   * Refresh the pending request count
   */
  async refreshPendingRequestCount(studioId?: string): Promise<void> {
    const targetStudioId = studioId || this.studio?.id;
    
    if (!targetStudioId || !this.canReviewRequests()) {
      this.pendingRequestCount.set(0);
      return;
    }

    try {
      const pendingRequests = await this.joinRequestService.getPendingRequestsForStudio(targetStudioId);
      this.pendingRequestCount.set(pendingRequests.length);
      
      console.log(`Updated pending request count for studio ${targetStudioId}:`, this.pendingRequestCount());

    } catch (error) {
      console.error('Error refreshing pending request count:', error);
      // Don't reset count on error - keep last known value
    }
  }

  /**
   * Open the join request review modal
   */
  async openJoinRequestReviewModal(): Promise<void> {
    if (!this.studio?.id || !this.canReviewRequests()) {
      console.warn('Cannot open join request modal: missing studio ID or insufficient permissions');
      return;
    }

    try {
      console.log('Opening join request review modal for studio:', this.studio.id);

      const modal = await this.modalController.create({
        component: InstructorJoinReviewModalComponent,
        componentProps: {
          studioId: this.studio.id,
          studioName: this.studio.name,
          config: {
            studioId: this.studio.id,
            studioName: this.studio.name,
            enableBulkActions: true,
            enableRealTimeUpdates: true,
            maxRequestsPerPage: 50,
            autoRefreshInterval: 30000
          }
        },
        cssClass: 'join-request-modal',
        backdropDismiss: true,
        showBackdrop: true
      });

      // Handle modal result when it's dismissed
      modal.onDidDismiss().then((result) => {
        console.log('Join request modal dismissed:', result.data);
        
        // Refresh pending request count after modal closes
        if (this.studio?.id) {
          this.refreshPendingRequestCount(this.studio.id);
        }
      });

      await modal.present();

    } catch (error) {
      console.error('Error opening join request review modal:', error);
    }
  }

  /**
   * Initialize chat integration with access control
   */
  private async initializeChatIntegration(studioId: string) {
    try {
      // Subscribe to auth state changes - use distinctUntilChanged to prevent duplicate calls
      const authSub = this.authStateService.currentUser$.subscribe(user => {
        const newUserId = user?.userId || null;
        
        // Only reload if userId actually changed
        if (newUserId !== this.currentUserId) {
          const previousUserId = this.currentUserId;
          this.currentUserId = newUserId;
          
          if (this.currentUserId) {
            // Set flag to prevent scroll during chat load
            this.preventScrollDuringChatLoad = true;
            
            // Load chats when user is authenticated
            this.loadStudioChats(studioId);
            
            // Aggressively prevent scroll after chats load
            // Use multiple timeouts to catch different stages of rendering
            [50, 100, 200, 300, 500].forEach(delay => {
              setTimeout(() => {
                if (this.content && this.preventScrollDuringChatLoad) {
                  this.content.scrollToTop(0);
                }
              }, delay);
            });
            
            // Clear the flag after all rendering should be complete
            setTimeout(() => {
              this.preventScrollDuringChatLoad = false;
            }, 600);
          } else {
            // Clear chats when user is not authenticated
            this.organizedChats = null;
            this.chatLoadError.set(false);
            this.totalChatCount.set(0);
            this.pendingInvitationCount.set(0);
            this.hasChatsAccess.set(false);
          }
        }
      });
      
      this.subscriptions.push(authSub);

      // Subscribe to access control updates for real-time chat visibility changes
      // NOTE: We don't automatically reload chats on access updates to avoid infinite loops
      // The user can manually refresh using the refreshChats() method if needed
      if (this.chatAccessController.isServiceReady()) {
        const accessSub = this.chatAccessController.accessUpdates$.subscribe(updates => {
          // Only log access changes, don't automatically reload
          // This prevents infinite loop: loadStudioChats -> filterChatsByAccess -> emitAccessUpdate -> loadStudioChats
          console.log('Access updates received:', updates.length, 'updates');
        });
        
        this.subscriptions.push(accessSub);
      }

    } catch (error) {
      console.error('Error initializing chat integration:', error);
      this.chatLoadError.set(true);
    }
  }

  /**
   * Load studio chats with access control filtering
   */
  private async loadStudioChats(studioId: string) {
    if (!this.currentUserId) {
      console.log('No authenticated user, skipping chat load');
      return;
    }

    // Prevent loading if already loading or already loaded for this studio
    if (this.isLoadingChats()) {
      console.log('Already loading chats, skipping duplicate request');
      return;
    }

    if (this.chatsLoadedForStudio === studioId) {
      console.log('Chats already loaded for this studio, skipping');
      return;
    }

    try {
      this.isLoadingChats.set(true);
      this.chatLoadError.set(false);

      console.log('Loading studio chats for studio:', studioId, 'user:', this.currentUserId);

      // Get organized chats with access control
      this.organizedChats = await this.chatAccessController.getStudioChatsForUser(studioId, this.currentUserId);

      // Update computed properties to avoid change detection loops
      this.totalChatCount.set(this.organizedChats.totalPublic + this.organizedChats.totalPrivate);
      this.pendingInvitationCount.set(this.organizedChats.invitationsPending.length);
      this.hasChatsAccess.set(this.totalChatCount() > 0 || this.pendingInvitationCount() > 0);

      // Mark as loaded for this studio
      this.chatsLoadedForStudio = studioId;

      console.log('Loaded organized chats:', {
        publicChats: this.organizedChats.totalPublic,
        privateChats: this.organizedChats.totalPrivate,
        pendingInvitations: this.organizedChats.invitationsPending.length
      });

    } catch (error) {
      console.error('Error loading studio chats:', error);
      this.chatLoadError.set(true);
      this.organizedChats = null;
    } finally {
      this.isLoadingChats.set(false);
    }
  }

  /**
   * Get total chat count for display
   */
  getTotalChatCount(): number {
    if (!this.organizedChats) return 0;
    return this.organizedChats.totalPublic + this.organizedChats.totalPrivate;
  }

  /**
   * Get pending invitation count for display
   */
  getPendingInvitationCount(): number {
    if (!this.organizedChats) return 0;
    return this.organizedChats.invitationsPending.length;
  }

  /**
   * Check if user has access to any chats
   */
  hasAccessToChats(): boolean {
    return this.getTotalChatCount() > 0 || this.getPendingInvitationCount() > 0;
  }

  /**
   * Refresh studio chats
   */
  async refreshChats() {
    if (this.studio?.id) {
      // Reset the loaded flag to allow reloading
      this.chatsLoadedForStudio = null;
      await this.loadStudioChats(this.studio.id);
    }
  }

  private loadStudioActivities(studioId: string) {
    this.studioActivities.set(this.activitiesService.getActivitiesByStudio(studioId));
  }

  private async loadStudioStudents(studioId: string) {
    try {
      console.log('[StudioPage] Loading students for studio:', studioId);
      this.studioStudents.set(await this.studioMembershipService.getStudioStudents(studioId));
      console.log('[StudioPage] Loaded', this.studioStudents().length, 'students');
    } catch (error) {
      console.error('[StudioPage] Failed to load studio students:', error);
      this.studioStudents.set([]);
    }
  }

  // Schedule view methods
  changeScheduleView(event: any) {
    this.scheduleView = event.detail.value as 'list' | 'calendar';
  }

  navigateWeek(direction: 'prev' | 'next') {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    this.currentDate = newDate;
  }

  goToToday() {
    this.currentDate = new Date();
  }

  // Calendar helper methods
  getWeekDates(): Date[] {
    const dates: Date[] = [];
    const startOfWeek = new Date(this.currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  getActivitiesForDate(date: Date): Activity[] {
    // Use the already loaded studio activities instead of calling service again
    return this.studioActivities().filter(activity => {
      if (!activity.isActive) return false;
      
      if (activity.isRecurring) {
        return this.isRecurringActivityOnDate(activity, date);
      } else {
        // One-time activity
        const dateStr = date.toISOString().split('T')[0];
        if (activity.startDate === dateStr) return true;
        if (activity.endDate) {
          const start = new Date(activity.startDate!);
          const end = new Date(activity.endDate);
          return date >= start && date <= end;
        }
        return false;
      }
    });
  }

  // Check if recurring activity occurs on specific date
  private isRecurringActivityOnDate(activity: Activity, date: Date): boolean {
    // For recurring activities, we need to check if they occur on this day of the week
    if (!activity.recurrencePattern || activity.recurrencePattern !== 'weekly') {
      return false;
    }
    
    // Check if the activity has specific recurrence days defined
    if (activity.recurrenceDays && activity.recurrenceDays.length > 0) {
      return activity.recurrenceDays.includes(date.getDay());
    }
    
    // Fallback: if no specific days, assume it occurs on the same day as recurrence start
    if (activity.recurrenceStart) {
      const recurrenceStart = new Date(activity.recurrenceStart);
      return date.getDay() === recurrenceStart.getDay();
    }
    
    return false;
  }

  // Get activities for a specific date and time slot
  getActivitiesForTimeSlot(date: Date, timeSlot: string): Activity[] {
    const activities = this.getActivitiesForDate(date);
    return activities.filter(activity => {
      const activityStartHour = parseInt(activity.startTime.split(':')[0]);
      const activityEndHour = parseInt(activity.endTime.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      
      // Check if the time slot overlaps with the activity time
      return slotHour >= activityStartHour && slotHour < activityEndHour;
    });
  }

  // Calculate activity position and height for time grid
  getActivityStyle(activity: Activity): any {
    const startHour = parseInt(activity.startTime.split(':')[0]);
    const startMinute = parseInt(activity.startTime.split(':')[1]);
    const endHour = parseInt(activity.endTime.split(':')[0]);
    const endMinute = parseInt(activity.endTime.split(':')[1]);
    
    // Calculate position as percentage from start of day (6 AM = 0%)
    const dayStartHour = 6;
    const totalHours = 17; // 6 AM to 11 PM = 17 hours
    
    // Ensure the activity is within our time range
    if (startHour < dayStartHour || startHour >= (dayStartHour + totalHours)) {
      return { display: 'none' }; // Hide activities outside our time range
    }
    
    const startOffset = ((startHour - dayStartHour) * 60 + startMinute) / (totalHours * 60) * 100;
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / (totalHours * 60) * 100;
    
    return {
      'top': `${startOffset}%`,
      'height': `${Math.max(duration, 8)}%`, // Minimum 8% height for visibility
      'background-color': activity.color || '#3880ff',
      'position': 'absolute',
      'left': '2px',
      'right': '2px',
      'border-radius': '4px',
      'padding': '4px',
      'font-size': '11px',
      'color': 'white',
      'overflow': 'hidden',
      'z-index': 1,
      'box-shadow': '0 1px 3px rgba(0, 0, 0, 0.2)',
      'border-left': '3px solid rgba(255, 255, 255, 0.3)'
    };
  }

  getCurrentWeekTitle(): string {
    const weekDates = this.getWeekDates();
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${this.months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${this.months[start.getMonth()]} ${start.getDate()} - ${this.months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
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

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getRecurringDaysText(days: number[]): string {
    if (!days || days.length === 0) return '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(dayIndex => dayNames[dayIndex]).join(', ');
  }

  // Get upcoming activities for list view
  getUpcomingActivities(): Activity[] {
    // For the studio detail page, show all active activities (both recurring and upcoming one-time)
    // This ensures users can see the regular class schedule
    return this.studioActivities()
      .filter(activity => activity.isActive)
      .sort((a, b) => {
        // Sort recurring activities first, then by title
        if (a.isRecurring && !b.isRecurring) return -1;
        if (!a.isRecurring && b.isRecurring) return 1;
        return a.title.localeCompare(b.title);
      });
  }

  // Navigate to activity detail page
  navigateToActivity(activity: Activity) {
    this.router.navigate(['/dash/activity', activity.id]);
  }

  // Navigate to person profile page
  navigateToPerson(person: Person) {
    this.router.navigate(['/dash/person', person.id]);
  }

  // Navigate to instructor profile page
  navigateToInstructor(instructor: any) {
    // Try to find the instructor in the people service by username or name
    let person = this.peopleService.getPersonByUsername(instructor.username);
    
    if (!person) {
      // If not found by username, try to find by name
      const allPeople = this.peopleService.getAllPeople();
      person = allPeople.find(p => p.name.toLowerCase() === instructor.name.toLowerCase());
    }
    
    if (person) {
      this.router.navigate(['/dash/person', person.id]);
    } else {
      console.log('Instructor profile not found:', instructor.name);
      // Could show a toast message here in a real app
    }
  }

  // Navigate back to previous page
  onBack() {
    this.location.back();
  }

  // Get limited instructors for display (max 20)
  getDisplayedInstructors() {
    return this.studio.instructors.slice(0, 20);
  }

  // Get limited students for display (max 20)
  getDisplayedStudents() {
    return this.studioStudents().slice(0, 20);
  }

  // Check if there are more instructors than displayed
  hasMoreInstructors(): boolean {
    return this.studio.instructors.length > 20;
  }

  // Check if there are more students than displayed
  hasMoreStudents(): boolean {
    return this.studioStudents().length > 20;
  }

  // Generate Google Maps embed URL for this studio (called once and cached)
  private generateStudioMapUrl(): SafeResourceUrl {
    if (!this.studio.address) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }
    
    const encodedAddress = encodeURIComponent(this.studio.address);
    const url = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4!2d-97.7431!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDE2JzAyLjAiTiA5N8KwNDQnMzUuMiJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=${encodedAddress}`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Get cached map URL (used in template)
  getStudioMapUrl(): SafeResourceUrl {
    return this.cachedMapUrl || this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  // Open directions in default maps app
  openDirections() {
    if (this.studio.address) {
      const encodedAddress = encodeURIComponent(this.studio.address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }
  }

  // Open location in maps app
  openInMaps() {
    if (this.studio.address) {
      const encodedAddress = encodeURIComponent(this.studio.address);
      // Try to open in native maps app first, fallback to web
      const mapsUrl = `maps://maps.google.com/?q=${encodedAddress}`;
      const webUrl = `https://maps.google.com/?q=${encodedAddress}`;
      
      // Create a temporary link to try native app
      const link = document.createElement('a');
      link.href = mapsUrl;
      
      // Set a timeout to fallback to web if native app doesn't open
      const timeout = setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);
      
      // Try to open native app
      link.click();
      
      // If we get here quickly, native app probably opened
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
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
    // Could navigate away or show a confirmation that the user left
  }

  onMuteChat(event: { chatId: string; isMuted: boolean }) {
    console.log('Chat mute status changed:', event);
    // In a real app, this would update the user's notification preferences
  }

  onChatInfo(chatId: string) {
    console.log('Show chat info for:', chatId);
    // In a real app, this might open a modal with chat details, participants, etc.
  }

  // Open studio join modal
  async openJoinStudioModal() {
    try {
      const modal = await this.modalController.create({
        component: SimpleStudioJoinComponent,
        componentProps: {
          studioId: this.studio.id,
          studioName: this.studio.name
        },
        backdropDismiss: true,
        showBackdrop: true
      });

      await modal.present();

      // Handle modal dismissal without blocking the UI
      modal.onWillDismiss().then(({ data }) => {
        if (data?.membershipChanged) {
          // Refresh studio data if membership status changed
          this.ionViewWillEnter();
        }
      }).catch(error => {
        console.error('Error handling modal dismissal:', error);
      });

    } catch (error) {
      console.error('Error opening join studio modal:', error);
      // Show a toast or alert to inform the user
      const toast = await this.toastController.create({
        message: this.translationService.getTranslation('studio_page.join_form_error'),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Setup instructor test environment (for development/testing)
   * This method can be called from the browser console to set up test data
   */
  async setupInstructorTestData(): Promise<void> {
    try {
      console.log('🚀 Setting up instructor test environment...');
      
      const result = await setupInstructorTestEnvironment();
      
      if (result.success) {
        console.log('✅ ' + result.message);
        console.log('📋 Details:', result.details);
        
        // Refresh permissions to reflect the changes
        if (this.studio?.id) {
          await this.checkInstructorPermissions(this.studio.id);
          await this.refreshPendingRequestCount(this.studio.id);
        }
        
        alert('✅ Instructor test environment setup complete!\n\nYou should now see the "Review Join Requests" button if you refresh the page.');
      } else {
        console.error('❌ ' + result.message);
        console.error('Details:', result.details);
        alert('❌ Setup failed: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ Error setting up instructor test data:', error);
      alert('❌ Error setting up instructor test data. Check console for details.');
    }
  }

  /**
   * Check current user's instructor status (for development/testing)
   */
  async checkCurrentInstructorStatus(): Promise<void> {
    try {
      const status = await checkInstructorStatus();
      console.log('👤 Current instructor status:', status);
      
      if (status.isInstructor) {
        console.log('✅ You are an instructor at Denver Aikido Dojo');
        console.log('📋 Membership details:', status.membership);
      } else {
        console.log('❌ You are not an instructor at Denver Aikido Dojo');
        console.log('💡 Run setupInstructorTestData() to become an instructor');
      }
    } catch (error) {
      console.error('❌ Error checking instructor status:', error);
    }
  }
}