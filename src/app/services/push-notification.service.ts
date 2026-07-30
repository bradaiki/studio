import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
// In the initializeWebPush method:

export interface PushNotificationToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private client = generateClient<Schema>();
  private currentUserId: string | null = null;
  private isInitialized = false;

  constructor(
    private platform: Platform,
    private router: Router
  ) {
    console.log('PushNotificationService initialized');
  }

  /**
   * Initialize push notifications for the current platform
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    try {
      // Get current user
      const user = await getCurrentUser();
      this.currentUserId = user.userId;

      // Check if push notifications are supported
      if (!this.platform.is('capacitor')) {
        console.log('Running in web mode - initializing web push');
        // For web, implement Web Push API
        await this.initializeWebPush();
        return;
      }

      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        console.log('Push notification permission granted');
        
        // Register with APNs/FCM
        try {
          await PushNotifications.register();
          
          // Set up listeners
          this.setupListeners();
          
          this.isInitialized = true;
          console.log('Push notifications initialized successfully');
        } catch (registerError) {
          console.warn('Push notification registration failed (Firebase may not be configured):', registerError);
          // Continue without push — app still works
        }
      } else {
        console.warn('Push notification permission denied');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Request notification permission explicitly
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('Web notifications not supported');
        return false;
      }

      if (Notification.permission === 'granted') {
        console.log('Notification permission already granted');
        return true;
      }

      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted!');
        this.isInitialized = true;
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Initialize web push notifications (for PWA)
   */
  private async initializeWebPush(): Promise<void> {
    if (!('Notification' in window)) {
      console.log('Web notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('Web notification permission already granted');
      this.isInitialized = true;
      this.setupWebNotificationListener();
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Web notification permission granted');
        this.isInitialized = true;
        this.setupWebNotificationListener();
      }
    }
  }

  /**
   * Set up web notification click listener
   */
  private setupWebNotificationListener(): void {
    // Listen for notification clicks in web environment
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service worker ready for notifications');
      });
    }
  }

  /**
   * Set up push notification listeners
   */
  private setupListeners(): void {
    // Handle successful registration
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      await this.saveDeviceToken(token.value);
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Handle incoming notifications when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handleForegroundNotification(notification);
    });

    // Handle notification tap/click
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      this.handleNotificationAction(action);
    });
  }

  /**
   * Save device token to backend
   */
  private async saveDeviceToken(token: string): Promise<void> {
    try {
      if (!this.currentUserId) {
        console.warn('No user ID available to save device token');
        return;
      }

      const platform = this.getPlatform();
      const deviceId = await this.getDeviceId();

      // Store token in your backend (you'll need to create a PushToken model)
      // For now, we'll store it in localStorage and you can sync to backend
      const tokenData: PushNotificationToken = {
        userId: this.currentUserId,
        token,
        platform,
        deviceId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      localStorage.setItem(`push_token_${this.currentUserId}`, JSON.stringify(tokenData));
      
      // TODO: Send to your backend API to store in database
      // await this.client.models.PushToken.create(tokenData);
      
      console.log('Device token saved:', tokenData);
    } catch (error) {
      console.error('Failed to save device token:', error);
    }
  }

  /**
   * Get current platform
   */
  private getPlatform(): 'ios' | 'android' | 'web' {
    if (this.platform.is('ios')) return 'ios';
    if (this.platform.is('android')) return 'android';
    return 'web';
  }

  /**
   * Get device ID (simplified version)
   */
  private async getDeviceId(): Promise<string> {
    // In a real app, use @capacitor/device to get unique device ID
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle notification when app is in foreground
   */
  private handleForegroundNotification(notification: PushNotificationSchema): void {
    // You can show a local notification or update UI
    console.log('Handling foreground notification:', notification);
    
    // Optionally show a toast or alert
    // You could also update the chat UI directly if the user is viewing that chat
  }

  /**
   * Handle notification tap/action
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const notification = action.notification;
    const data = notification.data;

    console.log('Notification tapped:', data);

    // Navigate to the relevant chat
    if (data.chatId) {
      this.router.navigate(['/dash/chat', data.chatId]);
    } else if (data.route) {
      this.router.navigate([data.route]);
    }
  }

  /**
   * Send a local notification (for testing or foreground notifications)
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (this.platform.is('capacitor')) {
      // Use Capacitor Local Notifications plugin
      // You'll need to install: npm install @capacitor/local-notifications
      console.log('Local notification:', title, body);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // Web notification with click handler
      const notification = new Notification(title, {
        body,
        icon: '/assets/icon/icon.png',
        badge: '/assets/icon/badge.png',
        tag: data?.chatId || 'notification',
        data: data,
        requireInteraction: false
      });

      // Handle notification click for web
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        const notificationData = (event.target as Notification).data;
        if (notificationData?.chatId) {
          this.router.navigate(['/dash/chat', notificationData.chatId]);
        } else if (notificationData?.route) {
          this.router.navigateByUrl(notificationData.route);
        }
        
        notification.close();
      };
    }
  }

  /**
   * Get stored device token
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      if (!this.currentUserId) return null;
      
      const tokenData = localStorage.getItem(`push_token_${this.currentUserId}`);
      if (tokenData) {
        const parsed: PushNotificationToken = JSON.parse(tokenData);
        return parsed.token;
      }
      return null;
    } catch (error) {
      console.error('Failed to get device token:', error);
      return null;
    }
  }

  /**
   * Remove device token (on logout)
   */
  async removeDeviceToken(): Promise<void> {
    try {
      if (!this.currentUserId) return;
      
      localStorage.removeItem(`push_token_${this.currentUserId}`);
      
      // TODO: Remove from backend
      // await this.client.models.PushToken.delete({ userId: this.currentUserId });
      
      console.log('Device token removed');
    } catch (error) {
      console.error('Failed to remove device token:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'granted';
    } else if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }
}
