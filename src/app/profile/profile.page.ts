import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Location as AngularLocation } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonButton, IonIcon,
  IonToggle, IonInput, IonList, IonListHeader, IonNote, IonCheckbox,
  IonRadioGroup, IonRadio, IonText, IonButtons, IonBackButton, IonAvatar,
  IonChip, IonTextarea, IonSegment, IonSegmentButton, IonBadge,
  ToastController, AlertController, LoadingController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  logOut, notifications, mail, chatbubble, phonePortrait, settings,
  checkmarkCircle, informationCircle, warning, personCircle, refresh,
  languageOutline, create, camera, location as locationIcon, calendar,
  trophy, ribbon, school, star, people, heart, bookmark, statsChart,
  globe, logoFacebook, logoInstagram, logoTwitter, logoLinkedin, save,
  close, add, atOutline, personOutline, locationOutline, chevronDown,
  chevronUp, arrowBack, chatbubbleOutline, heartOutline, chevronForward,
  home, codeSlashOutline, cloudUpload, shieldCheckmark, rocket, removeCircle,
  starOutline, cloud, desktop, cloudDone, notificationsOff, closeCircle } from 'ionicons/icons';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { AuthStateService } from '../services/auth-state.service';
import { TranslationService } from '../services/translation.service';
import { LanguageSelectorComponent } from '../components/language-selector/language-selector.component';
import { StudiosService, Studio } from '../services/studios.service';
import { PeopleService, Person, Achievement, SocialMediaLink } from '../services/people.service';
import { PersonProfileManagerService } from '../services/person-profile-manager.service';
import { DataSourceService, DataSource } from '../services/data-source.service';
import { PushNotificationService } from '../services/push-notification.service';
import { StudioMembershipService } from '../services/studio-membership.service';
import { SubscriptionService } from '../services/subscription.service';
import {
  togglePushNotifications, toggleLocalTestMode,
  isPushNotificationEnabled, isLocalTestMode
} from '../config/push-notification.config';

interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  eventTypes: {
    newEvents: boolean;
    eventReminders: boolean;
    classUpdates: boolean;
    promotions: boolean;
    systemUpdates: boolean;
  };
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  rank?: string;
  experience?: string;
  handle?: string;
  specialties: string[];
  achievements: Achievement[];
  socialMedia: SocialMediaLink[];
  studioMemberships: string[];
  instructorAt: string[];
  isVerified: boolean;
  stats: { followers: number; following: number; postsCount: number; studiosCount: number; };
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonButton, IonIcon,
    IonToggle, IonInput, IonList, IonListHeader, IonNote, IonCheckbox,
    IonRadioGroup, IonRadio, IonText, IonButtons, IonBackButton, IonAvatar,
    IonChip, IonTextarea, IonSegment, IonSegmentButton, IonBadge,
    RouterLink, TranslateModule, LanguageSelectorComponent
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  currentUser: any = null;
  selectedSegment: string = 'profile';
  isEditing = signal(false);

  viewingUserId: string | null = null;
  isOwnProfile = signal(true);
  isViewingOtherPerson = signal(false);
  loading = signal(true);
  notFound = signal(false);
  private routeSubscription: any;

  userProfile: UserProfile = {
    id: '', name: '', username: '', email: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: '', location: '',
    joinDate: new Date().toISOString().split('T')[0],
    rank: '', experience: '', handle: '',
    specialties: [], achievements: [], socialMedia: [],
    studioMemberships: [], instructorAt: [],
    isVerified: false,
    stats: { followers: 0, following: 0, postsCount: 0, studiosCount: 0 }
  };

  userStudios: Studio[] = [];
  instructorStudios: Studio[] = [];
  personProfile: Person | undefined;
  hasPersonProfile = signal(false);
  communityProfileError: string = '';
  isCommunityProfileExpanded = signal(false);
  isEditingCommunityProfile = signal(false);

  isAuthenticated = signal(false);
  isAdmin = signal(false);

  notificationPreferences: NotificationPreferences = {
    inApp: true, email: false, sms: false,
    emailAddress: '', phoneNumber: '',
    frequency: 'immediate',
    eventTypes: {
      newEvents: true, eventReminders: true, classUpdates: true,
      promotions: false, systemUpdates: true
    }
  };

  constructor(
    private authStateService: AuthStateService,
    private router: Router,
    private route: ActivatedRoute,
    private location: AngularLocation,
    private toastController: ToastController,
    private alertController: AlertController,
    private translationService: TranslationService,
    private studiosService: StudiosService,
    private peopleService: PeopleService,
    private personProfileManager: PersonProfileManagerService,
    public dataSourceService: DataSourceService,
    private loadingController: LoadingController,
    private pushNotificationService: PushNotificationService,
    public subscriptionService: SubscriptionService,
    private studioMembershipService: StudioMembershipService
  ) {
    addIcons({arrowBack,personCircle,school,notifications,camera,checkmarkCircle,location:locationIcon,chatbubbleOutline,calendar,home,chevronForward,create,atOutline,personOutline,locationOutline,save,close,add,people,settings,rocket,star,codeSlashOutline,shieldCheckmark,informationCircle,chatbubble,mail,phonePortrait,refresh,logOut,languageOutline,starOutline,removeCircle,cloudUpload,warning,trophy,ribbon,heart,heartOutline,bookmark,statsChart,globe,logoFacebook,logoInstagram,logoTwitter,logoLinkedin,chevronDown,chevronUp,cloud,desktop,cloudDone,notificationsOff,closeCircle});
  }

  ngOnInit() {
    this.authStateService.currentUser$.subscribe(user => {
      this.isAuthenticated.set(!!user);
    });
    // Check for segment query param (e.g., from gear icon -> settings)
    this.route.queryParams.subscribe(params => {
      if (params['segment']) {
        this.selectedSegment = params['segment'];
      }
    });
    this.routeSubscription = this.route.params.subscribe(async params => {
      const personId = params['id'];
      if (personId) {
        this.viewingUserId = personId;
        await this.loadOtherPersonProfile(personId);
      } else {
        this.viewingUserId = null;
        await this.loadOwnProfile();
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
  }

  private async loadOwnProfile() {
    this.isViewingOtherPerson.set(false);
    this.isOwnProfile.set(true);
    this.loading.set(true);
    this.authStateService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.signInDetails?.loginId) {
        this.notificationPreferences.emailAddress = user.signInDetails.loginId;
        this.userProfile.email = user.signInDetails.loginId;
      }
      if (user?.username) this.userProfile.username = user.username;
    });
    this.loadNotificationPreferences();
    await this.loadUserProfile();
    this.loadUserStudios();
    await this.loadPersonProfile();
    this.loading.set(false);
  }

  private async loadOtherPersonProfile(personId: string) {
    this.isViewingOtherPerson.set(true);
    this.loading.set(true);
    this.notFound.set(false);
    try {
      // Check if the viewer is the same user (only if authenticated)
      let isOwnProfile = false;
      try {
        const currentUser = await getCurrentUser();
        if (currentUser && currentUser.userId === personId) {
          isOwnProfile = true;
        }
      } catch {
        // Not authenticated - continue as guest viewer
      }

      if (isOwnProfile) {
        this.isViewingOtherPerson.set(false);
        this.isOwnProfile.set(true);
        await this.loadOwnProfile();
        return;
      }
      this.isOwnProfile.set(false);
      const person = await this.peopleService.getPersonByIdAsync(personId);
      if (person) {
        this.personProfile = person;
        this.userProfile = {
          id: person.id, name: person.name, username: person.username,
          email: '', avatar: person.avatar, bio: person.bio,
          location: person.location, joinDate: person.joinDate,
          rank: person.rank, experience: person.experience, handle: person.handle,
          specialties: person.specialties || [], achievements: person.achievements || [],
          socialMedia: person.socialMedia || [],
          studioMemberships: person.studioAffiliations || [], instructorAt: [],
          isVerified: person.isVerified,
          stats: {
            followers: person.followers, following: person.following,
            postsCount: person.postsCount, studiosCount: person.studioAffiliations?.length || 0
          }
        };
        this.loadPersonStudios(person);
        this.notFound.set(false);
      } else {
        this.notFound.set(true);
      }
    } catch (error) {
      console.error('Error loading person profile:', error);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPersonStudios(person: Person) {
    this.userStudios = [];
    this.instructorStudios = [];
    if (person && person.id) {
      try {
        const memberships = await this.studioMembershipService.getUserStudioMemberships(person.id);
        for (const sid of memberships.memberStudios) {
          const s = this.studiosService.getStudioById(sid);
          if (s) this.userStudios.push(s);
        }
        for (const sid of memberships.instructorStudios) {
          const s = this.studiosService.getStudioById(sid);
          if (s) this.instructorStudios.push(s);
        }
      } catch (error) {
        console.error('[ProfilePage] Failed to load person studios:', error);
      }
    }
  }

  async checkIfOwnProfile() {
    try {
      const user = await getCurrentUser();
      this.isOwnProfile.set(!this.viewingUserId || (user.userId === this.viewingUserId));
    } catch { this.isOwnProfile.set(false); }
  }

  async loadPersonProfile() {
    try {
      let user: any;
      try {
        user = await getCurrentUser();
      } catch (e) {
        console.log('[ProfilePage] getCurrentUser failed (guest tab):', e);
        this.hasPersonProfile.set(false);
        return;
      }
      if (!user) { this.hasPersonProfile.set(false); console.log('[ProfilePage] No current user'); return; }
      
      console.log('[ProfilePage] ✅ getCurrentUser succeeded. userId:', user.userId, 'username:', user.username);
      console.log('[ProfilePage] signInDetails:', JSON.stringify(user.signInDetails));
      
      const dbPerson = await this.peopleService.getPersonByIdAsync(user.userId);
      console.log('[ProfilePage] getPersonByIdAsync result:', dbPerson ? `FOUND: ${dbPerson.handle} (${dbPerson.name})` : 'NOT FOUND');
      if (dbPerson) {
        this.personProfile = dbPerson;
        this.hasPersonProfile.set(true);
        this.isAdmin.set(dbPerson.isAdmin === true);
        this.userProfile.handle = dbPerson.handle;
        this.userProfile.name = dbPerson.name;
        this.userProfile.username = dbPerson.username;
        this.userProfile.location = dbPerson.location;
        this.userProfile.bio = dbPerson.bio;
        this.userProfile.rank = dbPerson.rank;
        this.userProfile.experience = dbPerson.experience;
        this.userProfile.avatar = dbPerson.avatar;
        this.userProfile.specialties = dbPerson.specialties || [];
        this.userProfile.achievements = dbPerson.achievements || [];
        this.userProfile.socialMedia = dbPerson.socialMedia || [];
        this.userProfile.studioMemberships = dbPerson.studioAffiliations || [];
        this.userProfile.isVerified = dbPerson.isVerified;
        this.userProfile.stats = {
          followers: dbPerson.followers, following: dbPerson.following,
          postsCount: dbPerson.postsCount, studiosCount: dbPerson.studioAffiliations?.length || 0
        };
      } else {
        const hasProfile = await this.personProfileManager.hasPersonProfile();
        this.hasPersonProfile.set(hasProfile);
        if (hasProfile) {
          this.personProfile = await this.personProfileManager.getCurrentPersonProfile();
          if (this.personProfile) {
            this.userProfile.handle = this.personProfile.handle;
            this.userProfile.name = this.personProfile.name;
            this.userProfile.username = this.personProfile.username;
            this.userProfile.location = this.personProfile.location;
            this.userProfile.bio = this.personProfile.bio;
            this.userProfile.rank = this.personProfile.rank;
            this.userProfile.experience = this.personProfile.experience;
            this.userProfile.avatar = this.personProfile.avatar;
          }
        }
      }

      // Always check Cognito groups as the authoritative admin source
      if (!this.isAdmin()) {
        try {
          const session = await fetchAuthSession();
          const groups: string[] = (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) || [];
          if (groups.includes('admin')) {
            console.log('[ProfilePage] User is in Cognito admin group. Granting admin access.');
            this.isAdmin.set(true);
          }
        } catch (e) {
          console.warn('[ProfilePage] Could not check Cognito groups:', e);
        }
      }
    } catch (error) {
      console.error('Error loading person profile:', error);
      this.hasPersonProfile.set(false);
    }
  }

  onHandleInput(event: any) {
    let value = event.target.value;
    if (value && !value.startsWith('@')) value = '@' + value;
    value = value.replace(/[^@a-zA-Z0-9_]/g, '');
    this.userProfile.handle = value;
  }

  toggleCommunityProfileSection() {
    this.isCommunityProfileExpanded.set(!this.isCommunityProfileExpanded());
  }

  toggleCommunityProfileEdit() {
    if (this.isEditingCommunityProfile()) {
      if (this.personProfile) {
        this.userProfile.handle = this.personProfile.handle;
        this.userProfile.name = this.personProfile.name;
        this.userProfile.username = this.personProfile.username;
        this.userProfile.location = this.personProfile.location;
        this.userProfile.rank = this.personProfile.rank || '';
        this.userProfile.experience = this.personProfile.experience || '';
        this.userProfile.bio = this.personProfile.bio;
      }
      this.communityProfileError = '';
    } else {
      if (!this.userProfile.handle) this.userProfile.handle = '@';
    }
    this.isEditingCommunityProfile.set(!this.isEditingCommunityProfile());
  }

  async saveCommunityProfile() {
    this.communityProfileError = '';
    if (!this.userProfile.handle || this.userProfile.handle === '@') {
      this.communityProfileError = 'Handle is required';
      return;
    }
    if (!this.userProfile.name) {
      this.communityProfileError = 'Name is required';
      return;
    }
    if (!this.userProfile.location) {
      this.communityProfileError = 'Location is required';
      return;
    }
    try {
      const user = await getCurrentUser();
      if (!user) { this.communityProfileError = 'Not authenticated'; return; }
      const personData: Person = {
        id: user.userId,
        name: this.userProfile.name,
        username: this.userProfile.handle?.replace('@', '') || '',
        handle: this.userProfile.handle || '',
        avatar: this.userProfile.avatar,
        bio: this.userProfile.bio || '',
        location: this.userProfile.location,
        joinDate: new Date().toISOString(),
        followers: 0, following: 0, postsCount: 0,
        isFollowing: false, tags: [], isVerified: false,
        rank: this.userProfile.rank,
        experience: this.userProfile.experience,
        studioAffiliations: [],
        specialties: this.userProfile.specialties || [],
        achievements: this.userProfile.achievements || [],
        socialMedia: this.userProfile.socialMedia || []
      };
      if (this.hasPersonProfile()) {
        await this.peopleService.updatePerson(user.userId, personData);
        this.showToast(this.translationService.getTranslation('profile.community_profile_updated'));
      } else {
        await this.peopleService.addPerson(personData);
        this.showToast(this.translationService.getTranslation('profile.community_profile_created'));
      }
      this.hasPersonProfile.set(true);
      this.personProfile = personData;
      this.isEditingCommunityProfile.set(false);
      this.personProfileManager.notifyProfileUpdated();
    } catch (error) {
      console.error('Error saving community profile:', error);
      this.communityProfileError = 'Failed to save profile. Please try again.';
    }
  }

  async createOrEditPersonProfile() {
    const result = await this.personProfileManager.showProfileSetup(this.personProfile);
    if (result) {
      this.personProfile = result;
      this.hasPersonProfile.set(true);
      this.userProfile.handle = result.handle;
      this.userProfile.name = result.name;
      this.userProfile.username = result.username;
      this.userProfile.location = result.location;
      this.userProfile.bio = result.bio;
      this.userProfile.rank = result.rank;
      this.userProfile.experience = result.experience;
      this.userProfile.avatar = result.avatar;
    }
  }

  loadNotificationPreferences() {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        this.notificationPreferences = { ...this.notificationPreferences, ...JSON.parse(saved) };
      } catch (e) { console.error('Error loading notification preferences:', e); }
    }
  }

  saveNotificationPreferences() {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.notificationPreferences));
  }

  onNotificationMethodChange(method: string, checked: boolean) {
    (this.notificationPreferences as any)[method] = checked;
    this.saveNotificationPreferences();
  }

  onEventTypeChange(eventType: string, checked: boolean) {
    (this.notificationPreferences.eventTypes as any)[eventType] = checked;
    this.saveNotificationPreferences();
  }

  onFrequencyChange() {
    this.saveNotificationPreferences();
  }

  onContactInfoChange() {
    this.saveNotificationPreferences();
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone: string): boolean {
    return /^\+?[\d\s\-()]{7,}$/.test(phone);
  }

  async testNotification() {
    this.showToast(this.translationService.getTranslation('profile.test_notification_sent'));
    if (isPushNotificationEnabled()) {
      try {
        await this.pushNotificationService.sendLocalNotification(
          'Test Notification',
          'This is a test notification from your profile settings.'
        );
      } catch (e) { console.error('Failed to send test push notification:', e); }
    }
  }

  resetNotificationPreferences() {
    this.notificationPreferences = {
      inApp: true, email: false, sms: false,
      emailAddress: this.userProfile.email || '', phoneNumber: '',
      frequency: 'immediate',
      eventTypes: {
        newEvents: true, eventReminders: true, classUpdates: true,
        promotions: false, systemUpdates: true
      }
    };
    this.saveNotificationPreferences();
    this.showToast(this.translationService.getTranslation('profile.preferences_reset'));
  }

  async loadUserProfile() {
    try {
      const user = await getCurrentUser();
      if (user) {
        this.userProfile.id = user.userId;
        this.userProfile.username = user.username || '';
        if (user.signInDetails?.loginId) {
          this.userProfile.email = user.signInDetails.loginId;
        }
        const dbPerson = await this.peopleService.getPersonByIdAsync(user.userId);
        if (dbPerson) {
          this.isAdmin.set(dbPerson.isAdmin === true);
          this.userProfile.name = dbPerson.name || this.userProfile.name;
          this.userProfile.handle = dbPerson.handle || this.userProfile.handle;
          this.userProfile.avatar = dbPerson.avatar || this.userProfile.avatar;
          this.userProfile.bio = dbPerson.bio || this.userProfile.bio;
          this.userProfile.location = dbPerson.location || this.userProfile.location;
          this.userProfile.rank = dbPerson.rank || this.userProfile.rank;
          this.userProfile.experience = dbPerson.experience || this.userProfile.experience;
        }

        // Always check Cognito groups as the authoritative admin source
        if (!this.isAdmin()) {
          try {
            const session = await fetchAuthSession();
            const groups: string[] = (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) || [];
            if (groups.includes('admin')) {
              this.isAdmin.set(true);
            }
          } catch (e) {
            console.warn('[ProfilePage] Could not check Cognito groups:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async saveUserProfile() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await this.peopleService.updatePerson(user.userId, {
        name: this.userProfile.name,
        username: this.userProfile.username,
        handle: this.userProfile.handle,
        avatar: this.userProfile.avatar,
        bio: this.userProfile.bio,
        location: this.userProfile.location,
        rank: this.userProfile.rank,
        experience: this.userProfile.experience,
        specialties: this.userProfile.specialties,
        achievements: this.userProfile.achievements,
        socialMedia: this.userProfile.socialMedia
      });
      this.showToast(this.translationService.getTranslation('profile.profile_saved'));
      this.personProfileManager.notifyProfileUpdated();
    } catch (error) {
      console.error('Error saving user profile:', error);
      this.showToast(this.translationService.getTranslation('profile.profile_save_failed'));
    }
  }

  async loadUserStudios() {
    this.userStudios = [];
    this.instructorStudios = [];
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const memberships = await this.studioMembershipService.getUserStudioMemberships(user.userId);
      for (const sid of memberships.memberStudios) {
        const s = this.studiosService.getStudioById(sid);
        if (s) this.userStudios.push(s);
      }
      for (const sid of memberships.instructorStudios) {
        const s = this.studiosService.getStudioById(sid);
        if (s) this.instructorStudios.push(s);
      }
      this.userProfile.stats.studiosCount = this.userStudios.length + this.instructorStudios.length;
    } catch (error) {
      console.error('Error loading user studios:', error);
    }
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
  }

  toggleEdit() {
    if (this.isEditing()) {
      this.saveUserProfile();
    }
    this.isEditing.set(!this.isEditing());
  }

  async changeAvatar() {
    const alert = await this.alertController.create({
      header: 'Change Avatar',
      inputs: [{ name: 'url', type: 'url', placeholder: 'Enter image URL' }],
      buttons: [
        { text: this.translationService.getTranslation('app.cancel'), role: 'cancel' },
        { text: 'Save', handler: (data) => {
          if (data.url) { this.userProfile.avatar = data.url; }
        }}
      ]
    });
    await alert.present();
  }

  async addSpecialty() {
    const alert = await this.alertController.create({
      header: 'Add Specialty',
      inputs: [{ name: 'specialty', type: 'text', placeholder: 'e.g., Aikido, Judo' }],
      buttons: [
        { text: this.translationService.getTranslation('app.cancel'), role: 'cancel' },
        { text: 'Add', handler: (data) => {
          if (data.specialty && !this.userProfile.specialties.includes(data.specialty)) {
            this.userProfile.specialties.push(data.specialty);
          }
        }}
      ]
    });
    await alert.present();
  }

  removeSpecialty(specialty: string) {
    this.userProfile.specialties = this.userProfile.specialties.filter(s => s !== specialty);
  }

  async addAchievement() {
    const alert = await this.alertController.create({
      header: 'Add Achievement',
      inputs: [
        { name: 'title', type: 'text', placeholder: 'Achievement title' },
        { name: 'description', type: 'text', placeholder: 'Description' }
      ],
      buttons: [
        { text: this.translationService.getTranslation('app.cancel'), role: 'cancel' },
        { text: 'Add', handler: (data) => {
          if (data.title) {
            this.userProfile.achievements.push({
              id: Date.now().toString(), title: data.title,
              description: data.description || '', date: new Date().toISOString(),
              type: 'other'
            });
          }
        }}
      ]
    });
    await alert.present();
  }

  removeAchievement(id: string) {
    this.userProfile.achievements = this.userProfile.achievements.filter(a => a.id !== id);
  }

  async addSocialMedia() {
    const alert = await this.alertController.create({
      header: 'Add Social Media',
      inputs: [
        { name: 'platform', type: 'text', placeholder: 'Platform (facebook, instagram, etc.)' },
        { name: 'url', type: 'url', placeholder: 'Profile URL' }
      ],
      buttons: [
        { text: this.translationService.getTranslation('app.cancel'), role: 'cancel' },
        { text: 'Add', handler: (data) => {
          if (data.platform && data.url) {
            this.userProfile.socialMedia.push({
              platform: data.platform.toLowerCase() as any, url: data.url
            });
          }
        }}
      ]
    });
    await alert.present();
  }

  removeSocialMedia(index: number) {
    this.userProfile.socialMedia.splice(index, 1);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  }

  navigateToStudio(studioId: string) {
    this.router.navigate(['/dash/studio', studioId]);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }

  async logout() {
    try {
      const { signOut } = await import('aws-amplify/auth');
      await signOut();
      // Full reload to reset all services to guest state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      this.showToast(this.translationService.getTranslation('profile.sign_out_failed'));
    }
  }

  async onToggleDataSource() {
    const newSource = this.dataSourceService.toggleDataSource();
    const loading = await this.loadingController.create({ message: `Switching to ${newSource}...`, duration: 2000 });
    await loading.present();
    this.showToast(`Switched to ${newSource === 'mock' ? 'mock data' : 'database'}`);
    setTimeout(() => { window.location.reload(); }, 1500);
  }

  async onUpgradePremium() {
    // In production, this would open a payment flow (Stripe, App Store, Google Play).
    // For now, we toggle premium status for demonstration.
    const alert = await this.alertController.create({
      header: this.translationService.getTranslation('profile.go_premium'),
      message: this.translationService.getTranslation('profile.premium_message'),
      buttons: [
        { text: this.translationService.getTranslation('app.cancel'), role: 'cancel' },
        {
          text: this.translationService.getTranslation('profile.subscribe'),
          handler: () => {
            // TODO: Replace with real payment integration
            this.subscriptionService.upgradeToPremium();
            this.showToast(this.translationService.getTranslation('profile.upgraded_message'));
          }
        }
      ]
    });
    await alert.present();
  }

  async onMessage() {
    if (this.personProfile) {
      this.router.navigate(['/dash/chat'], { queryParams: { userId: this.personProfile.id } });
    }
  }

  onStudioClick(studioId: string) {
    this.router.navigate(['/dash/studio', studioId]);
  }

  getRankColor(): string {
    const rank = (this.userProfile.rank || '').toLowerCase();
    if (rank.includes('black') || rank.includes('dan')) return 'dark';
    if (rank.includes('brown')) return 'warning';
    if (rank.includes('blue')) return 'primary';
    if (rank.includes('green')) return 'success';
    if (rank.includes('orange')) return 'warning';
    if (rank.includes('yellow')) return 'warning';
    if (rank.includes('white')) return 'light';
    return 'medium';
  }

  getAchievementIcon(type: string): string {
    switch (type) {
      case 'rank': return 'ribbon';
      case 'competition': return 'trophy';
      case 'seminar': return 'school';
      case 'teaching': return 'people';
      default: return 'star';
    }
  }

  getAchievementColor(type: string): string {
    switch (type) {
      case 'rank': return 'primary';
      case 'competition': return 'warning';
      case 'seminar': return 'tertiary';
      case 'teaching': return 'success';
      default: return 'medium';
    }
  }

  getSocialIcon(platform: string): string {
    switch (platform?.toLowerCase()) {
      case 'facebook': return 'logo-facebook';
      case 'instagram': return 'logo-instagram';
      case 'twitter': return 'logo-twitter';
      case 'linkedin': return 'logo-linkedin';
      default: return 'globe';
    }
  }

  formatJoinDate(): string {
    const date = this.personProfile?.joinDate || this.userProfile.joinDate;
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch { return ''; }
  }

  formatAchievementDate(dateStr: string): string {
    return this.formatDate(dateStr);
  }

  onSocialClick(link: SocialMediaLink) {
    if (link.url) {
      window.open(link.url, '_blank');
    }
  }

  // Push notification methods
  isPushEnabled(): boolean {
    return isPushNotificationEnabled();
  }

  isLocalPushMode(): boolean {
    return isLocalTestMode();
  }

  hasNotificationPermission(): boolean {
    if (typeof Notification !== 'undefined') {
      return Notification.permission === 'granted';
    }
    return false;
  }

  getNotificationPermissionStatus(): string {
    if (typeof Notification !== 'undefined') {
      return Notification.permission === 'granted' ? 'Granted' :
             Notification.permission === 'denied' ? 'Denied' : 'Not yet requested';
    }
    return 'Not supported';
  }

  onTogglePushNotifications(event: any) {
    const enabled = event.detail.checked;
    togglePushNotifications(enabled);
    this.showToast(`Push notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  onTogglePushMode() {
    const newMode = !isLocalTestMode();
    toggleLocalTestMode(newMode);
    this.showToast(`Switched to ${newMode ? 'local test' : 'full'} push mode`);
  }

  async onRequestNotificationPermission() {
    try {
      const granted = await this.pushNotificationService.requestPermission();
      if (granted) {
        this.showToast(this.translationService.getTranslation('profile.permission_granted'));
      } else {
        this.showToast(this.translationService.getTranslation('profile.permission_denied'));
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.showToast(this.translationService.getTranslation('profile.permission_request_failed'));
    }
  }

  onBack() {
    this.location.back();
  }

  async onFollow() {
    if (this.personProfile) {
      this.peopleService.toggleFollow(this.personProfile.id);
      this.showToast(this.personProfile.isFollowing ? this.translationService.getTranslation('profile.unfollowed') : this.translationService.getTranslation('profile.followed'));
    }
  }
}
