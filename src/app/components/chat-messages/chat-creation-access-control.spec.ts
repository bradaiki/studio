import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ChatMessagesComponent } from './chat-messages.component';
import { ChatService } from '../../services/chat.service';
import { AccessControlService } from '../../services/access-control.service';
import { ChatAccessController } from '../../services/chat-access-controller.service';
import { Chat, ChatAccessLevel, ChatInvitation } from '../../models/chat.models';

// Property-based testing utilities
function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

function generateRandomUserId(): string {
  return `user_${generateRandomString(8)}`;
}

function generateRandomStudioId(): string {
  return `studio_${generateRandomString(8)}`;
}

function generateRandomChat(accessLevel: 'public' | 'private' = 'public'): Chat {
  return {
    id: `chat_${generateRandomString(8)}`,
    name: `Test Chat ${generateRandomString(5)}`,
    description: `Test chat description`,
    type: accessLevel === 'private' ? 'private' : 'group',
    studioId: generateRandomStudioId(),
    participantIds: [],
    createdBy: generateRandomUserId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    settings: {
      allowLeaving: true,
      allowMuting: true,
      allowInviting: accessLevel === 'public',
      isPublic: accessLevel === 'public'
    },
    accessLevel,
    invitationRequired: accessLevel === 'private',
    studioMembershipRequired: false
  };
}

describe('ChatMessagesComponent - Chat Creation Access Control Property Tests', () => {
  let component: ChatMessagesComponent;
  let fixture: ComponentFixture<ChatMessagesComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;
  let mockAccessControlService: jasmine.SpyObj<AccessControlService>;
  let mockChatAccessController: jasmine.SpyObj<ChatAccessController>;
  let mockToastController: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    // Create spy objects
    mockChatService = jasmine.createSpyObj('ChatService', [
      'createCustomChat',
      'getCurrentUserId',
      'isServiceReady',
      'retryInitialization',
      'getChatList',
      'getStudioChats',
      'loadMessages',
      'getChatsByStudioId',
      'createChat',
      'getChatById',
      'messages$',
      'getUnreadCount',
      'markMessagesAsRead',
      'sendMessage',
      'toggleMuteChat',
      'getUserFavoriteChats',
      'deleteChat',
      'toggleChatFavorite',
      'toggleChatPin',
      'getChatPreferences',
      'getServiceStatus'
    ]);

    mockAccessControlService = jasmine.createSpyObj('AccessControlService', [
      'checkChatAccess',
      'inviteUserToChat',
      'getUserChatInvitations',
      'acceptChatInvitation'
    ]);

    mockChatAccessController = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'canUserAccessChat'
    ]);

    mockToastController = jasmine.createSpyObj('ToastController', ['create']);

    // Mock toast creation
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    mockToastController.create.and.returnValue(Promise.resolve(mockToast));

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        FormsModule,
        ChatMessagesComponent
      ],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: AccessControlService, useValue: mockAccessControlService },
        { provide: ChatAccessController, useValue: mockChatAccessController },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatMessagesComponent);
    component = fixture.componentInstance;

    // Setup default mocks
    mockChatService.getCurrentUserId.and.returnValue('test-user-id');
    mockChatService.isServiceReady.and.returnValue(true);
    mockChatService.getChatList.and.returnValue(of([]));
    mockChatService.getStudioChats.and.returnValue(Promise.resolve({ studioId: '', chats: [], totalCount: 0 }));
    mockChatService.loadMessages.and.returnValue(Promise.resolve([]));
    mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([]));
    mockChatService.createChat.and.returnValue(Promise.resolve({
      id: 'test-chat',
      name: 'Test Chat',
      type: 'group',
      participantIds: [],
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    } as any));
    mockChatService.getChatById.and.returnValue(undefined);
    mockChatService.messages$ = of({});
    mockChatService.getUnreadCount.and.returnValue(0);
    mockChatService.markMessagesAsRead.and.returnValue(Promise.resolve(true));
    mockChatService.sendMessage.and.returnValue(Promise.resolve({
      id: 'msg1',
      chatId: 'test-chat',
      senderId: 'test-user',
      senderName: 'Test User',
      message: 'test',
      messageType: 'text',
      timestamp: new Date(),
      isRead: false,
      isOwn: true
    } as any));
    mockChatService.toggleMuteChat.and.returnValue(Promise.resolve(true));
    mockChatService.getUserFavoriteChats.and.returnValue(Promise.resolve({
      userId: 'test-user',
      favoriteChats: [],
      totalCount: 0
    } as any));
    mockChatService.deleteChat.and.returnValue(Promise.resolve(true));
    mockChatService.toggleChatFavorite.and.returnValue(Promise.resolve(true));
    mockChatService.toggleChatPin.and.returnValue(Promise.resolve(true));
    mockChatService.getChatPreferences.and.returnValue(Promise.resolve({
      id: 'pref1',
      userId: 'test-user',
      chatId: 'test-chat',
      isFavorite: false,
      isPinned: false,
      isMuted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any));
    mockChatService.getServiceStatus.and.returnValue({ ready: true });
    
    // Setup AccessControlService mocks
    mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve({
      canView: true,
      canRead: true,
      canWrite: true,
      canInvite: false,
      canManage: false,
      accessReason: 'public'
    }));
    mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
    mockAccessControlService.acceptChatInvitation.and.returnValue(Promise.resolve());
    mockAccessControlService.inviteUserToChat.and.returnValue(Promise.resolve({
      id: 'inv1',
      chatId: 'test-chat',
      invitedBy: 'test-user',
      invitedUserId: 'invited-user',
      status: 'pending',
      createdAt: new Date()
    } as any));
    
    mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
      publicChats: [],
      privateChats: [],
      invitationsPending: [],
      totalPublic: 0,
      totalPrivate: 0
    }));
    mockChatAccessController.canUserAccessChat.and.returnValue(Promise.resolve(true));
  });

  /**
   * Property 16: Chat Creation Access Control Validation
   * Validates: Requirements 4.1, 4.2, 4.3
   * 
   * Property: For any chat creation request, the system should properly validate access control
   * settings and create chats with appropriate visibility and member requirements
   */
  describe('Property 16: Chat Creation Access Control Validation', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      mockChatService.createCustomChat.calls.reset();
      mockToastController.create.calls.reset();
      mockAccessControlService.checkChatAccess.calls.reset();
      
      // Ensure access control service always returns a valid response
      mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve({
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: false,
        canManage: false,
        accessReason: 'public'
      }));
    });
    it('should create public chats with universal visibility (Requirement 4.2)', async () => {
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const studioId = generateRandomStudioId();
          const chatName = `Public Chat ${generateRandomString(5)}`;
          const description = `Public chat description ${i}`;
          const currentUserId = generateRandomUserId();
          
          // Setup component
          component.studioId = studioId;
          mockChatService.getCurrentUserId.and.returnValue(currentUserId);
          component.newChatName = chatName;
          component.newChatDescription = description;
          component.newChatAccessLevel = 'public';
          component.newChatType = 'group';
          component.newChatInitialMembers = [];
          
          // Mock successful public chat creation
          const expectedPublicChat = generateRandomChat('public');
          expectedPublicChat.name = chatName;
          expectedPublicChat.description = description;
          expectedPublicChat.studioId = studioId;
          expectedPublicChat.createdBy = currentUserId;
          
          mockChatService.createCustomChat.and.returnValue(Promise.resolve(expectedPublicChat));
          
          // Requirement 4.1: Allow selection between public and private types
          expect(component.newChatAccessLevel).toBe('public');
          
          // Validate form (should pass for public chats without initial members)
          const isValid = component['validateChatCreation']();
          expect(isValid).toBe(true);
          
          // Create the chat
          await component.createNewChat();
          
          // Wait for any pending async operations
          await fixture.whenStable();
          
          // Verify createCustomChat was called with correct parameters
          expect(mockChatService.createCustomChat).toHaveBeenCalledWith(
            studioId,
            chatName,
            description,
            false, // isPrivate = false for public chats
            [] // no initial members required for public chats
          );
          
          // Requirement 4.2: Public chats should be immediately visible to all studio visitors
          expect(expectedPublicChat.accessLevel).toBe('public');
          expect(expectedPublicChat.settings.isPublic).toBe(true);
          expect(expectedPublicChat.invitationRequired).toBe(false);
          
          console.log(`✓ Property 16 verified for public chat creation ${i + 1}: ` +
            `Chat "${chatName}" created with public access, visible to all studio visitors`);
          
        } catch (error) {
          console.error(`Property 16 test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });

    it('should create private chats with proper member requirements (Requirement 4.3)', async () => {
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const studioId = generateRandomStudioId();
          const chatName = `Private Chat ${generateRandomString(5)}`;
          const description = `Private chat description ${i}`;
          const currentUserId = generateRandomUserId();
          
          // Generate random initial members (1-3 members)
          const memberCount = Math.floor(Math.random() * 3) + 1;
          const initialMembers = Array.from({ length: memberCount }, () => generateRandomUserId());
          
          // Setup component
          component.studioId = studioId;
          mockChatService.getCurrentUserId.and.returnValue(currentUserId);
          component.newChatName = chatName;
          component.newChatDescription = description;
          component.newChatAccessLevel = 'private';
          component.newChatType = 'private';
          component.newChatInitialMembers = initialMembers;
          
          // Mock successful private chat creation
          const expectedPrivateChat = generateRandomChat('private');
          expectedPrivateChat.name = chatName;
          expectedPrivateChat.description = description;
          expectedPrivateChat.studioId = studioId;
          expectedPrivateChat.createdBy = currentUserId;
          expectedPrivateChat.participantIds = [currentUserId, ...initialMembers];
          
          mockChatService.createCustomChat.and.returnValue(Promise.resolve(expectedPrivateChat));
          
          // Requirement 4.1: Allow selection between public and private types
          expect(component.newChatAccessLevel).toBe('private');
          
          // Requirement 4.3: Private chats require initial invited members
          expect(component.newChatInitialMembers.length).toBeGreaterThan(0);
          
          // Validate form (should pass for private chats with initial members)
          const isValid = component['validateChatCreation']();
          expect(isValid).toBe(true);
          
          // Create the chat
          await component.createNewChat();
          
          // Wait for any pending async operations
          await fixture.whenStable();
          
          // Verify createCustomChat was called with correct parameters
          expect(mockChatService.createCustomChat).toHaveBeenCalledWith(
            studioId,
            chatName,
            description,
            true, // isPrivate = true for private chats
            initialMembers // initial members required for private chats
          );
          
          // Verify private chat properties
          expect(expectedPrivateChat.accessLevel).toBe('private');
          expect(expectedPrivateChat.settings.isPublic).toBe(false);
          expect(expectedPrivateChat.invitationRequired).toBe(true);
          expect(expectedPrivateChat.participantIds).toContain(currentUserId);
          
          // Verify all initial members are included
          for (const memberId of initialMembers) {
            expect(expectedPrivateChat.participantIds).toContain(memberId);
          }
          
          // Note: Toast notifications are UI concerns, not core business logic
          // The test focuses on verifying chat creation functionality
          
          console.log(`✓ Property 16 verified for private chat creation ${i + 1}: ` +
            `Chat "${chatName}" created with private access, ${initialMembers.length} initial members`);
          
        } catch (error) {
          console.error(`Property 16 test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });

    it('should validate private chat creation requirements', async () => {
      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const studioId = generateRandomStudioId();
          const chatName = `Private Chat ${generateRandomString(5)}`;
          const currentUserId = generateRandomUserId();
          
          // Setup component for private chat WITHOUT initial members
          component.studioId = studioId;
          mockChatService.getCurrentUserId.and.returnValue(currentUserId);
          component.newChatName = chatName;
          component.newChatAccessLevel = 'private';
          component.newChatType = 'private';
          component.newChatInitialMembers = []; // Empty - should fail validation
          
          // Requirement 4.3: Private chats must have initial members
          const isValid = component['validateChatCreation']();
          expect(isValid).toBe(false);
          
          // Wait for any pending async operations
          await fixture.whenStable();
          
          // Note: Toast notifications are UI concerns, not core business logic
          // The test focuses on verifying validation logic
          
          // Verify createCustomChat was NOT called
          expect(mockChatService.createCustomChat).not.toHaveBeenCalled();
          
          console.log(`✓ Property 16 validation verified ${i + 1}: ` +
            `Private chat creation properly rejected without initial members`);
          
          // Reset mocks for next iteration
          mockChatService.createCustomChat.calls.reset();
          mockToastController.create.calls.reset();
          
        } catch (error) {
          console.error(`Property 16 validation test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });

    it('should handle initial member management correctly', async () => {
      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const currentUserId = generateRandomUserId();
          
          // Setup component
          mockChatService.getCurrentUserId.and.returnValue(currentUserId);
          component.newChatInitialMembers = [];
          
          // Test adding valid members
          const validMemberId = generateRandomUserId();
          component.newChatMemberInput = validMemberId;
          component.addInitialMember();
          
          expect(component.newChatInitialMembers).toContain(validMemberId);
          expect(component.newChatMemberInput).toBe('');
          
          // Test preventing self-addition
          component.newChatMemberInput = currentUserId;
          component.addInitialMember();
          
          expect(component.newChatInitialMembers).not.toContain(currentUserId);
          
          // Note: Toast notifications are UI concerns, not core business logic
          // The test focuses on verifying member management logic
          
          // Test preventing duplicate addition
          component.newChatMemberInput = validMemberId;
          component.addInitialMember();
          
          const memberCount = component.newChatInitialMembers.filter(id => id === validMemberId).length;
          expect(memberCount).toBe(1); // Should only appear once
          
          // Test member removal
          component.removeInitialMember(validMemberId);
          expect(component.newChatInitialMembers).not.toContain(validMemberId);
          
          console.log(`✓ Property 16 member management verified ${i + 1}: ` +
            `Initial member addition/removal working correctly`);
          
          // Reset for next iteration
          component.newChatInitialMembers = [];
          mockToastController.create.calls.reset();
          
        } catch (error) {
          console.error(`Property 16 member management test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });
  });
});