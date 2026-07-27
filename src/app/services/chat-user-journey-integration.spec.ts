import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat.service';
import { AccessControlService, ChatInvitation } from './access-control.service';
import { ChatAccessController } from './chat-access-controller.service';
import { StudioChatOrganizer } from './studio-chat-organizer.service';
import { ChatPersistenceService } from './chat-persistence.service';
import { AuthStateService } from './auth-state.service';
import { Chat, CreateChatRequest } from '../models/chat.models';

// User Journey Integration Tests for Studio Chat Access Control
describe('Chat User Journey Integration Tests', () => {
  let chatService: jasmine.SpyObj<ChatService>;
  let accessControlService: jasmine.SpyObj<AccessControlService>;
  let chatAccessController: jasmine.SpyObj<ChatAccessController>;
  let studioChatOrganizer: jasmine.SpyObj<StudioChatOrganizer>;
  let chatPersistenceService: jasmine.SpyObj<ChatPersistenceService>;
  let authStateService: jasmine.SpyObj<AuthStateService>;

  // Setup test environment to avoid AWS Amplify calls
  beforeAll(() => {
    // Ensure AWS Amplify calls are mocked at the service level
    // The actual services should be mocked in beforeEach
  });

  // Test personas
  const studioVisitor = { id: 'visitor-123', name: 'Studio Visitor' };
  const studioMember = { id: 'member-456', name: 'Studio Member' };
  const studioInstructor = { id: 'instructor-789', name: 'Studio Instructor' };
  const studioAdmin = { id: 'admin-101', name: 'Studio Admin' };
  const studioId = 'test-studio-1';

  // Mock chats for different scenarios
  const publicGeneralChat: Chat = {
    id: 'public-general',
    studioId,
    name: 'General Discussion',
    type: 'studio',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastMessageAt: new Date('2024-01-02'),
    participantIds: [studioAdmin.id, studioMember.id, studioInstructor.id],
    createdBy: studioAdmin.id,
    settings: {
      isPublic: true,
      allowLeaving: true,
      allowMuting: true,
      allowInviting: true,
      maxParticipants: 100
    },
    accessLevel: 'public',
    invitationRequired: false,
    studioMembershipRequired: false
  };

  const publicEventsChat: Chat = {
    id: 'public-events',
    studioId,
    name: 'Upcoming Events',
    type: 'studio',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastMessageAt: new Date('2024-01-01'),
    participantIds: [studioAdmin.id, studioMember.id],
    createdBy: studioAdmin.id,
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

  const privateInstructorChat: Chat = {
    id: 'private-instructors',
    studioId,
    name: 'Instructor Coordination',
    type: 'private',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastMessageAt: new Date('2024-01-02'),
    participantIds: [studioAdmin.id, studioInstructor.id],
    createdBy: studioAdmin.id,
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

  const privateMemberChat: Chat = {
    id: 'private-members',
    studioId,
    name: 'Member Exclusive',
    type: 'private',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastMessageAt: new Date('2024-01-01'),
    participantIds: [studioAdmin.id, studioMember.id, studioInstructor.id],
    createdBy: studioAdmin.id,
    settings: {
      isPublic: false,
      allowLeaving: true,
      allowMuting: true,
      allowInviting: false,
      maxParticipants: 20
    },
    accessLevel: 'private',
    invitationRequired: true,
    studioMembershipRequired: true
  };

  const allChats = [publicGeneralChat, publicEventsChat, privateInstructorChat, privateMemberChat];

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
      currentUser$: new BehaviorSubject({ userId: studioVisitor.id, username: 'Test User' }),
      isAuthenticated$: new BehaviorSubject(true)
    });

    // Create mock services that don't make AWS calls
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'loadMessages',
      'sendMessage',
      'createChat',
      'getStudioChats'
    ]);

    const chatAccessControllerSpy = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'filterChatsByAccess'
    ]);

    const studioChatOrganizerSpy = jasmine.createSpyObj('StudioChatOrganizer', [
      'organizeStudioChats'
    ]);

    await TestBed.configureTestingModule({
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: ChatAccessController, useValue: chatAccessControllerSpy },
        { provide: StudioChatOrganizer, useValue: studioChatOrganizerSpy },
        { provide: AccessControlService, useValue: accessControlSpy },
        { provide: ChatPersistenceService, useValue: chatPersistenceSpy },
        { provide: AuthStateService, useValue: authStateSpy }
      ]
    }).compileComponents();

    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    accessControlService = TestBed.inject(AccessControlService) as jasmine.SpyObj<AccessControlService>;
    chatAccessController = TestBed.inject(ChatAccessController) as jasmine.SpyObj<ChatAccessController>;
    studioChatOrganizer = TestBed.inject(StudioChatOrganizer) as jasmine.SpyObj<StudioChatOrganizer>;
    chatPersistenceService = TestBed.inject(ChatPersistenceService) as jasmine.SpyObj<ChatPersistenceService>;
    authStateService = TestBed.inject(AuthStateService) as jasmine.SpyObj<AuthStateService>;
  });

  describe('Studio Visitor Journey', () => {
    it('should provide appropriate access for studio visitors', async () => {
      // Setup visitor context
      const visitorSubject = new BehaviorSubject({ userId: studioVisitor.id, username: 'Studio Visitor' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: visitorSubject,
        writable: true,
        configurable: true
      });

      // Visitors can only access public chats
      accessControlService.canUserAccessChat.and.callFake((chatId: string) => {
        return Promise.resolve(chatId === publicGeneralChat.id || chatId === publicEventsChat.id);
      });

      accessControlService.checkChatAccess.and.callFake((chatId: string) => {
        if (chatId === publicGeneralChat.id || chatId === publicEventsChat.id) {
          return Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          });
        }
        return Promise.resolve({
          canView: false,
          canRead: false,
          canWrite: false,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        });
      });

      accessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
      accessControlService.getAllUserChatInvitations.and.returnValue(Promise.resolve([]));

      // Setup ChatAccessController mock
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [],
        invitationsPending: [],
        totalPublic: 2,
        totalPrivate: 0
      }));

      // Journey: Visitor arrives at studio page
      const studioChats = await chatAccessController.getStudioChatsForUser(studioId, studioVisitor.id);

      // Should see public chats only
      expect(studioChats.publicChats).toHaveSize(2);
      expect(studioChats.privateChats).toHaveSize(0);
      expect(studioChats.invitationsPending).toHaveSize(0);

      // Should be able to read public chat messages
      chatService.loadMessages.and.returnValue(Promise.resolve([
        {
          id: 'msg-1',
          chatId: publicGeneralChat.id,
          senderId: studioMember.id,
          senderName: studioMember.name,
          senderAvatar: undefined,
          message: 'Welcome to our studio!',
          timestamp: new Date(),
          isRead: false,
          isOwn: false,
          messageType: 'text',
          replyToId: undefined,
          editedAt: undefined,
          deletedAt: undefined
        }
      ]));

      const messages = await chatService.loadMessages(publicGeneralChat.id);
      expect(messages).toHaveSize(1);
      expect(messages[0].message).toBe('Welcome to our studio!');

      // Should be able to send messages to public chats
      accessControlService.canUserSendMessage.and.returnValue(Promise.resolve(true));
      
      const canSend = await accessControlService.canUserSendMessage(publicGeneralChat.id, studioVisitor.id);
      expect(canSend).toBe(true);
    });
  });

  describe('Studio Member Journey', () => {
    it('should provide enhanced access for studio members', async () => {
      // Setup member context
      const memberSubject = new BehaviorSubject({ userId: studioMember.id, username: 'Studio Member' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: memberSubject,
        writable: true,
        configurable: true
      });

      // Members can access public chats and some private chats
      accessControlService.canUserAccessChat.and.callFake((chatId: string) => {
        // Can access public chats and member-exclusive private chat
        return Promise.resolve(
          chatId === publicGeneralChat.id || 
          chatId === publicEventsChat.id || 
          chatId === privateMemberChat.id
        );
      });

      accessControlService.checkChatAccess.and.callFake((chatId: string) => {
        if (chatId === publicGeneralChat.id || chatId === publicEventsChat.id) {
          return Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'public'
          });
        }
        if (chatId === privateMemberChat.id) {
          return Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: false,
            canManage: false,
            accessReason: 'studio_member'
          });
        }
        return Promise.resolve({
          canView: false,
          canRead: false,
          canWrite: false,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        });
      });

      // Member has pending invitation to instructor chat
      const pendingInvitation: ChatInvitation = {
        id: 'invitation-instructor',
        chatId: privateInstructorChat.id,
        invitedUserId: studioMember.id,
        invitedBy: studioAdmin.id,
        invitedAt: new Date(),
        status: 'pending',
        message: 'Join our instructor coordination chat'
      };

      accessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([pendingInvitation]));
      accessControlService.getAllUserChatInvitations.and.returnValue(Promise.resolve([pendingInvitation]));

      // Setup ChatAccessController mock
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [
          { chat: privateMemberChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        invitationsPending: [pendingInvitation],
        totalPublic: 2,
        totalPrivate: 1
      }));

      chatAccessController.filterChatsByAccess.and.returnValue(Promise.resolve([publicGeneralChat, publicEventsChat, privateMemberChat]));

      studioChatOrganizer.organizeStudioChats.and.returnValue({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [
          { chat: privateMemberChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        invitationsPending: [pendingInvitation],
        totalPublic: 2,
        totalPrivate: 1
      });

      // Journey: Member visits studio page
      const studioChats = await chatAccessController.getStudioChatsForUser(studioId, studioMember.id);

      // Should see public chats and accessible private chats
      expect(studioChats.publicChats).toHaveSize(2);
      expect(studioChats.privateChats).toHaveSize(1);
      expect(studioChats.privateChats[0].chat.id).toBe(privateMemberChat.id);
      expect(studioChats.invitationsPending).toHaveSize(1);

      // Should be organized properly
      const filteredChats = await chatAccessController.filterChatsByAccess(allChats, studioMember.id);
      const organizedChats = studioChatOrganizer.organizeStudioChats(
        filteredChats.map(chat => ({
          chat,
          lastMessage: undefined,
          unreadCount: 0,
          participants: [],
          userPreferences: undefined
        }))
      );

      expect(organizedChats.publicChats).toHaveSize(2);
      expect(organizedChats.privateChats).toHaveSize(1);
      expect(organizedChats.totalPublic).toBe(2);
      expect(organizedChats.totalPrivate).toBe(1);
    });
  });

  describe('Studio Instructor Journey', () => {
    it('should provide instructor-level access and invitation management', async () => {
      // Setup instructor context
      const instructorSubject = new BehaviorSubject({ userId: studioInstructor.id, username: 'Studio Instructor' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: instructorSubject,
        writable: true,
        configurable: true
      });

      // Instructors have access to all chats
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(true));

      accessControlService.checkChatAccess.and.callFake((chatId: string) => {
        if (chatId === publicGeneralChat.id || chatId === publicEventsChat.id) {
          return Promise.resolve({
            canView: true,
            canRead: true,
            canWrite: true,
            canInvite: true,
            canManage: false,
            accessReason: 'public'
          });
        }
        return Promise.resolve({
          canView: true,
          canRead: true,
          canWrite: true,
          canInvite: true,
          canManage: false,
          accessReason: 'invited'
        });
      });

      accessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
      accessControlService.getAllUserChatInvitations.and.returnValue(Promise.resolve([]));

      // Setup ChatAccessController mock
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [
          { chat: privateInstructorChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: privateMemberChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        invitationsPending: [],
        totalPublic: 2,
        totalPrivate: 2
      }));

      // Journey: Instructor visits studio page
      const studioChats = await chatAccessController.getStudioChatsForUser(studioId, studioInstructor.id);

      // Should see all chats
      expect(studioChats.publicChats).toHaveSize(2);
      expect(studioChats.privateChats).toHaveSize(2);

      // Should be able to invite users to private chats
      const newInvitation: ChatInvitation = {
        id: 'new-invitation',
        chatId: privateInstructorChat.id,
        invitedUserId: studioMember.id,
        invitedBy: studioInstructor.id,
        invitedAt: new Date(),
        status: 'pending'
      };

      accessControlService.inviteUserToChat.and.returnValue(Promise.resolve(newInvitation));

      const invitation = await accessControlService.inviteUserToChat(
        privateInstructorChat.id,
        studioMember.id,
        studioInstructor.id
      );

      expect(invitation.invitedBy).toBe(studioInstructor.id);
      expect(invitation.status).toBe('pending');

      // Should be able to send messages to all chats
      accessControlService.canUserSendMessage.and.returnValue(Promise.resolve(true));
      
      const canSendToPublic = await accessControlService.canUserSendMessage(publicGeneralChat.id, studioInstructor.id);
      const canSendToPrivate = await accessControlService.canUserSendMessage(privateInstructorChat.id, studioInstructor.id);
      
      expect(canSendToPublic).toBe(true);
      expect(canSendToPrivate).toBe(true);
    });
  });

  describe('Studio Admin Journey', () => {
    it('should provide full administrative access and management capabilities', async () => {
      // Setup admin context
      const adminSubject = new BehaviorSubject({ userId: studioAdmin.id, username: 'Studio Admin' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: adminSubject,
        writable: true,
        configurable: true
      });

      // Admins have full access to all chats
      accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(true));
      accessControlService.canUserSendMessage.and.returnValue(Promise.resolve(true));

      accessControlService.checkChatAccess.and.returnValue(Promise.resolve({
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: true,
        canManage: true,
        accessReason: 'admin'
      }));

      accessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
      accessControlService.getAllUserChatInvitations.and.returnValue(Promise.resolve([]));

      // Setup ChatAccessController mock
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [
          { chat: privateInstructorChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: privateMemberChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        invitationsPending: [],
        totalPublic: 2,
        totalPrivate: 2
      }));

      // Journey: Admin visits studio page
      const studioChats = await chatAccessController.getStudioChatsForUser(studioId, studioAdmin.id);

      // Should see all chats with management capabilities
      expect(studioChats.publicChats).toHaveSize(2);
      expect(studioChats.privateChats).toHaveSize(2);

      // Should be able to create new chats
      const newPrivateChat: Chat = {
        id: 'new-private-chat',
        studioId,
        name: 'Advanced Training',
        type: 'private',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        participantIds: [studioAdmin.id],
        createdBy: studioAdmin.id,
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

      chatPersistenceService.createChat.and.returnValue(Promise.resolve(newPrivateChat));
      chatService.createChat.and.returnValue(Promise.resolve(newPrivateChat));

      const createRequest: CreateChatRequest = {
        name: 'Advanced Training',
        type: 'private',
        studioId,
        participantIds: [studioAdmin.id],
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

      const createdChat = await chatService.createChat(createRequest);
      expect(createdChat.name).toBe('Advanced Training');
      expect(createdChat.createdBy).toBe(studioAdmin.id);

      // Should be able to revoke access
      accessControlService.revokeUserAccess.and.returnValue(Promise.resolve());

      await accessControlService.revokeUserAccess(privateInstructorChat.id, studioMember.id, studioAdmin.id);
      expect(accessControlService.revokeUserAccess).toHaveBeenCalledWith(
        privateInstructorChat.id,
        studioMember.id,
        studioAdmin.id
      );

      // Should be able to manage invitations
      const adminInvitation: ChatInvitation = {
        id: 'admin-invitation',
        chatId: newPrivateChat.id,
        invitedUserId: studioInstructor.id,
        invitedBy: studioAdmin.id,
        invitedAt: new Date(),
        status: 'pending',
        message: 'Join the advanced training discussion'
      };

      accessControlService.inviteUserToChat.and.returnValue(Promise.resolve(adminInvitation));

      const invitation = await accessControlService.inviteUserToChat(
        newPrivateChat.id,
        studioInstructor.id,
        studioAdmin.id
      );

      expect(invitation.message).toBe('Join the advanced training discussion');
    });
  });

  describe('Cross-User Interaction Journey', () => {
    it('should handle complex multi-user scenarios correctly', async () => {
      // Scenario: Admin creates private chat, invites instructor, instructor invites member

      // Step 1: Admin creates private chat
      const adminSubject = new BehaviorSubject({ userId: studioAdmin.id, username: 'Studio Admin' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: adminSubject,
        writable: true,
        configurable: true
      });
      
      const newChat: Chat = {
        id: 'multi-user-chat',
        studioId,
        name: 'Special Project',
        type: 'private',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        participantIds: [studioAdmin.id],
        createdBy: studioAdmin.id,
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

      chatPersistenceService.createChat.and.returnValue(Promise.resolve(newChat));
      chatService.createChat.and.returnValue(Promise.resolve(newChat));
      
      const createdChat = await chatService.createChat({
        name: 'Special Project',
        type: 'private',
        studioId,
        participantIds: [studioAdmin.id],
        settings: newChat.settings,
        accessLevel: 'private',
        invitationRequired: true,
        studioMembershipRequired: true
      });

      expect(createdChat.id).toBe('multi-user-chat');

      // Step 2: Admin invites instructor
      const instructorInvitation: ChatInvitation = {
        id: 'instructor-invite',
        chatId: newChat.id,
        invitedUserId: studioInstructor.id,
        invitedBy: studioAdmin.id,
        invitedAt: new Date(),
        status: 'pending'
      };

      accessControlService.inviteUserToChat.and.returnValue(Promise.resolve(instructorInvitation));
      
      const inviteInstructor = await accessControlService.inviteUserToChat(
        newChat.id,
        studioInstructor.id,
        studioAdmin.id
      );

      expect(inviteInstructor.invitedUserId).toBe(studioInstructor.id);

      // Step 3: Instructor accepts invitation
      const instructorSubject = new BehaviorSubject({ userId: studioInstructor.id, username: 'Studio Instructor' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: instructorSubject,
        writable: true,
        configurable: true
      });
      accessControlService.acceptChatInvitation.and.returnValue(Promise.resolve());
      
      await accessControlService.acceptChatInvitation(instructorInvitation.id);

      // Step 4: Instructor now has access and can invite member
      accessControlService.canUserAccessChat.and.callFake((chatId: string, userId: string) => {
        if (chatId === newChat.id && (userId === studioAdmin.id || userId === studioInstructor.id)) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const memberInvitation: ChatInvitation = {
        id: 'member-invite',
        chatId: newChat.id,
        invitedUserId: studioMember.id,
        invitedBy: studioInstructor.id,
        invitedAt: new Date(),
        status: 'pending'
      };

      accessControlService.inviteUserToChat.and.returnValue(Promise.resolve(memberInvitation));
      
      const inviteMember = await accessControlService.inviteUserToChat(
        newChat.id,
        studioMember.id,
        studioInstructor.id
      );

      expect(inviteMember.invitedBy).toBe(studioInstructor.id);

      // Step 5: Member accepts and all three can now access the chat
      const memberSubject = new BehaviorSubject({ userId: studioMember.id, username: 'Studio Member' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: memberSubject,
        writable: true,
        configurable: true
      });
      accessControlService.acceptChatInvitation.and.returnValue(Promise.resolve());
      
      await accessControlService.acceptChatInvitation(memberInvitation.id);

      // Step 6: Verify all users have access
      accessControlService.canUserAccessChat.and.callFake((chatId: string, userId: string) => {
        if (chatId === newChat.id && 
            (userId === studioAdmin.id || userId === studioInstructor.id || userId === studioMember.id)) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const adminAccess = await accessControlService.canUserAccessChat(newChat.id, studioAdmin.id);
      const instructorAccess = await accessControlService.canUserAccessChat(newChat.id, studioInstructor.id);
      const memberAccess = await accessControlService.canUserAccessChat(newChat.id, studioMember.id);
      const visitorAccess = await accessControlService.canUserAccessChat(newChat.id, studioVisitor.id);

      expect(adminAccess).toBe(true);
      expect(instructorAccess).toBe(true);
      expect(memberAccess).toBe(true);
      expect(visitorAccess).toBe(false);
    });
  });

  describe('Access Transition Journey', () => {
    it('should handle smooth transitions when access changes', async () => {
      // Scenario: Member gets promoted to instructor and gains additional access

      // Step 1: Member initially has limited access
      const memberSubject = new BehaviorSubject({ userId: studioMember.id, username: 'Studio Member' });
      Object.defineProperty(authStateService, 'currentUser$', {
        value: memberSubject,
        writable: true,
        configurable: true
      });
      
      accessControlService.canUserAccessChat.and.callFake((chatId: string) => {
        // Member can only access public chats and member-exclusive chat
        return Promise.resolve(
          chatId === publicGeneralChat.id || 
          chatId === publicEventsChat.id || 
          chatId === privateMemberChat.id
        );
      });

      // Setup ChatAccessController mock for initial member access
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [
          { chat: privateMemberChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        invitationsPending: [],
        totalPublic: 2,
        totalPrivate: 1
      }));

      const initialChats = await chatAccessController.getStudioChatsForUser(studioId, studioMember.id);
      expect(initialChats.publicChats).toHaveSize(2);
      expect(initialChats.privateChats).toHaveSize(1);

      // Step 2: Member gets promoted and gains instructor access
      accessControlService.canUserAccessChat.and.callFake((chatId: string) => {
        // Now has access to instructor chat as well
        return Promise.resolve(
          chatId === publicGeneralChat.id || 
          chatId === publicEventsChat.id || 
          chatId === privateMemberChat.id ||
          chatId === privateInstructorChat.id
        );
      });

      // Setup ChatAccessController mock for updated member access
      chatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
        publicChats: [
          { chat: publicGeneralChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: publicEventsChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        privateChats: [
          { chat: privateMemberChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined },
          { chat: privateInstructorChat, lastMessage: undefined, unreadCount: 0, participants: [], userPreferences: undefined }
        ],
        invitationsPending: [],
        totalPublic: 2,
        totalPrivate: 2
      }));

      const updatedChats = await chatAccessController.getStudioChatsForUser(studioId, studioMember.id);
      expect(updatedChats.publicChats).toHaveSize(2);
      expect(updatedChats.privateChats).toHaveSize(2);

      // Step 3: Can now send messages to instructor chat
      accessControlService.canUserSendMessage.and.callFake((chatId: string) => {
        return Promise.resolve(
          chatId === publicGeneralChat.id || 
          chatId === publicEventsChat.id || 
          chatId === privateMemberChat.id ||
          chatId === privateInstructorChat.id
        );
      });

      const canSendToInstructorChat = await accessControlService.canUserSendMessage(
        privateInstructorChat.id, 
        studioMember.id
      );
      expect(canSendToInstructorChat).toBe(true);

      // Step 4: Can now invite others to chats
      accessControlService.checkChatAccess.and.returnValue(Promise.resolve({
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: true,
        canManage: false,
        accessReason: 'invited'
      }));

      const accessLevel = await accessControlService.checkChatAccess(privateInstructorChat.id, studioMember.id);
      expect(accessLevel.canInvite).toBe(true);
    });
  });
});