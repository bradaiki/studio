import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';

import { ChatMessagesComponent } from './chat-messages.component';
import { ChatService } from '../../services/chat.service';
import { AccessControlService } from '../../services/access-control.service';
import { ChatAccessController } from '../../services/chat-access-controller.service';
import { 
  ChatMessage, 
  ChatAccessLevel, 
  Chat,
  OrganizedStudioChats,
  ChatListItem,
  StudioChatList,
  UserFavoriteChatList,
  UserChatPreferences
} from '../../models/chat.models';

// Property-based testing utilities
function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

function generateRandomChatId(): string {
  return `chat_${generateRandomString(8)}`;
}

function generateRandomUserId(): string {
  return `user_${generateRandomString(8)}`;
}

function generateChatWithType(type: 'studio' | 'private' | 'group', accessLevel?: 'public' | 'private' | 'restricted'): Chat {
  const chatId = generateRandomChatId();
  
  return {
    id: chatId,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Chat`,
    description: `A ${type} chat for testing`,
    type,
    studioId: type === 'studio' ? `studio_${generateRandomString(6)}` : undefined,
    participantIds: [generateRandomUserId(), generateRandomUserId()],
    createdBy: generateRandomUserId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    settings: {
      allowLeaving: true,
      allowMuting: true,
      allowInviting: type !== 'private',
      isPublic: accessLevel === 'public' || type === 'studio',
      maxParticipants: type === 'private' ? 2 : 100
    },
    accessLevel: accessLevel || (type === 'studio' ? 'public' : 'private'),
    invitationRequired: type === 'private' || accessLevel === 'private',
    studioMembershipRequired: type === 'studio'
  };
}

function generateAccessLevelForChatType(chatType: 'studio' | 'private' | 'group', accessLevel?: 'public' | 'private' | 'restricted'): ChatAccessLevel {
  // Studio chats are typically public with studio member access
  if (chatType === 'studio') {
    return {
      canView: true,
      canRead: true,
      canWrite: true,
      canInvite: false,
      canManage: false,
      accessReason: 'studio_member'
    };
  }
  
  // Private chats require invitation
  if (chatType === 'private' || accessLevel === 'private') {
    return {
      canView: true,
      canRead: true,
      canWrite: true,
      canInvite: false,
      canManage: false,
      accessReason: 'invited'
    };
  }
  
  // Restricted access level
  if (accessLevel === 'restricted') {
    return {
      canView: true,
      canRead: true,
      canWrite: false, // Read-only for restricted
      canInvite: false,
      canManage: false,
      accessReason: 'studio_member'
    };
  }
  
  // Group chats can be public or private
  return {
    canView: true,
    canRead: true,
    canWrite: true,
    canInvite: false,
    canManage: false,
    accessReason: accessLevel === 'public' ? 'public' : 'invited'
  };
}

function createOrganizedStudioChats(chat: Chat, chatAccessLevel: ChatAccessLevel, chatType: 'studio' | 'private' | 'group'): OrganizedStudioChats {
  const chatListItem = { 
    chat, 
    accessLevel: chatAccessLevel,
    unreadCount: 0,
    participants: []
  };
  const publicChats = chatType === 'studio' ? [chatListItem] : [];
  const privateChats = chatType === 'private' ? [chatListItem] : [];
  
  return {
    publicChats,
    privateChats,
    invitationsPending: [],
    totalPublic: publicChats.length,
    totalPrivate: privateChats.length
  };
}

function createStudioChatList(chat: Chat, studioId: string): StudioChatList {
  return {
    studioId,
    chats: [chat],
    totalCount: 1
  };
}

function createUserFavoriteChatList(userId: string): UserFavoriteChatList {
  return {
    userId,
    favoriteChats: [],
    totalCount: 0
  };
}

function createUserChatPreferences(chatId: string, userId: string): UserChatPreferences {
  return {
    id: `pref_${generateRandomString(8)}`,
    userId,
    chatId,
    isFavorite: false,
    isPinned: false,
    isMuted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Helper functions for creating proper mock return values

describe('ChatMessagesComponent - Chat Type Distinction Properties', () => {
  let component: ChatMessagesComponent;
  let fixture: ComponentFixture<ChatMessagesComponent>;
  let mockChatService: any;
  let mockAccessControlService: jasmine.SpyObj<AccessControlService>;
  let mockChatAccessController: jasmine.SpyObj<ChatAccessController>;

  beforeEach(async () => {
    // Create a complete mock ChatService with all required methods
    mockChatService = {
      // Observable properties
      messages$: new BehaviorSubject({}),
      
      // Method spies
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue('test-user-id'),
      loadMessages: jasmine.createSpy('loadMessages').and.returnValue(Promise.resolve([])),
      sendMessage: jasmine.createSpy('sendMessage').and.returnValue(Promise.resolve({ id: 'msg1', message: 'test' })),
      getChatsByStudioId: jasmine.createSpy('getChatsByStudioId').and.returnValue(Promise.resolve([])),
      createChat: jasmine.createSpy('createChat').and.returnValue(Promise.resolve({ id: 'chat1', name: 'Test Chat' })),
      isServiceReady: jasmine.createSpy('isServiceReady').and.returnValue(true),
      retryInitialization: jasmine.createSpy('retryInitialization').and.returnValue(Promise.resolve()),
      getChatById: jasmine.createSpy('getChatById').and.returnValue(null),
      getChatList: jasmine.createSpy('getChatList').and.returnValue(of([])),
      getStudioChats: jasmine.createSpy('getStudioChats').and.returnValue(Promise.resolve({ studioId: '', chats: [], totalCount: 0 })),
      getUserFavoriteChats: jasmine.createSpy('getUserFavoriteChats').and.returnValue(Promise.resolve({ userId: '', favoriteChats: [], totalCount: 0 })),
      getChatPreferences: jasmine.createSpy('getChatPreferences').and.returnValue(Promise.resolve({ isFavorite: false, isPinned: false })),
      toggleChatFavorite: jasmine.createSpy('toggleChatFavorite').and.returnValue(Promise.resolve(false)),
      toggleChatPin: jasmine.createSpy('toggleChatPin').and.returnValue(Promise.resolve(false)),
      deleteChat: jasmine.createSpy('deleteChat').and.returnValue(Promise.resolve(true)),
      createCustomChat: jasmine.createSpy('createCustomChat').and.returnValue(Promise.resolve({ id: 'chat1', name: 'Custom Chat' })),
      toggleMuteChat: jasmine.createSpy('toggleMuteChat').and.returnValue(Promise.resolve(false)),
      markMessagesAsRead: jasmine.createSpy('markMessagesAsRead').and.returnValue(Promise.resolve(true)),
      getUnreadCount: jasmine.createSpy('getUnreadCount').and.returnValue(0),
      getServiceStatus: jasmine.createSpy('getServiceStatus').and.returnValue({ isReady: true, isAuthenticated: true })
    };

    // Create AccessControlService mock
    mockAccessControlService = jasmine.createSpyObj('AccessControlService', [
      'checkChatAccess',
      'canUserAccessChat',
      'canUserSendMessage',
      'getUserChatInvitations',
      'acceptChatInvitation'
    ]);

    // Set up default AccessControlService returns
    mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve({
      canView: true,
      canRead: true,
      canWrite: true,
      canInvite: false,
      canManage: false,
      accessReason: 'public'
    }));
    mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));

    // Create ChatAccessController mock
    mockChatAccessController = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'canUserAccessChat',
      'getCurrentUserId'
    ]);

    // Set up default ChatAccessController returns
    mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
      publicChats: [],
      privateChats: [],
      invitationsPending: [],
      totalPublic: 0,
      totalPrivate: 0
    }));
    mockChatAccessController.canUserAccessChat.and.returnValue(Promise.resolve(true));
    mockChatAccessController.getCurrentUserId.and.returnValue('test-user-id');

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        FormsModule,
        RouterTestingModule,
        ChatMessagesComponent
      ],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: AccessControlService, useValue: mockAccessControlService },
        { provide: ChatAccessController, useValue: mockChatAccessController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatMessagesComponent);
    component = fixture.componentInstance;

    // Setup getChatList AFTER component creation - this is the key fix
    mockChatService.getChatList = jasmine.createSpy('getChatList').and.returnValue(of([]));
    
    // Ensure all mocks are properly configured before any component initialization
    // This prevents the "Cannot read properties of undefined" error
    mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
      publicChats: [],
      privateChats: [],
      invitationsPending: [],
      totalPublic: 0,
      totalPrivate: 0
    }));
    mockChatAccessController.canUserAccessChat.and.returnValue(Promise.resolve(true));
    mockChatAccessController.getCurrentUserId.and.returnValue('test-user-id');
  });

  /**
   * Property 5: Chat Type Visibility Distinction
   * Validates: Requirements 2.4, 6.2
   * 
   * Property: For any chat type (studio, private, group) and access level combination,
   * the UI should correctly display type indicators, access reason, and appropriate
   * visual distinctions that help users understand the chat's nature and their access level.
   */
  describe('Property 5: Chat Type Visibility Distinction', () => {
    it('should correctly display type indicators for all chat types', async () => {
      const chatTypes: Array<'studio' | 'private' | 'group'> = ['studio', 'private', 'group'];
      const accessLevels: Array<'public' | 'private' | 'restricted'> = ['public', 'private', 'restricted'];
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        const chatType = chatTypes[i % chatTypes.length];
        const accessLevel = accessLevels[i % accessLevels.length];
        const chat = generateChatWithType(chatType, accessLevel);
        const userId = generateRandomUserId();
        const chatAccessLevel = generateAccessLevelForChatType(chatType, accessLevel);
        
        // Setup mocks with proper return values
        mockChatService.getCurrentUserId.and.returnValue(userId);
        mockChatService.isServiceReady.and.returnValue(true);
        mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([chat]));
        mockChatService.getChatById.and.returnValue(chat);
        mockChatService.loadMessages.and.returnValue(Promise.resolve([]));
        mockChatService.getChatList.and.returnValue(of([]));
        mockChatService.getStudioChats.and.returnValue(Promise.resolve(createStudioChatList(chat, `studio_${i}`)));
        mockChatService.getUserFavoriteChats.and.returnValue(Promise.resolve(createUserFavoriteChatList(userId)));
        mockChatService.getChatPreferences.and.returnValue(Promise.resolve(createUserChatPreferences(chat.id, userId)));
        mockChatService.toggleChatFavorite.and.returnValue(Promise.resolve(false));
        mockChatService.toggleChatPin.and.returnValue(Promise.resolve(false));
        mockChatService.deleteChat.and.returnValue(Promise.resolve(true));
        mockChatService.createCustomChat.and.returnValue(Promise.resolve(chat));
        mockChatService.toggleMuteChat.and.returnValue(Promise.resolve(false));
        mockChatService.markMessagesAsRead.and.returnValue(Promise.resolve(true));
        mockChatService.getUnreadCount.and.returnValue(0);
        mockChatService.getServiceStatus.and.returnValue({ isReady: true, isAuthenticated: true });
        
        mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(chatAccessLevel));
        mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
        
        // Setup ChatAccessController with proper OrganizedStudioChats structure
        const organizedChats = createOrganizedStudioChats(chat, chatAccessLevel, chatType);
        mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve(organizedChats));
        mockChatAccessController.canUserAccessChat.and.returnValue(Promise.resolve(true));
        mockChatAccessController.getCurrentUserId.and.returnValue(userId);
        
        // Set component properties
        component.studioId = `studio_${i}`;
        component.studioName = `Test Studio ${i}`;
        
        // Initialize component
        await component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        
        // Verify chat type icon is appropriate
        const typeIcon = component.getCurrentChatTypeIcon();
        switch (chatType) {
          case 'studio':
            expect(typeIcon).toBe('people');
            break;
          case 'private':
            expect(typeIcon).toBe('person');
            break;
          case 'group':
            expect(typeIcon).toBe('chatbubbles');
            break;
        }
        
        // Verify chat type color is appropriate
        const typeColor = component.getCurrentChatTypeColor();
        switch (chatType) {
          case 'studio':
            expect(typeColor).toBe('primary');
            break;
          case 'private':
            expect(typeColor).toBe('tertiary');
            break;
          case 'group':
            expect(typeColor).toBe('secondary');
            break;
        }
        
        // Verify access reason display matches chat type and access level
        const accessReason = component.chatAccessReason;
        expect(accessReason).toBeDefined();
        
        switch (chatAccessLevel.accessReason) {
          case 'studio_member':
            expect(accessReason).toBe('Studio member');
            break;
          case 'invited':
            expect(accessReason).toBe('Invited member');
            break;
          case 'public':
            expect(accessReason).toBe('Public chat');
            break;
          case 'creator':
            expect(accessReason).toBe('Chat creator');
            break;
          case 'admin':
            expect(accessReason).toBe('Administrator');
            break;
        }
        
        // Verify access level consistency with chat type
        if (chatType === 'studio') {
          // Studio chats should typically allow studio members
          expect(chatAccessLevel.accessReason).toMatch(/studio_member|creator|admin/);
        } else if (chatType === 'private') {
          // Private chats should require invitation or be creator
          expect(chatAccessLevel.accessReason).toMatch(/invited|creator|admin/);
        }
        
        console.log(`✓ Iteration ${i + 1}: ${chatType} chat with ${accessLevel} access correctly displayed`);
      }
    });

    it('should show appropriate visual indicators for different access levels', async () => {
      const iterations = 15;
      
      for (let i = 0; i < iterations; i++) {
        const chatTypes: Array<'studio' | 'private' | 'group'> = ['studio', 'private', 'group'];
        const chatType = chatTypes[i % chatTypes.length];
        const chat = generateChatWithType(chatType);
        const userId = generateRandomUserId();
        
        // Vary access levels
        const accessReasons: Array<'public' | 'invited' | 'studio_member' | 'admin' | 'creator'> = 
          ['public', 'invited', 'studio_member', 'admin', 'creator'];
        const accessReason = accessReasons[i % accessReasons.length];
        
        const chatAccessLevel: ChatAccessLevel = {
          canView: true,
          canRead: true,
          canWrite: accessReason !== 'public' || Math.random() > 0.2, // 80% can write
          canInvite: accessReason === 'admin' || accessReason === 'creator',
          canManage: accessReason === 'creator',
          accessReason
        };
        
        // Setup mocks with proper return values
        mockChatService.getCurrentUserId.and.returnValue(userId);
        mockChatService.isServiceReady.and.returnValue(true);
        mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([chat]));
        mockChatService.getChatById.and.returnValue(chat);
        mockChatService.loadMessages.and.returnValue(Promise.resolve([]));
        mockChatService.getChatList.and.returnValue(of([]));
        mockChatService.getStudioChats.and.returnValue(Promise.resolve(createStudioChatList(chat, `studio_${i}`)));
        mockChatService.getUserFavoriteChats.and.returnValue(Promise.resolve(createUserFavoriteChatList(userId)));
        mockChatService.getChatPreferences.and.returnValue(Promise.resolve(createUserChatPreferences(chat.id, userId)));
        mockChatService.toggleChatFavorite.and.returnValue(Promise.resolve(false));
        mockChatService.toggleChatPin.and.returnValue(Promise.resolve(false));
        mockChatService.deleteChat.and.returnValue(Promise.resolve(true));
        mockChatService.createCustomChat.and.returnValue(Promise.resolve(chat));
        mockChatService.toggleMuteChat.and.returnValue(Promise.resolve(false));
        mockChatService.markMessagesAsRead.and.returnValue(Promise.resolve(true));
        mockChatService.getUnreadCount.and.returnValue(0);
        mockChatService.getServiceStatus.and.returnValue({ isReady: true, isAuthenticated: true });
        
        mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(chatAccessLevel));
        mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
        
        // Setup ChatAccessController with proper OrganizedStudioChats structure
        const organizedChats = createOrganizedStudioChats(chat, chatAccessLevel, chatType);
        mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve(organizedChats));
        mockChatAccessController.canUserAccessChat.and.returnValue(Promise.resolve(true));
        mockChatAccessController.getCurrentUserId.and.returnValue(userId);
        
        // Set component properties
        component.studioId = `studio_${i}`;
        component.studioName = `Test Studio ${i}`;
        
        // Initialize component
        await component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        
        // Verify access level properties
        expect(component.hasReadAccess).toBe(chatAccessLevel.canRead);
        expect(component.hasWriteAccess).toBe(chatAccessLevel.canWrite);
        expect(component.hasInviteAccess).toBe(chatAccessLevel.canInvite);
        expect(component.hasManageAccess).toBe(chatAccessLevel.canManage);
        
        // Verify message input state reflects write access
        if (chatAccessLevel.canWrite) {
          component.newMessage = 'test message';
          expect(component.canSendMessage).toBe(true);
        } else {
          expect(component.isMessageInputDisabled).toBe(true);
        }
        
        // Verify access reason display is user-friendly
        const displayedReason = component.chatAccessReason;
        expect(displayedReason).not.toBe('Unknown');
        expect(displayedReason).not.toBe('No access');
        
        // Verify consistency between chat type and expected access patterns
        if (chatType === 'studio' && accessReason === 'studio_member') {
          expect(chatAccessLevel.canRead).toBe(true);
          expect(chatAccessLevel.canWrite).toBe(true);
        }
        
        if (chatType === 'private' && accessReason === 'invited') {
          expect(chatAccessLevel.canRead).toBe(true);
          expect(chatAccessLevel.canWrite).toBe(true);
        }
        
        if (accessReason === 'creator') {
          expect(chatAccessLevel.canManage).toBe(true);
          expect(chatAccessLevel.canInvite).toBe(true);
        }
        
        console.log(`✓ Iteration ${i + 1}: ${chatType} chat with ${accessReason} access shows correct indicators`);
      }
    });

    it('should maintain visual consistency across different chat configurations', async () => {
      const iterations = 12;
      
      for (let i = 0; i < iterations; i++) {
        // Generate multiple chats of different types for the same studio
        const studioId = `studio_${i}`;
        const userId = generateRandomUserId();
        
        const studioChat = generateChatWithType('studio', 'public');
        const privateChat = generateChatWithType('private', 'private');
        const groupChat = generateChatWithType('group', Math.random() > 0.5 ? 'public' : 'private');
        
        const chats = [studioChat, privateChat, groupChat];
        const currentChat = chats[i % chats.length];
        
        const accessLevel = generateAccessLevelForChatType(currentChat.type, currentChat.accessLevel);
        
        // Setup mocks with proper return values
        mockChatService.getCurrentUserId.and.returnValue(userId);
        mockChatService.isServiceReady.and.returnValue(true);
        mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([currentChat]));
        mockChatService.getChatById.and.returnValue(currentChat);
        mockChatService.loadMessages.and.returnValue(Promise.resolve([]));
        mockChatService.getChatList.and.returnValue(of([]));
        mockChatService.getStudioChats.and.returnValue(Promise.resolve(createStudioChatList(currentChat, studioId)));
        mockChatService.getUserFavoriteChats.and.returnValue(Promise.resolve(createUserFavoriteChatList(userId)));
        mockChatService.getChatPreferences.and.returnValue(Promise.resolve(createUserChatPreferences(currentChat.id, userId)));
        mockChatService.toggleChatFavorite.and.returnValue(Promise.resolve(false));
        mockChatService.toggleChatPin.and.returnValue(Promise.resolve(false));
        mockChatService.deleteChat.and.returnValue(Promise.resolve(true));
        mockChatService.createCustomChat.and.returnValue(Promise.resolve(currentChat));
        mockChatService.toggleMuteChat.and.returnValue(Promise.resolve(false));
        mockChatService.markMessagesAsRead.and.returnValue(Promise.resolve(true));
        mockChatService.getUnreadCount.and.returnValue(0);
        mockChatService.getServiceStatus.and.returnValue({ isReady: true, isAuthenticated: true });
        
        mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(accessLevel));
        mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
        
        // Setup ChatAccessController with proper OrganizedStudioChats structure
        const organizedChats = createOrganizedStudioChats(currentChat, accessLevel, currentChat.type);
        mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve(organizedChats));
        mockChatAccessController.canUserAccessChat.and.returnValue(Promise.resolve(true));
        mockChatAccessController.getCurrentUserId.and.returnValue(userId);
        
        // Set component properties
        component.studioId = studioId;
        component.studioName = `Test Studio ${i}`;
        
        // Initialize component
        await component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        
        // Verify type-specific icon consistency
        const typeIcon = component.getCurrentChatTypeIcon();
        const expectedIcon = component.getChatTypeIcon(currentChat.type);
        expect(typeIcon).toBe(expectedIcon);
        
        // Verify type-specific color consistency
        const typeColor = component.getCurrentChatTypeColor();
        const expectedColor = component.getChatTypeColor(currentChat.type);
        expect(typeColor).toBe(expectedColor);
        
        // Verify access reason is appropriate for chat configuration
        const accessReason = component.chatAccessReason;
        
        // Studio chats should show studio-related access
        if (currentChat.type === 'studio') {
          expect(accessReason).toMatch(/Studio|Public|Creator|Administrator/);
        }
        
        // Private chats should show invitation-related access
        if (currentChat.type === 'private') {
          expect(accessReason).toMatch(/Invited|Creator|Administrator/);
        }
        
        // Verify no access errors for valid configurations
        expect(component.accessError).toBeNull();
        expect(component.currentChatAccess).not.toBeNull();
        
        console.log(`✓ Iteration ${i + 1}: ${currentChat.type} chat visual consistency verified`);
      }
    });
  });
});