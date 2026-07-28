import { Component, input, output, effect, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonLabel,
  IonAvatar,
  IonButton,
  IonIcon,
  IonTextarea,
  IonChip,
  IonBadge,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPopover,
  IonList,
  IonItem,
  IonAlert,
  IonSearchbar,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonText,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send, person, time, checkmarkDone, checkmark, ellipsisVertical, notifications, notificationsOff, exit, informationCircle, people, add, trash, close, pin, pinOutline, radioButtonOn, heart, heartOutline, mail, lockClosed, refresh, eye, personAdd, personRemove, atOutline, addCircle } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChatService } from '../../services/chat.service';
import { AccessControlService } from '../../services/access-control.service';
import { ChatAccessController } from '../../services/chat-access-controller.service';
import { ChatInvitationService } from '../../services/chat-invitation.service';
import { ChatMessage, ChatAccessLevel, ChatInvitation, ChatAccessError, ChatAccessException } from '../../models/chat.models';
import { ChatInvitationManagerComponent } from '../chat-invitation-manager/chat-invitation-manager.component';

@Component({
  selector: 'app-chat-messages',
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonLabel,
    IonAvatar,
    IonButton,
    IonIcon,
    IonTextarea,
    IonChip,
    IonBadge,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonPopover,
    IonList,
    IonItem,
    IonAlert,
    IonSearchbar,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonText,
    ChatInvitationManagerComponent
  ]
})
export class ChatMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { read: ElementRef }) messagesContainer?: ElementRef;
  
  studioId = input<string>('');
  studioName = input<string>('');
  maxHeight = input<string>('400px');
  showHeader = input<boolean>(true);
  compact = input<boolean>(false);
  canLeave = input<boolean>(true); // Whether user can leave the chat
  canMute = input<boolean>(true); // Whether user can mute the chat

  messageClick = output<ChatMessage>();
  sendMessage = output<string>();
  leaveChat = output<string>();
  muteChat = output<{ chatId: string; isMuted: boolean }>();
  chatInfo = output<string>();
  chatSwitch = output<{ chatId: string; chatName: string }>();

  displayedMessages: ChatMessage[] = [];
  newMessage: string = '';
  unreadCount: number = 0;
  chatId: string = '';
  currentChatName: string = '';
  
  // Access control properties
  currentChatAccess: ChatAccessLevel | null = null;
  pendingInvitations: ChatInvitation[] = [];
  showInvitationUI: boolean = false;
  accessError: string | null = null;
  
  // Enhanced UI state for access control
  showChatTypeIndicators: boolean = true;
  showMemberLists: boolean = true;
  invitationNotifications: ChatInvitation[] = [];
  
  // Search functionality
  searchTerm: string = '';
  filteredMessages: ChatMessage[] = [];
  
  // Recent chats functionality
  recentChats: any[] = [];
  studioChats: any[] = [];
  favoriteChats: any[] = [];
  showingStudioChats: boolean = false;
  showingFavorites: boolean = false;
  private isManuallyUpdating = false;
  
  // Chat management
  showCreateChatModal: boolean = false;
  showDeleteChatAlert: boolean = false;
  showChatInfoModal: boolean = false;
  showInvitationManagerModal: boolean = false;
  chatInfoData: any = null;
  newChatName: string = '';
  newChatDescription: string = '';
  newChatType: 'group' | 'private' = 'group';
  newChatAccessLevel: 'public' | 'private' = 'public'; // New: Access control selection
  newChatInitialMembers: any[] = []; // Changed to array of user objects
  newChatMemberInput: string = ''; // New: Input field for adding members
  newChatMemberSearchTerm: string = ''; // New: Search term for user search
  newChatMemberSearchResults: any[] = []; // New: Search results
  chatToDelete: string = '';
  isOwnerOfChatToDelete: boolean = false;
  
  // Infinite scroll properties
  private pageSize = 20;
  private hasMoreMessages = true;

  // Chat management properties
  isMuted: boolean = false;
  isMenuOpen: boolean = false;
  showLeaveAlert: boolean = false;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  // Cache for async operations to prevent memory leaks
  private chatPreferencesCache = new Map<string, { isFavorite: boolean; isPinned: boolean; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds cache
  
  // Debounce timers
  private updateTimers = new Map<string, any>();
  
  // Alert buttons
  alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.cancelLeaveChat();
      }
    },
    {
      text: 'Leave',
      role: 'destructive',
      handler: () => {
        this.confirmLeaveChat();
      }
    }
  ];

  constructor(
    private chatService: ChatService, 
    private cdr: ChangeDetectorRef,
    private accessControlService: AccessControlService,
    private chatAccessController: ChatAccessController,
    private toastController: ToastController,
    private invitationService: ChatInvitationService
  ) {
    addIcons({pin,mail,people,add,heart,trash,notificationsOff,checkmarkDone,ellipsisVertical,checkmark,close,notifications,eye,lockClosed,refresh,send,informationCircle,exit,atOutline,addCircle,personAdd,personRemove,heartOutline,radioButtonOn,person,time,pinOutline});
    
    // React to studioId changes (replaces ngOnChanges)
    let isFirstRun = true;
    effect(() => {
      const currentStudioId = this.studioId();
      if (!isFirstRun && currentStudioId) {
        console.log('Studio ID changed:', currentStudioId);
        this.initializeChat().catch(error => {
          console.error('Chat initialization failed after studioId change:', error);
          this.chatId = '';
          this.currentChatName = 'Chat Unavailable';
          this.displayedMessages = [];
        });
      }
      isFirstRun = false;
    });
  }

  ngOnInit() {
    // Initialize chat if studioId is already set
    if (this.studioId() && this.studioId().trim() !== '') {
      console.log('Studio ID already set on init:', this.studioId());
      this.initializeChat().catch(error => {
        console.error('Chat initialization failed:', error);
        // Show error state instead of fallback
        this.chatId = '';
        this.currentChatName = 'Chat Unavailable';
        this.displayedMessages = [];
      });
    } else {
      console.warn('No studio ID set on init');
      this.currentChatName = 'Chat Not Available';
    }
    
    // Load recent chats
    this.loadRecentChats();
  }

  ngOnDestroy() {
    console.log('ChatMessagesComponent destroying, cleaning up resources...');
    
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
    
    // Clear all timers
    this.updateTimers.forEach(timer => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.updateTimers.clear();
    
    // Clear caches
    this.chatPreferencesCache.clear();
    
    // Clear data references
    this.displayedMessages = [];
    this.recentChats = [];
    this.studioChats = [];
    this.favoriteChats = [];
    
    // Clear access control state
    this.currentChatAccess = null;
    this.pendingInvitations = [];
    this.showInvitationUI = false;
    this.accessError = null;
    this.invitationNotifications = [];
    
    console.log('ChatMessagesComponent cleanup complete');
  }

  private async initializeChat() {
    console.log('Initializing chat for studio:', this.studioId(), this.studioName());
    
    // Clear previous subscriptions if reinitializing
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    
    if (this.studioId() && this.studioId().trim() !== '') {
      try {
        // Check if chat service is ready (user authenticated)
        if (!this.chatService.isServiceReady()) {
          console.log('Chat service not ready, retrying initialization...');
          await this.chatService.retryInitialization();
          
          // Wait a bit more for authentication to complete
          if (!this.chatService.isServiceReady()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.chatService.retryInitialization();
          }
        }
        
        // Load recent chats first
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for chat list to load
        
        // Try to get the first recent chat
        let firstRecentChat: any = null;
        try {
          const chatList = await this.chatService.getChatList().pipe(take(1)).toPromise();
          if (chatList && chatList.length > 0) {
            // Filter for studio chats or accessible chats
            const accessibleChats: any[] = [];
            for (const chatItem of chatList.slice(0, 5)) { // Check first 5 chats
              const canAccess = await this.chatAccessController.canUserAccessChat(chatItem.chat.id);
              if (canAccess) {
                accessibleChats.push(chatItem);
              }
            }
            
            if (accessibleChats.length > 0) {
              firstRecentChat = accessibleChats[0].chat;
              console.log('Found first accessible recent chat:', firstRecentChat.name);
            }
          }
        } catch (error) {
          console.log('Could not load recent chats, will try studio chats:', error);
        }
        
        // If we found a recent chat, use it
        if (firstRecentChat) {
          this.chatId = firstRecentChat.id;
          this.currentChatName = firstRecentChat.name;
          console.log('Using first recent chat:', this.chatId, 'Name:', this.currentChatName);
        } else {
          // Fallback to studio chat logic
          // Get accessible studio chats using access controller
          const organizedChats = await this.chatAccessController.getStudioChatsForUser(this.studioId());
          const accessibleChats = [...organizedChats.publicChats, ...organizedChats.privateChats];
          console.log('Found accessible studio chats:', accessibleChats.length);
          
          if (accessibleChats.length > 0) {
            // Use the first accessible chat
            const firstChat = accessibleChats[0].chat;
            this.chatId = firstChat.id;
            this.currentChatName = firstChat.name;
            console.log('Using accessible chat:', this.chatId, 'Name:', this.currentChatName);
          } else {
            // Check if there are pending invitations
            if (organizedChats.invitationsPending.length > 0) {
              this.pendingInvitations = organizedChats.invitationsPending;
              this.showInvitationUI = true;
              this.currentChatName = 'Pending Invitations';
              console.log('Found pending invitations:', this.pendingInvitations.length);
              return; // Don't proceed with chat initialization
            }
            
            // Try to find existing chats for this studio (fallback)
            let studioChats = await this.chatService.getChatsByStudioId(this.studioId());
            console.log('Found existing studio chats (fallback):', studioChats.length);
            
            if (studioChats.length > 0) {
              // Check access to the first chat
              const canAccess = await this.chatAccessController.canUserAccessChat(studioChats[0].id);
              if (canAccess) {
                this.chatId = studioChats[0].id;
                this.currentChatName = studioChats[0].name;
                console.log('Using existing chat with access:', this.chatId, 'Name:', this.currentChatName);
              } else {
                this.accessError = 'Access denied to studio chats';
                this.currentChatName = 'Access Denied';
                return;
              }
            } else {
              // No chats exist for this studio
              console.log('No chats exist for this studio');
              this.currentChatName = 'No Chats Available';
              this.accessError = 'No chats are available for this studio. An administrator needs to create a chat first.';
              return;
            }
          }
        }

        // Subscribe to message updates
        this.subscribeToMessages();
        
        // Check access control for this chat
        await this.checkChatAccess();
        
        // Load messages for this chat (only if we have access)
        if (this.currentChatAccess?.canRead) {
          await this.loadMessages();
        }
        
        console.log('Chat initialization complete. Final Chat ID:', this.chatId);
        
      } catch (error: any) {
        console.error('Failed to initialize chat:', error);
        
        // Set appropriate error state based on error type
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('log in') || errorMessage?.includes('Authentication Required')) {
          this.currentChatName = 'Authentication Required';
        } else if (errorMessage?.includes('Connection Error') || errorMessage?.includes('Network')) {
          this.currentChatName = 'Connection Error';
        } else if (errorMessage?.includes('Service Unavailable') || errorMessage?.includes('API')) {
          this.currentChatName = 'Service Unavailable';
        } else {
          this.currentChatName = 'Chat Unavailable';
        }
        
        throw error;
      }
    } else {
      throw new Error('No valid studio ID provided for chat initialization');
    }
  }

  private async checkChatAccess() {
    if (!this.chatId) return;
    
    try {
      const currentUserId = this.chatService.getCurrentUserId();
      if (!currentUserId) {
        this.accessError = 'Authentication required';
        return;
      }

      // Check access level for current chat
      this.currentChatAccess = await this.accessControlService.checkChatAccess(this.chatId, currentUserId);
      
      // Load pending invitations for this user (Requirement 3.3: notify of invitations)
      this.pendingInvitations = await this.accessControlService.getUserChatInvitations(currentUserId);
      
      // Filter invitations for current chat
      const chatInvitation = this.pendingInvitations.find(inv => inv.chatId === this.chatId && inv.status === 'pending');
      
      // Set invitation notifications for UI display (Requirement 3.3)
      this.invitationNotifications = this.pendingInvitations.filter(inv => inv.status === 'pending');
      
      // If no access, check for pending invitations
      if (!this.currentChatAccess.canView) {
        if (chatInvitation) {
          this.showInvitationUI = true;
          this.accessError = null;
        } else {
          this.accessError = 'Access denied to this chat';
        }
      } else {
        this.showInvitationUI = false;
        this.accessError = null;
      }
      
      console.log('Chat access check complete:', {
        chatId: this.chatId,
        access: this.currentChatAccess,
        hasInvitation: this.showInvitationUI,
        invitationCount: this.invitationNotifications.length,
        error: this.accessError
      });
      
    } catch (error) {
      console.error('Failed to check chat access:', error);
      
      if (error instanceof ChatAccessException) {
        switch (error.errorCode) {
          case ChatAccessError.INVITATION_REQUIRED:
            this.accessError = 'This chat requires an invitation';
            break;
          case ChatAccessError.MEMBERSHIP_REQUIRED:
            this.accessError = 'Studio membership required';
            break;
          case ChatAccessError.CHAT_NOT_FOUND:
            this.accessError = 'Chat not found';
            break;
          default:
            this.accessError = 'Access denied';
        }
      } else {
        this.accessError = 'Failed to verify access permissions';
      }
      
      this.currentChatAccess = null;
      this.showInvitationUI = false;
    }
  }

  private async loadMessages() {
    console.log('Component loading messages for chat:', this.chatId);
    
    // Check if user has read access before loading messages
    if (!this.currentChatAccess?.canRead) {
      console.log('User does not have read access to chat:', this.chatId);
      this.displayedMessages = [];
      return;
    }
    
    try {
      const messages = await this.chatService.loadMessages(this.chatId, {
        pageSize: this.pageSize
      });
      console.log('Component received', messages.length, 'messages from service');
      this.displayedMessages = messages;
      this.updateUnreadCount();
      
      // Scroll to bottom after initial load
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  private subscribeToMessages() {
    console.log('Setting up message subscription for chat:', this.chatId);
    
    // Clean up existing subscription if any
    const existingMessageSub = this.subscriptions.find(sub => sub && !sub.closed);
    if (existingMessageSub) {
      existingMessageSub.unsubscribe();
      this.subscriptions = this.subscriptions.filter(sub => sub !== existingMessageSub);
    }
    
    const messagesSub = this.chatService.messages$.subscribe(allMessages => {
      const chatMessages = allMessages[this.chatId] || [];
      
      // Reduce console logging to prevent memory buildup
      if (chatMessages.length !== this.displayedMessages.length) {
        console.log('Messages updated for chat:', this.chatId, 'Count:', chatMessages.length);
      }
      
      this.displayedMessages = chatMessages;
      this.updateUnreadCount();
      
      // Debounced scroll to bottom
      this.debounceScrollToBottom();
    });
    
    this.subscriptions.push(messagesSub);
    console.log('Message subscription active for chat:', this.chatId);
  }

  private debounceScrollToBottom() {
    const timerId = 'scrollToBottom';
    if (this.updateTimers.has(timerId)) {
      clearTimeout(this.updateTimers.get(timerId));
    }
    
    const timer = setTimeout(() => {
      this.scrollToBottom();
      this.updateTimers.delete(timerId);
    }, 100);
    
    this.updateTimers.set(timerId, timer);
  }

  private updateUnreadCount() {
    this.unreadCount = this.displayedMessages.filter(msg => !msg.isRead && !msg.isOwn).length;
  }

  // Infinite scroll handler
  onLoadMore(event: any) {
    setTimeout(async () => {
      if (this.hasMoreMessages && this.displayedMessages.length > 0) {
        try {
          const oldestMessage = this.displayedMessages[0];
          const olderMessages = await this.chatService.loadMessages(this.chatId, {
            pageSize: this.pageSize,
            beforeMessageId: oldestMessage.id
          });
          
          if (olderMessages.length > 0) {
            // Store current scroll position
            const messagesContainer = document.querySelector('.messages-container');
            const scrollHeight = messagesContainer?.scrollHeight || 0;
            
            // Prepend older messages
            this.displayedMessages = [...olderMessages, ...this.displayedMessages];
            
            // Restore scroll position to prevent jumping
            setTimeout(() => {
              if (messagesContainer) {
                const newScrollHeight = messagesContainer.scrollHeight;
                messagesContainer.scrollTop = newScrollHeight - scrollHeight;
              }
            }, 50);
          } else {
            this.hasMoreMessages = false;
          }
        } catch (error) {
          console.error('Failed to load more messages:', error);
          this.hasMoreMessages = false;
        }
      }
      
      event.target.complete();
      
      // Disable infinite scroll when all messages are loaded
      if (!this.hasMoreMessages) {
        event.target.disabled = true;
      }
    }, 500);
  }

  async onSendMessage() {
    if (!this.newMessage.trim()) {
      console.log('Cannot send message - message is empty');
      return;
    }
    
    // Check if user has write access
    if (!this.currentChatAccess?.canWrite) {
      console.log('User does not have write access to chat:', this.chatId);
      this.accessError = 'You do not have permission to send messages in this chat';
      return;
    }
    
    // If no chat ID, try to initialize chat first
    if (!this.chatId) {
      console.log('No chat ID, attempting to initialize chat...');
      try {
        await this.initializeChat();
        if (!this.chatId) {
          console.error('Failed to initialize chat - cannot send message');
          return;
        }
      } catch (error) {
        console.error('Failed to initialize chat for sending message:', error);
        return;
      }
    }
    
    try {
      console.log('Sending message to chat:', this.chatId);
      const sentMessage = await this.chatService.sendMessage({
        chatId: this.chatId,
        message: this.newMessage.trim(),
        messageType: 'text'
      });
      
      console.log('Message sent successfully:', sentMessage);
      
      this.sendMessage.emit(this.newMessage.trim());
      this.newMessage = '';
      
      // Scroll to bottom after sending - the subscription will update displayedMessages
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // If it's an authentication error, show appropriate message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('not authenticated') || errorMessage?.includes('log in')) {
        this.currentChatName = 'Authentication Required';
        this.chatId = '';
      } else {
        this.currentChatName = 'Chat Unavailable';
        this.chatId = '';
      }
    }
  }

  // Helper methods for message input state
  get isMessageInputDisabled(): boolean {
    // Disable input if we're in an error state that can't be recovered by sending
    return this.currentChatName === 'Authentication Required' || 
           this.currentChatName === 'Connection Error' ||
           this.currentChatName === 'Service Unavailable' ||
           !this.currentChatAccess?.canWrite ||
           !!this.accessError;
  }

  get canSendMessage(): boolean {
    // Can send if we have a message and either have a chat ID or can potentially create one
    return this.newMessage.trim().length > 0 && 
           !this.isMessageInputDisabled &&
           this.currentChatAccess?.canWrite === true;
  }

  // Access control methods
  async acceptChatInvitation(invitationId: string) {
    try {
      console.log('Accepting chat invitation:', invitationId);
      
      // Accept the invitation using the invitation service
      await this.invitationService.acceptInvitation(invitationId);
      
      // Remove the accepted invitation from pending lists
      this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== invitationId);
      this.invitationNotifications = this.invitationNotifications.filter(inv => inv.id !== invitationId);
      
      // Refresh access after accepting invitation
      await this.checkChatAccess();
      
      // If we now have access, reload messages and hide invitation UI
      if (this.currentChatAccess?.canRead) {
        this.showInvitationUI = false;
        await this.loadMessages();
        
        // Subscribe to messages if not already subscribed
        if (!this.subscriptions.some(sub => sub && !sub.closed)) {
          this.subscribeToMessages();
        }
      }
      
      await this.showToast('Chat invitation accepted successfully', 'success');
      console.log('Chat invitation accepted successfully - full access granted');
    } catch (error) {
      console.error('Failed to accept chat invitation:', error);
      this.accessError = 'Failed to accept invitation';
      await this.showToast('Failed to accept invitation', 'danger');
    }
  }

  async declineChatInvitation(invitationId: string) {
    try {
      console.log('Declining chat invitation:', invitationId);
      
      // Decline the invitation using the invitation service
      await this.invitationService.declineInvitation(invitationId);
      
      // Remove from pending invitations
      this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== invitationId);
      this.invitationNotifications = this.invitationNotifications.filter(inv => inv.id !== invitationId);
      this.showInvitationUI = this.pendingInvitations.some(inv => inv.chatId === this.chatId);
      
      await this.showToast('Chat invitation declined', 'success');
      console.log('Chat invitation declined successfully');
    } catch (error) {
      console.error('Failed to decline chat invitation:', error);
      await this.showToast('Failed to decline invitation', 'danger');
    }
  }

  get currentChatInvitation(): ChatInvitation | undefined {
    return this.pendingInvitations.find(inv => inv.chatId === this.chatId && inv.status === 'pending') || undefined;
  }

  get hasReadAccess(): boolean {
    return this.currentChatAccess?.canRead === true;
  }

  get hasWriteAccess(): boolean {
    return this.currentChatAccess?.canWrite === true;
  }

  get hasInviteAccess(): boolean {
    return this.currentChatAccess?.canInvite === true;
  }

  get hasManageAccess(): boolean {
    return this.currentChatAccess?.canManage === true;
  }

  get chatAccessReason(): string {
    if (!this.currentChatAccess) return 'No access';
    
    switch (this.currentChatAccess.accessReason) {
      case 'public': return 'Public chat';
      case 'invited': return 'Invited member';
      case 'studio_member': return 'Studio member';
      case 'admin': return 'Administrator';
      case 'creator': return 'Chat creator';
      default: return 'Unknown';
    }
  }

  // Enhanced methods for chat type distinction (Requirement 2.4)
  get isCurrentChatPublic(): boolean {
    const currentChat = this.chatService.getChatById(this.chatId);
    return currentChat?.accessLevel === 'public' || this.currentChatAccess?.accessReason === 'public';
  }

  get isCurrentChatPrivate(): boolean {
    const currentChat = this.chatService.getChatById(this.chatId);
    return currentChat?.accessLevel === 'private' || currentChat?.invitationRequired === true;
  }

  get currentChatTypeLabel(): string {
    if (this.isCurrentChatPublic) {
      return 'Public Chat';
    } else if (this.isCurrentChatPrivate) {
      return 'Private Chat';
    }
    return 'Chat';
  }

  get currentChatTypeIcon(): string {
    if (this.isCurrentChatPublic) {
      return 'people';
    } else if (this.isCurrentChatPrivate) {
      return 'lock-closed';
    }
    return 'chatbubbles';
  }

  get currentChatTypeColor(): string {
    if (this.isCurrentChatPublic) {
      return 'success';
    } else if (this.isCurrentChatPrivate) {
      return 'warning';
    }
    return 'medium';
  }

  // Methods for invitation status display (Requirement 2.5)
  get currentChatMemberCount(): number {
    const currentChat = this.chatService.getChatById(this.chatId);
    return currentChat?.participantIds?.length || 0;
  }

  get hasInvitationStatus(): boolean {
    return this.isCurrentChatPrivate && (this.showInvitationUI || this.currentChatAccess?.accessReason === 'invited');
  }

  get invitationStatusText(): string {
    if (this.showInvitationUI) {
      return 'Invitation pending';
    } else if (this.currentChatAccess?.accessReason === 'invited') {
      return 'Invited member';
    }
    return '';
  }

  // Method to get chat type for any chat (for chat lists)
  getChatTypeLabel(chat: any): string {
    if (chat.accessLevel === 'public' || chat.settings?.isPublic) {
      return 'Public';
    } else if (chat.accessLevel === 'private' || chat.invitationRequired) {
      return 'Private';
    }
    return 'Chat';
  }

  getChatTypeIconForChat(chat: any): string {
    if (chat.accessLevel === 'public' || chat.settings?.isPublic) {
      return 'people';
    } else if (chat.accessLevel === 'private' || chat.invitationRequired) {
      return 'lock-closed';
    }
    return this.getChatTypeIcon(chat.type);
  }

  getChatTypeColorForChat(chat: any): string {
    if (chat.accessLevel === 'public' || chat.settings?.isPublic) {
      return 'success';
    } else if (chat.accessLevel === 'private' || chat.invitationRequired) {
      return 'warning';
    }
    return this.getChatTypeColor(chat.type);
  }

  getMessageInputTooltip(): string {
    if (!this.newMessage.trim()) {
      return 'Type a message to send';
    }
    
    if (this.currentChatName === 'Authentication Required') {
      return 'Please log in to send messages';
    }
    
    if (this.currentChatName === 'Connection Error') {
      return 'Check your internet connection';
    }
    
    if (this.currentChatName === 'Service Unavailable') {
      return 'Chat service is temporarily unavailable';
    }
    
    if (this.accessError) {
      return this.accessError;
    }
    
    if (!this.hasWriteAccess) {
      return 'You do not have permission to send messages';
    }
    
    if (!this.chatId) {
      return 'Chat is loading...';
    }
    
    return 'Send message';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  async onMessageClick(message: ChatMessage) {
    if (!message.isRead && !message.isOwn) {
      try {
        await this.chatService.markMessagesAsRead(this.chatId, [message.id]);
        this.updateUnreadCount();
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
    this.messageClick.emit(message);
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  }

  private scrollToBottom() {
    // DISABLED: This was causing the entire page to scroll
    // The messages container will naturally show the latest messages
    // Users can manually scroll if needed
    return;
    
    /* Original code - DISABLED
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });
      }
    }, 50);
    */
  }

  async markAllAsRead() {
    if (this.chatId) {
      try {
        await this.chatService.markMessagesAsRead(this.chatId);
        this.updateUnreadCount();
      } catch (error) {
        console.error('Failed to mark all messages as read:', error);
      }
    }
  }

  get recentMessages(): ChatMessage[] {
    if (this.compact()) {
      return this.displayedMessages.slice(-3); // Show only last 3 messages in compact mode
    }
    return this.displayedMessages;
  }

  // Get total message count for debugging
  get totalMessageCount(): number {
    return this.displayedMessages.length;
  }

  get displayedMessageCount(): number {
    return this.displayedMessages.length;
  }

  // Debug information
  get debugInfo(): any {
    return {
      studioId: this.studioId(),
      studioName: this.studioName(),
      chatId: this.chatId,
      messagesCount: this.displayedMessages.length,
      hasMessages: this.displayedMessages.length > 0,
      isInitialized: !!this.chatId
    };
  }

  // Chat management methods
  onMenuClick(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  async onMuteToggle() {
    if (this.chatId) {
      try {
        this.isMuted = !this.isMuted;
        await this.chatService.toggleMuteChat(this.chatId, this.isMuted);
        this.muteChat.emit({ chatId: this.chatId, isMuted: this.isMuted });
        this.isMenuOpen = false;
        
        // Show feedback message
        console.log(this.isMuted ? 'Chat muted' : 'Chat unmuted');
      } catch (error) {
        console.error('Failed to toggle mute:', error);
        // Revert the change
        this.isMuted = !this.isMuted;
      }
    }
  }

  onChatInfo() {
    const chat = this.chatService.getChatById(this.chatId || this.studioId());
    if (chat) {
      // Subscribe to participants observable to get current participants
      this.chatService.participants$.pipe(take(1)).subscribe(participantsMap => {
        const participants = participantsMap[chat.id] || [];
        
        this.chatInfoData = {
          chat: chat,
          participants: participants,
          isOwner: chat.createdBy === this.chatService.getCurrentUserId()
        };
        this.showChatInfoModal = true;
      });
    }
    this.isMenuOpen = false;
  }

  closeChatInfo() {
    this.showChatInfoModal = false;
    this.chatInfoData = null;
  }

  onLeaveChat() {
    this.showLeaveAlert = true;
    this.isMenuOpen = false;
  }

  confirmLeaveChat() {
    this.leaveChat.emit(this.chatId || this.studioId());
    this.showLeaveAlert = false;
  }

  cancelLeaveChat() {
    this.showLeaveAlert = false;
  }

  // Search functionality
  onSearchMessages(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.searchTerm = searchTerm;
    
    if (searchTerm.trim() === '') {
      this.filteredMessages = [];
      return;
    }
    
    this.filteredMessages = this.displayedMessages.filter(message =>
      message.message.toLowerCase().includes(searchTerm) ||
      message.senderName.toLowerCase().includes(searchTerm)
    );
  }

  get messagesToDisplay(): ChatMessage[] {
    if (this.searchTerm.trim() !== '' && this.filteredMessages.length >= 0) {
      return this.filteredMessages;
    }
    return this.recentMessages;
  }

  // Recent chats functionality
  private loadRecentChats() {
    // Check if we already have a chat list subscription
    const hasExistingChatListSub = this.subscriptions.some(sub => sub && !sub.closed);
    if (hasExistingChatListSub) {
      console.log('Chat list subscription already exists, skipping...');
      return;
    }

    setTimeout(() => {
         // Subscribe to chat list changes for real-time updates
    const chatListSub = this.chatService.getChatList().subscribe(chatList => {
      if (!this.isManuallyUpdating) {
        this.updateRecentChatsList(chatList);
      }
    });
    
    // Add subscription to cleanup list
    this.subscriptions.push(chatListSub);
    console.log('Chat list subscription created'); 
    }, 1000);
  }

  // Load studio chats for browsing
  async loadStudioChats() {
    if (!this.studioId()) return;
    
    try {
      const studioChatList = await this.chatService.getStudioChats({
        studioId: this.studioId(),
        pageSize: 20,
        sortBy: 'recent'
      });
      
      this.studioChats = studioChatList.chats.map(chat => ({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        unreadCount: this.chatService.getUnreadCount(chat.id),
        lastMessageAt: chat.lastMessageAt,
        description: chat.description
      }));
      
      console.log('Loaded studio chats:', this.studioChats.length);
    } catch (error) {
      console.error('Failed to load studio chats:', error);
    }
  }

  // Load user's favorite chats
  async loadFavoriteChats() {
    if (!this.chatService.getCurrentUserId()) return;
    
    try {
      const favoriteChatList = await this.chatService.getUserFavoriteChats({
        userId: this.chatService.getCurrentUserId()!,
        pageSize: 10
      });
      
      this.favoriteChats = favoriteChatList.favoriteChats.map(chatItem => ({
        id: chatItem.chat.id,
        name: chatItem.chat.name,
        type: chatItem.chat.type,
        unreadCount: chatItem.unreadCount,
        lastMessageAt: chatItem.chat.lastMessageAt,
        isPinned: chatItem.userPreferences?.isPinned || false,
        isFavorite: true
      }));
      
      console.log('Loaded favorite chats:', this.favoriteChats.length);
    } catch (error) {
      console.error('Failed to load favorite chats:', error);
    }
  }

  // Toggle between different chat views
  showRecentChats() {
    this.showingStudioChats = false;
    this.showingFavorites = false;
    console.log('Showing recent chats');
  }

  showStudioChatList() {
    this.showingStudioChats = true;
    this.showingFavorites = false;
    this.loadStudioChats();
    console.log('Showing studio chats');
  }

  showFavoritesList() {
    this.showingStudioChats = false;
    this.showingFavorites = true;
    this.loadFavoriteChats();
    console.log('Showing favorite chats');
  }

  // Get the current chat list to display
  get currentChatList(): any[] {
    if (this.showingStudioChats) {
      return this.studioChats;
    } else if (this.showingFavorites) {
      return this.favoriteChats;
    } else {
      return this.recentChats;
    }
  }

  // Get the current view title
  get currentViewTitle(): string {
    if (this.showingStudioChats) {
      return 'Studio Chats';
    } else if (this.showingFavorites) {
      return 'Favorites';
    } else {
      return 'Recent';
    }
  }

  private updateRecentChatsList(chatList: any[]) {
    // Don't update if we're manually updating or if data hasn't changed
    if (this.isManuallyUpdating) {
      return;
    }
    
    // Take first 6 chats
    const newRecentChats = chatList
      .slice(0, 6)
      .map(chatItem => ({
        id: chatItem.chat.id,
        name: chatItem.chat.name,
        type: chatItem.chat.type,
        unreadCount: chatItem.unreadCount,
        lastMessageAt: chatItem.chat.lastMessageAt,
        isFavorite: this.isChatFavoriteSync(chatItem.chat.id),
        isPinned: this.isChatPinnedSync(chatItem.chat.id)
      }));
    
    // Only update if the list has actually changed
    if (JSON.stringify(newRecentChats) !== JSON.stringify(this.recentChats)) {
      this.recentChats = newRecentChats;
      this.cdr.markForCheck();
    }
  }

  // Force immediate update of recent chats
  private forceUpdateRecentChats() {
    this.chatService.getChatList().pipe(take(1)).subscribe(chatList => {
      this.updateRecentChatsList(chatList);
      console.log('Forced immediate update of recent chats complete');
    });
  }

  // Method to switch to a specific chat by ID
  switchToChatById(chatId: string) {
    this.chatService.getChatList().subscribe(chatList => {
      const targetChat = chatList.find(chatItem => chatItem.chat.id === chatId);
      if (targetChat) {
        this.switchToChat({
          id: targetChat.chat.id,
          name: targetChat.chat.name,
          type: targetChat.chat.type,
          unreadCount: targetChat.unreadCount
        });
      }
    });
  }

  async switchToChat(chat: any) {
    console.log('=== SWITCHING TO CHAT ===');
    console.log('Target chat:', chat.name, 'ID:', chat.id);
    console.log('Current recentChats BEFORE:', this.recentChats.map(c => c.name));
    
    // Check if user has access to this chat
    const canAccess = await this.chatAccessController.canUserAccessChat(chat.id);
    if (!canAccess) {
      console.error('User does not have access to chat:', chat.id);
      this.accessError = `Access denied to chat: ${chat.name}`;
      return;
    }
    
    // Set flag to prevent subscription interference
    this.isManuallyUpdating = true;
    
    // STEP 1: Find the clicked chat and move it to position 0 IMMEDIATELY
    const clickedIndex = this.recentChats.findIndex(c => c.id === chat.id);
    if (clickedIndex > 0) {
      // Create a completely new array with clicked chat first
      const newArray = [...this.recentChats];
      const [clickedChat] = newArray.splice(clickedIndex, 1);
      newArray.unshift(clickedChat);
      
      // Replace the entire array
      this.recentChats = newArray;
      
      console.log('IMMEDIATELY after reorder:', this.recentChats.map(c => c.name));
      
      // Force Angular to detect the change
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
    
    // STEP 2: Update backend data
    this.updateChatInteractionTime(chat.id);
    
    // STEP 3: Switch to the chat
    this.displayedMessages = [];
    this.searchTerm = '';
    this.filteredMessages = [];
    this.chatId = chat.id;
    this.currentChatName = chat.name;
    this.accessError = null; // Clear any previous access errors
    
    // STEP 4: Check access control for the new chat
    await this.checkChatAccess();
    
    // STEP 5: Load messages (only if we have read access)
    if (this.currentChatAccess?.canRead) {
      await this.loadMessages();
    }
    
    // STEP 6: Emit event
    this.chatSwitch.emit({ chatId: chat.id, chatName: chat.name });
    
    // Clear the flag after a delay to allow subscription updates later
    setTimeout(() => {
      this.isManuallyUpdating = false;
    }, 1000);
    
    console.log('=== END SWITCHING TO CHAT ===');
  }

  private updateChatInteractionTime(chatId: string) {
    // Update chat interaction time by updating the chat's updatedAt timestamp
    const chat = this.chatService.getChatById(chatId);
    if (chat) {
      chat.updatedAt = new Date();
      console.log('Updated chat interaction time for:', chat.name);
    }
  }

  getChatTypeIcon(type: string): string {
    switch (type) {
      case 'studio': return 'people';
      case 'group': return 'chatbubbles';
      case 'private': return 'person';
      default: return 'chatbubbles';
    }
  }

  getCurrentChatTypeIcon(): string {
    // Get the current chat to determine its type
    const currentChat = this.chatService.getChatById(this.chatId);
    if (currentChat) {
      return this.getChatTypeIcon(currentChat.type);
    }
    return 'chatbubbles'; // Default icon
  }

  getCurrentChatTypeColor(): string {
    // Get the current chat to determine its type
    const currentChat = this.chatService.getChatById(this.chatId);
    if (currentChat) {
      return this.getChatTypeColor(currentChat.type);
    }
    return 'medium'; // Default color
  }

  getChatTypeColor(type: string): string {
    switch (type) {
      case 'studio': return 'primary';
      case 'group': return 'secondary';
      case 'private': return 'tertiary';
      default: return 'medium';
    }
  }

  // Chat management methods
  openCreateChatModal() {
    this.showCreateChatModal = true;
    this.newChatName = '';
    this.newChatDescription = '';
    this.newChatType = 'group';
    this.newChatAccessLevel = 'public'; // Default to public
    this.newChatInitialMembers = [];
    this.newChatMemberInput = '';
    this.newChatMemberSearchTerm = '';
    this.newChatMemberSearchResults = [];
  }

  closeCreateChatModal() {
    this.showCreateChatModal = false;
  }

  /**
   * Search users for adding to new chat
   */
  async searchUsersForNewChat() {
    if (!this.newChatMemberSearchTerm.trim()) {
      this.newChatMemberSearchResults = [];
      return;
    }

    try {
      // Remove @ if user included it
      const searchHandle = this.newChatMemberSearchTerm.trim().replace(/^@/, '');
      
      const client = generateClient<Schema>();
      
      // Search for users by handle or display name
      const result = await client.models.Person.list({
        filter: {
          or: [
            { handle: { contains: searchHandle } },
            { displayName: { contains: this.newChatMemberSearchTerm.trim() } }
          ]
        }
      });

      if (result.data) {
        // Filter out already added members and current user
        const currentUserId = this.chatService.getCurrentUserId();
        this.newChatMemberSearchResults = result.data
          .filter(person => {
            const userId = person.userId || person.id;
            return userId !== currentUserId && 
                   !this.newChatInitialMembers.some(m => m.userId === userId);
          })
          .slice(0, 10)
          .map(person => ({
            id: person.id,
            userId: person.userId || person.id,
            handle: person.handle,
            name: person.displayName,
            avatar: person.profileImage,
            bio: person.bio
          }));
      } else {
        this.newChatMemberSearchResults = [];
      }
    } catch (error) {
      console.error('Failed to search users:', error);
      this.newChatMemberSearchResults = [];
    }
  }

  /**
   * Add a user from search results to initial members
   */
  addInitialMemberByUser(user: any) {
    // Check if already added
    if (this.newChatInitialMembers.some(m => m.userId === user.userId)) {
      this.showToast('User already added', 'warning');
      return;
    }

    this.newChatInitialMembers.push({
      userId: user.userId,
      handle: user.handle,
      displayName: user.name,
      avatar: user.avatar
    });

    // Clear search
    this.newChatMemberSearchTerm = '';
    this.newChatMemberSearchResults = [];
  }

  /**
   * Add a member to the initial members list for private chats by handle
   * Requirement 4.3: Require specification of initial invited members for private chats
   */
  async addInitialMember() {
    const handleInput = this.newChatMemberInput.trim().replace(/^@/, '');
    if (!handleInput) {
      return;
    }

    try {
      const client = generateClient<Schema>();
      
      // Look up user by handle
      const personResult = await client.models.Person.list({
        filter: {
          handle: { eq: handleInput }
        }
      });

      if (personResult.errors || !personResult.data || personResult.data.length === 0) {
        await this.showToast(`User with handle @${handleInput} not found`, 'danger');
        return;
      }

      const person = personResult.data[0];
      const userId = person.userId || person.id;

      // Validate member ID
      if (userId === this.chatService.getCurrentUserId()) {
        this.showToast('You cannot add yourself as an initial member', 'warning');
        return;
      }

      if (this.newChatInitialMembers.some(m => m.userId === userId)) {
        this.showToast('User already added', 'warning');
        return;
      }

      this.newChatInitialMembers.push({
        userId: userId,
        handle: person.handle,
        displayName: person.displayName,
        avatar: person.profileImage
      });

      this.newChatMemberInput = '';
    } catch (error) {
      console.error('Failed to add member:', error);
      await this.showToast('Failed to add member', 'danger');
    }
  }

  /**
   * Remove a member from the initial members list
   */
  removeInitialMember(memberHandle: string) {
    this.newChatInitialMembers = this.newChatInitialMembers.filter(m => m.handle !== memberHandle);
  }

  /**
   * Validate chat creation form
   * Requirement 4.3: Private chats require initial invited members
   */
  private validateChatCreation(): boolean {
    if (!this.newChatName.trim()) {
      this.showToast('Chat name is required', 'danger');
      return false;
    }

    // Requirement 4.3: Private chats must have initial members
    if (this.newChatAccessLevel === 'private' && this.newChatInitialMembers.length === 0) {
      this.showToast('Private chats must have at least one initial member', 'danger');
      return false;
    }

    return true;
  }

  async createNewChat() {
    if (!this.validateChatCreation()) {
      return;
    }

    try {
      // Requirement 4.1: Allow selection between public and private types
      const isPrivate = this.newChatAccessLevel === 'private';
      
      // Extract user IDs from member objects
      const memberUserIds = this.newChatInitialMembers.map(m => m.userId);
      
      const newChat = await this.chatService.createCustomChat(
        this.studioId(),
        this.newChatName.trim(),
        this.newChatDescription.trim() || undefined,
        isPrivate,
        memberUserIds // Pass initial member user IDs for private chats
      );

      console.log('New chat created:', newChat.name, 'Access level:', this.newChatAccessLevel);

      // Switch to the new chat
      this.switchToChat({
        id: newChat.id,
        name: newChat.name,
        type: newChat.type,
        unreadCount: 0
      });

      this.closeCreateChatModal();
      
      // Show success message based on chat type
      const memberHandles = this.newChatInitialMembers.map(m => `@${m.handle}`).join(', ');
      const message = isPrivate 
        ? `Private chat "${newChat.name}" created and invitations sent to: ${memberHandles}`
        : `Public chat "${newChat.name}" created and is now visible to all studio visitors`;
      
      this.showToast(message, 'success');
      
      console.log('New chat created and switched to:', newChat.name);
    } catch (error) {
      console.error('Failed to create new chat:', error);
      this.showToast('Failed to create chat. Please try again.', 'danger');
    }
  }

  confirmDeleteChat(chatId: string, chatName: string) {
    this.chatToDelete = chatId;
    const chat = this.chatService.getChatById(chatId);
    this.isOwnerOfChatToDelete = chat ? chat.createdBy === this.chatService.getCurrentUserId() : false;
    this.showDeleteChatAlert = true;
  }

  async deleteChat() {
    if (!this.chatToDelete) return;

    try {
      const deletedChatId = this.chatToDelete;
      const chat = this.chatService.getChatById(deletedChatId);
      const isOwner = chat && chat.createdBy === this.chatService.getCurrentUserId();
      
      if (isOwner) {
        // Owner can delete the chat for everyone
        await this.chatService.deleteChat(deletedChatId);
        console.log('Chat deleted from service:', deletedChatId);
      } else {
        // Non-owner just removes it from their view (local only)
        console.log('Removing chat from local view:', deletedChatId);
      }
      
      // Immediately remove from ALL local chat arrays by creating new array references
      // This ensures Angular's change detection picks up the changes
      this.recentChats = [...this.recentChats.filter(chat => chat.id !== deletedChatId)];
      this.studioChats = [...this.studioChats.filter(chat => chat.id !== deletedChatId)];
      this.favoriteChats = [...this.favoriteChats.filter(chat => chat.id !== deletedChatId)];
      
      console.log('Removed from all chat lists');
      console.log('Recent chats remaining:', this.recentChats.length);
      console.log('Studio chats remaining:', this.studioChats.length);
      console.log('Favorite chats remaining:', this.favoriteChats.length);
      
      // Close the alert first
      this.showDeleteChatAlert = false;
      this.chatToDelete = '';
      
      // Defer the chat switching and UI updates to the next cycle
      setTimeout(() => {
        // If we deleted the current chat, switch to another one
        if (deletedChatId === this.chatId) {
          const remainingChats = this.currentChatList;
          if (remainingChats.length > 0) {
            this.switchToChat(remainingChats[0]);
          } else {
            // No other chats, clear current chat
            this.chatId = '';
            this.currentChatName = '';
            this.displayedMessages = [];
          }
        }
        
        console.log('Chat removed successfully, UI updated');
      }, 0);
      
    } catch (error) {
      console.error('Failed to delete chat:', error);
      this.showDeleteChatAlert = false;
      this.chatToDelete = '';
    }
  }

  cancelDeleteChat() {
    this.showDeleteChatAlert = false;
    this.chatToDelete = '';
  }

  canDeleteChat(chatId: string): boolean {
    // Anyone can remove a chat from their view
    // Only owners can delete it for everyone (handled in deleteChat method)
    return true;
  }

  async toggleChatFavorite(chatId: string, event: Event) {
    event.stopPropagation(); // Prevent chat switching when clicking favorite
    try {
      const isFavorite = await this.chatService.toggleChatFavorite(chatId);
      
      // Update the chat in the current list
      const chat = this.currentChatList.find(c => c.id === chatId);
      if (chat) {
        chat.isFavorite = isFavorite;
      }
      
      // Refresh the appropriate list
      if (this.showingFavorites) {
        this.loadFavoriteChats();
      }
      
      console.log(`Chat ${isFavorite ? 'added to' : 'removed from'} favorites`);
    } catch (error) {
      console.error('Failed to toggle chat favorite:', error);
    }
  }

  async toggleChatPin(chatId: string, event: Event) {
    event.stopPropagation(); // Prevent chat switching when clicking pin
    try {
      const isPinned = await this.chatService.toggleChatPin(chatId);
      
      // Update the chat in the current list
      const chat = this.currentChatList.find(c => c.id === chatId);
      if (chat) {
        chat.isPinned = isPinned;
      }
      
      // Refresh the appropriate list
      if (this.showingFavorites) {
        this.loadFavoriteChats();
      } else {
        this.forceUpdateRecentChats();
      }
      
      console.log(`Chat ${isPinned ? 'pinned' : 'unpinned'}`);
    } catch (error) {
      console.error('Failed to toggle chat pin:', error);
    }
  }

  // Synchronous methods with caching to prevent async operations in templates
  isChatFavoriteSync(chatId: string): boolean {
    const cached = this.getCachedPreferences(chatId);
    if (cached) {
      return cached.isFavorite;
    }
    
    // Load preferences asynchronously and cache them
    this.loadChatPreferences(chatId);
    return false; // Default to false while loading
  }

  isChatPinnedSync(chatId: string): boolean {
    const cached = this.getCachedPreferences(chatId);
    if (cached) {
      return cached.isPinned;
    }
    
    // Load preferences asynchronously and cache them
    this.loadChatPreferences(chatId);
    return false; // Default to false while loading
  }

  private getCachedPreferences(chatId: string): { isFavorite: boolean; isPinned: boolean } | null {
    const cached = this.chatPreferencesCache.get(chatId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return { isFavorite: cached.isFavorite, isPinned: cached.isPinned };
    }
    return null;
  }

  private async loadChatPreferences(chatId: string) {
    try {
      const prefs = await this.chatService.getChatPreferences(chatId);
      this.chatPreferencesCache.set(chatId, {
        isFavorite: prefs?.isFavorite || false,
        isPinned: prefs?.isPinned || false,
        timestamp: Date.now()
      });
      
      // Trigger change detection to update UI
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to load chat preferences:', error);
    }
  }

  get deleteAlertButtons() {
    return [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => this.cancelDeleteChat()
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => this.deleteChat()
      }
    ];
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  // Track by function for ngFor to help Angular detect changes
  trackByChat(index: number, chat: any): string {
    return chat.id;
  }

  // Retry chat initialization
  async retryInitialization() {
    console.log('Retrying chat initialization...');
    try {
      // Reset state
      this.chatId = '';
      this.currentChatName = '';
      this.displayedMessages = [];
      
      // Retry initialization
      await this.initializeChat();
    } catch (error) {
      console.error('Retry initialization failed:', error);
      // Error state will be set by initializeChat
    }
  }

  // Debug method to check service status
  debugServiceStatus() {
    const status = this.chatService.getServiceStatus();
    console.log('=== CHAT SERVICE DEBUG STATUS ===');
    console.log('Service Status:', status);
    console.log('Component State:', {
      chatId: this.chatId,
      currentChatName: this.currentChatName,
      studioId: this.studioId(),
      studioName: this.studioName(),
      messagesCount: this.displayedMessages.length
    });
    console.log('=== END DEBUG STATUS ===');
    return status;
  }

  // ==================== INVITATION MANAGEMENT METHODS ====================

  /**
   * Accept a chat invitation
   */
  async acceptInvitation(invitationId: string) {
    try {
      console.log('Accepting chat invitation:', invitationId);
      
      await this.invitationService.acceptInvitation(invitationId);
      
      // Remove the accepted invitation from pending list
      this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== invitationId);
      
      // If no more pending invitations, hide the invitation UI
      if (this.pendingInvitations.length === 0) {
        this.showInvitationUI = false;
      }
      
      // Refresh the chat list to show newly accessible chats
      await this.initializeChat();
      
      await this.showToast('Chat invitation accepted successfully', 'success');
      console.log('Chat invitation accepted successfully');
      
    } catch (error) {
      console.error('Failed to accept chat invitation:', error);
      
      if (error instanceof ChatAccessException) {
        switch (error.errorCode) {
          case ChatAccessError.INVITATION_EXPIRED:
            this.accessError = 'This invitation has expired';
            break;
          case ChatAccessError.INVITATION_REVOKED:
            this.accessError = 'This invitation has been revoked';
            break;
          case ChatAccessError.INVALID_INVITATION:
            this.accessError = 'Invalid invitation';
            break;
          default:
            this.accessError = 'Failed to accept invitation';
        }
      } else {
        this.accessError = 'Failed to accept invitation';
      }
      
      await this.showToast(this.accessError, 'danger');
      
      // Remove the problematic invitation from the list
      this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== invitationId);
      
      if (this.pendingInvitations.length === 0) {
        this.showInvitationUI = false;
      }
    }
  }

  /**
   * Decline a chat invitation
   */
  async declineInvitation(invitationId: string) {
    try {
      console.log('Declining chat invitation:', invitationId);
      
      await this.invitationService.declineInvitation(invitationId);
      
      // Remove the declined invitation from pending list
      this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== invitationId);
      
      // If no more pending invitations, hide the invitation UI
      if (this.pendingInvitations.length === 0) {
        this.showInvitationUI = false;
        
        // If we were showing pending invitations, try to initialize a regular chat
        if (this.currentChatName === 'Pending Invitations') {
          await this.initializeChat();
        }
      }
      
      await this.showToast('Chat invitation declined', 'success');
      console.log('Chat invitation declined successfully');
      
    } catch (error) {
      console.error('Failed to decline chat invitation:', error);
      this.accessError = 'Failed to decline invitation';
      await this.showToast('Failed to decline invitation', 'danger');
    }
  }

  /**
   * Get invitation by chat ID from pending invitations
   */
  getInvitationForChat(chatId: string): ChatInvitation | undefined {
    return this.pendingInvitations.find(inv => inv.chatId === chatId);
  }

  /**
   * Check if there are any pending invitations
   */
  get hasPendingInvitations(): boolean {
    return this.pendingInvitations.length > 0;
  }

  /**
   * Get formatted invitation message
   */
  getInvitationMessage(invitation: ChatInvitation): string {
    const chatName = invitation.chatId; // We might not have the chat name, so use ID for now
    const inviterName = invitation.invitedBy; // We might not have the inviter name, so use ID for now
    
    if (invitation.message) {
      return `${inviterName} invited you to join "${chatName}": ${invitation.message}`;
    } else {
      return `${inviterName} invited you to join "${chatName}"`;
    }
  }

  /**
   * Check if invitation is expired
   */
  isInvitationExpired(invitation: ChatInvitation): boolean {
    if (!invitation.expiresAt) {
      return false; // No expiration date
    }
    
    return new Date() > invitation.expiresAt;
  }

  /**
   * Show toast message to user
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Open invitation manager modal
   */
  openInvitationManager() {
    this.showInvitationManagerModal = true;
    this.isMenuOpen = false;
  }

  /**
   * Close invitation manager modal
   */
  closeInvitationManager() {
    this.showInvitationManagerModal = false;
  }

  /**
   * Handle invitation sent event
   */
  onInvitationSent() {
    console.log('Invitation sent, refreshing chat info');
    // Optionally refresh chat info or participant list
  }

}