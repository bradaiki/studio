import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  chatId?: string;
  route?: string;
  timestamp: Date;
  read: boolean;
  senderId?: string;
  senderName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService {
  private notifications$ = new BehaviorSubject<InAppNotification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor(
    private toastController: ToastController,
    private router: Router
  ) {
    console.log('[InAppNotification] Service initialized');
    this.loadNotifications();
  }

  /**
   * Show an in-app notification toast
   */
  async showNotification(
    title: string,
    message: string,
    chatId?: string,
    route?: string,
    senderId?: string
  ): Promise<void> {
    try {
      console.log('[InAppNotification] Showing notification:', { title, message, chatId });

      // Create notification object
      const notification: InAppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        message: this.truncateMessage(message),
        chatId,
        route: route || (chatId ? `/dash/chat/${chatId}` : undefined),
        timestamp: new Date(),
        read: false,
        senderId,
        senderName: title
      };

      // Add to notifications list
      this.addNotification(notification);

      // Show toast
      const toast = await this.toastController.create({
        header: title,
        message: this.truncateMessage(message),
        duration: 5000,
        position: 'top',
        color: 'primary',
        cssClass: 'chat-notification-toast',
        buttons: [
          {
            text: 'View',
            handler: () => {
              this.handleNotificationClick(notification);
            }
          },
          {
            text: 'Dismiss',
            role: 'cancel',
            handler: () => {
              this.markAsRead(notification.id);
            }
          }
        ]
      });

      await toast.present();
      console.log('[InAppNotification] Toast presented successfully');
    } catch (error) {
      console.error('[InAppNotification] Failed to show notification:', error);
    }
  }

  /**
   * Handle notification click - navigate to chat
   */
  private handleNotificationClick(notification: InAppNotification): void {
    console.log('[InAppNotification] Notification clicked:', notification);
    
    this.markAsRead(notification.id);

    if (notification.route) {
      this.router.navigateByUrl(notification.route);
    } else if (notification.chatId) {
      this.router.navigate(['/dash/chat', notification.chatId]);
    }
  }

  /**
   * Add notification to the list
   */
  private addNotification(notification: InAppNotification): void {
    const current = this.notifications$.value;
    const updated = [notification, ...current].slice(0, 50); // Keep last 50
    this.notifications$.next(updated);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const current = this.notifications$.value;
    const updated = current.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notifications$.next(updated);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const current = this.notifications$.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications$.next([]);
    this.unreadCount$.next(0);
    this.saveNotifications();
  }

  /**
   * Get notifications observable
   */
  getNotifications(): Observable<InAppNotification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Get unread count observable
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    const unread = this.notifications$.value.filter(n => !n.read).length;
    this.unreadCount$.next(unread);
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotifications(): void {
    try {
      const notifications = this.notifications$.value;
      localStorage.setItem('in_app_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('[InAppNotification] Failed to save notifications:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('in_app_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const parsed = notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notifications$.next(parsed);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('[InAppNotification] Failed to load notifications:', error);
    }
  }

  /**
   * Truncate message for display
   */
  private truncateMessage(message: string, maxLength: number = 100): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Remove old notifications (older than 7 days)
   */
  cleanupOldNotifications(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const current = this.notifications$.value;
    const filtered = current.filter(n => n.timestamp > sevenDaysAgo);
    
    if (filtered.length !== current.length) {
      this.notifications$.next(filtered);
      this.updateUnreadCount();
      this.saveNotifications();
      console.log(`[InAppNotification] Cleaned up ${current.length - filtered.length} old notifications`);
    }
  }
}
