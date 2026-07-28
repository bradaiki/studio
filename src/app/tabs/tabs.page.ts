import {
  Component,
  EnvironmentInjector,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';

import { Router } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonBadge,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  triangle,
  ellipse,
  square,
  logOut,
  person,
  settingsOutline,
  phonePortrait,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';
import { TranslationService } from '../services/translation.service';
import { PersonProfileManagerService } from '../services/person-profile-manager.service';
import { DataSourceService, DataSource } from '../services/data-source.service';
import { AdBannerComponent } from '../components/ad-banner/ad-banner.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonBadge,
    TranslateModule,
    AdBannerComponent,
  ],
})
export class TabsPage implements OnInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  userHandle = signal('@guest');
  adClient = signal(environment.adSense?.publisherId || '');
  adSlot = signal(environment.adSense?.bannerSlotId || '');
  private userSubscription?: Subscription;
  private profileUpdateSubscription?: Subscription;

  constructor(
    private authStateService: AuthStateService,
    private router: Router,
    private toastController: ToastController,
    private translationService: TranslationService,
    private personProfileManager: PersonProfileManagerService,
    public dataSourceService: DataSourceService,
  ) {
    addIcons({
      triangle,
      ellipse,
      square,
      logOut,
      person,
      settingsOutline,
      phonePortrait,
    });
    console.log('[Tabs Page] Initialized');
  }

  ngOnInit() {
    this.subscribeToAuthState();
    this.subscribeToProfileUpdates();
    this.loadPersonHandle();
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
    this.profileUpdateSubscription?.unsubscribe();
  }

  private subscribeToAuthState() {
    this.userSubscription = this.authStateService.currentUser$.subscribe(
      (user) => {
        console.log('[Tabs Page] User changed, loading handle');
        // Reload person handle when user changes
        this.loadPersonHandle();
      },
    );
  }

  private subscribeToProfileUpdates() {
    this.profileUpdateSubscription =
      this.personProfileManager.onProfileUpdated$.subscribe(() => {
        console.log('[Tabs Page] Profile updated, reloading handle');
        this.loadPersonHandle();
      });
  }

  private async loadPersonHandle() {
    try {
      const personProfile =
        await this.personProfileManager.getCurrentPersonProfile();
      if (personProfile && personProfile.handle) {
        this.userHandle.set(personProfile.handle);
        console.log('[Tabs Page] Handle loaded:', this.userHandle());
      } else {
        // Fallback to @guest if no handle exists
        this.userHandle.set('@guest');
        console.log('[Tabs Page] No handle found, using default');
      }
    } catch (error) {
      console.error('[Tabs Page] Error loading person handle:', error);
      this.userHandle.set('@guest');
    }
  }

  openProfile() {
    this.router.navigate(['/dash/profile']);
  }

  async logout() {
    try {
      await this.authStateService.signOut();
      const message = this.translationService.getTranslation('messages.saved');
      const toast = await this.toastController.create({
        message: message,
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      toast.present();
      this.router.navigate(['/login']);
    } catch (error) {
      const message = this.translationService.getTranslation('errors.unknown');
      const toast = await this.toastController.create({
        message: message,
        duration: 2000,
        color: 'danger',
        position: 'top',
      });
      toast.present();
    }
  }
}
