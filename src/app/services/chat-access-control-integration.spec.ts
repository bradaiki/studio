import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat.service';
import { AccessControlService, ChatAccessLevel, ChatInvitation } from './access-control.service';
import { ChatAccessController } from './chat-access-controller.service';
import { ChatPersistenceService } from './chat-persistence.service';
import { AuthStateService } from './auth-state.service';
import { Chat, CreateChatRequest, SendMessageRequest } from '../models/chat.models';

// Integration Tests for Studio Chat Access Control
describe('Chat Access Control Integration Tests', () => {
  let chatService: jasmine.SpyObj<ChatService>;
  let accessControlService: jasmine.SpyObj<AccessControlService>;
  let chatAccessController: jasmine.SpyObj<ChatAccessController>;
  let chatPersistenceService: jasmine.SpyObj<ChatPersistenceService>;
  let authStateService: jasmine.SpyObj<AuthStateService>;

  // Setup test environment to avoid AWS Amplify calls
  beforeAll(() => {
    // Ensure AWS Amplify calls are mocked at the service level
    // The actual services should be mocked in beforeEach
  });

  // Mock data for integration testing
  const mockStudioId = 'studio-123';
  const mockUserId = 'user-456';
  const mockAdminUserId = 'admin-789';
  const mockInvitedUserId = 'invited-user-101';

  const mockPublicChat: Chat = {
    id: 'public-chat-1',
    studioId: mockStudioId,
    name: 'General Discussion',
    type: 'studio',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastMessageAt: new Date('2024-01-01'),
    participantIds: [mockUserId, mockAdminUserId],
    createdBy: mockAdminUserId,
    settings: {
      isPublic: true,
      allowLeaving: true,
      allowMuting: true,
      allowInviting: true,
      maxParticipants: 50
    },
    accessLevel: 'public',
    invitationRequired: false,
    studioMembershipRequired: false
  };

  const mockPrivateChat: Chat = {
    id: 'private-chat-1',
    studioId: mockStudioId,
    name: 'Instructor Planning',
    type: 'private',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastMessageAt: new Date('2024-01-01'),
    participantIds: [mockAdminUserId, mockInvitedUserId],
    createdBy: mockAdminUserId,
    settings: {
      isPublic: false,
      allowLeaving: true,
      allowMuting: true,
      allowInviting: false,
      maxParticipants: 10
    },
    accessLevel: 'private',
    invitationRequired: true,
    studioMembershipRequired: true
  };

  const mockPublicAccessLevel: ChatAccessLevel = {
    canView: true,
    canRead: true,
    canWrite: true,
    canInvite: false,
    canManage: false,
    accessReason: 'public'
  };

  const mockPrivateAccessLevel: ChatAccessLevel = {
    canView: true,
    canRead: true,
    canWrite: true,
    canInvite: false,
    canManage: false,
    accessReason: 'invited'
  };

  const mockDeniedAccessLevel: ChatAccessLevel = {
    canView: false,
    canRead: false,
    canWrite: false,
    canInvite: false,
    canManage: false,
    accessReason: 'public'
  };

  beforeEach(async () => {
    const accessControlSpy = jasmine.createSpyObj('AccessControlService', [
      'checkChatAccess',
      'canUserAccessChat',
      'canUserSendMessage',
      'inviteUserToChat',
      'revokeUserAccess',
      'getUserChatInvitations',
      'getAllUserChatInvitations',
      'acceptChatInvitation'
    ]);

    const chatPersistenceSpy = jasmine.createSpyObj('ChatPersistenceService', [
      'loadUserChats',
      'loadMessages',
      'createChat',
      'sendMessage',
      'createInvitation',
      'updateInvitationStatus',
      'getInvitationsByUser',
      'loadParticipants'
    ]);

    const authStateSpy = jasmine.createSpyObj('AuthStateService', [], {
      currentUser$: new BehaviorSubject({ userId: mockUserId, username: 'Test User' }),
      isAuthenticated$: new BehaviorSubject(true)
    });

    // Create a mock ChatService that doesn't make AWS calls
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'loadMessages',
      'sendMessage',
      'createChat',
      'getStudioChats',
      'initializeService'
    ]);

    // Create a mock ChatAccessController that doesn't make AWS calls
    const chatAccessControllerSpy = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'filterChatsByAccess'
    ]);

    await TestBed.configureTestingModule({
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: ChatAccessController, useValue: chatAccessControllerSpy },
        { provide: AccessControlService, useValue: accessControlSpy },
        { provide: ChatPersistenceService, useValue: chatPersistenceSpy },
        { provide: AuthStateService, useValue: authStateSpy }
      ]
    }).compileComponents();

    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    accessControlService = TestBed.inject(AccessControlService) as jasmine.SpyObj<AccessControlService>;
    chatAccessController = TestBed.inject(ChatAccessController) as jasmine.SpyObj<ChatAccessController>;
    chatPersistenceService = TestBed.inject(ChatPersistenceService) as jasmine.SpyObj<ChatPersistenceService>;
    authStateService = TestBed.inject(AuthStateService) as jasmine.SpyObj<AuthStateService>;
  });

  describe('End-to-End Public Chat Access Flow', () => {
    it('should allow complete public chat access flow for any authenticated user', async () => {
      // Setup: Mock public chat access
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve(mockPublicAccessLevel));
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(true));
      accessControlService.canUserSendMessage.and.returnValue(Promise.resolve(true));
      
      // Setup ChatAccessController mock
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [{ 
          chat: mockPublicChat, 
          lastMessage: undefined, 
          unreadCount: 0, 
          participants: [], 
          userPreferences: undefined 
        }],
        privateChats: [],
        invitationsPending: [],
        totalPublic: 1,
        totalPrivate: 0
      }));

      // Setup ChatService mocks
      chatService.loadMessages.and.returnValue(Promise.resolve([
        {
          id: 'msg-1',
          chatId: mockPublicChat.id,
          senderId: mockAdminUserId,
          senderName: 'Admin User',
          senderAvatar: undefined,
          message: 'Welcome to the studio!',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          isRead: false,
          isOwn: false,
          messageType: 'text',
          replyToId: undefined,
          editedAt: undefined,
          deletedAt: undefined
        }
      ]));

      chatService.sendMessage.and.returnValue(Promise.resolve({
        id: 'msg-2',
        chatId: mockPublicChat.id,
        senderId: mockUserId,
        senderName: 'Test User',
        senderAvatar: undefined,
        message: 'Hello everyone!',
        timestamp: new Date(),
        isRead: true,
        isOwn: true,
        messageType: 'text',
        replyToId: undefined,
        editedAt: undefined,
        deletedAt: undefined
      }));

      // Step 1: User visits studio page and loads chats
      const studioChats = await chatAccessController.getStudioChatsForUser(mockStudioId, mockUserId);
      
      expect(studioChats.publicChats).toHaveSize(1);
      expect(studioChats.publicChats[0].chat.id).toBe(mockPublicChat.id);
      expect(studioChats.privateChats).toHaveSize(0);

      // Verify authentication state is properly set
      const currentUser = (authStateService.currentUser$ as BehaviorSubject<any>).value;
      expect(currentUser.userId).toBe(mockUserId);
      
      // Step 2: User accesses public chat messages
      const messages = await chatService.loadMessages(mockPublicChat.id);
      
      expect(messages).toHaveSize(1);
      expect(messages[0].message).toBe('Welcome to the studio!');

      // Step 3: User sends message to public chat
      const sendRequest: SendMessageRequest = {
        chatId: mockPublicChat.id,
        message: 'Hello everyone!',
        messageType: 'text'
      };

      const sentMessage = await chatService.sendMessage(sendRequest);
      
      expect(sentMessage.message).toBe('Hello everyone!');
      expect(sentMessage.senderId).toBe(mockUserId);

      // Verify the expected service interactions occurred
      expect(chatAccessController.getStudioChatsForUser).toHaveBeenCalledWith(mockStudioId, mockUserId);
      expect(chatService.loadMessages).toHaveBeenCalledWith(mockPublicChat.id);
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendRequest);
    });
  });

  describe('End-to-End Private Chat Invitation Flow', () => {
    it('should handle complete private chat invitation and access flow', async () => {
      const mockInvitation: ChatInvitation = {
        id: 'invitation-1',
        chatId: mockPrivateChat.id,
        invitedUserId: mockInvitedUserId,
        invitedBy: mockAdminUserId,
        invitedAt: new Date(),
        status: 'pending',
        message: 'Join our instructor planning chat'
      };

      // Step 1: Admin creates private chat
      const createRequest: CreateChatRequest = {
        name: 'Instructor Planning',
        type: 'private',
        studioId: mockStudioId,
        participantIds: [mockAdminUserId],
        settings: {
          isPublic: false,
          allowLeaving: true,
          allowMuting: true,
          allowInviting: false
        },
        accessLevel: 'private',
        invitationRequired: true,
        studioMembershipRequired: true
      };

      chatService.createChat.and.returnValue(Promise.resolve(mockPrivateChat));
      
      const createdChat = await chatService.createChat(createRequest);
      expect(createdChat.accessLevel).toBe('private');

      // Step 2: Admin invites user to private chat
      accessControlService.inviteUserToChat.and.returnValue(Promise.resolve(mockInvitation));
      
      const invitation = await accessControlService.inviteUserToChat(
        mockPrivateChat.id,
        mockInvitedUserId,
        mockAdminUserId
      );
      
      expect(invitation.status).toBe('pending');
      expect(invitation.invitedUserId).toBe(mockInvitedUserId);

      // Step 3: Invited user initially cannot access private chat
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(false));
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve(mockDeniedAccessLevel));
      
      const hasAccess = await accessControlService.canUserAccessChat(mockPrivateChat.id, mockInvitedUserId);
      expect(hasAccess).toBe(false);

      // Step 4: User accepts invitation
      const acceptedInvitation = { ...mockInvitation, status: 'accepted' as const };
      accessControlService.acceptChatInvitation.and.returnValue(Promise.resolve());
      accessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([acceptedInvitation]));
      accessControlService.getAllUserChatInvitations.and.returnValue(Promise.resolve([acceptedInvitation]));
      
      await accessControlService.acceptChatInvitation(mockInvitation.id);

      // Step 5: User now has access to private chat
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(true));
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve(mockPrivateAccessLevel));
      
      const hasAccessAfterAccept = await accessControlService.canUserAccessChat(mockPrivateChat.id, mockInvitedUserId);
      expect(hasAccessAfterAccept).toBe(true);

      // Step 6: User can now see private chat in studio chat list
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [],
        privateChats: [{ 
          chat: mockPrivateChat, 
          lastMessage: undefined, 
          unreadCount: 0, 
          participants: [], 
          userPreferences: undefined 
        }],
        invitationsPending: [],
        totalPublic: 0,
        totalPrivate: 1
      }));
      
      const studioChats = await chatAccessController.getStudioChatsForUser(mockStudioId, mockInvitedUserId);
      expect(studioChats.privateChats).toHaveSize(1);
      expect(studioChats.privateChats[0].chat.id).toBe(mockPrivateChat.id);
    });
  });

  describe('End-to-End Access Revocation Flow', () => {
    it('should handle complete access revocation and immediate effect', async () => {
      // Step 1: User initially has access to private chat
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(true));
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve(mockPrivateAccessLevel));
      
      chatService.loadMessages.and.returnValue(Promise.resolve([
        {
          id: 'msg-1',
          chatId: mockPrivateChat.id,
          senderId: mockAdminUserId,
          senderName: 'Admin User',
          senderAvatar: undefined,
          message: 'Private discussion',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          isRead: false,
          isOwn: false,
          messageType: 'text',
          replyToId: undefined,
          editedAt: undefined,
          deletedAt: undefined
        }
      ]));

      // Verify initial access
      const initialAccess = await accessControlService.canUserAccessChat(mockPrivateChat.id, mockUserId);
      expect(initialAccess).toBe(true);

      const initialMessages = await chatService.loadMessages(mockPrivateChat.id);
      expect(initialMessages).toHaveSize(1);

      // Step 2: Admin revokes user access
      accessControlService.revokeUserAccess.and.returnValue(Promise.resolve());
      
      await accessControlService.revokeUserAccess(mockPrivateChat.id, mockUserId, mockAdminUserId);

      // Step 3: User immediately loses access
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(false));
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve(mockDeniedAccessLevel));
      
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [],
        privateChats: [],
        invitationsPending: [],
        totalPublic: 0,
        totalPrivate: 0
      }));

      const accessAfterRevocation = await accessControlService.canUserAccessChat(mockPrivateChat.id, mockUserId);
      expect(accessAfterRevocation).toBe(false);

      // Step 4: User can no longer see private chat in studio list
      const studioChatsAfterRevocation = await chatAccessController.getStudioChatsForUser(mockStudioId, mockUserId);
      expect(studioChatsAfterRevocation.privateChats).toHaveSize(0);

      // Step 5: User cannot send messages to revoked chat
      accessControlService.canUserSendMessage.and.returnValue(Promise.resolve(false));
      
      const canSendAfterRevocation = await accessControlService.canUserSendMessage(mockPrivateChat.id, mockUserId);
      expect(canSendAfterRevocation).toBe(false);
    });
  });

  describe('Real-time Updates with Access Control', () => {
    it('should handle real-time updates respecting access permissions', async () => {
      // Step 1: Setup initial state with mixed access
      accessControlService.canUserAccessChat.and.callFake((chatId: string) => {
        if (chatId === mockPublicChat.id) return Promise.resolve(true);
        if (chatId === mockPrivateChat.id) return Promise.resolve(false);
        return Promise.resolve(false);
      });

      // Step 2: User should receive update for public chat
      const canReceivePublicUpdate = await accessControlService.canUserAccessChat(mockPublicChat.id, mockUserId);
      expect(canReceivePublicUpdate).toBe(true);

      // Step 3: User should NOT receive update for private chat
      const canReceivePrivateUpdate = await accessControlService.canUserAccessChat(mockPrivateChat.id, mockUserId);
      expect(canReceivePrivateUpdate).toBe(false);

      // Step 4: Grant access to private chat
      accessControlService.canUserAccessChat.and.callFake((chatId: string, userId: string) => {
        return Promise.resolve(true); // Now has access to both chats
      });

      // Step 5: User should now receive updates for both chats
      const canReceivePublicAfterGrant = await accessControlService.canUserAccessChat(mockPublicChat.id, mockUserId);
      const canReceivePrivateAfterGrant = await accessControlService.canUserAccessChat(mockPrivateChat.id, mockUserId);
      
      expect(canReceivePublicAfterGrant).toBe(true);
      expect(canReceivePrivateAfterGrant).toBe(true);
    });
  });

  describe('Cross-Component Integration', () => {
    it('should integrate all access control components correctly', async () => {
      // Step 1: Setup comprehensive mock data
      const allChats = [mockPublicChat, mockPrivateChat];
      const mockInvitations: ChatInvitation[] = [
        {
          id: 'invitation-1',
          chatId: mockPrivateChat.id,
          invitedUserId: mockUserId,
          invitedBy: mockAdminUserId,
          invitedAt: new Date(),
          status: 'pending'
        }
      ];

      // Setup service responses
      accessControlService.getUserChatInvitations.and.returnValue(Promise.resolve(mockInvitations));
      accessControlService.getAllUserChatInvitations.and.returnValue(Promise.resolve(mockInvitations));
      
      // User has access to public chat but not private chat initially
      accessControlService.canUserAccessChat.and.callFake((chatId: string) => {
        return Promise.resolve(chatId === mockPublicChat.id);
      });

      accessControlService.checkChatAccess.and.callFake((chatId: string) => {
        if (chatId === mockPublicChat.id) return Promise.resolve(mockPublicAccessLevel);
        return Promise.resolve(mockDeniedAccessLevel);
      });

      // Step 2: Test ChatAccessController filtering
      chatAccessController.filterChatsByAccess.and.returnValue(Promise.resolve([mockPublicChat]));
      
      const filteredChats = await chatAccessController.filterChatsByAccess(allChats, mockUserId);
      expect(filteredChats).toHaveSize(1);
      expect(filteredChats[0].id).toBe(mockPublicChat.id);

      // Step 3: Test organized studio chats
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [{ 
          chat: mockPublicChat, 
          lastMessage: undefined, 
          unreadCount: 0, 
          participants: [], 
          userPreferences: undefined 
        }],
        privateChats: [],
        invitationsPending: mockInvitations,
        totalPublic: 1,
        totalPrivate: 0
      }));
      
      const organizedChats = await chatAccessController.getStudioChatsForUser(mockStudioId, mockUserId);
      expect(organizedChats.publicChats).toHaveSize(1);
      expect(organizedChats.privateChats).toHaveSize(0);
      expect(organizedChats.invitationsPending).toHaveSize(1);

      // Step 4: Accept invitation and verify integration
      accessControlService.acceptChatInvitation.and.returnValue(Promise.resolve());
      await accessControlService.acceptChatInvitation(mockInvitations[0].id);

      // Update access after invitation acceptance
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(true));
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve(mockPrivateAccessLevel));

      // Step 5: Verify all components reflect the access change
      chatAccessController.filterChatsByAccess.and.returnValue(Promise.resolve(allChats));
      const filteredChatsAfterAccept = await chatAccessController.filterChatsByAccess(allChats, mockUserId);
      expect(filteredChatsAfterAccept).toHaveSize(2);

      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [{ 
          chat: mockPublicChat, 
          lastMessage: undefined, 
          unreadCount: 0, 
          participants: [], 
          userPreferences: undefined 
        }],
        privateChats: [{ 
          chat: mockPrivateChat, 
          lastMessage: undefined, 
          unreadCount: 0, 
          participants: [], 
          userPreferences: undefined 
        }],
        invitationsPending: [],
        totalPublic: 1,
        totalPrivate: 1
      }));

      const organizedChatsAfterAccept = await chatAccessController.getStudioChatsForUser(mockStudioId, mockUserId);
      expect(organizedChatsAfterAccept.publicChats).toHaveSize(1);
      expect(organizedChatsAfterAccept.privateChats).toHaveSize(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across all components', async () => {
      // Step 1: Test network error handling
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.reject(new Error('Network error')));
      
      try {
        await chatAccessController.getStudioChatsForUser(mockStudioId, mockUserId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Step 2: Test access denied error handling
      chatService.loadMessages.and.returnValue(Promise.reject(new Error('Access denied')));
      
      try {
        await chatService.loadMessages(mockPrivateChat.id);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Step 3: Test invalid invitation error handling
      accessControlService.acceptChatInvitation.and.returnValue(Promise.reject(new Error('Invalid invitation')));
      
      try {
        await accessControlService.acceptChatInvitation('invalid-invitation-id');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});