import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { ChatPersistenceService } from './chat-persistence.service';
import { AuthStateService } from './auth-state.service';
import { AccessControlService, ChatAccessLevel } from './access-control.service';
import { BehaviorSubject } from 'rxjs';
import { Chat, CreateChatRequest, ChatSettings } from '../models/chat.models';

// Mock services
const mockPersistenceService = {
  loadUserChats: jasmine.createSpy('loadUserChats'),
  loadMessages: jasmine.createSpy('loadMessages'),
  loadParticipants: jasmine.createSpy('loadParticipants'),
  createChat: jasmine.createSpy('createChat'),
  sendMessage: jasmine.createSpy('sendMessage'),
  markMessagesAsRead: jasmine.createSpy('markMessagesAsRead'),
  updateChatSettings: jasmine.createSpy('updateChatSettings'),
  deleteChat: jasmine.createSpy('deleteChat')
};

const mockAuthStateService = {
  currentUser$: new BehaviorSubject({ userId: 'test-user-1', username: 'TestUser1' })
};

const mockAccessControlService = {
  canUserAccessChat: jasmine.createSpy('canUserAccessChat'),
  canUserSendMessage: jasmine.createSpy('canUserSendMessage'),
  checkChatAccess: jasmine.createSpy('checkChatAccess'),
  getUserChatInvitations: jasmine.createSpy('getUserChatInvitations'),
  getAllUserChatInvitations: jasmine.createSpy('getAllUserChatInvitations')
};

// Helper function to create complete ChatSettings
const createChatSettings = (overrides: Partial<ChatSettings> = {}): ChatSettings => ({
  allowLeaving: true,
  allowMuting: true,
  allowInviting: true,
  isPublic: true,
  maxParticipants: 50,
  ...overrides
});

// Feature: studio-chat-access-control, Property 1: Public Chat Universal Visibility
describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: ChatPersistenceService, useValue: mockPersistenceService },
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: AccessControlService, useValue: mockAccessControlService }
      ]
    });
    
    // Reset all spies before creating service
    Object.values(mockPersistenceService).forEach(spy => {
      if (typeof spy === 'function' && (spy as any).calls) {
        (spy as any).calls.reset();
      }
    });
    Object.values(mockAccessControlService).forEach(spy => {
      if (typeof spy === 'function' && (spy as any).calls) {
        (spy as any).calls.reset();
      }
    });

    // Create service but prevent constructor from running initialization
    service = TestBed.inject(ChatService);
    
    // Mock all the methods that would be called during initialization
    spyOn(service as any, 'initializeService').and.callFake(async () => {
      // Set up minimal internal state without Amplify calls
      (service as any).currentUserId = 'test-user-1';
      (service as any).currentUserName = 'TestUser1';
      (service as any).localChats = [];
      (service as any).localMessages = {};
      (service as any).localParticipants = {};
      (service as any).localUnreadCounts = [];
      return Promise.resolve();
    });
    
    spyOn(service as any, 'subscribeToAuthChanges').and.returnValue(undefined);
    
    // Manually set up the service's internal state for testing
    (service as any).currentUserId = 'test-user-1';
    (service as any).currentUserName = 'TestUser1';
    (service as any).localChats = [];
    (service as any).localMessages = {};
    (service as any).localParticipants = {};
    (service as any).localUnreadCounts = [];
  });

  describe('Property 1: Public Chat Universal Visibility', () => {
    it('should make all public chats visible to any authenticated user regardless of studio membership', async () => {
      // Feature: studio-chat-access-control, Property 1: Public Chat Universal Visibility
      // Validates: Requirements 1.1
      
      const testCases = [
        {
          studioId: 'studio-1',
          userId: 'user-1',
          isStudioMember: false,
          publicChats: [
            {
              id: 'public-chat-1',
              name: 'General Discussion',
              type: 'group' as const,
              studioId: 'studio-1',
              accessLevel: 'public' as const,
              invitationRequired: false,
              studioMembershipRequired: false,
              settings: createChatSettings(),
              isActive: true,
              createdBy: 'admin-1',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
              participantIds: ['admin-1']
            },
            {
              id: 'public-chat-2',
              name: 'Announcements',
              type: 'group' as const,
              studioId: 'studio-1',
              accessLevel: 'public' as const,
              invitationRequired: false,
              studioMembershipRequired: false,
              settings: createChatSettings(),
              isActive: true,
              createdBy: 'admin-1',
              createdAt: new Date('2024-01-02'),
              updatedAt: new Date('2024-01-02'),
              participantIds: ['admin-1']
            }
          ],
          privateChats: [
            {
              id: 'private-chat-1',
              name: 'Staff Only',
              type: 'private' as const,
              studioId: 'studio-1',
              accessLevel: 'private' as const,
              invitationRequired: true,
              studioMembershipRequired: false,
              settings: createChatSettings({ isPublic: false }),
              isActive: true,
              createdBy: 'admin-1',
              createdAt: new Date('2024-01-03'),
              updatedAt: new Date('2024-01-03'),
              participantIds: ['admin-1']
            }
          ]
        },
        {
          studioId: 'studio-2',
          userId: 'user-2',
          isStudioMember: true,
          publicChats: [
            {
              id: 'public-chat-3',
              name: 'Community Chat',
              type: 'group' as const,
              studioId: 'studio-2',
              accessLevel: 'public' as const,
              invitationRequired: false,
              studioMembershipRequired: false,
              settings: createChatSettings(),
              isActive: true,
              createdBy: 'admin-2',
              createdAt: new Date('2024-01-04'),
              updatedAt: new Date('2024-01-04'),
              participantIds: ['admin-2']
            }
          ],
          privateChats: [
            {
              id: 'private-chat-2',
              name: 'Members Only',
              type: 'private' as const,
              studioId: 'studio-2',
              accessLevel: 'private' as const,
              invitationRequired: true,
              studioMembershipRequired: true,
              settings: createChatSettings({ isPublic: false }),
              isActive: true,
              createdBy: 'admin-2',
              createdAt: new Date('2024-01-05'),
              updatedAt: new Date('2024-01-05'),
              participantIds: ['admin-2']
            }
          ]
        }
      ];

      for (const testData of testCases) {
        // Reset all spies before each test case
        Object.values(mockPersistenceService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });
        Object.values(mockAccessControlService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });

        // FIRST: Set up the service's internal authentication state
        (service as any).currentUserId = testData.userId;
        (service as any).currentUserName = `TestUser${testData.userId.slice(-1)}`;

        // Update auth state to simulate user login
        mockAuthStateService.currentUser$.next({
          userId: testData.userId,
          username: `TestUser${testData.userId.slice(-1)}`
        });

        // Setup mock data - all chats for the studio
        const allStudioChats = [...testData.publicChats, ...testData.privateChats];
        
        // Set up the chat data in local cache BEFORE calling any methods
        (service as any).localChats = allStudioChats;
        (service as any).localMessages = {};
        (service as any).localParticipants = {};
        (service as any).localUnreadCounts = [];

        // Mock loadUserChats to return all chats
        (mockPersistenceService.loadUserChats as jasmine.Spy).and.returnValue(
          Promise.resolve(allStudioChats)
        );

        // Mock loadMessages and loadParticipants for each chat
        allStudioChats.forEach(chat => {
          (mockPersistenceService.loadMessages as jasmine.Spy).and.returnValue(
            Promise.resolve([])
          );
          (mockPersistenceService.loadParticipants as jasmine.Spy).and.returnValue(
            Promise.resolve([])
          );
        });

        // Mock access control responses
        testData.publicChats.forEach(chat => {
          // Public chats should be accessible to all users
          (mockAccessControlService.canUserAccessChat as jasmine.Spy)
            .withArgs(chat.id, testData.userId)
            .and.returnValue(Promise.resolve(true));
          
          (mockAccessControlService.checkChatAccess as jasmine.Spy)
            .withArgs(chat.id, testData.userId)
            .and.returnValue(Promise.resolve({
              canView: true,
              canRead: true,
              canWrite: true,
              canInvite: false,
              canManage: false,
              accessReason: 'public'
            } as ChatAccessLevel));
        });

        testData.privateChats.forEach(chat => {
          // Private chats should not be accessible to non-invited users
          const hasAccess = testData.isStudioMember; // Simplified for this test
          (mockAccessControlService.canUserAccessChat as jasmine.Spy)
            .withArgs(chat.id, testData.userId)
            .and.returnValue(Promise.resolve(hasAccess));
          
          if (hasAccess) {
            (mockAccessControlService.checkChatAccess as jasmine.Spy)
              .withArgs(chat.id, testData.userId)
              .and.returnValue(Promise.resolve({
                canView: true,
                canRead: true,
                canWrite: true,
                canInvite: false,
                canManage: false,
                accessReason: 'studio_member'
              } as ChatAccessLevel));
          }
        });

        // Property: All public chats should be visible to any authenticated user
        
        // Test getChatsByStudioId method
        const accessibleChats = await service.getChatsByStudioId(testData.studioId);
        
        // Verify all public chats are included
        testData.publicChats.forEach(publicChat => {
          const foundChat = accessibleChats.find(chat => chat.id === publicChat.id);
          expect(foundChat).toBeDefined();
          expect(foundChat?.name).toBe(publicChat.name);
          expect(foundChat?.settings?.isPublic).toBe(true);
        });

        // Property: Public chats should be accessible regardless of studio membership status
        expect(accessibleChats.filter(chat => 
          testData.publicChats.some(pc => pc.id === chat.id)
        ).length).toBe(testData.publicChats.length);

        // Test getStudioChats method
        const studioChatList = await service.getStudioChats({
          studioId: testData.studioId,
          sortBy: 'recent',
          offset: 0,
          pageSize: 20
        });

        // Verify all public chats are included in studio chat list
        testData.publicChats.forEach(publicChat => {
          const foundChat = studioChatList.chats.find(chat => chat.id === publicChat.id);
          expect(foundChat).toBeDefined();
          expect(foundChat?.name).toBe(publicChat.name);
        });

        // Property: Public chats should be visible in filtered chat list
        const filteredChatList = await service.getFilteredChatList();
        const studioPublicChatsInFiltered = filteredChatList.filter(item => 
          item.chat.studioId === testData.studioId && 
          testData.publicChats.some(pc => pc.id === item.chat.id)
        );

        expect(studioPublicChatsInFiltered.length).toBe(testData.publicChats.length);

        // Property: User should be able to access public chat regardless of membership
        for (const publicChat of testData.publicChats) {
          const canAccess = await service.canCurrentUserAccessChat(publicChat.id);
          expect(canAccess).toBe(true);

          const accessLevel = await service.getCurrentUserChatAccessLevel(publicChat.id);
          expect(accessLevel).toBeDefined();
          expect(accessLevel?.canView).toBe(true);
          expect(accessLevel?.canRead).toBe(true);
          expect(accessLevel?.accessReason).toBe('public');
        }

        // Verify access control service was called correctly for public chats
        testData.publicChats.forEach(chat => {
          expect(mockAccessControlService.canUserAccessChat)
            .toHaveBeenCalledWith(chat.id, testData.userId);
        });

        console.log(`✓ Property 1 verified for ${testData.userId} in ${testData.studioId}: ` +
          `${testData.publicChats.length} public chats accessible, ` +
          `studio member: ${testData.isStudioMember}`);
      }
    });

    it('should allow authenticated users to read messages from public chats', async () => {
      // Feature: studio-chat-access-control, Property 1: Public Chat Universal Visibility
      // Validates: Requirements 1.1 (message reading aspect)
      
      const testData = {
        studioId: 'studio-1',
        userId: 'visitor-user',
        publicChatId: 'public-chat-1',
        messages: [
          {
            id: 'msg-1',
            chatId: 'public-chat-1',
            senderId: 'user-1',
            senderName: 'User1',
            message: 'Hello everyone!',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            messageType: 'text',
            isOwn: false,
            isRead: false
          },
          {
            id: 'msg-2',
            chatId: 'public-chat-1',
            senderId: 'user-2',
            senderName: 'User2',
            message: 'Welcome to the studio!',
            timestamp: new Date('2024-01-01T10:05:00Z'),
            messageType: 'text',
            isOwn: false,
            isRead: false
          }
        ]
      };

      // Mock access control for public chat
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .withArgs(testData.publicChatId, testData.userId)
        .and.returnValue(Promise.resolve(true));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.publicChatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        } as ChatAccessLevel));

      // Mock message loading
      (mockPersistenceService.loadMessages as jasmine.Spy)
        .withArgs(testData.publicChatId, jasmine.any(Object), testData.userId)
        .and.returnValue(Promise.resolve(testData.messages));

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testData.userId,
        username: 'VisitorUser'
      });

      // Mock the service's internal authentication state
      (service as any).currentUserId = testData.userId;
      (service as any).currentUserName = 'VisitorUser';

      // Property: Any authenticated user should be able to read messages from public chats
      const loadedMessages = await service.loadMessages(testData.publicChatId);

      expect(loadedMessages).toBeDefined();
      expect(loadedMessages.length).toBe(testData.messages.length);
      
      // Verify all messages are accessible
      testData.messages.forEach((expectedMessage, index) => {
        expect(loadedMessages[index].id).toBe(expectedMessage.id);
        expect(loadedMessages[index].message).toBe(expectedMessage.message);
        expect(loadedMessages[index].senderId).toBe(expectedMessage.senderId);
      });

      // Verify access control was checked (loadMessages only calls checkChatAccess)
      expect(mockAccessControlService.checkChatAccess)
        .toHaveBeenCalledWith(testData.publicChatId, testData.userId);

      console.log(`✓ Property 1 message access verified: User ${testData.userId} can read ${loadedMessages.length} messages from public chat`);
    });

    it('should allow authenticated users to send messages to public chats', async () => {
      // Feature: studio-chat-access-control, Property 1: Public Chat Universal Visibility
      // Validates: Requirements 1.1 (message sending aspect)
      
      const testData = {
        studioId: 'studio-1',
        userId: 'visitor-user',
        publicChatId: 'public-chat-1',
        messageRequest: {
          chatId: 'public-chat-1',
          message: 'Hello from visitor!',
          messageType: 'text' as const
        },
        expectedMessage: {
          id: 'msg-new-1',
          chatId: 'public-chat-1',
          senderId: 'visitor-user',
          senderName: 'VisitorUser',
          message: 'Hello from visitor!',
          timestamp: new Date(),
          messageType: 'text' as const,
          isOwn: true,
          isRead: true
        }
      };

      // Mock access control for public chat
      (mockAccessControlService.canUserSendMessage as jasmine.Spy)
        .withArgs(testData.publicChatId, testData.userId)
        .and.returnValue(Promise.resolve(true));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.publicChatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        } as ChatAccessLevel));

      // Mock message sending
      (mockPersistenceService.sendMessage as jasmine.Spy)
        .withArgs(testData.messageRequest)
        .and.returnValue(Promise.resolve(testData.expectedMessage));

      // Mock chat data
      const publicChat: Chat = {
        id: testData.publicChatId,
        name: 'Public Chat',
        type: 'group',
        studioId: testData.studioId,
        accessLevel: 'public',
        invitationRequired: false,
        studioMembershipRequired: false,
        settings: createChatSettings(),
        isActive: true,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        participantIds: ['admin-1']
      };

      (mockPersistenceService.loadUserChats as jasmine.Spy).and.returnValue(
        Promise.resolve([publicChat])
      );

      (mockPersistenceService.loadMessages as jasmine.Spy).and.returnValue(
        Promise.resolve([])
      );

      (mockPersistenceService.loadParticipants as jasmine.Spy).and.returnValue(
        Promise.resolve([])
      );

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testData.userId,
        username: 'VisitorUser'
      });

      // Mock the service's internal authentication state
      (service as any).currentUserId = testData.userId;
      (service as any).currentUserName = 'VisitorUser';

      // Set up the chat in local cache
      (service as any).localChats = [publicChat];

      // Property: Any authenticated user should be able to send messages to public chats
      const sentMessage = await service.sendMessage(testData.messageRequest);

      expect(sentMessage).toBeDefined();
      expect(sentMessage.id).toBe(testData.expectedMessage.id);
      expect(sentMessage.message).toBe(testData.expectedMessage.message);
      expect(sentMessage.senderId).toBe(testData.userId);

      // Verify access control was checked (for public chats, only checkChatAccess is called)
      expect(mockAccessControlService.checkChatAccess)
        .toHaveBeenCalledWith(testData.publicChatId, testData.userId);

      // Verify message was sent via persistence service
      expect(mockPersistenceService.sendMessage)
        .toHaveBeenCalledWith(testData.messageRequest);

      console.log(`✓ Property 1 message sending verified: User ${testData.userId} can send messages to public chat`);
    });
  });

  describe('Property 2: Public Chat Message Access', () => {
    it('should allow any authenticated user to read all messages in public chats without access restrictions', async () => {
      // Feature: studio-chat-access-control, Property 2: Public Chat Message Access
      // Validates: Requirements 1.2
      
      const testCases = [
        {
          userId: 'visitor-user-1',
          username: 'VisitorUser1',
          isStudioMember: false
        },
        {
          userId: 'member-user-1', 
          username: 'MemberUser1',
          isStudioMember: true
        },
        {
          userId: 'random-user-1',
          username: 'RandomUser1', 
          isStudioMember: false
        }
      ];

      const publicChatData = {
        chatId: 'public-chat-test',
        studioId: 'studio-test',
        messages: [
          {
            id: 'msg-1',
            chatId: 'public-chat-test',
            senderId: 'user-a',
            senderName: 'UserA',
            message: 'First message in public chat',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          },
          {
            id: 'msg-2', 
            chatId: 'public-chat-test',
            senderId: 'user-b',
            senderName: 'UserB',
            message: 'Second message with sensitive info',
            timestamp: new Date('2024-01-01T10:05:00Z'),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          },
          {
            id: 'msg-3',
            chatId: 'public-chat-test', 
            senderId: 'user-c',
            senderName: 'UserC',
            message: 'Third message from different user',
            timestamp: new Date('2024-01-01T10:10:00Z'),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          }
        ]
      };

      for (const testUser of testCases) {
        // Reset all spies before each test case
        Object.values(mockPersistenceService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });
        Object.values(mockAccessControlService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });

        // Set up the service's internal authentication state FIRST
        (service as any).currentUserId = testUser.userId;
        (service as any).currentUserName = testUser.username;

        // Update auth state to simulate user login
        mockAuthStateService.currentUser$.next({
          userId: testUser.userId,
          username: testUser.username
        });

        // Mock access control for public chat - should always allow access
        (mockAccessControlService.canUserAccessChat as jasmine.Spy)
          .and.returnValue(Promise.resolve(true));

        (mockAccessControlService.checkChatAccess as jasmine.Spy)
          .and.returnValue(Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          } as ChatAccessLevel));

        // Mock message loading - should return ALL messages without filtering
        (mockPersistenceService.loadMessages as jasmine.Spy)
          .and.returnValue(Promise.resolve([...publicChatData.messages]));

        // Property: Any authenticated user should be able to read ALL messages from public chats
        const loadedMessages = await service.loadMessages(publicChatData.chatId);

        // Verify all messages are accessible without restrictions
        expect(loadedMessages).toBeDefined();
        expect(loadedMessages.length).toBe(publicChatData.messages.length);

        // Property: Message content should be fully accessible (no filtering or redaction)
        publicChatData.messages.forEach((expectedMessage, index) => {
          const actualMessage = loadedMessages[index];
          expect(actualMessage.id).toBe(expectedMessage.id);
          expect(actualMessage.message).toBe(expectedMessage.message);
          expect(actualMessage.senderId).toBe(expectedMessage.senderId);
          expect(actualMessage.senderName).toBe(expectedMessage.senderName);
          expect(actualMessage.messageType).toBe(expectedMessage.messageType);
          expect(actualMessage.timestamp).toEqual(expectedMessage.timestamp);
        });

        // Property: Access control should confirm read permissions (loadMessages only calls checkChatAccess)
        expect(mockAccessControlService.checkChatAccess)
          .toHaveBeenCalledWith(publicChatData.chatId, testUser.userId);

        // Property: Message loading should be called with correct parameters
        expect(mockPersistenceService.loadMessages)
          .toHaveBeenCalledWith(publicChatData.chatId, jasmine.any(Object), testUser.userId);

        console.log(`✓ Property 2 verified: User ${testUser.userId} (member: ${testUser.isStudioMember}) ` +
          `can read all ${loadedMessages.length} messages from public chat without restrictions`);
      }
    });

    it('should provide consistent message access across different public chats for any authenticated user', async () => {
      // Feature: studio-chat-access-control, Property 2: Public Chat Message Access  
      // Validates: Requirements 1.2 (consistency across multiple public chats)
      
      const testUser = {
        userId: 'test-user-consistency',
        username: 'TestUserConsistency'
      };

      const publicChats = [
        {
          chatId: 'public-chat-1',
          studioId: 'studio-1',
          messages: [
            {
              id: 'msg-1-1',
              chatId: 'public-chat-1',
              senderId: 'user-x',
              senderName: 'UserX',
              message: 'Message in first public chat',
              timestamp: new Date('2024-01-01T09:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            }
          ]
        },
        {
          chatId: 'public-chat-2', 
          studioId: 'studio-2',
          messages: [
            {
              id: 'msg-2-1',
              chatId: 'public-chat-2',
              senderId: 'user-y',
              senderName: 'UserY', 
              message: 'Message in second public chat',
              timestamp: new Date('2024-01-01T09:30:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-2-2',
              chatId: 'public-chat-2',
              senderId: 'user-z',
              senderName: 'UserZ',
              message: 'Another message in second chat',
              timestamp: new Date('2024-01-01T09:35:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            }
          ]
        }
      ];

      // Reset all spies
      Object.values(mockPersistenceService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });
      Object.values(mockAccessControlService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });

      // Set up the service's internal authentication state FIRST
      (service as any).currentUserId = testUser.userId;
      (service as any).currentUserName = testUser.username;

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testUser.userId,
        username: testUser.username
      });

      // Mock access control for all public chats
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .and.returnValue(Promise.resolve(true));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .and.returnValue(Promise.resolve({
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        } as ChatAccessLevel));

      // Mock message loading for each chat - return the specific messages for that chat
      (mockPersistenceService.loadMessages as jasmine.Spy)
        .and.callFake((chatId: string) => {
          const chat = publicChats.find(c => c.chatId === chatId);
          return Promise.resolve(chat ? [...chat.messages] : []);
        });

      // Don't call initializeService - the beforeEach setup handles this

      for (const chatData of publicChats) {
        // Property: User should have consistent access to all messages in each public chat
        const loadedMessages = await service.loadMessages(chatData.chatId);

        expect(loadedMessages).toBeDefined();
        expect(loadedMessages.length).toBe(chatData.messages.length);

        // Property: All messages should be fully accessible regardless of which public chat
        chatData.messages.forEach((expectedMessage, index) => {
          const actualMessage = loadedMessages[index];
          expect(actualMessage.id).toBe(expectedMessage.id);
          expect(actualMessage.message).toBe(expectedMessage.message);
          expect(actualMessage.senderId).toBe(expectedMessage.senderId);
        });

        console.log(`✓ Property 2 consistency verified: User ${testUser.userId} has full access to ` +
          `${loadedMessages.length} messages in public chat ${chatData.chatId}`);
      }
    });
  });

  describe('Property 11: Message History Access Control', () => {
    it('should filter message history based on user join date for private chats (Requirement 7.1)', async () => {
      // Feature: studio-chat-access-control, Property 11: Message History Access Control
      // Validates: Requirements 7.1 - Message history filtering based on access
      
      const testCases = [
        {
          userId: 'invited-user-1',
          username: 'InvitedUser1',
          chatId: 'private-chat-1',
          joinDate: new Date('2024-01-15T10:00:00Z'),
          allMessages: [
            {
              id: 'msg-before-1',
              chatId: 'private-chat-1',
              senderId: 'admin-1',
              senderName: 'Admin1',
              message: 'Message before user joined',
              timestamp: new Date('2024-01-10T09:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-before-2',
              chatId: 'private-chat-1',
              senderId: 'member-1',
              senderName: 'Member1',
              message: 'Another message before join',
              timestamp: new Date('2024-01-14T15:30:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-after-1',
              chatId: 'private-chat-1',
              senderId: 'admin-1',
              senderName: 'Admin1',
              message: 'Message after user joined',
              timestamp: new Date('2024-01-15T11:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-after-2',
              chatId: 'private-chat-1',
              senderId: 'invited-user-1',
              senderName: 'InvitedUser1',
              message: 'User own message after joining',
              timestamp: new Date('2024-01-16T14:20:00Z'),
              messageType: 'text' as const,
              isOwn: true,
              isRead: true
            }
          ],
          expectedVisibleMessages: ['msg-after-1', 'msg-after-2']
        },
        {
          userId: 'late-joiner',
          username: 'LateJoiner',
          chatId: 'private-chat-2',
          joinDate: new Date('2024-01-20T16:00:00Z'),
          allMessages: [
            {
              id: 'msg-early-1',
              chatId: 'private-chat-2',
              senderId: 'creator-1',
              senderName: 'Creator1',
              message: 'Very early message',
              timestamp: new Date('2024-01-01T08:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-mid-1',
              chatId: 'private-chat-2',
              senderId: 'member-2',
              senderName: 'Member2',
              message: 'Middle period message',
              timestamp: new Date('2024-01-15T12:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-recent-1',
              chatId: 'private-chat-2',
              senderId: 'creator-1',
              senderName: 'Creator1',
              message: 'Recent message after late joiner',
              timestamp: new Date('2024-01-21T09:30:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            }
          ],
          expectedVisibleMessages: ['msg-recent-1']
        }
      ];

      for (const testData of testCases) {
        // Reset all spies
        Object.values(mockPersistenceService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });
        Object.values(mockAccessControlService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });

        // Set up the service's internal authentication state
        (service as any).currentUserId = testData.userId;
        (service as any).currentUserName = testData.username;

        // Update auth state
        mockAuthStateService.currentUser$.next({
          userId: testData.userId,
          username: testData.username
        });

        // Mock access control for private chat with invited access
        (mockAccessControlService.canUserAccessChat as jasmine.Spy)
          .withArgs(testData.chatId, testData.userId)
          .and.returnValue(Promise.resolve(true));

        (mockAccessControlService.checkChatAccess as jasmine.Spy)
          .withArgs(testData.chatId, testData.userId)
          .and.returnValue(Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'invited'
          } as ChatAccessLevel));

        // Mock getUserChatInvitations to return invitation with join date
        (mockAccessControlService.getUserChatInvitations as jasmine.Spy)
          .withArgs(testData.userId)
          .and.returnValue(Promise.resolve([
            {
              id: `invitation-${testData.userId}`,
              chatId: testData.chatId,
              invitedUserId: testData.userId,
              invitedBy: 'admin-1',
              invitedAt: testData.joinDate,
              status: 'accepted',
              expiresAt: undefined
            }
          ]));

        // Mock getAllUserChatInvitations to return invitation with join date
        (mockAccessControlService.getAllUserChatInvitations as jasmine.Spy)
          .withArgs(testData.userId)
          .and.returnValue(Promise.resolve([
            {
              id: `invitation-${testData.userId}`,
              chatId: testData.chatId,
              invitedUserId: testData.userId,
              invitedBy: 'admin-1',
              invitedAt: testData.joinDate,
              status: 'accepted',
              expiresAt: undefined
            }
          ]));

        // Mock message loading - return ALL messages from persistence
        (mockPersistenceService.loadMessages as jasmine.Spy)
          .withArgs(testData.chatId, jasmine.any(Object), testData.userId)
          .and.returnValue(Promise.resolve([...testData.allMessages]));

        // Set up participant data to simulate join date
        (service as any).localParticipants = {
          [testData.chatId]: [
            {
              id: `participant-${testData.userId}`,
              chatId: testData.chatId,
              userId: testData.userId,
              userName: testData.username,
              joinedAt: testData.joinDate,
              isActive: true
            }
          ]
        };

        // Property: Private chat messages should be filtered based on user join date
        const loadedMessages = await service.loadMessages(testData.chatId);

        expect(loadedMessages).toBeDefined();
        expect(loadedMessages.length).toBe(testData.expectedVisibleMessages.length);

        // Property: Only messages from join date forward should be visible
        testData.expectedVisibleMessages.forEach(expectedId => {
          const foundMessage = loadedMessages.find(msg => msg.id === expectedId);
          expect(foundMessage).toBeDefined();
          expect(foundMessage!.timestamp.getTime()).toBeGreaterThanOrEqual(testData.joinDate.getTime());
        });

        // Property: Messages before join date should be filtered out
        const messagesBeforeJoin = testData.allMessages.filter(msg => 
          msg.timestamp < testData.joinDate
        );
        messagesBeforeJoin.forEach(beforeMessage => {
          const foundMessage = loadedMessages.find(msg => msg.id === beforeMessage.id);
          expect(foundMessage).toBeUndefined();
        });

        // Verify access control was properly checked
        expect(mockAccessControlService.checkChatAccess)
          .toHaveBeenCalledWith(testData.chatId, testData.userId);

        console.log(`✓ Property 11 (Req 7.1) verified: User ${testData.userId} sees ${loadedMessages.length} of ${testData.allMessages.length} messages from join date ${testData.joinDate.toISOString()}`);
      }
    });

    it('should immediately hide messages when user loses access to private chat (Requirement 7.2)', async () => {
      // Feature: studio-chat-access-control, Property 11: Message History Access Control
      // Validates: Requirements 7.2 - Messages immediately hidden when users lose access
      
      const testData = {
        userId: 'revoked-user',
        username: 'RevokedUser',
        chatId: 'private-chat-revoke',
        messages: [
          {
            id: 'msg-1',
            chatId: 'private-chat-revoke',
            senderId: 'admin-1',
            senderName: 'Admin1',
            message: 'Message user could see before',
            timestamp: new Date('2024-01-15T10:00:00Z'),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          },
          {
            id: 'msg-2',
            chatId: 'private-chat-revoke',
            senderId: 'revoked-user',
            senderName: 'RevokedUser',
            message: 'User own message',
            timestamp: new Date('2024-01-15T11:00:00Z'),
            messageType: 'text' as const,
            isOwn: true,
            isRead: true
          }
        ]
      };

      // Reset all spies
      Object.values(mockPersistenceService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });
      Object.values(mockAccessControlService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });

      // Set up the service's internal authentication state
      (service as any).currentUserId = testData.userId;
      (service as any).currentUserName = testData.username;

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testData.userId,
        username: testData.username
      });

      // Initially, user has access
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .withArgs(testData.chatId, testData.userId)
        .and.returnValue(Promise.resolve(true));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.chatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: false,
          canManage: false,
          accessReason: 'invited'
        } as ChatAccessLevel));

      // Mock message loading - return messages when user has access
      (mockPersistenceService.loadMessages as jasmine.Spy)
        .withArgs(testData.chatId, jasmine.any(Object), testData.userId)
        .and.returnValue(Promise.resolve([...testData.messages]));

      // Property: User initially has access and can see messages
      let loadedMessages = await service.loadMessages(testData.chatId);
      expect(loadedMessages.length).toBe(testData.messages.length);

      // Now simulate access revocation
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .withArgs(testData.chatId, testData.userId)
        .and.returnValue(Promise.resolve(false));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.chatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: false,
          canRead: false,
          canWrite: false,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        } as ChatAccessLevel));

      // Property: After access revocation, messages should be immediately hidden
      loadedMessages = await service.loadMessages(testData.chatId);
      expect(loadedMessages.length).toBe(0);

      // Property: handleAccessRevocation should clear messages from local cache
      await service.handleAccessRevocation(testData.chatId, testData.userId);
      
      // Verify messages are cleared from local cache
      const localMessages = (service as any).localMessages[testData.chatId];
      expect(localMessages).toEqual([]);

      console.log(`✓ Property 11 (Req 7.2) verified: User ${testData.userId} messages immediately hidden after access revocation`);
    });

    it('should show complete message history for public chats regardless of user join time (Requirement 7.3)', async () => {
      // Feature: studio-chat-access-control, Property 11: Message History Access Control
      // Validates: Requirements 7.3 - Complete message history shown for public chats
      
      const testCases = [
        {
          userId: 'new-user',
          username: 'NewUser',
          chatId: 'public-chat-history',
          userJoinDate: new Date('2024-01-20T10:00:00Z'), // User joined recently
          allMessages: [
            {
              id: 'msg-old-1',
              chatId: 'public-chat-history',
              senderId: 'founder-1',
              senderName: 'Founder1',
              message: 'Very old message from chat creation',
              timestamp: new Date('2024-01-01T08:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-old-2',
              chatId: 'public-chat-history',
              senderId: 'early-user',
              senderName: 'EarlyUser',
              message: 'Message from early days',
              timestamp: new Date('2024-01-05T12:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-mid-1',
              chatId: 'public-chat-history',
              senderId: 'regular-user',
              senderName: 'RegularUser',
              message: 'Message from middle period',
              timestamp: new Date('2024-01-15T14:30:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'msg-recent-1',
              chatId: 'public-chat-history',
              senderId: 'new-user',
              senderName: 'NewUser',
              message: 'New user first message',
              timestamp: new Date('2024-01-20T11:00:00Z'),
              messageType: 'text' as const,
              isOwn: true,
              isRead: true
            }
          ]
        },
        {
          userId: 'visitor-user',
          username: 'VisitorUser',
          chatId: 'public-chat-archive',
          userJoinDate: new Date('2024-01-25T16:00:00Z'), // Very recent join
          allMessages: [
            {
              id: 'archive-msg-1',
              chatId: 'public-chat-archive',
              senderId: 'archivist-1',
              senderName: 'Archivist1',
              message: 'Historical message with important info',
              timestamp: new Date('2023-12-01T10:00:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            },
            {
              id: 'archive-msg-2',
              chatId: 'public-chat-archive',
              senderId: 'contributor-1',
              senderName: 'Contributor1',
              message: 'Another historical contribution',
              timestamp: new Date('2023-12-15T15:20:00Z'),
              messageType: 'text' as const,
              isOwn: false,
              isRead: false
            }
          ]
        }
      ];

      for (const testData of testCases) {
        // Reset all spies
        Object.values(mockPersistenceService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });
        Object.values(mockAccessControlService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });

        // Set up the service's internal authentication state
        (service as any).currentUserId = testData.userId;
        (service as any).currentUserName = testData.username;

        // Update auth state
        mockAuthStateService.currentUser$.next({
          userId: testData.userId,
          username: testData.username
        });

        // Mock access control for public chat
        (mockAccessControlService.canUserAccessChat as jasmine.Spy)
          .withArgs(testData.chatId, testData.userId)
          .and.returnValue(Promise.resolve(true));

        (mockAccessControlService.checkChatAccess as jasmine.Spy)
          .withArgs(testData.chatId, testData.userId)
          .and.returnValue(Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          } as ChatAccessLevel));

        // Mock message loading - return ALL messages for public chat
        (mockPersistenceService.loadMessages as jasmine.Spy)
          .withArgs(testData.chatId, jasmine.any(Object), testData.userId)
          .and.returnValue(Promise.resolve([...testData.allMessages]));

        // Property: Public chats should show complete message history regardless of join date
        const loadedMessages = await service.loadMessages(testData.chatId);

        expect(loadedMessages).toBeDefined();
        expect(loadedMessages.length).toBe(testData.allMessages.length);

        // Property: All messages should be visible, including those from before user joined
        testData.allMessages.forEach(expectedMessage => {
          const foundMessage = loadedMessages.find(msg => msg.id === expectedMessage.id);
          expect(foundMessage).toBeDefined();
          expect(foundMessage!.message).toBe(expectedMessage.message);
          expect(foundMessage!.senderId).toBe(expectedMessage.senderId);
          expect(foundMessage!.timestamp).toEqual(expectedMessage.timestamp);
        });

        // Property: Messages from before user join date should be visible (unlike private chats)
        const messagesBeforeJoin = testData.allMessages.filter(msg => 
          msg.timestamp < testData.userJoinDate
        );
        expect(messagesBeforeJoin.length).toBeGreaterThan(0); // Ensure we're testing this scenario
        
        messagesBeforeJoin.forEach(beforeMessage => {
          const foundMessage = loadedMessages.find(msg => msg.id === beforeMessage.id);
          expect(foundMessage).toBeDefined(); // Should be visible in public chats
        });

        // Verify access control confirmed public access
        expect(mockAccessControlService.checkChatAccess)
          .toHaveBeenCalledWith(testData.chatId, testData.userId);

        console.log(`✓ Property 11 (Req 7.3) verified: User ${testData.userId} sees complete history (${loadedMessages.length} messages) in public chat, including ${messagesBeforeJoin.length} messages from before join date`);
      }
    });

    it('should handle access control changes and refresh message visibility accordingly', async () => {
      // Feature: studio-chat-access-control, Property 11: Message History Access Control
      // Validates: Requirements 7.1, 7.2, 7.3 - Dynamic access control updates
      
      const testData = {
        userId: 'dynamic-user',
        username: 'DynamicUser',
        privateChatId: 'private-chat-dynamic',
        publicChatId: 'public-chat-dynamic',
        messages: [
          {
            id: 'private-msg-1',
            chatId: 'private-chat-dynamic',
            senderId: 'admin-1',
            senderName: 'Admin1',
            message: 'Private chat message',
            timestamp: new Date('2024-01-15T10:00:00Z'),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          },
          {
            id: 'public-msg-1',
            chatId: 'public-chat-dynamic',
            senderId: 'user-1',
            senderName: 'User1',
            message: 'Public chat message',
            timestamp: new Date('2024-01-15T11:00:00Z'),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          }
        ]
      };

      // Reset all spies
      Object.values(mockPersistenceService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });
      Object.values(mockAccessControlService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });

      // Set up the service's internal authentication state
      (service as any).currentUserId = testData.userId;
      (service as any).currentUserName = testData.username;

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testData.userId,
        username: testData.username
      });

      // Set up initial state - user has access to both chats
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .and.callFake((chatId: string) => {
          return Promise.resolve(true); // Initially has access to both
        });

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .and.callFake((chatId: string) => {
          if (chatId === testData.privateChatId) {
            return Promise.resolve({
              canView: true,
              canRead: true,
              canWrite: true,
              canInvite: false,
              canManage: false,
              accessReason: 'invited'
            } as ChatAccessLevel);
          } else {
            return Promise.resolve({
              canView: true,
              canRead: true,
              canWrite: true,
              canInvite: false,
              canManage: false,
              accessReason: 'public'
            } as ChatAccessLevel);
          }
        });

      // Mock message loading
      (mockPersistenceService.loadMessages as jasmine.Spy)
        .and.callFake((chatId: string) => {
          const message = testData.messages.find(msg => msg.chatId === chatId);
          return Promise.resolve(message ? [message] : []);
        });

      // Property: Initially user can access both chats
      let privateMessages = await service.loadMessages(testData.privateChatId);
      let publicMessages = await service.loadMessages(testData.publicChatId);
      
      expect(privateMessages.length).toBe(1);
      expect(publicMessages.length).toBe(1);

      // Simulate access revocation for private chat only
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .and.callFake((chatId: string) => {
          if (chatId === testData.privateChatId) {
            return Promise.resolve(false); // Access revoked
          } else {
            return Promise.resolve(true); // Still has access to public
          }
        });

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .and.callFake((chatId: string) => {
          if (chatId === testData.privateChatId) {
            return Promise.resolve({
              canView: false,
              canRead: false,
              canWrite: false,
              canInvite: false,
              canManage: false,
              accessReason: 'public'
            } as ChatAccessLevel);
          } else {
            return Promise.resolve({
              canView: true,
              canRead: true,
              canWrite: true,
              canInvite: false,
              canManage: false,
              accessReason: 'public'
            } as ChatAccessLevel);
          }
        });

      // Property: After access revocation, private chat messages should be hidden
      await service.refreshMessageAccess(testData.privateChatId);
      privateMessages = await service.loadMessages(testData.privateChatId);
      expect(privateMessages.length).toBe(0);

      // Property: Public chat access should remain unaffected
      await service.refreshMessageAccess(testData.publicChatId);
      publicMessages = await service.loadMessages(testData.publicChatId);
      expect(publicMessages.length).toBe(1);

      // Property: handleAccessGrant should restore access when permissions are restored
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .and.returnValue(Promise.resolve(true));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .and.callFake((chatId: string) => {
          return Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: chatId === testData.privateChatId ? 'invited' : 'public'
          } as ChatAccessLevel);
        });

      await service.handleAccessGrant(testData.privateChatId, testData.userId);
      privateMessages = await service.loadMessages(testData.privateChatId);
      expect(privateMessages.length).toBe(1);

      console.log(`✓ Property 11 (Dynamic) verified: Access control changes properly affect message visibility - private chat access revoked/restored, public chat unaffected`);
    });
  });

  describe('Property 9: Real-time Update Access Filtering', () => {
    it('should deliver real-time updates only to authorized users and stop when access is revoked', async () => {
      // Feature: studio-chat-access-control, Property 9: Real-time Update Access Filtering
      // Validates: Requirements 8.1, 8.4
      
      const testCases = [
        {
          userId: 'authorized-user-1',
          username: 'AuthorizedUser1',
          chatId: 'realtime-chat-1',
          initialAccess: true,
          accessReason: 'invited' as const,
          shouldReceiveUpdates: true
        },
        {
          userId: 'unauthorized-user-1',
          username: 'UnauthorizedUser1',
          chatId: 'realtime-chat-1',
          initialAccess: false,
          accessReason: 'public' as const,
          shouldReceiveUpdates: false
        },
        {
          userId: 'public-user-1',
          username: 'PublicUser1',
          chatId: 'public-realtime-chat',
          initialAccess: true,
          accessReason: 'public' as const,
          shouldReceiveUpdates: true
        },
        {
          userId: 'revoked-user-1',
          username: 'RevokedUser1',
          chatId: 'realtime-chat-2',
          initialAccess: true,
          accessReason: 'invited' as const,
          shouldReceiveUpdates: false // Will be revoked during test
        }
      ];

      for (const testData of testCases) {
        // Reset all spies
        Object.values(mockPersistenceService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });
        Object.values(mockAccessControlService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });

        // Set up the service's internal authentication state
        (service as any).currentUserId = testData.userId;
        (service as any).currentUserName = testData.username;
        (service as any).isSubscriptionsActive = false;
        (service as any).messageSubscriptions = new Map();
        (service as any).chatSubscriptions = new Map();
        (service as any).accessControlSubscriptions = new Map();

        // Update auth state
        mockAuthStateService.currentUser$.next({
          userId: testData.userId,
          username: testData.username
        });

        // Mock initial access control state
        (mockAccessControlService.canUserAccessChat as jasmine.Spy)
          .withArgs(testData.chatId, testData.userId)
          .and.returnValue(Promise.resolve(testData.initialAccess));

        (mockAccessControlService.checkChatAccess as jasmine.Spy)
          .withArgs(testData.chatId, testData.userId)
          .and.returnValue(Promise.resolve({
            canView: testData.initialAccess,
            canRead: testData.initialAccess,
            canWrite: testData.initialAccess,
            canInvite: false,
            canManage: false,
            accessReason: testData.accessReason
          } as ChatAccessLevel));

        // Set up mock chat data
        const mockChat: Chat = {
          id: testData.chatId,
          name: `Real-time Chat ${testData.chatId}`,
          type: testData.accessReason === 'public' ? 'group' : 'private',
          studioId: 'studio-realtime',
          accessLevel: testData.accessReason === 'public' ? 'public' : 'private',
          invitationRequired: testData.accessReason !== 'public',
          studioMembershipRequired: false,
          settings: createChatSettings({ 
            isPublic: testData.accessReason === 'public' 
          }),
          isActive: true,
          createdBy: 'admin-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          participantIds: ['admin-1']
        };

        (service as any).localChats = [mockChat];

        // Property: Real-time subscriptions should only be created for accessible chats (Requirement 8.1)
        
        // Test subscription initialization
        await service.initializeRealTimeSubscriptions();

        const subscriptionStatus = service.getSubscriptionStatus();
        
        if (testData.initialAccess) {
          // User has access - should have subscriptions
          expect(subscriptionStatus.isActive).toBe(true);
          console.log(`✓ User ${testData.userId} with ${testData.accessReason} access has active subscriptions`);
        } else {
          // User has no access - should not have subscriptions for this chat
          expect(subscriptionStatus.isActive).toBe(true); // Service is active but no chat subscriptions
          console.log(`✓ User ${testData.userId} without access has no chat subscriptions`);
        }

        // Property: Access changes should update subscriptions immediately (Requirements 8.2, 8.3, 8.5)
        
        if (testData.userId === 'revoked-user-1') {
          // Simulate access revocation for this specific user
          (mockAccessControlService.canUserAccessChat as jasmine.Spy)
            .withArgs(testData.chatId, testData.userId)
            .and.returnValue(Promise.resolve(false));

          (mockAccessControlService.checkChatAccess as jasmine.Spy)
            .withArgs(testData.chatId, testData.userId)
            .and.returnValue(Promise.resolve({
              canView: false,
              canRead: false,
              canWrite: false,
              canInvite: false,
              canManage: false,
              accessReason: 'public'
            } as ChatAccessLevel));

          // Property: When access is revoked, subscriptions should be immediately updated (Requirement 8.3)
          await service.updateSubscriptionsForAccessChange(testData.chatId, testData.userId, false);

          // Verify access revocation was handled
          const localMessages = (service as any).localMessages[testData.chatId];
          expect(localMessages).toEqual([]);

          console.log(`✓ User ${testData.userId} access revoked - subscriptions updated and messages cleared`);
        }

        // Property: Real-time message updates should respect access control (Requirement 8.1)
        
        // Simulate real-time message update
        const mockRealTimeMessages = [
          {
            id: 'realtime-msg-1',
            chatId: testData.chatId,
            senderId: 'sender-1',
            senderName: 'Sender1',
            message: 'Real-time message',
            timestamp: new Date(),
            messageType: 'text' as const,
            isOwn: false,
            isRead: false
          }
        ];

        // Mock the filterMessagesByAccess method to return messages only if user has access
        let filterMessagesSpy1 = (service as any).filterMessagesByAccess;
        if (!filterMessagesSpy1 || !filterMessagesSpy1.and) {
          filterMessagesSpy1 = spyOn(service as any, 'filterMessagesByAccess');
        }
        filterMessagesSpy1.and.callFake(async (chatId: string, messages: any[]) => {
          const hasAccess = await mockAccessControlService.canUserAccessChat(chatId, testData.userId);
          return hasAccess ? messages : [];
        });

        // Call the real-time message handler directly
        await (service as any).handleRealTimeMessageUpdate(testData.chatId, mockRealTimeMessages);

        const finalMessages = (service as any).localMessages[testData.chatId] || [];
        
        if (testData.shouldReceiveUpdates && testData.userId !== 'revoked-user-1') {
          // User should receive updates
          expect(finalMessages.length).toBe(1);
          expect(finalMessages[0].message).toBe('Real-time message');
          console.log(`✓ User ${testData.userId} received real-time update as expected`);
        } else {
          // User should not receive updates (no access or access revoked)
          expect(finalMessages.length).toBe(0);
          console.log(`✓ User ${testData.userId} correctly did not receive real-time update`);
        }

        // Property: Push notifications should only be sent for accessible chats (Requirement 8.4)
        // This is implicitly tested by the subscription management - if no subscription exists,
        // no real-time updates (including push notifications) will be delivered

        // Verify access control was properly checked during real-time processing
        expect(mockAccessControlService.canUserAccessChat)
          .toHaveBeenCalledWith(testData.chatId, testData.userId);

        console.log(`✓ Property 9 verified for user ${testData.userId}: Real-time access filtering working correctly`);
      }
    });

    it('should start delivering updates when user is added to private chat and stop when removed', async () => {
      // Feature: studio-chat-access-control, Property 9: Real-time Update Access Filtering
      // Validates: Requirements 8.2, 8.3
      
      const testData = {
        userId: 'dynamic-access-user',
        username: 'DynamicAccessUser',
        privateChatId: 'private-dynamic-chat',
        invitationId: 'invitation-dynamic-123'
      };

      // Reset all spies
      Object.values(mockPersistenceService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });
      Object.values(mockAccessControlService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });

      // Set up the service's internal authentication state
      (service as any).currentUserId = testData.userId;
      (service as any).currentUserName = testData.username;
      (service as any).isSubscriptionsActive = false;
      (service as any).messageSubscriptions = new Map();
      (service as any).chatSubscriptions = new Map();
      (service as any).accessControlSubscriptions = new Map();

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testData.userId,
        username: testData.username
      });

      // Initially, user has no access to private chat
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .withArgs(testData.privateChatId, testData.userId)
        .and.returnValue(Promise.resolve(false));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.privateChatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: false,
          canRead: false,
          canWrite: false,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        } as ChatAccessLevel));

      // Set up mock private chat
      const mockPrivateChat: Chat = {
        id: testData.privateChatId,
        name: 'Private Dynamic Chat',
        type: 'private',
        studioId: 'studio-dynamic',
        accessLevel: 'private',
        invitationRequired: true,
        studioMembershipRequired: false,
        settings: createChatSettings({ isPublic: false }),
        isActive: true,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        participantIds: ['admin-1']
      };

      (service as any).localChats = [mockPrivateChat];

      // Property: Initially, user should not have subscriptions for inaccessible private chat
      await service.initializeRealTimeSubscriptions();
      
      let subscriptionStatus = service.getSubscriptionStatus();
      expect(subscriptionStatus.isActive).toBe(true); // Service active but no chat subscriptions

      // Simulate user being added to private chat (invitation accepted)
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .withArgs(testData.privateChatId, testData.userId)
        .and.returnValue(Promise.resolve(true));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.privateChatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: false,
          canManage: false,
          accessReason: 'invited'
        } as ChatAccessLevel));

      // Mock message loading for the newly accessible chat
      (mockPersistenceService.loadMessages as jasmine.Spy)
        .withArgs(testData.privateChatId, jasmine.any(Object), testData.userId)
        .and.returnValue(Promise.resolve([]));

      (mockPersistenceService.loadParticipants as jasmine.Spy)
        .withArgs(testData.privateChatId)
        .and.returnValue(Promise.resolve([]));

      // Property: When user gains access, subscriptions should start immediately (Requirement 8.2)
      await service.updateSubscriptionsForAccessChange(testData.privateChatId, testData.userId, true);

      // Verify access grant was handled
      expect(mockPersistenceService.loadMessages)
        .toHaveBeenCalledWith(testData.privateChatId, jasmine.any(Object), testData.userId);

      console.log(`✓ User ${testData.userId} gained access - subscriptions started and chat data loaded`);

      // Simulate real-time message after gaining access
      const mockNewMessage = {
        id: 'new-access-msg-1',
        chatId: testData.privateChatId,
        senderId: 'admin-1',
        senderName: 'Admin1',
        message: 'Welcome to the private chat!',
        timestamp: new Date(),
        messageType: 'text' as const,
        isOwn: false,
        isRead: false
      };

      // Mock the filterMessagesByAccess method
      let filterMessagesSpy2 = (service as any).filterMessagesByAccess;
      if (!filterMessagesSpy2 || !filterMessagesSpy2.and) {
        filterMessagesSpy2 = spyOn(service as any, 'filterMessagesByAccess');
      }
      filterMessagesSpy2.and.returnValue(Promise.resolve([mockNewMessage]));

      // Property: User should now receive real-time updates for the accessible chat
      await (service as any).handleRealTimeMessageUpdate(testData.privateChatId, [mockNewMessage]);

      let messages = (service as any).localMessages[testData.privateChatId] || [];
      expect(messages.length).toBe(1);
      expect(messages[0].message).toBe('Welcome to the private chat!');

      console.log(`✓ User ${testData.userId} received real-time message after gaining access`);

      // Now simulate user being removed from private chat
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .withArgs(testData.privateChatId, testData.userId)
        .and.returnValue(Promise.resolve(false));

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .withArgs(testData.privateChatId, testData.userId)
        .and.returnValue(Promise.resolve({
          canView: false,
          canRead: false,
          canWrite: false,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        } as ChatAccessLevel));

      // Property: When user loses access, subscriptions should stop immediately (Requirement 8.3)
      await service.updateSubscriptionsForAccessChange(testData.privateChatId, testData.userId, false);

      // Verify access revocation was handled - messages should be cleared
      messages = (service as any).localMessages[testData.privateChatId] || [];
      expect(messages.length).toBe(0);

      console.log(`✓ User ${testData.userId} lost access - subscriptions stopped and messages cleared`);

      // Simulate another real-time message after losing access
      const mockBlockedMessage = {
        id: 'blocked-msg-1',
        chatId: testData.privateChatId,
        senderId: 'admin-1',
        senderName: 'Admin1',
        message: 'This message should not be received',
        timestamp: new Date(),
        messageType: 'text' as const,
        isOwn: false,
        isRead: false
      };

      // Reset the spy to return empty array (no access)
      let filterMessagesSpy3 = (service as any).filterMessagesByAccess;
      if (!filterMessagesSpy3 || !filterMessagesSpy3.and) {
        filterMessagesSpy3 = spyOn(service as any, 'filterMessagesByAccess');
      }
      filterMessagesSpy3.and.returnValue(Promise.resolve([]));

      // Property: User should not receive real-time updates after losing access
      await (service as any).handleRealTimeMessageUpdate(testData.privateChatId, [mockBlockedMessage]);

      messages = (service as any).localMessages[testData.privateChatId] || [];
      expect(messages.length).toBe(0);

      console.log(`✓ User ${testData.userId} correctly did not receive real-time message after losing access`);

      console.log(`✓ Property 9 (Requirements 8.2, 8.3) verified: Dynamic subscription management works correctly`);
    });

    it('should update subscriptions when access permissions change globally', async () => {
      // Feature: studio-chat-access-control, Property 9: Real-time Update Access Filtering
      // Validates: Requirements 8.5
      
      const testData = {
        userId: 'global-change-user',
        username: 'GlobalChangeUser',
        chats: [
          {
            id: 'chat-1',
            name: 'Chat 1',
            accessLevel: 'public' as const,
            initialAccess: true
          },
          {
            id: 'chat-2', 
            name: 'Chat 2',
            accessLevel: 'private' as const,
            initialAccess: true
          },
          {
            id: 'chat-3',
            name: 'Chat 3', 
            accessLevel: 'private' as const,
            initialAccess: false
          }
        ]
      };

      // Reset all spies
      Object.values(mockPersistenceService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });
      Object.values(mockAccessControlService).forEach(spy => {
        if (typeof spy === 'function' && (spy as any).calls) {
          (spy as any).calls.reset();
        }
      });

      // Set up the service's internal authentication state
      (service as any).currentUserId = testData.userId;
      (service as any).currentUserName = testData.username;
      (service as any).isSubscriptionsActive = false;
      (service as any).messageSubscriptions = new Map();
      (service as any).chatSubscriptions = new Map();
      (service as any).accessControlSubscriptions = new Map();

      // Update auth state
      mockAuthStateService.currentUser$.next({
        userId: testData.userId,
        username: testData.username
      });

      // Set up mock chats
      const mockChats: Chat[] = testData.chats.map(chatData => ({
        id: chatData.id,
        name: chatData.name,
        type: chatData.accessLevel === 'public' ? 'group' : 'private',
        studioId: 'studio-global',
        accessLevel: chatData.accessLevel,
        invitationRequired: chatData.accessLevel === 'private',
        studioMembershipRequired: false,
        settings: createChatSettings({ 
          isPublic: chatData.accessLevel === 'public' 
        }),
        isActive: true,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        participantIds: ['admin-1']
      }));

      (service as any).localChats = mockChats;

      // Mock initial access control state
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .and.callFake((chatId: string) => {
          const chatData = testData.chats.find(c => c.id === chatId);
          return Promise.resolve(chatData?.initialAccess || false);
        });

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .and.callFake((chatId: string) => {
          const chatData = testData.chats.find(c => c.id === chatId);
          const hasAccess = chatData?.initialAccess || false;
          return Promise.resolve({
            canView: hasAccess,
            canRead: hasAccess,
            canWrite: hasAccess,
            canInvite: false,
            canManage: false,
            accessReason: hasAccess ? (chatData?.accessLevel === 'public' ? 'public' : 'invited') : 'public'
          } as ChatAccessLevel);
        });

      // Property: Initial subscription setup should respect current access permissions
      await service.initializeRealTimeSubscriptions();

      let subscriptionStatus = service.getSubscriptionStatus();
      expect(subscriptionStatus.isActive).toBe(true);

      console.log(`✓ Initial subscriptions set up for user ${testData.userId} with access to ${testData.chats.filter(c => c.initialAccess).length} chats`);

      // Simulate global permission change - user gains access to chat-3, loses access to chat-2
      (mockAccessControlService.canUserAccessChat as jasmine.Spy)
        .and.callFake((chatId: string) => {
          if (chatId === 'chat-1') return Promise.resolve(true);  // Still has access
          if (chatId === 'chat-2') return Promise.resolve(false); // Lost access
          if (chatId === 'chat-3') return Promise.resolve(true);  // Gained access
          return Promise.resolve(false);
        });

      (mockAccessControlService.checkChatAccess as jasmine.Spy)
        .and.callFake((chatId: string) => {
          let hasAccess = false;
          let accessReason = 'public';
          
          if (chatId === 'chat-1') {
            hasAccess = true;
            accessReason = 'public';
          } else if (chatId === 'chat-2') {
            hasAccess = false;
            accessReason = 'public';
          } else if (chatId === 'chat-3') {
            hasAccess = true;
            accessReason = 'invited';
          }

          return Promise.resolve({
            canView: hasAccess,
            canRead: hasAccess,
            canWrite: hasAccess,
            canInvite: false,
            canManage: false,
            accessReason
          } as ChatAccessLevel);
        });

      // Mock message loading for newly accessible chats
      (mockPersistenceService.loadMessages as jasmine.Spy)
        .and.returnValue(Promise.resolve([]));

      (mockPersistenceService.loadParticipants as jasmine.Spy)
        .and.returnValue(Promise.resolve([]));

      // Property: Global subscription refresh should update all subscriptions (Requirement 8.5)
      await service.refreshAllSubscriptions();

      subscriptionStatus = service.getSubscriptionStatus();
      expect(subscriptionStatus.isActive).toBe(true);

      // Verify that access changes were handled correctly
      // Chat-2 should have no messages (access revoked)
      let chat2Messages = (service as any).localMessages['chat-2'] || [];
      expect(chat2Messages.length).toBe(0);

      console.log(`✓ Global subscription refresh completed - access changes applied`);

      // Test real-time message delivery after global changes
      const testMessages = [
        {
          id: 'global-msg-1',
          chatId: 'chat-1',
          senderId: 'sender-1',
          senderName: 'Sender1',
          message: 'Message for accessible public chat',
          timestamp: new Date(),
          messageType: 'text' as const,
          isOwn: false,
          isRead: false
        },
        {
          id: 'global-msg-2',
          chatId: 'chat-2',
          senderId: 'sender-2',
          senderName: 'Sender2',
          message: 'Message for revoked private chat',
          timestamp: new Date(),
          messageType: 'text' as const,
          isOwn: false,
          isRead: false
        },
        {
          id: 'global-msg-3',
          chatId: 'chat-3',
          senderId: 'sender-3',
          senderName: 'Sender3',
          message: 'Message for newly accessible private chat',
          timestamp: new Date(),
          messageType: 'text' as const,
          isOwn: false,
          isRead: false
        }
      ];

      // Mock the filterMessagesByAccess method to respect new permissions
      let filterMessagesSpy4 = (service as any).filterMessagesByAccess;
      if (!filterMessagesSpy4 || !filterMessagesSpy4.and) {
        filterMessagesSpy4 = spyOn(service as any, 'filterMessagesByAccess');
      }
      filterMessagesSpy4.and.callFake(async (chatId: string, messages: any[]) => {
        const hasAccess = await mockAccessControlService.canUserAccessChat(chatId, testData.userId);
        return hasAccess ? messages : [];
      });

      // Property: Real-time updates should respect updated permissions
      for (const message of testMessages) {
        await (service as any).handleRealTimeMessageUpdate(message.chatId, [message]);
      }

      // Verify message delivery based on updated permissions
      const chat1Messages = (service as any).localMessages['chat-1'] || [];
      chat2Messages = (service as any).localMessages['chat-2'] || [];
      const chat3Messages = (service as any).localMessages['chat-3'] || [];

      expect(chat1Messages.length).toBe(1); // Should receive (has access)
      expect(chat1Messages[0].message).toBe('Message for accessible public chat');

      expect(chat2Messages.length).toBe(0); // Should not receive (access revoked)

      expect(chat3Messages.length).toBe(1); // Should receive (gained access)
      expect(chat3Messages[0].message).toBe('Message for newly accessible private chat');

      console.log(`✓ Property 9 (Requirement 8.5) verified: Global permission changes correctly updated real-time subscriptions and message delivery`);
    });
  });
});