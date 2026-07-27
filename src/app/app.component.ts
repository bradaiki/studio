import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslationService } from './services/translation.service';
import { initializeGlobalSetup } from './utils/global-setup';
import { PushNotificationService } from './services/push-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { NotificationModalComponent } from './components/notification-modal/notification-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, FontAwesomeModule, NotificationModalComponent],
})
export class AppComponent implements OnInit {
  constructor(
    private translationService: TranslationService,
    private pushNotificationService: PushNotificationService,
    private inAppNotificationService: InAppNotificationService
  ) {
    // Translation service is initialized automatically
    console.log('[App Component] Translation service initialized');
    
    // Initialize global development helpers
    initializeGlobalSetup();
    
    // Initialize in-app notification service
    console.log('[App Component] In-app notification service initialized');
  }

  async ngOnInit() {
    // Initialize push notifications for mobile platforms (iOS/Android)
    await this.pushNotificationService.initialize();
    
    // Clean up old notifications on app start
    this.inAppNotificationService.cleanupOldNotifications();
  }
}