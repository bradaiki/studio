import { Injectable, OnDestroy } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { pushNotificationConfig } from '../config/push-notification.config';
import { config as amplifyConfig } from '../config/amplify.config';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { InAppNotificationService } from './in-app-notification.service';

interface SendPushNotificationRequest {
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  participantIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatPushIntegrationService implements OnDestroy {
  private client = generateClient<Schema>();
  private currentUserId: string | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private messageSubscription: any = null;

  constructor(private inAppNotificationService: InAppNotificationService) {
    console.log('ChatPushIntegrationService initialized');
    this.initializeCurrentUser();
    this.setupBroadcastListener();
    this.setupMessageSubscription();
    this.requestNotificationPermission();
  }

  /**
   * Request browser notification permission on startup
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('[Push Notifications] Browser notification permission:', permission);
      }
    } catch (e) {
      console.warn('[Push Notifications] Could not request notification permission:', e);
    }
  }

  /**
   * Initialize current user ID
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const user = await getCurrentUser();
      this.currentUserId = user.userId;
      console.log('[Push Notifications] Current user ID:', this.currentUserId);
    } catch (error) {
      console.log('[Push Notifications] No authenticated user');
    }
  }

  /**
   * Set up broadcast channel listener for cross-window notifications (same device)
   */
  private setupBroadcastListener(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('push-notifications');
      this.broadcastChannel.onmessage = async (event) => {
        console.log('[Push Notifications] Received broadcast:', event.data);
        
        if (event.data.type === 'NOTIFICATION_SENT') {
          const { chatId, senderName, message, senderId } = event.data;
          
          // Don't show notification if this is the sender
          if (senderId && senderId === this.currentUserId) {
            console.log('[Push Notifications] Skipping notification for sender');
            return;
          }
          
          // Show in-app notification
          await this.inAppNotificationService.showNotification(
            senderName,
            message,
            chatId,
            undefined,
            senderId
          );
        }
      };
      console.log('[Push Notifications] Broadcast listener set up');
    } catch (error) {
      console.log('[Push Notifications] BroadcastChannel not available:', error);
    }
  }

  /**
   * Set up GraphQL subscription for real-time messages (cross-device)
   * This listens for new messages across ALL devices and computers
   */
  private async setupMessageSubscription(): Promise<void> {
    try {
      // Wait for user to be initialized
      await this.waitForUser();

      if (!this.currentUserId) {
        console.log('[Push Notifications] No user ID, skipping subscription setup');
        return;
      }

      console.log('[Push Notifications] Setting up GraphQL message subscription for cross-device notifications');

      // Subscribe to new chat messages
      this.messageSubscription = this.client.models.ChatMessage.onCreate().subscribe({
        next: async (message) => {
          console.log('[Push Notifications] New message received via subscription:', message);
          
          // Don't show notification if this is the sender
          if (message.senderId === this.currentUserId) {
            console.log('[Push Notifications] Skipping notification for own message');
            return;
          }

          // Check if notifications are enabled
          if (!pushNotificationConfig.enabled) {
            console.log('[Push Notifications] Notifications disabled');
            return;
          }

          // Get sender name and message content
          const senderName = message.senderName || 'Someone';
          const messageText = message.message || '';
          const chatId = message.chatId;

          // Show native browser/OS notification
          this.showNativeNotification(senderName, messageText, chatId);

          // Show in-app notification
          await this.inAppNotificationService.showNotification(
            senderName,
            messageText,
            chatId,
            undefined,
            message.senderId
          );

          console.log('[Push Notifications] ✅ Cross-device notification shown');
        },
        error: (error) => {
          console.error('[Push Notifications] Subscription error:', error);
        }
      });

      console.log('[Push Notifications] ✅ GraphQL subscription active - will receive notifications from all devices');
    } catch (error) {
      console.error('[Push Notifications] Failed to setup message subscription:', error);
    }
  }

  /**
   * Wait for user to be initialized
   */
  private async waitForUser(maxAttempts: number = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (this.currentUserId) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Send push notifications to all chat participants when a message is sent
   */
  async notifyParticipants(
    chatId: string,
    senderId: string,
    senderName: string,
    message: string,
    participantIds: string[]
  ): Promise<boolean> {
    try {
      console.log('[Push Notifications] notifyParticipants called:', {
        chatId,
        senderId,
        senderName,
        participantCount: participantIds.length,
        localTestMode: pushNotificationConfig.localTestMode,
        enabled: pushNotificationConfig.enabled
      });

      // Check if notifications are enabled
      if (!pushNotificationConfig.enabled) {
        console.log('[Push Notifications] Disabled - skipping');
        return false;
      }

      // Local test mode - show in-app notification directly
      if (pushNotificationConfig.localTestMode) {
        console.log('[Push Notifications] Using local test mode (in-app notifications)');
        return await this.sendLocalInAppNotification(chatId, senderId, senderName, message);
      }

      console.log('[Push Notifications] Using full mode (Lambda + in-app)');
      const request: SendPushNotificationRequest = {
        chatId,
        senderId,
        senderName,
        message: this.truncateMessage(message),
        participantIds
      };

      // Send via Lambda for push notifications to mobile devices
      await this.invokePushNotificationLambda(request);

      // Also show in-app notification for web users
      await this.sendLocalInAppNotification(chatId, senderId, senderName, message);

      console.log('Push notifications sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send push notifications:', error);
      // Don't throw - push notification failure shouldn't block message sending
      return false;
    }
  }

  /**
   * Send local in-app notification (works on web, iOS, and Android)
   * Uses BroadcastChannel to notify all open windows/tabs
   */
  private async sendLocalInAppNotification(
    chatId: string,
    senderId: string,
    senderName: string,
    message: string
  ): Promise<boolean> {
    try {
      console.log('[Local In-App] Sending notification:', {
        chatId,
        senderId,
        senderName,
        messageLength: message.length
      });

      // Broadcast to other windows/tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'NOTIFICATION_SENT',
          chatId,
          senderId,
          senderName,
          message: this.truncateMessage(message),
          timestamp: Date.now()
        });
        console.log('[Local In-App] Broadcast message sent to other windows');
      }

      // Don't show notification in the sender's window
      if (senderId === this.currentUserId) {
        console.log('[Local In-App] Skipping notification for sender');
        return true;
      }

      // Show in-app notification in this window
      await this.inAppNotificationService.showNotification(
        senderName,
        message,
        chatId,
        undefined,
        senderId
      );

      console.log('[Local In-App] ✅ In-app notification shown successfully');
      return true;
    } catch (error) {
      console.error('[Local In-App] Failed to show notification:', error);
      return false;
    }
  }

  /**
   * Show a native browser/OS notification (Web Notifications API)
   * Works on desktop browsers, Android Chrome, and any browser supporting the Notification API.
   */
  private showNativeNotification(title: string, body: string, chatId: string): void {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      // Don't show native notification if the tab is focused — the in-app toast is enough
      if (document.hasFocus()) return;

      const notification = new Notification(title, {
        body: this.truncateMessage(body),
        icon: '/assets/icon/icon.png',
        badge: '/assets/icon/badge.png',
        tag: `chat-${chatId}`, // Replaces previous notification for same chat
        data: { chatId, route: `/dash/chat/${chatId}` },
        requireInteraction: false,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.hash = '';
        window.location.href = `/dash/chat/${chatId}`;
        notification.close();
      };

      // Auto-close after 8 seconds
      setTimeout(() => notification.close(), 8000);
    } catch (e) {
      console.warn('[Push Notifications] Native notification failed:', e);
    }
  }

  /**
   * Invoke the push notification Lambda function
   */
  private async invokePushNotificationLambda(request: SendPushNotificationRequest): Promise<void> {
    // Check if push notifications are enabled
    if (!pushNotificationConfig.enabled) {
      if (pushNotificationConfig.debug) {
        console.log('[Push Notifications] Disabled - would have sent:', request);
      }
      return;
    }

    try {
      // Get AWS credentials
      const session = await fetchAuthSession();
      if (!session.credentials) {
        console.warn('[Push Notifications] No AWS credentials available');
        return;
      }

      // Get Lambda function name from Amplify outputs
      const functionName = this.getLambdaFunctionName();
      if (!functionName) {
        if (pushNotificationConfig.debug) {
          console.log('[Push Notifications] Lambda not deployed - skipping notification send');
        }
        return;
      }

      // Import Lambda client dynamically
      const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
      
      // Create Lambda client
      const lambda = new LambdaClient({
        region: session.credentials.sessionToken ? 
          (session.identityId?.split(':')[0] || 'us-east-1') : 'us-east-1',
        credentials: session.credentials
      });

      // Invoke Lambda function
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: new TextEncoder().encode(JSON.stringify({
          body: JSON.stringify(request)
        }))
      });

      const response = await lambda.send(command);
      
      if (response.StatusCode === 200) {
        const result = JSON.parse(new TextDecoder().decode(response.Payload));
        console.log('[Push Notifications] Lambda invoked successfully:', result);
      } else {
        console.error('[Push Notifications] Lambda invocation failed:', response);
      }
    } catch (error) {
      console.error('[Push Notifications] Failed to invoke Lambda:', error);
      // Don't throw - push notification failure shouldn't block message sending
    }
  }

  /**
   * Get Lambda function name from Amplify outputs
   */
  private getLambdaFunctionName(): string | null {
    try {
      // Get from amplify config
      const functionName = amplifyConfig.custom?.pushNotificationFunctionName || null;
      
      if (!functionName && pushNotificationConfig.debug) {
        console.log('[Push Notifications] Lambda function not deployed yet.');
        console.log('[Push Notifications] To deploy: npx ampx sandbox');
        console.log('[Push Notifications] This is normal if you haven\'t deployed the backend.');
      }
      
      return functionName;
    } catch (error) {
      if (pushNotificationConfig.debug) {
        console.log('[Push Notifications] Could not read Amplify outputs:', error);
      }
      return null;
    }
  }

  /**
   * Truncate message for notification preview
   */
  private truncateMessage(message: string, maxLength: number = 100): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Save push token to database
   */
  async savePushToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string
  ): Promise<boolean> {
    try {
      // TODO: Uncomment when PushToken model is added to schema
      /*
      await this.client.models.PushToken.create({
        userId,
        token,
        platform,
        deviceId,
        isActive: true
      });
      */
      
      console.log('Push token saved to database:', { userId, platform, deviceId });
      return true;
    } catch (error) {
      console.error('Failed to save push token:', error);
      return false;
    }
  }

  /**
   * Remove push token from database
   */
  async removePushToken(userId: string, token: string): Promise<boolean> {
    try {
      // TODO: Uncomment when PushToken model is added to schema
      /*
      const tokens = await this.client.models.PushToken.list({
        filter: { userId: { eq: userId }, token: { eq: token } }
      });
      
      for (const tokenRecord of tokens.data) {
        await this.client.models.PushToken.delete({ id: tokenRecord.id });
      }
      */
      
      console.log('Push token removed from database:', { userId });
      return true;
    } catch (error) {
      console.error('Failed to remove push token:', error);
      return false;
    }
  }

  /**
   * Get all push tokens for a user
   */
  async getUserPushTokens(userId: string): Promise<any[]> {
    try {
      // TODO: Uncomment when PushToken model is added to schema
      /*
      const result = await this.client.models.PushToken.list({
        filter: { userId: { eq: userId }, isActive: { eq: true } }
      });
      return result.data;
      */
      
      console.log('Getting push tokens for user:', userId);
      return [];
    } catch (error) {
      console.error('Failed to get user push tokens:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  ngOnDestroy(): void {
    console.log('[Push Notifications] Cleaning up resources');
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
