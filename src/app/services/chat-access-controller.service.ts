import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval, merge } from 'rxjs';
import { filter, switchMap, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { getCurrentUser } from 'aws-amplify/auth';
import { Chat, StudioChatList, ChatListItem } from '../models/chat.models';
import { AccessControlService, ChatAccessLevel, ChatInvitation } from './access-control.service';
import { ChatService } from './chat.service';
import { AuthStateService } from './auth-state.service';

export interface OrganizedStudioChats {
  publicChats: ChatListItem[];
  privateChats: ChatListItem[];
  invitationsPending: ChatInvitation[];
  totalPublic: number;
  totalPrivate: number;
}

export interface AccessChangeEvent {
  chatId: string;
  userId: string;
  hasAccess: boolean;
  accessLevel?: ChatAccessLevel;
  changeType: 'granted' | 'revoked' | 'updated';
  timestamp: Date;
}

export interface ChatVisibilityUpdate {
  chatId: string;
  userId: string;
  isVisible: boolean;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatAccessController {
  private currentUserId: string | null = null;
  private authSubscription: Subscription | null = null;
  private accessPollingSubscription: Subscription | null = null;

  // Subjects for real-time access control updates
  private accessUpdatesSubject = new BehaviorSubject<{ chatId: string; userId: string; hasAccess: boolean }[]>([]);
  public accessUpdates$ = this.accessUpdatesSubject.asObservable();

  // Subject for access change events
  private accessChangeEventsSubject = new BehaviorSubject<AccessChangeEvent[]>([]);
  public accessChangeEvents$ = this.accessChangeEventsSubject.asObservable();

  // Subject for chat visibility updates
  private chatVisibilitySubject = new BehaviorSubject<ChatVisibilityUpdate[]>([]);
  public chatVisibilityUpdates$ = this.chatVisibilitySubject.asObservable();

  // Cache for access permissions to detect changes
  private accessCache = new Map<string, { hasAccess: boolean; accessLevel?: ChatAccessLevel; lastChecked: Date }>();

  // Active subscriptions for chat access monitoring
  private activeSubscriptions = new Map<string, Subscription>();

  constructor(
    private accessControlService: AccessControlService,
    private chatService: ChatService,
    private authStateService: AuthStateService
  ) {
    console.log('ChatAccessController initialized');
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Subscribe to auth changes
      this.authSubscription = this.authStateService.currentUser$.subscribe(user => {
        if (user && user.userId !== this.currentUserId) {
          this.currentUserId = user.userId;
          console.log('ChatAccessController: User changed to', this.currentUserId);
        } else if (!user) {
          this.currentUserId = null;
          console.log('ChatAccessController: User logged out');
        }
      });

      // Try to get current user
      try {
        const user = await getCurrentUser();
        this.currentUserId = user.userId;
        console.log('ChatAccessController: Current user set to', this.currentUserId);
      } catch (error) {
        console.log('ChatAccessController: No authenticated user');
        this.currentUserId = null;
      }
    } catch (error) {
      console.error('Error initializing ChatAccessController:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.accessPollingSubscription) {
      this.accessPollingSubscription.unsubscribe();
    }
    // Clean up all active subscriptions
    this.activeSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.activeSubscriptions.clear();
  }

  /**
   * Get all chats for a studio that the user has access to, organized by type
   */
  async getStudioChatsForUser(studioId: string, userId?: string): Promise<OrganizedStudioChats> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      console.log('Getting studio chats for user:', targetUserId, 'studio:', studioId);

      // Get all chats for the studio from the chat service
      const studioChatsResult = await this.chatService.getStudioChats({
        studioId,
        pageSize: 100, // Get all chats for now
        sortBy: 'recent'
      });

      const allStudioChats = studioChatsResult.chats;
      console.log('Found', allStudioChats.length, 'total chats for studio');

      // Filter chats based on access permissions
      const accessibleChats = await this.filterChatsByAccess(allStudioChats, targetUserId);
      console.log('User has access to', accessibleChats.length, 'chats');

      // Convert to ChatListItem format and organize by type
      const chatListItems: ChatListItem[] = [];
      
      for (const chat of accessibleChats) {
        // Get additional data for each chat
        const messages = await this.chatService.loadMessages(chat.id, { pageSize: 1 });
        const participants = await this.chatService.loadParticipants(chat.id);
        const unreadCount = this.chatService.getUnreadCount(chat.id);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

        chatListItems.push({
          chat,
          lastMessage,
          unreadCount,
          participants,
          userPreferences: undefined // Will be populated by components if needed
        });
      }

      // Separate public and private chats
      const publicChats: ChatListItem[] = [];
      const privateChats: ChatListItem[] = [];

      for (const item of chatListItems) {
        const chat = item.chat;
        
        // Determine if chat is public or private based on access level and settings
        const isPublic = chat.settings?.isPublic !== false && 
                        (!chat.settings || chat.settings.allowInviting !== false) &&
                        (chat.type === 'studio' || chat.type === 'group');
        
        if (isPublic) {
          publicChats.push(item);
        } else {
          privateChats.push(item);
        }
      }

      // Sort each section by recent activity
      const sortByActivity = (a: ChatListItem, b: ChatListItem) => {
        const aTime = a.chat.lastMessageAt?.getTime() || a.chat.updatedAt?.getTime() || a.chat.createdAt?.getTime() || 0;
        const bTime = b.chat.lastMessageAt?.getTime() || b.chat.updatedAt?.getTime() || b.chat.createdAt?.getTime() || 0;
        return bTime - aTime;
      };

      publicChats.sort(sortByActivity);
      privateChats.sort(sortByActivity);

      // Get pending invitations for the user
      let pendingInvitations: ChatInvitation[] = [];
      try {
        pendingInvitations = await this.accessControlService.getUserChatInvitations(targetUserId);
        pendingInvitations = pendingInvitations.filter(inv => 
          inv.status === 'pending' && 
          allStudioChats.some(chat => chat.id === inv.chatId)
        );
      } catch (error) {
        console.warn('Failed to load pending invitations:', error);
      }

      const result: OrganizedStudioChats = {
        publicChats,
        privateChats,
        invitationsPending: pendingInvitations,
        totalPublic: publicChats.length,
        totalPrivate: privateChats.length
      };

      console.log('Organized studio chats:', {
        publicCount: result.totalPublic,
        privateCount: result.totalPrivate
      });

      return result;

    } catch (error) {
      console.error('Error getting studio chats for user:', error);
      
      // Return empty result on error
      return {
        publicChats: [],
        privateChats: [],
        invitationsPending: [],
        totalPublic: 0,
        totalPrivate: 0
      };
    }
  }

  /**
   * Check if a user can access a specific chat
   */
  async canUserAccessChat(chatId: string, userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        console.warn('No user ID provided for access check');
        return false;
      }

      // Check cache first for immediate access revocation/grant
      const cacheKey = `${chatId}_${targetUserId}`;
      const cached = this.accessCache.get(cacheKey);
      
      if (cached) {
        // If we have a recent cache entry (within last 5 seconds), use it
        // This ensures immediate effect for access revocation/grant
        const cacheAge = Date.now() - cached.lastChecked.getTime();
        if (cacheAge < 5000) {
          return cached.hasAccess;
        }
      }

      // Otherwise, check with the service
      const hasAccess = await this.accessControlService.canUserAccessChat(chatId, targetUserId);
      
      // Update cache with the result
      this.accessCache.set(cacheKey, {
        hasAccess,
        lastChecked: new Date()
      });
      
      return hasAccess;
    } catch (error) {
      console.error('Error checking user chat access:', error);
      return false;
    }
  }

  /**
   * Check if a user can send messages to a specific chat
   */
  async canUserSendMessage(chatId: string, userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        console.warn('No user ID provided for message permission check');
        return false;
      }

      // Check cache first for immediate access revocation/grant
      const cacheKey = `${chatId}_${targetUserId}`;
      const cached = this.accessCache.get(cacheKey);
      
      if (cached) {
        // If access is revoked in cache, immediately deny message sending
        if (!cached.hasAccess) {
          return false;
        }
        
        // If we have a recent cache entry with access level, check write permission
        if (cached.accessLevel) {
          const cacheAge = Date.now() - cached.lastChecked.getTime();
          if (cacheAge < 5000) {
            return cached.accessLevel.canWrite;
          }
        }
      }

      // Otherwise, check with the service
      return await this.accessControlService.canUserSendMessage(chatId, targetUserId);
    } catch (error) {
      console.error('Error checking user message permissions:', error);
      return false;
    }
  }

  /**
   * Filter a list of chats to only include those the user has access to
   */
  async filterChatsByAccess(chats: Chat[], userId?: string): Promise<Chat[]> {
    try {
      // If userId is explicitly undefined (not just omitted), return empty array
      if (arguments.length > 1 && userId === undefined) {
        console.warn('User ID explicitly set to undefined for chat filtering');
        return [];
      }
      
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        console.warn('No user ID provided for chat filtering');
        return [];
      }

      // Handle empty chat list early
      if (chats.length === 0) {
        console.log('No chats to filter');
        return [];
      }

      console.log('Filtering', chats.length, 'chats for user access:', targetUserId);

      const accessibleChats: Chat[] = [];
      const accessChecks: Promise<{ chat: Chat; hasAccess: boolean }>[] = [];

      // Check access for all chats in parallel
      for (const chat of chats) {
        const accessCheck = this.accessControlService.canUserAccessChat(chat.id, targetUserId)
          .then(hasAccess => ({ chat, hasAccess }))
          .catch(error => {
            console.error(`Error checking access for chat ${chat.id}:`, error);
            return { chat, hasAccess: false };
          });
        
        accessChecks.push(accessCheck);
      }

      // Wait for all access checks to complete
      const results = await Promise.all(accessChecks);

      // Filter to only accessible chats
      for (const result of results) {
        if (result.hasAccess) {
          accessibleChats.push(result.chat);
        }
      }

      console.log('User has access to', accessibleChats.length, 'out of', chats.length, 'chats');

      // Emit access update for real-time subscriptions
      this.emitAccessUpdate(results.map(r => ({
        chatId: r.chat.id,
        userId: targetUserId,
        hasAccess: r.hasAccess
      })));

      return accessibleChats;

    } catch (error) {
      console.error('Error filtering chats by access:', error);
      return [];
    }
  }

  /**
   * Get detailed access level information for a chat
   */
  async getChatAccessLevel(chatId: string, userId?: string): Promise<ChatAccessLevel | null> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        console.warn('No user ID provided for access level check');
        return null;
      }

      // Check cache first for immediate access revocation/grant
      const cacheKey = `${chatId}_${targetUserId}`;
      const cached = this.accessCache.get(cacheKey);
      
      if (cached) {
        // If access is revoked in cache, return no-access level
        if (!cached.hasAccess) {
          return {
            canView: false,
            canRead: false,
            canWrite: false,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          };
        }
        
        // If we have a recent cache entry with access level, use it
        if (cached.accessLevel) {
          const cacheAge = Date.now() - cached.lastChecked.getTime();
          if (cacheAge < 5000) {
            return cached.accessLevel;
          }
        }
      }

      // Otherwise, check with the service
      const accessLevel = await this.accessControlService.checkChatAccess(chatId, targetUserId);
      
      // Update cache with the result
      this.accessCache.set(cacheKey, {
        hasAccess: accessLevel.canView && accessLevel.canRead,
        accessLevel,
        lastChecked: new Date()
      });
      
      return accessLevel;
    } catch (error) {
      console.error('Error getting chat access level:', error);
      return null;
    }
  }

  /**
   * Refresh access permissions for a user (useful after permission changes)
   */
  async refreshUserAccess(userId?: string): Promise<void> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        console.warn('No user ID provided for access refresh');
        return;
      }

      console.log('Refreshing access permissions for user:', targetUserId);

      // Get all chats the user might have access to
      const allChats = await this.chatService.loadUserChats();
      
      // Re-check access for all chats
      await this.filterChatsByAccess(allChats, targetUserId);
      
      console.log('Access permissions refreshed for user:', targetUserId);

    } catch (error) {
      console.error('Error refreshing user access:', error);
    }
  }

  /**
   * Handle real-time access control updates
   */
  private emitAccessUpdate(updates: { chatId: string; userId: string; hasAccess: boolean }[]): void {
    try {
      const currentUpdates = this.accessUpdatesSubject.value;
      const newUpdates = [...currentUpdates];

      // Update or add access status for each chat
      for (const update of updates) {
        const existingIndex = newUpdates.findIndex(
          u => u.chatId === update.chatId && u.userId === update.userId
        );

        if (existingIndex >= 0) {
          newUpdates[existingIndex] = update;
        } else {
          newUpdates.push(update);
        }
      }

      // Keep only recent updates (last 100)
      if (newUpdates.length > 100) {
        newUpdates.splice(0, newUpdates.length - 100);
      }

      this.accessUpdatesSubject.next(newUpdates);
    } catch (error) {
      console.error('Error emitting access update:', error);
    }
  }

  /**
   * Subscribe to access changes for a specific chat
   */
  subscribeToAccessChanges(chatId: string, userId?: string): Observable<boolean> {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      throw new Error('No user ID available for access subscription');
    }

    return new Observable<boolean>(subscriber => {
      // Initial access check
      this.canUserAccessChat(chatId, targetUserId)
        .then(hasAccess => subscriber.next(hasAccess))
        .catch(error => {
          console.error('Error in initial access check:', error);
          subscriber.next(false);
        });

      // Subscribe to access updates
      const subscription = this.accessUpdates$.subscribe(updates => {
        const relevantUpdate = updates.find(
          u => u.chatId === chatId && u.userId === targetUserId
        );
        
        if (relevantUpdate) {
          subscriber.next(relevantUpdate.hasAccess);
        }
      });

      // Cleanup function
      return () => {
        subscription.unsubscribe();
      };
    });
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Check if service is ready (user is authenticated)
   */
  isServiceReady(): boolean {
    return this.currentUserId !== null;
  }

  // ==================== REAL-TIME ACCESS CONTROL UPDATES ====================

  /**
   * Start monitoring access changes for a specific chat
   */
  startAccessMonitoring(chatId: string, userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      console.warn('Cannot start access monitoring without user ID');
      return;
    }

    const subscriptionKey = `${chatId}_${targetUserId}`;
    
    // Don't create duplicate subscriptions
    if (this.activeSubscriptions.has(subscriptionKey)) {
      return;
    }

    console.log('Starting access monitoring for chat:', chatId, 'user:', targetUserId);

    // Poll for access changes every 30 seconds
    const subscription = interval(30000).pipe(
      switchMap(() => this.checkAccessChange(chatId, targetUserId)),
      filter(change => change !== null),
      distinctUntilChanged((prev, curr) => 
        prev?.hasAccess === curr?.hasAccess && 
        prev?.accessLevel?.accessReason === curr?.accessLevel?.accessReason
      )
    ).subscribe(change => {
      if (change) {
        this.handleAccessChange(change);
      }
    });

    this.activeSubscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Stop monitoring access changes for a specific chat
   */
  stopAccessMonitoring(chatId: string, userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      return;
    }

    const subscriptionKey = `${chatId}_${targetUserId}`;
    const subscription = this.activeSubscriptions.get(subscriptionKey);
    
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(subscriptionKey);
      console.log('Stopped access monitoring for chat:', chatId, 'user:', targetUserId);
    }
  }

  /**
   * Start monitoring access changes for multiple chats
   */
  startBulkAccessMonitoring(chatIds: string[], userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      console.warn('Cannot start bulk access monitoring without user ID');
      return;
    }

    console.log('Starting bulk access monitoring for', chatIds.length, 'chats');

    for (const chatId of chatIds) {
      this.startAccessMonitoring(chatId, targetUserId);
    }

    // Also start periodic bulk refresh
    this.startPeriodicAccessRefresh(chatIds, targetUserId);
  }

  /**
   * Stop monitoring access changes for multiple chats
   */
  stopBulkAccessMonitoring(chatIds: string[], userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      return;
    }

    for (const chatId of chatIds) {
      this.stopAccessMonitoring(chatId, targetUserId);
    }

    // Stop periodic refresh
    if (this.accessPollingSubscription) {
      this.accessPollingSubscription.unsubscribe();
      this.accessPollingSubscription = null;
    }
  }

  /**
   * Force refresh access permissions for all monitored chats
   */
  async forceAccessRefresh(userId?: string): Promise<void> {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      console.warn('Cannot refresh access without user ID');
      return;
    }

    console.log('Force refreshing access permissions for user:', targetUserId);

    const refreshPromises: Promise<void>[] = [];

    // Refresh access for all monitored chats
    for (const subscriptionKey of this.activeSubscriptions.keys()) {
      const [chatId, userId] = subscriptionKey.split('_');
      if (userId === targetUserId) {
        refreshPromises.push(
          this.checkAccessChange(chatId, targetUserId).then(change => {
            if (change) {
              this.handleAccessChange(change);
            }
          }).catch(error => {
            console.error(`Error refreshing access for chat ${chatId}:`, error);
          })
        );
      }
    }

    await Promise.all(refreshPromises);
    console.log('Access refresh completed for', refreshPromises.length, 'chats');
  }

  /**
   * Handle immediate access revocation (called when user loses access)
   */
  async handleImmediateAccessRevocation(chatId: string, userId?: string): Promise<void> {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      return;
    }

    console.log('Handling immediate access revocation for chat:', chatId, 'user:', targetUserId);

    // Create access change event
    const changeEvent: AccessChangeEvent = {
      chatId,
      userId: targetUserId,
      hasAccess: false,
      changeType: 'revoked',
      timestamp: new Date()
    };

    // Update cache
    this.accessCache.set(`${chatId}_${targetUserId}`, {
      hasAccess: false,
      lastChecked: new Date()
    });

    // Emit change events
    this.handleAccessChange(changeEvent);

    // Create visibility update
    const visibilityUpdate: ChatVisibilityUpdate = {
      chatId,
      userId: targetUserId,
      isVisible: false,
      reason: 'Access revoked'
    };

    this.emitChatVisibilityUpdate(visibilityUpdate);
  }

  /**
   * Handle immediate access grant (called when user gains access)
   */
  async handleImmediateAccessGrant(chatId: string, userId?: string, accessLevel?: ChatAccessLevel): Promise<void> {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      return;
    }

    console.log('Handling immediate access grant for chat:', chatId, 'user:', targetUserId);

    // Create access change event
    const changeEvent: AccessChangeEvent = {
      chatId,
      userId: targetUserId,
      hasAccess: true,
      accessLevel,
      changeType: 'granted',
      timestamp: new Date()
    };

    // Update cache
    this.accessCache.set(`${chatId}_${targetUserId}`, {
      hasAccess: true,
      accessLevel,
      lastChecked: new Date()
    });

    // Emit change events
    this.handleAccessChange(changeEvent);

    // Create visibility update
    const visibilityUpdate: ChatVisibilityUpdate = {
      chatId,
      userId: targetUserId,
      isVisible: true,
      reason: 'Access granted'
    };

    this.emitChatVisibilityUpdate(visibilityUpdate);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Check if access has changed for a specific chat
   */
  private async checkAccessChange(chatId: string, userId: string): Promise<AccessChangeEvent | null> {
    try {
      const cacheKey = `${chatId}_${userId}`;
      const cached = this.accessCache.get(cacheKey);
      
      // Get current access level
      const currentAccessLevel = await this.accessControlService.checkChatAccess(chatId, userId);
      const currentHasAccess = currentAccessLevel.canView && currentAccessLevel.canRead;

      // Compare with cached value
      if (cached) {
        const accessChanged = cached.hasAccess !== currentHasAccess;
        const reasonChanged = cached.accessLevel?.accessReason !== currentAccessLevel.accessReason;
        
        if (accessChanged || reasonChanged) {
          // Update cache
          this.accessCache.set(cacheKey, {
            hasAccess: currentHasAccess,
            accessLevel: currentAccessLevel,
            lastChecked: new Date()
          });

          // Determine change type
          let changeType: 'granted' | 'revoked' | 'updated';
          if (!cached.hasAccess && currentHasAccess) {
            changeType = 'granted';
          } else if (cached.hasAccess && !currentHasAccess) {
            changeType = 'revoked';
          } else {
            changeType = 'updated';
          }

          return {
            chatId,
            userId,
            hasAccess: currentHasAccess,
            accessLevel: currentAccessLevel,
            changeType,
            timestamp: new Date()
          };
        }
      } else {
        // First time checking - cache the result
        this.accessCache.set(cacheKey, {
          hasAccess: currentHasAccess,
          accessLevel: currentAccessLevel,
          lastChecked: new Date()
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking access change:', error);
      return null;
    }
  }

  /**
   * Handle an access change event
   */
  private handleAccessChange(change: AccessChangeEvent): void {
    try {
      console.log('Access change detected:', change);

      // Update access updates subject
      const currentUpdates = this.accessUpdatesSubject.value;
      const newUpdates = [...currentUpdates];

      const existingIndex = newUpdates.findIndex(
        u => u.chatId === change.chatId && u.userId === change.userId
      );

      const update = {
        chatId: change.chatId,
        userId: change.userId,
        hasAccess: change.hasAccess
      };

      if (existingIndex >= 0) {
        newUpdates[existingIndex] = update;
      } else {
        newUpdates.push(update);
      }

      // Keep only recent updates (last 100)
      if (newUpdates.length > 100) {
        newUpdates.splice(0, newUpdates.length - 100);
      }

      this.accessUpdatesSubject.next(newUpdates);

      // Update access change events subject
      const currentEvents = this.accessChangeEventsSubject.value;
      const newEvents = [...currentEvents, change];

      // Keep only recent events (last 50)
      if (newEvents.length > 50) {
        newEvents.splice(0, newEvents.length - 50);
      }

      this.accessChangeEventsSubject.next(newEvents);

      // Create visibility update if access was revoked or granted
      if (change.changeType === 'revoked' || change.changeType === 'granted') {
        const visibilityUpdate: ChatVisibilityUpdate = {
          chatId: change.chatId,
          userId: change.userId,
          isVisible: change.hasAccess,
          reason: change.changeType === 'revoked' ? 'Access revoked' : 'Access granted'
        };

        this.emitChatVisibilityUpdate(visibilityUpdate);
      }

    } catch (error) {
      console.error('Error handling access change:', error);
    }
  }

  /**
   * Emit chat visibility update
   */
  private emitChatVisibilityUpdate(update: ChatVisibilityUpdate): void {
    try {
      const currentUpdates = this.chatVisibilitySubject.value;
      const newUpdates = [...currentUpdates, update];

      // Keep only recent updates (last 50)
      if (newUpdates.length > 50) {
        newUpdates.splice(0, newUpdates.length - 50);
      }

      this.chatVisibilitySubject.next(newUpdates);
    } catch (error) {
      console.error('Error emitting visibility update:', error);
    }
  }

  /**
   * Start periodic access refresh for bulk monitoring
   */
  private startPeriodicAccessRefresh(chatIds: string[], userId: string): void {
    // Stop existing polling
    if (this.accessPollingSubscription) {
      this.accessPollingSubscription.unsubscribe();
    }

    // Start new polling every 2 minutes for bulk refresh
    this.accessPollingSubscription = interval(120000).pipe(
      debounceTime(1000) // Debounce to avoid rapid successive calls
    ).subscribe(() => {
      this.forceAccessRefresh(userId).catch(error => {
        console.error('Error in periodic access refresh:', error);
      });
    });
  }
}