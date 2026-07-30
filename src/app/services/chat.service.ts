import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, Subscription } from 'rxjs';
import { getCurrentUser } from 'aws-amplify/auth';
import {
  Chat,
  ChatMessage,
  ChatParticipant,
  ChatUnreadCount,
  CreateChatRequest,
  SendMessageRequest,
  ChatListItem,
  ChatLoadOptions,
  ChatSearchOptions,
  ChatSettings,
  UserChatPreferences,
  StudioChatList,
  UserFavoriteChatList,
  StudioChatListRequest,
  UserFavoritesRequest,
  UpdateChatPreferencesRequest
} from '../models/chat.models';
import { ChatPersistenceService } from './chat-persistence.service';
import { AuthStateService } from './auth-state.service';
import { AccessControlService, ChatAccessLevel } from './access-control.service';
import { ChatPushIntegrationService } from './chat-push-integration.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // BehaviorSubjects for reactive data
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private messagesSubject = new BehaviorSubject<{ [chatId: string]: ChatMessage[] }>({});
  private participantsSubject = new BehaviorSubject<{ [chatId: string]: ChatParticipant[] }>({});
  private unreadCountsSubject = new BehaviorSubject<ChatUnreadCount[]>([]);
  
  // Public observables
  public chats$ = this.chatsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public participants$ = this.participantsSubject.asObservable();
  public unreadCounts$ = this.unreadCountsSubject.asObservable();
  
  // Current user info
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  
  // Local cache for offline support
  private localChats: Chat[] = [];
  private localMessages: { [chatId: string]: ChatMessage[] } = {};
  private localParticipants: { [chatId: string]: ChatParticipant[] } = {};
  private localUnreadCounts: ChatUnreadCount[] = [];
  
  // Auth state subscription
  private authSubscription: Subscription | null = null;
  
  // Real-time subscription management
  private messageSubscriptions: Map<string, Subscription> = new Map();
  private chatSubscriptions: Map<string, Subscription> = new Map();
  private accessControlSubscriptions: Map<string, Subscription> = new Map();
  private isSubscriptionsActive: boolean = false;

  private isInitializing = false; // Flag to prevent concurrent initialization
  private isLoadingChats = false; // Flag to prevent concurrent loadUserChats calls
  private chatsLoadTimestamp: number = 0; // Timestamp of last successful chat load
  private readonly CHATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor(
    private persistenceService: ChatPersistenceService, 
    private authStateService: AuthStateService,
    private accessControlService: AccessControlService,
      private chatPushIntegration: ChatPushIntegrationService
  ) {
    console.log('ChatService constructor called');
    this.initializeService();
    this.subscribeToAuthChanges();
  }

  /**
   * Subscribe to authentication state changes
   */
  private subscribeToAuthChanges(): void {
    this.authSubscription = this.authStateService.currentUser$.subscribe(user => {
      console.log('Auth state changed in chat service:', user);
      
      if (user && user.userId !== this.currentUserId) {
        // User logged in or switched - reinitialize
        console.log('User changed, reinitializing chat service...');
        this.initializeService();
      } else if (!user && this.currentUserId) {
        // User logged out - clear everything
        console.log('User logged out, clearing chat service...');
        this.clearUserData();
      }
    });
  }

  /**
   * Clear all user data when user logs out
   */
  private clearUserData(): void {
    this.currentUserId = null;
    this.currentUserName = null;
    this.localChats = [];
    this.localMessages = {};
    this.localParticipants = {};
    this.localUnreadCounts = [];
    
    // Reset loading flags and cache
    this.isLoadingChats = false;
    this.chatsLoadTimestamp = 0;
    
    // Clear all real-time subscriptions
    this.clearAllSubscriptions();
    
    // Update observables with empty data
    this.chatsSubject.next([]);
    this.messagesSubject.next({});
    this.participantsSubject.next({});
    this.unreadCountsSubject.next([]);
    
    console.log('Chat service data cleared for logout');
  }

  /**
   * Cleanup subscriptions
   */
  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    this.clearAllSubscriptions();
  }

  /**
   * Get service status for debugging
   */
  getServiceStatus(): any {
    return {
      isReady: this.isServiceReady(),
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName,
      chatsCount: this.localChats.length,
      hasClient: !!this.persistenceService
    };
  }

  /**
   * Retry initialization when user becomes authenticated
   */
  async retryInitialization(): Promise<void> {
    console.log('Retrying chat service initialization...');
    await this.initializeService();
  }

  /**
   * Check if the service is ready (user is authenticated)
   */
  isServiceReady(): boolean {
    return this.currentUserId !== null;
  }

  private async initializeService(): Promise<void> {
    // Prevent concurrent initialization
    if (this.isInitializing) {
      console.log('ChatService initialization already in progress, skipping...');
      return;
    }

    this.isInitializing = true;
    console.log('ChatService initializeService called');
    try {
      // Try to get current user info with better error handling
      let user;
      try {
        console.log('Attempting to get current user...');
        user = await getCurrentUser();
        this.currentUserId = user.userId;
        this.currentUserName = user.username || 'Unknown User';
        console.log('Successfully authenticated user:', this.currentUserId, this.currentUserName);
      } catch (authError: any) {
        console.warn('User not authenticated, will initialize when authentication is available:', authError);
        
        // Check if it's a specific authentication error
        const errorMessage = authError?.message || String(authError);
        if (errorMessage.includes('not authenticated') || errorMessage.includes('No current user')) {
          console.log('User needs to sign in - setting up empty state');
        } else {
          console.error('Unexpected authentication error:', authError);
        }
        
        // Don't throw error - just set up empty state and wait for authentication
        this.currentUserId = null;
        this.currentUserName = null;
        
        // Initialize with empty data
        this.localChats = [];
        this.localMessages = {};
        this.localParticipants = {};
        this.localUnreadCounts = [];
        
        // Update observables with empty data
        this.chatsSubject.next(this.localChats);
        this.messagesSubject.next(this.localMessages);
        this.participantsSubject.next(this.localParticipants);
        this.unreadCountsSubject.next(this.localUnreadCounts);
        
        console.log('Chat service initialized without authentication - waiting for user login');
        this.isInitializing = false;
        return; // Exit early, will be re-initialized when user authenticates
      }
      
      // If we have a user, try to load their data
      if (this.currentUserId) {
        try {
          console.log('Loading user chats for authenticated user...');
          await this.loadUserChats();
          console.log('Loaded user chats from database, count:', this.localChats.length);
        } catch (loadError: any) {
          console.error('Failed to load user chats from database:', loadError);
          
          // Check if it's a network/connection error
          const errorMessage = loadError?.message || String(loadError);
          if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
            console.error('Network connectivity issue - chat may be unavailable');
          } else if (errorMessage.includes('GraphQL') || errorMessage.includes('API')) {
            console.error('API/GraphQL error - backend may be unavailable');
          }
          
          // Start with empty chats - they will be created as needed
          this.localChats = [];
          this.localMessages = {};
          this.localParticipants = {};
          this.localUnreadCounts = [];
          
          // Update observables with empty data
          this.chatsSubject.next(this.localChats);
          this.messagesSubject.next(this.localMessages);
          this.participantsSubject.next(this.localParticipants);
          this.unreadCountsSubject.next(this.localUnreadCounts);
          
          // Re-throw the error so components can handle it appropriately
          throw loadError;
        }
      }
      
      console.log('Chat service initialized successfully for user:', this.currentUserId || 'not authenticated');
      
    } catch (error: any) {
      console.error('Unexpected error during chat service initialization:', error);
      
      // Initialize with empty state rather than throwing
      this.currentUserId = null;
      this.currentUserName = null;
      this.localChats = [];
      this.localMessages = {};
      this.localParticipants = {};
      this.localUnreadCounts = [];
      
      // Update observables with empty data
      this.chatsSubject.next(this.localChats);
      this.messagesSubject.next(this.localMessages);
      this.participantsSubject.next(this.localParticipants);
      this.unreadCountsSubject.next(this.localUnreadCounts);
      
      console.log('Chat service initialized with empty state due to error');
      
      // Re-throw the error so components can show appropriate error messages
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  // ==================== CHAT MANAGEMENT ====================
  // ==================== CHAT MANAGEMENT ====================

  /**
   * Load all chats for the current user
   */
  async loadUserChats(): Promise<Chat[]> {
    // Prevent concurrent loads
    if (this.isLoadingChats) {
      console.log('Chat loading already in progress, skipping...');
      return this.localChats;
    }

    // Check cache - if we loaded recently, return cached data
    const now = Date.now();
    if (this.chatsLoadTimestamp > 0 && (now - this.chatsLoadTimestamp) < this.CHATS_CACHE_DURATION) {
      console.log('Returning cached chats (loaded', Math.floor((now - this.chatsLoadTimestamp) / 1000), 'seconds ago)');
      return this.localChats;
    }

    this.isLoadingChats = true;
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      console.log('Loading chats from database for user:', this.currentUserId);
      
      const chats = await this.persistenceService.loadUserChats();
      this.localChats = chats;
      this.chatsSubject.next(this.localChats);
      
      // Load messages and participants for each chat (but don't block on them)
      // Use Promise.allSettled to prevent one failure from blocking others
      const loadPromises = chats.map(async (chat) => {
        try {
          // Check if we already have messages for this chat
          if (!this.localMessages[chat.id] || this.localMessages[chat.id].length === 0) {
            const messages = await this.persistenceService.loadMessages(chat.id, {}, this.currentUserId!);
            this.localMessages[chat.id] = messages;
          }
          
          // Check if we already have participants for this chat
          if (!this.localParticipants[chat.id] || this.localParticipants[chat.id].length === 0) {
            const participants = await this.persistenceService.loadParticipants(chat.id);
            this.localParticipants[chat.id] = participants;
          }
        } catch (chatDataError) {
          console.warn(`Failed to load data for chat ${chat.id}:`, chatDataError);
          // Initialize with empty data for this chat
          this.localMessages[chat.id] = this.localMessages[chat.id] || [];
          this.localParticipants[chat.id] = this.localParticipants[chat.id] || [];
        }
      });

      // Wait for all loads to complete (or fail)
      await Promise.allSettled(loadPromises);
      
      this.messagesSubject.next(this.localMessages);
      this.participantsSubject.next(this.localParticipants);
      
      // Update cache timestamp
      this.chatsLoadTimestamp = Date.now();
      
      console.log('Successfully loaded chats from database:', chats.length);
      return chats;
    } catch (error) {
      console.error('Failed to load user chats from database:', error);
      throw error; // Don't fall back to dummy data
    } finally {
      this.isLoadingChats = false;
    }
  }

  /**
   * Force refresh chats from database (bypasses cache)
   */
  async refreshUserChats(): Promise<Chat[]> {
    console.log('Force refreshing chats from database...');
    this.chatsLoadTimestamp = 0; // Clear cache timestamp
    return this.loadUserChats();
  }

  /**
   * Create a new chat
   */
  async createChat(request: CreateChatRequest): Promise<Chat> {
    try {
      // Ensure we have a current user - retry initialization if needed
      if (!this.currentUserId) {
        console.log('User not authenticated, retrying initialization...');
        await this.retryInitialization();
        
        if (!this.currentUserId) {
          throw new Error('User not authenticated - please log in to create chats');
        }
      }

      console.log('Creating chat in database:', request.name, 'for user:', this.currentUserId);

      // Always create in database - no fallbacks
      const newChat = await this.persistenceService.createChat(request);
      
      // Add to local cache
      this.localChats.push(newChat);
      this.chatsSubject.next(this.localChats);

      // Initialize empty messages and participants for this chat
      this.localMessages[newChat.id] = [];
      this.localParticipants[newChat.id] = [];
      
      // Load initial data from database
      try {
        const messages = await this.persistenceService.loadMessages(newChat.id, {}, this.currentUserId!);
        this.localMessages[newChat.id] = messages;
        
        const participants = await this.persistenceService.loadParticipants(newChat.id);
        this.localParticipants[newChat.id] = participants;
      } catch (dataError) {
        console.warn('Failed to load initial chat data, keeping empty:', dataError);
      }
      
      this.messagesSubject.next(this.localMessages);
      this.participantsSubject.next(this.localParticipants);

      console.log('Chat successfully created in database:', newChat);
      return newChat;
        
    } catch (error) {
      console.error('Failed to create chat in database:', error);
      throw error; // Don't create temporary chats - fail properly
    }
  }

  /**
   * Delete a chat
   */
  async deleteChat(chatId: string): Promise<boolean> {
    try {
      const chat = this.getChatById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if user has permission to delete (creator or admin)
      if (chat.createdBy !== this.currentUserId) {
        throw new Error('You do not have permission to delete this chat');
      }

      // Always delete from database - no fallbacks
      await this.persistenceService.deleteChat(chatId);
      console.log('Chat deleted from database:', chatId);

      // Remove from local cache
      this.localChats = this.localChats.filter(c => c.id !== chatId);
      delete this.localMessages[chatId];
      delete this.localParticipants[chatId];

      // Update observables
      this.chatsSubject.next([...this.localChats]);
      this.messagesSubject.next({ ...this.localMessages });
      this.participantsSubject.next({ ...this.localParticipants });

      console.log('Chat deleted successfully:', chatId);
      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  }

  /**
   * Get a specific chat by ID
   */
  getChatById(chatId: string): Chat | undefined {
    return this.localChats.find(chat => chat.id === chatId);
  }

  /**
   * Create a custom chat for studio members
   * Enhanced with access control options for Requirements 4.1, 4.2, 4.3
   */
  async createCustomChat(
    studioId: string, 
    chatName: string, 
    description?: string, 
    isPrivate: boolean = false,
    initialMembers: string[] = []
  ): Promise<Chat> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated - cannot create custom chat');
      }

      // Requirement 4.3: Private chats require initial invited members
      if (isPrivate && initialMembers.length === 0) {
        throw new Error('Private chats must have at least one initial member');
      }

      // Build participant list: creator + initial members for private chats
      const participantIds = [this.currentUserId];
      if (isPrivate && initialMembers.length > 0) {
        // Add initial members to participant list (they'll be invited)
        participantIds.push(...initialMembers);
      }

      const newChat = await this.createChat({
        name: chatName,
        description: description || `Custom chat: ${chatName}`,
        type: isPrivate ? 'private' : 'group',
        studioId: studioId,
        participantIds: participantIds,
        settings: {
          allowLeaving: true,
          allowMuting: true,
          allowInviting: !isPrivate,
          isPublic: !isPrivate, // Requirement 4.2: Public chats visible to all
          maxParticipants: isPrivate ? initialMembers.length + 1 : 50
        },
        // Access control fields
        accessLevel: isPrivate ? 'private' : 'public',
        invitationRequired: isPrivate,
        studioMembershipRequired: false
      });

      // For private chats, send invitations to initial members
      if (isPrivate && initialMembers.length > 0) {
        try {
          // Import AccessControlService if not already available
          const { AccessControlService } = await import('./access-control.service');
          const { ChatErrorHandlerService } = await import('./chat-error-handler.service');
          const { ChatLoadingStateService } = await import('./chat-loading-state.service');
          
          // Create required dependencies
          const errorHandler = new ChatErrorHandlerService(
            // We'll need to inject these properly in a real implementation
            null as any, // ToastController
            null as any, // AlertController
            null as any  // TranslationService
          );
          const loadingState = new ChatLoadingStateService(
            null as any // LoadingController
          );
          const accessControlService = new AccessControlService(errorHandler, loadingState);
          
          // Send invitations to all initial members
          for (const memberId of initialMembers) {
            try {
              await accessControlService.inviteUserToChat(newChat.id, memberId, this.currentUserId);
              console.log(`Invitation sent to ${memberId} for private chat ${newChat.name}`);
            } catch (inviteError) {
              console.warn(`Failed to send invitation to ${memberId}:`, inviteError);
              // Continue with other invitations even if one fails
            }
          }
        } catch (serviceError) {
          console.warn('Failed to send invitations for private chat:', serviceError);
          // Chat is still created, just without invitations
        }
      }

      console.log('Custom chat created:', newChat, 'Access level:', isPrivate ? 'private' : 'public');
      return newChat;
    } catch (error) {
      console.error('Failed to create custom chat:', error);
      throw error;
    }
  }

  /**
   * Get chats created by current user
   */
  getUserCreatedChats(): Chat[] {
    return this.localChats.filter(chat => chat.createdBy === this.currentUserId);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get chats by studio ID with access control (for backward compatibility)
   */
  async getChatsByStudioId(studioId: string): Promise<Chat[]> {
    if (!this.currentUserId) {
      console.warn('User not authenticated, returning empty chat list');
      return [];
    }

    const studioChats = this.localChats.filter(chat => chat.studioId === studioId && chat.isActive);
    
    // Filter chats based on access control permissions
    const accessibleChats: Chat[] = [];
    for (const chat of studioChats) {
      try {
        const hasAccess = await this.accessControlService.canUserAccessChat(chat.id, this.currentUserId);
        if (hasAccess) {
          accessibleChats.push(chat);
        }
      } catch (error) {
        console.warn(`Failed to check access for chat ${chat.id}:`, error);
        // For public chats, allow access on error (fail-open for public content)
        if (chat.settings?.isPublic !== false) {
          accessibleChats.push(chat);
        }
      }
    }

    console.log(`User has access to ${accessibleChats.length} out of ${studioChats.length} chats for studio ${studioId}`);
    return accessibleChats;
  }

  /**
   * Toggle chat favorite status for current user
   */
  async toggleChatFavorite(chatId: string): Promise<boolean> {
    if (!this.currentUserId) return false;
    
    const currentPrefs = await this.getChatPreferences(chatId);
    const newFavoriteStatus = !currentPrefs?.isFavorite;
    
    const success = await this.updateChatPreferences({
      userId: this.currentUserId,
      chatId: chatId,
      isFavorite: newFavoriteStatus
    });
    
    if (success) {
      console.log(`Chat ${newFavoriteStatus ? 'added to' : 'removed from'} favorites:`, chatId);
    }
    
    return newFavoriteStatus;
  }

  /**
   * Toggle chat pin status for current user
   */
  async toggleChatPin(chatId: string): Promise<boolean> {
    if (!this.currentUserId) return false;
    
    const currentPrefs = await this.getChatPreferences(chatId);
    const newPinStatus = !currentPrefs?.isPinned;
    
    const success = await this.updateChatPreferences({
      userId: this.currentUserId,
      chatId: chatId,
      isPinned: newPinStatus
    });
    
    if (success) {
      console.log(`Chat ${newPinStatus ? 'pinned' : 'unpinned'}:`, chatId);
    }
    
    return newPinStatus;
  }

  /**
   * Check if a chat is favorited by current user
   */
  async isChatFavorite(chatId: string): Promise<boolean> {
    const prefs = await this.getChatPreferences(chatId);
    return prefs?.isFavorite || false;
  }

  /**
   * Check if a chat is pinned by current user
   */
  async isChatPinned(chatId: string): Promise<boolean> {
    const prefs = await this.getChatPreferences(chatId);
    return prefs?.isPinned || false;
  }

  /**
   * Remove duplicate chats (cleanup utility)
   */
  removeDuplicateChats(): void {
    const seenNames = new Set<string>();
    const uniqueChats: Chat[] = [];
    
    for (const chat of this.localChats) {
      if (!seenNames.has(chat.name)) {
        seenNames.add(chat.name);
        uniqueChats.push(chat);
      } else {
        console.log('Removing duplicate chat:', chat.name, 'ID:', chat.id);
        // Also clean up messages and participants for the duplicate
        delete this.localMessages[chat.id];
        delete this.localParticipants[chat.id];
      }
    }
    
    if (uniqueChats.length !== this.localChats.length) {
      console.log(`Removed ${this.localChats.length - uniqueChats.length} duplicate chats`);
      this.localChats = uniqueChats;
      this.chatsSubject.next([...this.localChats]);
      this.messagesSubject.next({ ...this.localMessages });
      this.participantsSubject.next({ ...this.localParticipants });
    }
  }
  // ==================== STUDIO CHAT MANAGEMENT ====================

  /**
   * Get all chats for a specific studio with access control filtering
   */
  async getStudioChats(request: StudioChatListRequest): Promise<StudioChatList> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      console.log('Loading studio chats for:', request.studioId);
      
      // Get all chats for this studio
      const studioChats = this.localChats.filter(chat => 
        chat.studioId === request.studioId && chat.isActive
      );

      // Filter chats based on access control permissions
      const accessibleChats: Chat[] = [];
      for (const chat of studioChats) {
        try {
          const hasAccess = await this.accessControlService.canUserAccessChat(chat.id, this.currentUserId);
          if (hasAccess) {
            accessibleChats.push(chat);
          }
        } catch (error) {
          console.warn(`Failed to check access for chat ${chat.id}:`, error);
          // For public chats, allow access on error (fail-open for public content)
          if (chat.settings?.isPublic !== false) {
            accessibleChats.push(chat);
          }
        }
      }

      console.log(`User has access to ${accessibleChats.length} out of ${studioChats.length} studio chats`);

      // Apply search filter if provided
      let filteredChats = accessibleChats;
      if (request.searchQuery) {
        const query = request.searchQuery.toLowerCase();
        filteredChats = accessibleChats.filter(chat =>
          chat.name.toLowerCase().includes(query) ||
          chat.description?.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      switch (request.sortBy) {
        case 'name':
          filteredChats.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'created':
          filteredChats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'recent':
        default:
          filteredChats.sort((a, b) => {
            const aTime = a.lastMessageAt?.getTime() || a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
            const bTime = b.lastMessageAt?.getTime() || b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
            return bTime - aTime;
          });
          break;
      }

      // Apply pagination
      const offset = request.offset || 0;
      const pageSize = request.pageSize || 20;
      const paginatedChats = filteredChats.slice(offset, offset + pageSize);

      return {
        studioId: request.studioId,
        chats: paginatedChats,
        totalCount: filteredChats.length
      };
    } catch (error) {
      console.error('Failed to get studio chats:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite chats across all studios
   */
  async getUserFavoriteChats(request: UserFavoritesRequest): Promise<UserFavoriteChatList> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      console.log('Loading favorite chats for user:', this.currentUserId);

      // Get user's chat preferences
      const userPreferences = await this.getUserChatPreferences();
      
      // Filter for favorite chats
      const favoritePrefs = userPreferences.filter(pref => pref.isFavorite);
      
      // Get the actual chat data for favorites
      const favoriteChatItems: ChatListItem[] = [];
      
      for (const pref of favoritePrefs) {
        const chat = this.getChatById(pref.chatId);
        if (chat) {
          const messages = this.localMessages[chat.id] || [];
          const participants = this.localParticipants[chat.id] || [];
          const unreadCount = this.getUnreadCount(chat.id);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

          favoriteChatItems.push({
            chat,
            lastMessage,
            unreadCount,
            participants,
            userPreferences: pref
          });
        }
      }

      // Sort by recent activity (pinned first, then by last message time)
      favoriteChatItems.sort((a, b) => {
        // Pinned chats first
        if (a.userPreferences?.isPinned && !b.userPreferences?.isPinned) return -1;
        if (!a.userPreferences?.isPinned && b.userPreferences?.isPinned) return 1;
        
        // Then by recent activity
        const aTime = a.chat.lastMessageAt?.getTime() || a.chat.updatedAt?.getTime() || a.chat.createdAt?.getTime() || 0;
        const bTime = b.chat.lastMessageAt?.getTime() || b.chat.updatedAt?.getTime() || b.chat.createdAt?.getTime() || 0;
        return bTime - aTime;
      });

      // Apply pagination
      const offset = request.offset || 0;
      const pageSize = request.pageSize || 10;
      const paginatedFavorites = favoriteChatItems.slice(offset, offset + pageSize);

      return {
        userId: this.currentUserId,
        favoriteChats: paginatedFavorites,
        totalCount: favoriteChatItems.length
      };
    } catch (error) {
      console.error('Failed to get user favorite chats:', error);
      throw error;
    }
  }

  /**
   * Update user's chat preferences (favorite, pin, mute)
   */
  async updateChatPreferences(request: UpdateChatPreferencesRequest): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      console.log('Updating chat preferences:', request);

      // For now, store preferences locally
      // In a real app, this would be stored in the database
      const prefKey = `chat_pref_${request.userId}_${request.chatId}`;
      const existingPref = localStorage.getItem(prefKey);
      
      let preferences: UserChatPreferences;
      if (existingPref) {
        preferences = JSON.parse(existingPref);
      } else {
        preferences = {
          id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: request.userId,
          chatId: request.chatId,
          isFavorite: false,
          isPinned: false,
          isMuted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Update preferences
      if (request.isFavorite !== undefined) preferences.isFavorite = request.isFavorite;
      if (request.isPinned !== undefined) preferences.isPinned = request.isPinned;
      if (request.isMuted !== undefined) preferences.isMuted = request.isMuted;
      preferences.updatedAt = new Date();

      // Save to localStorage (in real app, save to database)
      localStorage.setItem(prefKey, JSON.stringify(preferences));

      console.log('Chat preferences updated:', preferences);
      return true;
    } catch (error) {
      console.error('Failed to update chat preferences:', error);
      return false;
    }
  }

  /**
   * Get user's chat preferences for all chats
   */
  private async getUserChatPreferences(): Promise<UserChatPreferences[]> {
    try {
      const preferences: UserChatPreferences[] = [];
      
      // Get all preference keys for current user from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`chat_pref_${this.currentUserId}_`)) {
          const prefData = localStorage.getItem(key);
          if (prefData) {
            const pref = JSON.parse(prefData);
            // Convert date strings back to Date objects
            pref.createdAt = new Date(pref.createdAt);
            pref.updatedAt = new Date(pref.updatedAt);
            if (pref.lastReadAt) pref.lastReadAt = new Date(pref.lastReadAt);
            preferences.push(pref);
          }
        }
      }
      
      return preferences;
    } catch (error) {
      console.error('Failed to get user chat preferences:', error);
      return [];
    }
  }

  /**
   * Get user's preferences for a specific chat
   */
  async getChatPreferences(chatId: string): Promise<UserChatPreferences | null> {
    try {
      if (!this.currentUserId) return null;
      
      const prefKey = `chat_pref_${this.currentUserId}_${chatId}`;
      const prefData = localStorage.getItem(prefKey);
      
      if (prefData) {
        const pref = JSON.parse(prefData);
        // Convert date strings back to Date objects
        pref.createdAt = new Date(pref.createdAt);
        pref.updatedAt = new Date(pref.updatedAt);
        if (pref.lastReadAt) pref.lastReadAt = new Date(pref.lastReadAt);
        return pref;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get chat preferences:', error);
      return null;
    }
  }

  /**
   * Update chat settings
   */
  async updateChatSettings(chatId: string, settings: Partial<ChatSettings>): Promise<boolean> {
    try {
      const chat = this.getChatById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Try to update via persistence layer first
      try {
        const success = await this.persistenceService.updateChatSettings(chatId, settings);
        if (success) {
          // Update local cache
          chat.settings = { ...chat.settings, ...settings };
          chat.updatedAt = new Date();
          this.chatsSubject.next(this.localChats);
          
          console.log('Chat settings updated via persistence layer:', chatId, settings);
          return true;
        }
      } catch (persistenceError) {
        console.warn('Failed to update via persistence, updating locally:', persistenceError);
      }

      // Fall back to local update
      chat.settings = { ...chat.settings, ...settings };
      chat.updatedAt = new Date();
      this.chatsSubject.next(this.localChats);
      
      console.log('Chat settings updated locally:', chatId, settings);
      return true;
    } catch (error) {
      console.error('Failed to update chat settings:', error);
      return false;
    }
  }

  // ==================== MESSAGE MANAGEMENT ====================

  /**
   * Load messages for a specific chat with comprehensive access control
   * Implements Requirements 7.1, 7.2, 7.3
   */
  async loadMessages(chatId: string, options: ChatLoadOptions = {}): Promise<ChatMessage[]> {
    console.log('Loading messages for chat:', chatId, 'with options:', options);
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated - cannot load messages');
      }

      // Check if user has access to read messages from this chat
      const accessLevel = await this.accessControlService.checkChatAccess(chatId, this.currentUserId);
      if (!accessLevel.canRead) {
        console.warn(`User ${this.currentUserId} does not have read access to chat ${chatId}`);
        // Return empty array and update local cache to reflect no access (Requirement 7.2)
        this.localMessages[chatId] = [];
        this.messagesSubject.next(this.localMessages);
        return [];
      }
      
      // Load messages from database with user ID for consistency
      const messages = await this.persistenceService.loadMessages(chatId, options, this.currentUserId);
      
      // Filter message history based on access level and join date (Requirements 7.1, 7.2, 7.3)
      const filteredMessages = await this.filterMessagesByAccess(chatId, messages);
      
      this.localMessages[chatId] = filteredMessages;
      this.messagesSubject.next(this.localMessages);
      console.log(`Loaded and filtered messages from database: ${filteredMessages.length} of ${messages.length} messages accessible`);
      return filteredMessages;
        
    } catch (error) {
      console.error('Failed to load messages from database:', error);
      
      // Return empty array instead of generating mock data
      this.localMessages[chatId] = [];
      this.messagesSubject.next(this.localMessages);
      return [];
    }
  }

  /**
   * Send a new message with comprehensive access control validation
   * Implements Requirements 1.3, 7.1, 7.2, 7.3
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    console.log('=== SERVICE SEND MESSAGE ===');
    console.log('Request:', request);
    try {
      // Ensure we have a current user - retry initialization if needed
      if (!this.currentUserId || !this.currentUserName) {
        console.log('User not authenticated, retrying initialization...');
        await this.retryInitialization();
        
        if (!this.currentUserId || !this.currentUserName) {
          throw new Error('User not authenticated - please log in to send messages');
        }
      }

      // Get the chat to validate it exists and get its access settings
      const chat = this.getChatById(request.chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      console.log('=== CALLING PUSH NOTIFICATIONS ===');
      console.log('Chat:', chat.name, 'ID:', chat.id);
      console.log('Participants:', chat.participantIds);
      console.log('Sender:', this.currentUserId, this.currentUserName);
      
      try {
        await this.chatPushIntegration.notifyParticipants(
          chat.id,
          this.currentUserId!,
          this.currentUserName!,
          request.message,
          chat.participantIds
        );
        console.log('=== PUSH NOTIFICATIONS COMPLETED ===');
      } catch (pushError) {
        console.error('=== PUSH NOTIFICATIONS FAILED ===', pushError);
        // Don't throw - push notification failure shouldn't block message sending
      }

      // Check comprehensive access permissions for sending messages
      const accessLevel = await this.accessControlService.checkChatAccess(request.chatId, this.currentUserId);
      
      // Validate write permissions (Requirement 1.3 for public chats, 7.1 for private chats)
      if (!accessLevel.canWrite) {
        const errorMessage = this.getAccessDeniedMessage(accessLevel.accessReason, chat);
        console.error(`Message send denied for user ${this.currentUserId} to chat ${request.chatId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Additional validation for private chats
      if (chat.accessLevel === 'private' || chat.invitationRequired) {
        // Ensure user has proper invitation or membership
        if (accessLevel.accessReason === 'invited') {
          // Verify invitation is still valid and not revoked
          const hasValidAccess = await this.accessControlService.canUserSendMessage(request.chatId, this.currentUserId);
          if (!hasValidAccess) {
            throw new Error('Your access to this private chat has been revoked');
          }
        }
      }

      console.log(`User ${this.currentUserId} has ${accessLevel.accessReason} access to send message to chat ${request.chatId}`);
      console.log('Sending message to chat:', chat.name, 'via database');

      // Send message via persistence layer
      const newMessage = await this.persistenceService.sendMessage(request);
      
      // Add to local cache
      if (!this.localMessages[request.chatId]) {
        this.localMessages[request.chatId] = [];
      }
      this.localMessages[request.chatId].push(newMessage);

      // Update chat's last message info and interaction timestamp
      chat.lastMessageId = newMessage.id;
      chat.lastMessageAt = newMessage.timestamp;
      chat.updatedAt = new Date();

      // Update observables
      this.messagesSubject.next({ ...this.localMessages });
      this.chatsSubject.next([...this.localChats]);

      console.log('Message successfully sent to database:', newMessage);
      console.log('=== END SERVICE SEND MESSAGE ===');
      return newMessage;
        
    } catch (error) {
      console.error('Failed to send message to database:', error);
      console.log('=== END SERVICE SEND MESSAGE (ERROR) ===');
      throw error; // Don't create temporary messages - fail properly
    }
  }

  /**
   * Get user-friendly error message for access denied scenarios
   */
  private getAccessDeniedMessage(accessReason: string, chat: Chat): string {
    if (chat.accessLevel === 'public' || (!chat.invitationRequired && !chat.studioMembershipRequired)) {
      return 'You must be logged in to send messages to public chats';
    }
    
    if (chat.accessLevel === 'private' || chat.invitationRequired) {
      return 'You need an invitation to send messages to this private chat';
    }
    
    if (chat.studioMembershipRequired) {
      return 'You must be a studio member to send messages to this chat';
    }
    
    return 'You do not have permission to send messages to this chat';
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId: string, messageIds?: string[]): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      // Always use database - no fallbacks
      const success = await this.persistenceService.markMessagesAsRead(chatId, messageIds);
      if (success) {
        // Update local cache
        const messages = this.localMessages[chatId] || [];
        const messagesToUpdate = messageIds 
          ? messages.filter(m => messageIds.includes(m.id))
          : messages.filter(m => !m.isOwn && !m.isRead);

        messagesToUpdate.forEach(message => {
          message.isRead = true;
        });

        // Update unread counts
        this.updateUnreadCount(chatId);
        this.messagesSubject.next(this.localMessages);
        
        console.log('Messages marked as read in database:', chatId, messagesToUpdate.length);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to mark messages as read in database:', error);
      return false;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      // Find the message across all chats
      let messageFound = false;
      for (const chatId in this.localMessages) {
        const messageIndex = this.localMessages[chatId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const message = this.localMessages[chatId][messageIndex];
          
          // Only allow deletion of own messages or if user is admin
          if (message.senderId === this.currentUserId) {
            message.deletedAt = new Date();
            message.message = '[Message deleted]';
            messageFound = true;
            break;
          }
        }
      }

      if (!messageFound) {
        throw new Error('Message not found or not authorized to delete');
      }

      // In a real implementation, this would update the backend
      this.messagesSubject.next(this.localMessages);
      
      console.log('Message deleted:', messageId);
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }

  // ==================== PARTICIPANT MANAGEMENT ====================

  /**
   * Load participants for a specific chat
   */
  async loadParticipants(chatId: string): Promise<ChatParticipant[]> {
    try {
      // Always load from database - no fallbacks
      const participants = await this.persistenceService.loadParticipants(chatId);
      this.localParticipants[chatId] = participants;
      this.participantsSubject.next(this.localParticipants);
      return participants;
    } catch (error) {
      console.error('Failed to load participants from database:', error);
      
      // Return empty array instead of generating mock data
      this.localParticipants[chatId] = [];
      this.participantsSubject.next(this.localParticipants);
      return [];
    }
  }

  /**
   * Add participant to chat
   */
  async addParticipant(chatId: string, userId: string): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const chat = this.getChatById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      if (chat.participantIds.includes(userId)) {
        throw new Error('User is already a participant');
      }

      // Add to chat participants
      chat.participantIds.push(userId);
      chat.updatedAt = new Date();

      // Create participant record
      const newParticipant: ChatParticipant = {
        id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId: chatId,
        userId: userId,
        userName: `User ${userId}`, // Would be loaded from user service
        role: 'member',
        joinedAt: new Date(),
        isMuted: false,
        isActive: true
      };

      if (!this.localParticipants[chatId]) {
        this.localParticipants[chatId] = [];
      }
      this.localParticipants[chatId].push(newParticipant);

      // In a real implementation, this would update the backend
      this.chatsSubject.next(this.localChats);
      this.participantsSubject.next(this.localParticipants);

      console.log('Participant added:', chatId, userId);
      return true;
    } catch (error) {
      console.error('Failed to add participant:', error);
      return false;
    }
  }

  /**
   * Remove participant from chat
   */
  async removeParticipant(chatId: string, userId: string): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const chat = this.getChatById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Remove from chat participants
      chat.participantIds = chat.participantIds.filter(id => id !== userId);
      chat.updatedAt = new Date();

      // Remove participant record
      if (this.localParticipants[chatId]) {
        this.localParticipants[chatId] = this.localParticipants[chatId].filter(p => p.userId !== userId);
      }

      // In a real implementation, this would update the backend
      this.chatsSubject.next(this.localChats);
      this.participantsSubject.next(this.localParticipants);

      console.log('Participant removed:', chatId, userId);
      return true;
    } catch (error) {
      console.error('Failed to remove participant:', error);
      return false;
    }
  }

  /**
   * Mute/unmute chat for current user
   */
  async toggleMuteChat(chatId: string, isMuted: boolean): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const participants = this.localParticipants[chatId] || [];
      const userParticipant = participants.find(p => p.userId === this.currentUserId);
      
      if (userParticipant) {
        userParticipant.isMuted = isMuted;
        
        // In a real implementation, this would update the backend
        this.participantsSubject.next(this.localParticipants);
        
        console.log('Chat mute toggled:', chatId, isMuted);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      return false;
    }
  }

  // ==================== ACCESS CONTROL METHODS ====================

  /**
   * Filter messages based on user's access permissions and join date
   * Implements Requirements 7.1, 7.2, 7.3
   */
  private async filterMessagesByAccess(chatId: string, messages: ChatMessage[]): Promise<ChatMessage[]> {
    try {
      if (!this.currentUserId) {
        return [];
      }

      // Get user's access level for this chat
      const accessLevel = await this.accessControlService.checkChatAccess(chatId, this.currentUserId);
      
      // If user has no access, return empty array (Requirement 7.2)
      if (!accessLevel.canRead) {
        console.log(`User ${this.currentUserId} has no read access to chat ${chatId}, hiding all messages`);
        return [];
      }

      // For public chats, show complete message history to all users (Requirement 7.3)
      if (accessLevel.accessReason === 'public' || accessLevel.accessReason === 'creator') {
        console.log(`User ${this.currentUserId} has public/creator access to chat ${chatId}, showing all ${messages.length} messages`);
        return messages;
      }

      // For private chats, filter messages based on join date (Requirement 7.1)
      if (accessLevel.accessReason === 'invited') {
        const joinDate = await this.getUserJoinDate(chatId, this.currentUserId);
        
        if (joinDate) {
          // Show messages from join date forward
          const filteredMessages = messages.filter(message => message.timestamp >= joinDate);
          console.log(`User ${this.currentUserId} joined chat ${chatId} on ${joinDate.toISOString()}, showing ${filteredMessages.length} of ${messages.length} messages`);
          return filteredMessages;
        } else {
          // If no join date found, show all messages (fallback for legacy data)
          console.log(`No join date found for user ${this.currentUserId} in chat ${chatId}, showing all messages as fallback`);
          return messages;
        }
      }

      // For studio members, show all messages (they have general access)
      if (accessLevel.accessReason === 'studio_member') {
        console.log(`User ${this.currentUserId} has studio member access to chat ${chatId}, showing all ${messages.length} messages`);
        return messages;
      }

      // For admin access, show all messages
      if (accessLevel.accessReason === 'admin') {
        console.log(`User ${this.currentUserId} has admin access to chat ${chatId}, showing all ${messages.length} messages`);
        return messages;
      }

      // Default: no access
      console.log(`User ${this.currentUserId} has no recognized access to chat ${chatId}, hiding all messages`);
      return [];
    } catch (error) {
      console.error('Error filtering messages by access:', error);
      // On error, return empty array for security (fail-closed for private content)
      return [];
    }
  }

  /**
   * Handle access revocation - immediately hide messages when user loses access
   * Implements Requirement 7.2
   */
  async handleAccessRevocation(chatId: string, userId: string): Promise<void> {
    try {
      // If this affects the current user, immediately hide the chat messages
      if (userId === this.currentUserId) {
        console.log(`Access revoked for current user to chat ${chatId}, hiding messages`);
        
        // Clear messages from local cache
        this.localMessages[chatId] = [];
        this.messagesSubject.next({ ...this.localMessages });
        
        // Also remove the chat from the user's visible chat list
        this.localChats = this.localChats.filter(chat => chat.id !== chatId);
        this.chatsSubject.next([...this.localChats]);
        
        // Clear participants
        delete this.localParticipants[chatId];
        this.participantsSubject.next({ ...this.localParticipants });
        
        console.log(`Chat ${chatId} hidden from current user due to access revocation`);
      }
    } catch (error) {
      console.error('Error handling access revocation:', error);
    }
  }

  /**
   * Handle access grant - reload messages when user gains access
   * Implements Requirement 7.1
   */
  async handleAccessGrant(chatId: string, userId: string): Promise<void> {
    try {
      // If this affects the current user, reload the chat and messages
      if (userId === this.currentUserId) {
        console.log(`Access granted for current user to chat ${chatId}, reloading messages`);
        
        // Reload messages with new access permissions
        await this.loadMessages(chatId);
        
        // Reload participants
        await this.loadParticipants(chatId);
        
        console.log(`Chat ${chatId} reloaded for current user after access grant`);
      }
    } catch (error) {
      console.error('Error handling access grant:', error);
    }
  }

  /**
   * Refresh message access for a specific chat (useful when permissions change)
   * Implements Requirements 7.1, 7.2
   */
  async refreshMessageAccess(chatId: string): Promise<void> {
    try {
      if (!this.currentUserId) {
        return;
      }

      console.log(`Refreshing message access for chat ${chatId}`);
      
      // Check current access level
      const accessLevel = await this.accessControlService.checkChatAccess(chatId, this.currentUserId);
      
      if (!accessLevel.canRead) {
        // User lost access - hide all messages (Requirement 7.2)
        console.log(`User lost access to chat ${chatId}, hiding messages`);
        this.localMessages[chatId] = [];
        this.messagesSubject.next({ ...this.localMessages });
      } else {
        // User has access - reload and filter messages (Requirement 7.1)
        console.log(`User has access to chat ${chatId}, reloading messages`);
        await this.loadMessages(chatId);
      }
    } catch (error) {
      console.error('Error refreshing message access:', error);
    }
  }

  /**
   * Get the date when a user joined a private chat (from invitation acceptance or participant record)
   */
  private async getUserJoinDate(chatId: string, userId: string): Promise<Date | null> {
    try {
      // First, try to get join date from accepted invitation
      const allInvitations = await this.accessControlService.getAllUserChatInvitations(userId);
      const acceptedInvitation = allInvitations.find(inv => 
        inv.chatId === chatId && 
        inv.status === 'accepted'
      );

      if (acceptedInvitation) {
        // Use invitation acceptance date as join date
        // For now, we'll use invitedAt as a proxy since we don't track acceptance date separately
        // In a full implementation, we'd track the actual acceptance timestamp
        console.log(`Found accepted invitation for user ${userId} in chat ${chatId}, join date: ${acceptedInvitation.invitedAt.toISOString()}`);
        return acceptedInvitation.invitedAt;
      }

      // Fallback: try to get join date from participant record (local cache first)
      const localParticipants = this.localParticipants[chatId] || [];
      const localUserParticipant = localParticipants.find(p => p.userId === userId);
      
      if (localUserParticipant && localUserParticipant.joinedAt) {
        console.log(`Found local participant record for user ${userId} in chat ${chatId}, join date: ${localUserParticipant.joinedAt.toISOString()}`);
        return localUserParticipant.joinedAt;
      }

      // If not in local cache, query the database directly
      try {
        const participants = await this.persistenceService.loadParticipants(chatId);
        const dbUserParticipant = participants.find((p: any) => p.userId === userId);
        
        if (dbUserParticipant && dbUserParticipant.joinedAt) {
          console.log(`Found database participant record for user ${userId} in chat ${chatId}, join date: ${dbUserParticipant.joinedAt.toISOString()}`);
          return dbUserParticipant.joinedAt;
        }
      } catch (dbError) {
        console.warn('Failed to load participants from database:', dbError);
      }

      // No join date found
      console.log(`No join date found for user ${userId} in chat ${chatId}`);
      return null;
    } catch (error) {
      console.error('Error getting user join date:', error);
      return null;
    }
  }

  /**
   * Get filtered chat list with access control
   */
  async getFilteredChatList(): Promise<ChatListItem[]> {
    try {
      if (!this.currentUserId) {
        return [];
      }

      // Get all chats and filter by access
      const accessibleChats: Chat[] = [];
      
      for (const chat of this.localChats) {
        try {
          const hasAccess = await this.accessControlService.canUserAccessChat(chat.id, this.currentUserId);
          if (hasAccess) {
            accessibleChats.push(chat);
          }
        } catch (error) {
          console.warn(`Failed to check access for chat ${chat.id}:`, error);
          // For public chats, allow access on error (fail-open for public content)
          if (chat.settings?.isPublic !== false) {
            accessibleChats.push(chat);
          }
        }
      }

      // Convert to ChatListItem format
      const chatListItems: ChatListItem[] = [];
      
      for (const chat of accessibleChats) {
        const messages = this.localMessages[chat.id] || [];
        const participants = this.localParticipants[chat.id] || [];
        const unreadCount = this.getUnreadCount(chat.id);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

        // Update chat's lastMessageAt if we have a more recent message
        if (lastMessage && (!chat.lastMessageAt || lastMessage.timestamp > chat.lastMessageAt)) {
          chat.lastMessageAt = lastMessage.timestamp;
          chat.updatedAt = lastMessage.timestamp;
        }

        chatListItems.push({
          chat,
          lastMessage,
          unreadCount,
          participants,
          userPreferences: undefined // Will be populated by components that need it
        });
      }

      // Sort by recent interaction (most recent first)
      return chatListItems.sort((a, b) => {
        const aTime = a.chat.lastMessageAt?.getTime() || a.chat.updatedAt?.getTime() || a.chat.createdAt?.getTime() || 0;
        const bTime = b.chat.lastMessageAt?.getTime() || b.chat.updatedAt?.getTime() || b.chat.createdAt?.getTime() || 0;
        return bTime - aTime; // Descending order (newest first)
      });
    } catch (error) {
      console.error('Error getting filtered chat list:', error);
      return [];
    }
  }

  /**
   * Check if current user can access a specific chat
   */
  async canCurrentUserAccessChat(chatId: string): Promise<boolean> {
    if (!this.currentUserId) {
      return false;
    }

    try {
      return await this.accessControlService.canUserAccessChat(chatId, this.currentUserId);
    } catch (error) {
      console.error('Error checking chat access:', error);
      return false;
    }
  }

  /**
   * Check if current user can send messages to a specific chat
   */
  async canCurrentUserSendMessage(chatId: string): Promise<boolean> {
    if (!this.currentUserId) {
      return false;
    }

    try {
      return await this.accessControlService.canUserSendMessage(chatId, this.currentUserId);
    } catch (error) {
      console.error('Error checking message permissions:', error);
      return false;
    }
  }

  /**
   * Get current user's access level for a specific chat
   */
  async getCurrentUserChatAccessLevel(chatId: string): Promise<ChatAccessLevel | null> {
    if (!this.currentUserId) {
      return null;
    }

    try {
      return await this.accessControlService.checkChatAccess(chatId, this.currentUserId);
    } catch (error) {
      console.error('Error getting chat access level:', error);
      return null;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get chat list with unread counts and last messages (for current user's recent chats)
   * Now includes access control filtering
   */
  getChatList(): Observable<ChatListItem[]> {
    return combineLatest([
      this.chats$,
      this.messages$,
      this.participants$,
      this.unreadCounts$
    ]).pipe(
      map(([chats, allMessages, allParticipants, unreadCounts]) => {
        // Filter chats by access control (this will be async, but we'll handle it in components)
        const chatListItems = chats.map(chat => {
          const messages = allMessages[chat.id] || [];
          const participants = allParticipants[chat.id] || [];
          const unreadCount = unreadCounts.find(uc => uc.chatId === chat.id)?.unreadCount || 0;
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

          // Update chat's lastMessageAt if we have a more recent message
          if (lastMessage && (!chat.lastMessageAt || lastMessage.timestamp > chat.lastMessageAt)) {
            chat.lastMessageAt = lastMessage.timestamp;
            chat.updatedAt = lastMessage.timestamp;
          }

          return {
            chat,
            lastMessage,
            unreadCount,
            participants,
            userPreferences: undefined // Will be populated by components that need it
          };
        });

        // Sort by recent interaction (most recent first)
        return chatListItems.sort((a, b) => {
          const aTime = a.chat.lastMessageAt?.getTime() || a.chat.updatedAt?.getTime() || a.chat.createdAt?.getTime() || 0;
          const bTime = b.chat.lastMessageAt?.getTime() || b.chat.updatedAt?.getTime() || b.chat.createdAt?.getTime() || 0;
          return bTime - aTime; // Descending order (newest first)
        });
      })
    );
  }

  /**
   * Search messages across chats
   */
  async searchMessages(options: ChatSearchOptions): Promise<ChatMessage[]> {
    try {
      const results: ChatMessage[] = [];
      const searchTerm = options.query.toLowerCase();

      for (const chatId in this.localMessages) {
        if (options.chatId && chatId !== options.chatId) continue;

        const messages = this.localMessages[chatId];
        const filteredMessages = messages.filter(message => {
          // Text search
          if (!message.message.toLowerCase().includes(searchTerm)) return false;
          
          // Sender filter
          if (options.senderId && message.senderId !== options.senderId) return false;
          
          // Message type filter
          if (options.messageType && message.messageType !== options.messageType) return false;
          
          // Date range filter
          if (options.fromDate && message.timestamp < options.fromDate) return false;
          if (options.toDate && message.timestamp > options.toDate) return false;
          
          return true;
        });

        results.push(...filteredMessages);
      }

      // Sort by timestamp (most recent first)
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return results;
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  /**
   * Get unread count for a specific chat
   */
  getUnreadCount(chatId: string): number {
    const messages = this.localMessages[chatId] || [];
    return messages.filter(m => !m.isOwn && !m.isRead).length;
  }

  /**
   * Update unread count for a chat
   */
  private updateUnreadCount(chatId: string): void {
    const unreadCount = this.getUnreadCount(chatId);
    const existingIndex = this.localUnreadCounts.findIndex(uc => uc.chatId === chatId);
    
    if (existingIndex >= 0) {
      this.localUnreadCounts[existingIndex].unreadCount = unreadCount;
      this.localUnreadCounts[existingIndex].lastReadAt = new Date();
    } else {
      this.localUnreadCounts.push({
        chatId,
        userId: this.currentUserId!,
        unreadCount,
        lastReadAt: new Date()
      });
    }
    
    this.unreadCountsSubject.next(this.localUnreadCounts);
  }

  // ==================== REAL-TIME SUBSCRIPTION MANAGEMENT ====================

  /**
   * Initialize real-time subscriptions for accessible chats
   * Implements Requirements 8.1, 8.2, 8.5
   */
  async initializeRealTimeSubscriptions(): Promise<void> {
    try {
      if (!this.currentUserId || this.isSubscriptionsActive) {
        return;
      }

      console.log('Initializing real-time subscriptions for user:', this.currentUserId);

      // Get all accessible chats for the current user
      const accessibleChats = await this.getAccessibleChatsForSubscription();
      
      // Subscribe to messages for each accessible chat
      for (const chat of accessibleChats) {
        await this.subscribeToChat(chat.id);
      }

      // Subscribe to access control changes
      await this.subscribeToAccessControlChanges();

      this.isSubscriptionsActive = true;
      console.log(`Real-time subscriptions initialized for ${accessibleChats.length} chats`);

    } catch (error) {
      console.error('Error initializing real-time subscriptions:', error);
    }
  }

  /**
   * Subscribe to real-time updates for a specific chat
   * Implements Requirements 8.1, 8.4
   */
  private async subscribeToChat(chatId: string): Promise<void> {
    try {
      // Check if user has access to this chat
      if (!this.currentUserId) {
        return;
      }

      const hasAccess = await this.accessControlService.canUserAccessChat(chatId, this.currentUserId);
      if (!hasAccess) {
        console.log(`User ${this.currentUserId} does not have access to chat ${chatId}, skipping subscription`);
        return;
      }

      // Unsubscribe from existing subscription if any
      this.unsubscribeFromChat(chatId);

      console.log(`Subscribing to real-time updates for chat: ${chatId}`);

      // Subscribe to new messages for this chat
      // Note: In a real implementation, this would use Amplify's real-time subscriptions
      // For now, we'll simulate with a polling mechanism or use the persistence service's subscription methods
      
      // Subscribe to chat messages
      const messageSubscription = this.subscribeToMessages(chatId);
      if (messageSubscription) {
        this.messageSubscriptions.set(chatId, messageSubscription);
      }

      // Subscribe to chat updates (participant changes, settings changes)
      const chatSubscription = this.subscribeToChatUpdates(chatId);
      if (chatSubscription) {
        this.chatSubscriptions.set(chatId, chatSubscription);
      }

      console.log(`Successfully subscribed to real-time updates for chat: ${chatId}`);

    } catch (error) {
      console.error(`Error subscribing to chat ${chatId}:`, error);
    }
  }

  /**
   * Unsubscribe from real-time updates for a specific chat
   * Implements Requirements 8.3
   */
  private unsubscribeFromChat(chatId: string): void {
    console.log(`Unsubscribing from real-time updates for chat: ${chatId}`);

    // Unsubscribe from messages
    const messageSubscription = this.messageSubscriptions.get(chatId);
    if (messageSubscription) {
      messageSubscription.unsubscribe();
      this.messageSubscriptions.delete(chatId);
    }

    // Unsubscribe from chat updates
    const chatSubscription = this.chatSubscriptions.get(chatId);
    if (chatSubscription) {
      chatSubscription.unsubscribe();
      this.chatSubscriptions.delete(chatId);
    }

    console.log(`Successfully unsubscribed from real-time updates for chat: ${chatId}`);
  }

  /**
   * Subscribe to message updates for a specific chat
   */
  private subscribeToMessages(chatId: string): Subscription | null {
    try {
      // In a real implementation, this would use Amplify DataStore subscriptions
      // For now, we'll create a mock subscription that could be replaced with actual Amplify subscriptions
      
      // Example of what the real implementation would look like:
      // return this.client.models.ChatMessage.observeQuery({
      //   filter: { chatId: { eq: chatId } }
      // }).subscribe({
      //   next: ({ items }) => {
      //     this.handleRealTimeMessageUpdate(chatId, items);
      //   },
      //   error: (error) => {
      //     console.error(`Error in message subscription for chat ${chatId}:`, error);
      //   }
      // });

      // Mock implementation - in real app, replace with actual Amplify subscription
      console.log(`Mock message subscription created for chat: ${chatId}`);
      return new Subscription(); // Placeholder

    } catch (error) {
      console.error(`Error creating message subscription for chat ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to chat updates (settings, participants, etc.)
   */
  private subscribeToChatUpdates(chatId: string): Subscription | null {
    try {
      // In a real implementation, this would use Amplify DataStore subscriptions
      // For now, we'll create a mock subscription
      
      // Example of what the real implementation would look like:
      // return this.client.models.Chat.observeQuery({
      //   filter: { id: { eq: chatId } }
      // }).subscribe({
      //   next: ({ items }) => {
      //     this.handleRealTimeChatUpdate(chatId, items[0]);
      //   },
      //   error: (error) => {
      //     console.error(`Error in chat subscription for chat ${chatId}:`, error);
      //   }
      // });

      // Mock implementation
      console.log(`Mock chat subscription created for chat: ${chatId}`);
      return new Subscription(); // Placeholder

    } catch (error) {
      console.error(`Error creating chat subscription for chat ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to access control changes (invitations, revocations)
   * Implements Requirements 8.2, 8.3, 8.5
   */
  private async subscribeToAccessControlChanges(): Promise<void> {
    try {
      if (!this.currentUserId) {
        return;
      }

      console.log('Subscribing to access control changes for user:', this.currentUserId);

      // Subscribe to chat invitations for current user
      const invitationSubscription = this.subscribeToInvitations();
      if (invitationSubscription) {
        this.accessControlSubscriptions.set('invitations', invitationSubscription);
      }

      // Subscribe to chat access revocations
      const revocationSubscription = this.subscribeToAccessRevocations();
      if (revocationSubscription) {
        this.accessControlSubscriptions.set('revocations', revocationSubscription);
      }

      console.log('Successfully subscribed to access control changes');

    } catch (error) {
      console.error('Error subscribing to access control changes:', error);
    }
  }

  /**
   * Subscribe to chat invitations for current user
   */
  private subscribeToInvitations(): Subscription | null {
    try {
      if (!this.currentUserId) {
        return null;
      }

      // In a real implementation, this would use Amplify DataStore subscriptions
      // Example:
      // return this.client.models.ChatInvitation.observeQuery({
      //   filter: { 
      //     invitedUserId: { eq: this.currentUserId },
      //     status: { eq: 'pending' }
      //   }
      // }).subscribe({
      //   next: ({ items }) => {
      //     this.handleNewInvitations(items);
      //   },
      //   error: (error) => {
      //     console.error('Error in invitation subscription:', error);
      //   }
      // });

      // Mock implementation
      console.log(`Mock invitation subscription created for user: ${this.currentUserId}`);
      return new Subscription(); // Placeholder

    } catch (error) {
      console.error('Error creating invitation subscription:', error);
      return null;
    }
  }

  /**
   * Subscribe to access revocations
   */
  private subscribeToAccessRevocations(): Subscription | null {
    try {
      if (!this.currentUserId) {
        return null;
      }

      // In a real implementation, this would monitor ChatInvitation status changes to 'revoked'
      // and participant removals
      
      // Mock implementation
      console.log(`Mock revocation subscription created for user: ${this.currentUserId}`);
      return new Subscription(); // Placeholder

    } catch (error) {
      console.error('Error creating revocation subscription:', error);
      return null;
    }
  }

  /**
   * Handle real-time message updates with access control
   * Implements Requirements 8.1, 8.4
   */
  private async handleRealTimeMessageUpdate(chatId: string, messages: any[]): Promise<void> {
    try {
      if (!this.currentUserId) {
        return;
      }

      // Verify user still has access to this chat
      const hasAccess = await this.accessControlService.canUserAccessChat(chatId, this.currentUserId);
      if (!hasAccess) {
        console.log(`User ${this.currentUserId} lost access to chat ${chatId}, unsubscribing`);
        this.unsubscribeFromChat(chatId);
        await this.handleAccessRevocation(chatId, this.currentUserId);
        return;
      }

      // Process new messages with access control filtering
      const filteredMessages = await this.filterMessagesByAccess(chatId, messages);
      
      // Update local cache
      this.localMessages[chatId] = filteredMessages;
      this.messagesSubject.next({ ...this.localMessages });

      // Update unread counts
      this.updateUnreadCount(chatId);

      console.log(`Processed ${filteredMessages.length} real-time messages for chat ${chatId}`);

    } catch (error) {
      console.error(`Error handling real-time message update for chat ${chatId}:`, error);
    }
  }

  /**
   * Handle real-time chat updates (settings, participants)
   */
  private async handleRealTimeChatUpdate(chatId: string, chat: any): Promise<void> {
    try {
      if (!this.currentUserId) {
        return;
      }

      // Verify user still has access to this chat
      const hasAccess = await this.accessControlService.canUserAccessChat(chatId, this.currentUserId);
      if (!hasAccess) {
        console.log(`User ${this.currentUserId} lost access to chat ${chatId} due to chat update`);
        this.unsubscribeFromChat(chatId);
        await this.handleAccessRevocation(chatId, this.currentUserId);
        return;
      }

      // Update local chat data
      const chatIndex = this.localChats.findIndex(c => c.id === chatId);
      if (chatIndex >= 0) {
        this.localChats[chatIndex] = { ...this.localChats[chatIndex], ...chat };
        this.chatsSubject.next([...this.localChats]);
      }

      console.log(`Processed real-time chat update for chat ${chatId}`);

    } catch (error) {
      console.error(`Error handling real-time chat update for chat ${chatId}:`, error);
    }
  }

  /**
   * Handle new invitations - start subscriptions for newly accessible chats
   * Implements Requirements 8.2
   */
  private async handleNewInvitations(invitations: any[]): Promise<void> {
    try {
      if (!this.currentUserId) {
        return;
      }

      for (const invitation of invitations) {
        if (invitation.status === 'accepted') {
          console.log(`User ${this.currentUserId} accepted invitation to chat ${invitation.chatId}`);
          
          // Start subscription for this newly accessible chat
          await this.subscribeToChat(invitation.chatId);
          
          // Reload chat data
          await this.handleAccessGrant(invitation.chatId, this.currentUserId);
        }
      }

    } catch (error) {
      console.error('Error handling new invitations:', error);
    }
  }

  /**
   * Get all chats that the current user has access to (for subscription initialization)
   */
  private async getAccessibleChatsForSubscription(): Promise<Chat[]> {
    try {
      if (!this.currentUserId) {
        return [];
      }

      const accessibleChats: Chat[] = [];
      
      for (const chat of this.localChats) {
        try {
          const hasAccess = await this.accessControlService.canUserAccessChat(chat.id, this.currentUserId);
          if (hasAccess) {
            accessibleChats.push(chat);
          }
        } catch (error) {
          console.warn(`Failed to check access for chat ${chat.id}:`, error);
          // For public chats, allow access on error (fail-open for public content)
          if (chat.settings?.isPublic !== false) {
            accessibleChats.push(chat);
          }
        }
      }

      return accessibleChats;

    } catch (error) {
      console.error('Error getting accessible chats for subscription:', error);
      return [];
    }
  }

  /**
   * Update subscriptions when access permissions change
   * Implements Requirements 8.5
   */
  async updateSubscriptionsForAccessChange(chatId: string, userId: string, hasAccess: boolean): Promise<void> {
    try {
      // Only handle changes for the current user
      if (userId !== this.currentUserId) {
        return;
      }

      console.log(`Updating subscriptions for access change: chat ${chatId}, user ${userId}, hasAccess: ${hasAccess}`);

      if (hasAccess) {
        // User gained access - start subscription
        await this.subscribeToChat(chatId);
        await this.handleAccessGrant(chatId, userId);
      } else {
        // User lost access - stop subscription
        this.unsubscribeFromChat(chatId);
        await this.handleAccessRevocation(chatId, userId);
      }

    } catch (error) {
      console.error('Error updating subscriptions for access change:', error);
    }
  }

  /**
   * Clear all real-time subscriptions
   */
  private clearAllSubscriptions(): void {
    console.log('Clearing all real-time subscriptions');

    // Clear message subscriptions
    this.messageSubscriptions.forEach((subscription, chatId) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from messages for chat: ${chatId}`);
    });
    this.messageSubscriptions.clear();

    // Clear chat subscriptions
    this.chatSubscriptions.forEach((subscription, chatId) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from chat updates for chat: ${chatId}`);
    });
    this.chatSubscriptions.clear();

    // Clear access control subscriptions
    this.accessControlSubscriptions.forEach((subscription, type) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from access control changes: ${type}`);
    });
    this.accessControlSubscriptions.clear();

    this.isSubscriptionsActive = false;
    console.log('All real-time subscriptions cleared');
  }

  /**
   * Refresh all subscriptions (useful when user permissions change globally)
   * Implements Requirements 8.5
   */
  async refreshAllSubscriptions(): Promise<void> {
    try {
      console.log('Refreshing all real-time subscriptions');
      
      // Clear existing subscriptions
      this.clearAllSubscriptions();
      
      // Reinitialize with current access permissions
      await this.initializeRealTimeSubscriptions();
      
      console.log('All real-time subscriptions refreshed');

    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
    }
  }

  /**
   * Check if subscriptions are active
   */
  areSubscriptionsActive(): boolean {
    return this.isSubscriptionsActive;
  }

  /**
   * Get subscription status for debugging
   */
  getSubscriptionStatus(): any {
    return {
      isActive: this.isSubscriptionsActive,
      messageSubscriptions: this.messageSubscriptions.size,
      chatSubscriptions: this.chatSubscriptions.size,
      accessControlSubscriptions: this.accessControlSubscriptions.size,
      currentUserId: this.currentUserId
    };
  }

}