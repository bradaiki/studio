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
  ChatInvitation, 
  Chat,
  ChatAccessError,
  ChatAccessException 
} from '../../models/chat.models';

// Property-based testing utilities
function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

function generateRandomUserId(): string {
  return `user_${generateRandomString(8)}`;
}

function generateRandomChatId(): string {
  return `chat_${generateRandomString(8)}`;
}

function generateRandomAccessLevel(hasAccess: boolean = true): ChatAccessLevel {
  if (!hasAccess) {
    return {
      canView: false,
      canRead: false,
      canWrite: false,
      canInvite: false,
      canManage: false,
      accessReason: 'public' // Use valid access reason but with no permissions
    };
  }

  const accessTypes = ['public', 'invited', 'studio_member', 'admin', 'creator'] as const;
  const accessReason = accessTypes[Math.floor(Math.random() * accessTypes.length)];
  
  // Different access levels based on reason
  switch (accessReason) {
    case 'creator':
      return {
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: true,
        canManage: true,
        accessReason
      };
    case 'admin':
      return {
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: true,
        canManage: false,
        accessReason
      };
    case 'invited':
    case 'studio_member':
      return {
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: false,
        canManage: false,
        accessReason
      };
    case 'public':
    default:
      return {
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: false,
        canManage: false,
        accessReason: 'public'
      };
  }
}

function generateRandomInvitation(chatId: string, userId: string): ChatInvitation {
  return {
    id: `inv_${generateRandomString(8)}`,
    chatId,
    invitedUserId: userId,
    invitedBy: generateRandomUserId(),
    invitedAt: new Date(),
    status: 'pending',
    message: Math.random() > 0.5 ? `Welcome to the chat!` : undefined
  };
}

describe('ChatMessagesComponent - Access Control Properties', () => {
  let component: ChatMessagesComponent;
  let fixture: ComponentFixture<ChatMessagesComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;
  let mockAccessControlService: jasmine.SpyObj<AccessControlService>;
  let mockChatAccessController: jasmine.SpyObj<ChatAccessController>;

  beforeEach(async () => {
    // Create spy objects
    mockChatService = jasmine.createSpyObj('ChatService', [
      'getCurrentUserId',
      'loadMessages',
      'sendMessage',
      'getChatsByStudioId',
      'createChat',
      'isServiceReady',
      'retryInitialization',
      'getChatById',
      'getChatPreferences'
    ], {
      messages$: new BehaviorSubject({})
    });

    mockAccessControlService = jasmine.createSpyObj('AccessControlService', [
      'checkChatAccess',
      'canUserAccessChat',
      'canUserSendMessage',
      'getUserChatInvitations',
      'acceptChatInvitation'
    ]);

    mockChatAccessController = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'canUserAccessChat',
      'getCurrentUserId'
    ]);

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

    // Setup default mocks
    mockChatService.getChatList = jasmine.createSpy('getChatList').and.returnValue(of([]));
    mockChatService.getChatById = jasmine.createSpy('getChatById').and.returnValue(null);
    mockChatService.getChatPreferences = jasmine.createSpy('getChatPreferences').and.returnValue(Promise.resolve({ isFavorite: false, isPinned: false }));
    mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
      publicChats: [],
      privateChats: [],
      invitationsPending: [],
      totalPublic: 0,
      totalPrivate: 0
    }));
  });

  /**
   * Property 4: Private Chat Access Control
   * Validates: Requirements 2.1, 2.2, 2.3
   * 
   * Property: For any private chat and user combination, the UI should correctly
   * reflect the user's access permissions and show appropriate controls.
   */
  describe('Property 4: Private Chat Access Control', () => {
    it('should correctly display access controls for various permission levels', async () => {
      const iterations = 15;
      
      for (let i = 0; i < iterations; i++) {
        const chatId = generateRandomChatId();
        const userId = generateRandomUserId();
        const hasAccess = Math.random() > 0.3; // 70% chance of having access
        const accessLevel = generateRandomAccessLevel(hasAccess);
        
        // Setup mocks
        mockChatService.getCurrentUserId.and.returnValue(userId);
        mockChatService.isServiceReady.and.returnValue(true);
        mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([{
          id: chatId,
          name: `Test Chat ${i}`,
          type: 'private',
          accessLevel: 'private',
          invitationRequired: true
        } as Chat]));
        mockChatService.loadMessages.and.returnValue(Promise.resolve([]));
        
        // Mock getChatById to return the chat when requested
        mockChatService.getChatById.and.returnValue({
          id: chatId,
          name: `Test Chat ${i}`,
          type: 'private',
          accessLevel: 'private',
          invitationRequired: true
        } as Chat);
        
        mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(accessLevel));
        mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
        
        // Mock organized chats response - only include chat if user has access
        if (hasAccess) {
          mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
            publicChats: accessLevel.accessReason === 'public' ? [{
              chat: {
                id: chatId,
                name: `Test Chat ${i}`,
                type: 'private',
                accessLevel: 'private'
              } as Chat,
              lastMessage: undefined,
              unreadCount: 0,
              participants: []
            }] : [],
            privateChats: accessLevel.accessReason !== 'public' ? [{
              chat: {
                id: chatId,
                name: `Test Chat ${i}`,
                type: 'private',
                accessLevel: 'private'
              } as Chat,
              lastMessage: undefined,
              unreadCount: 0,
              participants: []
            }] : [],
            invitationsPending: [],
            totalPublic: accessLevel.accessReason === 'public' ? 1 : 0,
            totalPrivate: accessLevel.accessReason !== 'public' ? 1 : 0
          }));
        } else {
          // No access - return empty chat lists
          mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
            publicChats: [],
            privateChats: [],
            invitationsPending: [],
            totalPublic: 0,
            totalPrivate: 0
          }));
        }
        
        // Set component properties
        component.studioId = `studio_${i}`;
        component.studioName = `Test Studio ${i}`;
        
        // Initialize component
        await component.ngOnInit();
        fixture.detectChanges();
        
        // Wait for async operations
        await fixture.whenStable();
        
        // For cases where user has no access, we need to manually trigger access check
        // since the component won't have a chatId to check
        if (!hasAccess) {
          // Manually set a chatId to trigger access check
          component.chatId = chatId;
          await component['checkChatAccess']();
          fixture.detectChanges();
        }
        
        // Verify access level is set correctly
        if (hasAccess) {
          expect(component.currentChatAccess).toEqual(accessLevel);
        } else {
          // When no access, currentChatAccess should be null or have no permissions
          expect(component.currentChatAccess).toEqual(accessLevel);
        }
        
        // Verify UI reflects access permissions
        if (hasAccess) {
          expect(component.hasReadAccess).toBe(accessLevel.canRead);
          expect(component.hasWriteAccess).toBe(accessLevel.canWrite);
          expect(component.hasInviteAccess).toBe(accessLevel.canInvite);
          expect(component.hasManageAccess).toBe(accessLevel.canManage);
          
          // Should not show access error if user has access
          expect(component.accessError).toBeNull();
          expect(component.showInvitationUI).toBeFalse();
        } else {
          expect(component.hasReadAccess).toBeFalse();
          expect(component.hasWriteAccess).toBeFalse();
          
          // Should show appropriate error or invitation UI
          expect(component.accessError || component.showInvitationUI).toBeTruthy();
        }
        
        // Verify message input state
        if (accessLevel.canWrite) {
          component.newMessage = 'test message';
          expect(component.canSendMessage).toBe(true);
          expect(component.isMessageInputDisabled).toBe(false);
        } else {
          expect(component.isMessageInputDisabled).toBe(true);
        }
        
        // Verify access reason display
        expect(component.chatAccessReason).toBeDefined();
        expect(component.chatAccessReason).not.toBe('Unknown');
        
        console.log(`✓ Iteration ${i + 1}: Access level ${accessLevel.accessReason} correctly displayed`);
      }
    });

    it('should handle invitation UI correctly when user has pending invitations', async () => {
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const chatId = generateRandomChatId();
        const userId = generateRandomUserId();
        const invitation = generateRandomInvitation(chatId, userId);
        
        // No access but has pending invitation
        const noAccessLevel: ChatAccessLevel = {
          canView: false,
          canRead: false,
          canWrite: false,
          canInvite: false,
          canManage: false,
          accessReason: 'public'
        };
        
        // Setup mocks
        mockChatService.getCurrentUserId.and.returnValue(userId);
        mockChatService.isServiceReady.and.returnValue(true);
        mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([{
          id: chatId,
          name: `Invitation Chat ${i}`,
          type: 'private',
          accessLevel: 'private',
          invitationRequired: true
        } as Chat]));
        
        // Mock getChatById to return the chat when requested
        mockChatService.getChatById.and.returnValue({
          id: chatId,
          name: `Invitation Chat ${i}`,
          type: 'private',
          accessLevel: 'private',
          invitationRequired: true
        } as Chat);
        
        mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(noAccessLevel));
        mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([invitation]));
        
        // Mock organized chats response with pending invitations
        mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
          publicChats: [],
          privateChats: [],
          invitationsPending: [invitation],
          totalPublic: 0,
          totalPrivate: 0
        }));
        
        // Set component properties
        component.studioId = `studio_${i}`;
        component.studioName = `Test Studio ${i}`;
        
        // Initialize component
        await component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        
        // Ensure the component's chatId is set to match the invitation
        // This happens during initialization, but we need to ensure it matches our test invitation
        component.chatId = chatId;
        
        // Verify invitation UI is shown
        expect(component.showInvitationUI).toBe(true);
        expect(component.currentChatInvitation).toEqual(invitation);
        expect(component.accessError).toBeNull();
        
        // Verify no access to read/write
        expect(component.hasReadAccess).toBe(false);
        expect(component.hasWriteAccess).toBe(false);
        
        console.log(`✓ Iteration ${i + 1}: Invitation UI correctly displayed for pending invitation`);
      }
    });

    it('should handle access control errors appropriately', async () => {
      const iterations = 8;
      const errorTypes = [
        ChatAccessError.INVITATION_REQUIRED,
        ChatAccessError.MEMBERSHIP_REQUIRED,
        ChatAccessError.CHAT_NOT_FOUND,
        ChatAccessError.ACCESS_DENIED
      ];
      
      for (let i = 0; i < iterations; i++) {
        const chatId = generateRandomChatId();
        const userId = generateRandomUserId();
        const errorType = errorTypes[i % errorTypes.length];
        const error = new ChatAccessException(errorType, chatId, userId);
        
        // Setup mocks
        mockChatService.getCurrentUserId.and.returnValue(userId);
        mockChatService.isServiceReady.and.returnValue(true);
        mockChatService.getChatsByStudioId.and.returnValue(Promise.resolve([{
          id: chatId,
          name: `Error Chat ${i}`,
          type: 'private'
        } as Chat]));
        
        // Mock getChatById to return the chat when requested
        mockChatService.getChatById.and.returnValue({
          id: chatId,
          name: `Error Chat ${i}`,
          type: 'private'
        } as Chat);
        
        mockAccessControlService.checkChatAccess.and.returnValue(Promise.reject(error));
        mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
        
        // Mock organized chats response for error case - return some accessible chats so we get to checkChatAccess
        mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
          publicChats: [{
            chat: {
              id: chatId,
              name: `Error Chat ${i}`,
              type: 'private'
            } as Chat,
            lastMessage: undefined,
            unreadCount: 0,
            participants: []
          }],
          privateChats: [],
          invitationsPending: [],
          totalPublic: 1,
          totalPrivate: 0
        }));
        
        // Set component properties
        component.studioId = `studio_${i}`;
        component.studioName = `Test Studio ${i}`;
        
        // Initialize component
        component.ngOnInit();
        fixture.detectChanges();
        
        // Wait for async operations to complete
        await fixture.whenStable();
        
        // Give additional time for error handling to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify error handling
        expect(component.accessError).toBeDefined();
        expect(component.accessError).not.toBeNull();
        expect(component.currentChatAccess).toBeNull();
        expect(component.showInvitationUI).toBe(false);
        
        // Verify appropriate error message based on error type
        switch (errorType) {
          case ChatAccessError.INVITATION_REQUIRED:
            expect(component.accessError).toContain('invitation');
            break;
          case ChatAccessError.MEMBERSHIP_REQUIRED:
            expect(component.accessError).toContain('membership');
            break;
          case ChatAccessError.CHAT_NOT_FOUND:
            expect(component.accessError).toContain('not found');
            break;
          case ChatAccessError.ACCESS_DENIED:
            expect(component.accessError).toContain('denied');
            break;
        }
        
        console.log(`✓ Iteration ${i + 1}: Error ${errorType} handled correctly`);
      }
    });
  });
});