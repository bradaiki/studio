import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ChatInvitationManagerComponent } from './chat-invitation-manager.component';
import { AccessControlService, ChatAccessLevel, ChatInvitation } from '../../services/access-control.service';
import { Chat, ChatParticipant, ChatAccessError, ChatAccessException } from '../../models/chat.models';

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

function generateRandomChat(accessLevel: 'public' | 'private' = 'private'): Chat {
  return {
    id: generateRandomChatId(),
    name: `Test Chat ${generateRandomString(5)}`,
    description: `Test chat description`,
    type: 'private',
    studioId: `studio_${generateRandomString(6)}`,
    participantIds: [],
    createdBy: generateRandomUserId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    settings: {
      allowLeaving: true,
      allowMuting: true,
      allowInviting: true,
      isPublic: accessLevel === 'public'
    },
    accessLevel,
    invitationRequired: accessLevel === 'private',
    studioMembershipRequired: false
  };
}

function generateRandomAccessLevel(canManage: boolean = false): ChatAccessLevel {
  const accessTypes = ['public', 'invited', 'studio_member', 'admin', 'creator'] as const;
  let accessReason = accessTypes[Math.floor(Math.random() * accessTypes.length)];
  
  // Force creator/admin if canManage is required
  if (canManage && !['creator', 'admin'].includes(accessReason)) {
    accessReason = Math.random() > 0.5 ? 'creator' : 'admin';
  }
  
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
    default:
      return {
        canView: true,
        canRead: true,
        canWrite: true,
        canInvite: false,
        canManage: false,
        accessReason
      };
  }
}

function generateRandomInvitation(chatId: string, invitedBy: string): ChatInvitation {
  const statuses = ['pending', 'accepted', 'declined', 'revoked'] as const;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const isExpired = Math.random() > 0.8; // 20% chance of being expired
  
  return {
    id: `inv_${generateRandomString(8)}`,
    chatId,
    invitedUserId: generateRandomUserId(),
    invitedBy,
    invitedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
    status,
    expiresAt: isExpired ? new Date(Date.now() - 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    message: Math.random() > 0.5 ? `Welcome to the chat!` : undefined
  };
}

function generateRandomParticipants(count: number = 3): ChatParticipant[] {
  const participants: ChatParticipant[] = [];
  for (let i = 0; i < count; i++) {
    participants.push({
      id: `participant_${generateRandomString(8)}`,
      chatId: generateRandomChatId(),
      userId: generateRandomUserId(),
      userName: `User ${i + 1}`,
      userAvatar: undefined,
      role: i === 0 ? 'admin' : 'member',
      joinedAt: new Date(),
      isActive: true,
      isMuted: false
    });
  }
  return participants;
}

describe('ChatInvitationManagerComponent - Property Tests', () => {
  let component: ChatInvitationManagerComponent;
  let fixture: ComponentFixture<ChatInvitationManagerComponent>;
  let mockAccessControlService: jasmine.SpyObj<AccessControlService>;
  let mockAlertController: jasmine.SpyObj<AlertController>;
  let mockToastController: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    // Create spy objects
    mockAccessControlService = jasmine.createSpyObj('AccessControlService', [
      'checkChatAccess',
      'inviteUserToChat',
      'revokeUserAccess',
      'getUserChatInvitations'
    ]);

    mockAlertController = jasmine.createSpyObj('AlertController', ['create']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);

    // Mock toast creation
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    mockToastController.create.and.returnValue(Promise.resolve(mockToast));

    // Mock alert creation with automatic handler execution
    const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    mockAlertController.create.and.callFake(async (options: any) => {
      // Automatically execute the destructive button handler if it exists
      if (options.buttons) {
        const destructiveButton = options.buttons.find((btn: any) => btn.role === 'destructive');
        if (destructiveButton && destructiveButton.handler) {
          // Execute the handler immediately to simulate user clicking the button
          try {
            await destructiveButton.handler();
          } catch (error) {
            // Swallow the error since we're testing error handling
          }
        }
      }
      return mockAlert;
    });

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        FormsModule,
        ChatInvitationManagerComponent
      ],
      providers: [
        { provide: AccessControlService, useValue: mockAccessControlService },
        { provide: AlertController, useValue: mockAlertController },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInvitationManagerComponent);
    component = fixture.componentInstance;
  });

  /**
   * Property 14: Invitation Management Completeness
   * Validates: Requirements 3.2, 3.5
   * 
   * Property: For any chat admin, they should be able to invite users, revoke invitations, 
   * and remove members with immediate effect on access permissions
   */
  describe('Property 14: Invitation Management Completeness', () => {
    it('should provide complete invitation management capabilities for chat admins', async () => {
      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const chat = generateRandomChat('private');
          const currentUserId = generateRandomUserId();
          const participants = generateRandomParticipants(3);
          
          // Ensure current user has management permissions (Requirements 3.2, 3.5)
          const adminAccessLevel = generateRandomAccessLevel(true);
          const canManageInvitations = adminAccessLevel.canInvite || 
                                      adminAccessLevel.canManage || 
                                      adminAccessLevel.accessReason === 'creator';
          
          // Generate some existing invitations for this chat
          const existingInvitations = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, 
            () => generateRandomInvitation(chat.id, currentUserId));
          
          // Setup mocks
          mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(adminAccessLevel));
          mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve(existingInvitations));
          
          // Set component inputs
          component.chat = chat;
          component.currentUserId = currentUserId;
          component.participants = participants;
          
          // Reset component state for clean test iteration
          component.showInviteForm = false;
          component.showInvitationList = false;
          component.isInviting = false;
          component.isLoadingInvitations = false;
          component.chatInvitations = [];
          
          // Initialize component
          await component.ngOnInit();
          fixture.detectChanges();
          await fixture.whenStable();
          
          // **Requirement 3.2: Chat admins can invite users to private chats**
          
          // Verify admin can access invitation management
          expect(component.canManageInvitations).toBe(canManageInvitations);
          expect(component.userAccessLevel).toEqual(adminAccessLevel);
          
          if (canManageInvitations) {
            // Test invitation form availability
            expect(component.showInviteForm).toBe(false); // Initially hidden
            component.toggleInviteForm();
            expect(component.showInviteForm).toBe(true);
            
            // Test invitation sending capability
            const targetUserId = generateRandomUserId();
            const newInvitation = generateRandomInvitation(chat.id, currentUserId);
            newInvitation.invitedUserId = targetUserId;
            
            mockAccessControlService.inviteUserToChat.and.returnValue(Promise.resolve(newInvitation));
            
            // Fill and submit invitation form
            component.inviteForm.userId = targetUserId;
            component.inviteForm.message = 'Welcome to our chat!';
            
            await component.sendInvitation();
            
            // Wait for any pending async operations
            await fixture.whenStable();
            
            // Verify invitation was sent
            expect(mockAccessControlService.inviteUserToChat)
              .toHaveBeenCalledWith(chat.id, targetUserId, currentUserId);
            
            // Verify form reset and UI state
            expect(component.inviteForm.userId).toBe('');
            expect(component.inviteForm.message).toBe('');
            expect(component.showInviteForm).toBe(false);
            
            // **Requirement 3.5: Chat admins can revoke invitations and remove members**
            
            // Test invitation list management - only if user can manage invitations
            if (component.canManageInvitations) {
              // Ensure the invitation list starts as hidden
              expect(component.showInvitationList).toBe(false);
              
              component.toggleInvitationList();
              await fixture.whenStable(); // Wait for async operations
              
              // Now it should be visible
              expect(component.showInvitationList).toBe(true);
              
              // Verify existing invitations are loaded and displayed
              expect(component.chatInvitations.length).toBeGreaterThan(0);
              
              // Test invitation revocation capability
              const pendingInvitation = component.chatInvitations.find(inv => inv.status === 'pending');
              if (pendingInvitation) {
                mockAccessControlService.revokeUserAccess.and.returnValue(Promise.resolve());
                
                // Mock alert to auto-confirm revocation
                const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
                
                // Override the alert creation to simulate user confirmation
                mockAlertController.create.and.callFake((config: any) => {
                  return Promise.resolve({
                    ...mockAlert,
                    present: async () => {
                      // Simulate user clicking "Revoke" button by calling the handler directly
                      const revokeButton = config.buttons?.find((btn: any) => 
                        typeof btn === 'object' && btn.text === 'Revoke'
                      );
                      if (revokeButton && typeof revokeButton === 'object' && revokeButton.handler) {
                        await revokeButton.handler();
                      }
                    }
                  });
                });
                
                await component.revokeInvitation(pendingInvitation);
                
                // Verify revocation was called
                expect(mockAccessControlService.revokeUserAccess)
                  .toHaveBeenCalledWith(chat.id, pendingInvitation.invitedUserId, currentUserId);
              }
              
              // Test invitation resending capability
              const expiredInvitation = component.chatInvitations.find(inv => inv.isExpired || inv.status === 'declined');
              if (expiredInvitation) {
                const resendInvitation = generateRandomInvitation(chat.id, currentUserId);
                mockAccessControlService.inviteUserToChat.and.returnValue(Promise.resolve(resendInvitation));
                
                await component.resendInvitation(expiredInvitation);
                
                // Verify resend was called
                expect(mockAccessControlService.inviteUserToChat)
                  .toHaveBeenCalledWith(chat.id, expiredInvitation.invitedUserId, currentUserId);
              }
              
              // Verify invitation status display and management capabilities
              for (const invitation of component.chatInvitations) {
                const statusColor = component.getInvitationStatusColor(invitation);
                const statusText = component.getInvitationStatusText(invitation);
                const canManage = component.canManageInvitation(invitation);
                
                // Verify status display is appropriate
                expect(statusColor).toBeDefined();
                expect(statusText).toBeDefined();
                expect(['warning', 'success', 'danger', 'medium'].includes(statusColor)).toBe(true);
                expect(['Pending', 'Accepted', 'Declined', 'Revoked', 'Expired'].includes(statusText)).toBe(true);
                
                // Verify management permissions are correct
                const expectedCanManage = canManageInvitations && 
                                         invitation.invitedBy === currentUserId &&
                                         (invitation.status === 'pending' || invitation.isExpired || invitation.status === 'declined');
                expect(canManage).toBe(expectedCanManage);
              }
            }
            
            console.log(`✓ Property 14 verified for admin user ${currentUserId}: ` +
              `Can invite: ${adminAccessLevel.canInvite}, Can manage: ${adminAccessLevel.canManage}, ` +
              `Access reason: ${adminAccessLevel.accessReason}, ` +
              `Invitations managed: ${component.chatInvitations.length}`);
            
          } else {
            // Non-admin users should not have invitation management capabilities
            expect(component.canManageInvitations).toBe(false);
            
            // Attempting to toggle invite form should show error
            component.toggleInviteForm();
            expect(component.showInviteForm).toBe(false);
            
            console.log(`✓ Property 14 verified for non-admin user ${currentUserId}: ` +
              `Correctly denied invitation management access (${adminAccessLevel.accessReason})`);
          }
          
        } catch (error) {
          console.error(`Property 14 test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });

    it('should handle invitation management errors gracefully', async () => {
      const iterations = 3;
      const errorTypes = [
        ChatAccessError.ACCESS_DENIED,
        ChatAccessError.ALREADY_MEMBER,
        ChatAccessError.INVALID_INVITATION,
        ChatAccessError.INVITATION_EXPIRED
      ];
      
      for (let i = 0; i < iterations; i++) {
        try {
          const chat = generateRandomChat('private');
          const currentUserId = generateRandomUserId();
          const participants = generateRandomParticipants(2);
          const errorType = errorTypes[i % errorTypes.length];
          
          // Admin access level
          const adminAccessLevel = generateRandomAccessLevel(true);
          
          // Setup mocks
          mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(adminAccessLevel));
          mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
          
          // Set component inputs
          component.chat = chat;
          component.currentUserId = currentUserId;
          component.participants = participants;
          
          // Initialize component
          await component.ngOnInit();
          fixture.detectChanges();
          
          // Test error handling for invitation sending
          const targetUserId = generateRandomUserId();
          const error = new ChatAccessException(errorType, chat.id, targetUserId);
          
          mockAccessControlService.inviteUserToChat.and.returnValue(Promise.reject(error));
          
          // Attempt to send invitation
          component.toggleInviteForm();
          component.inviteForm.userId = targetUserId;
          
          await component.sendInvitation();
          
          // Verify error was handled gracefully
          expect(component.isInviting).toBe(false);
          expect(mockToastController.create).toHaveBeenCalled();
          
          // Test error handling for revocation
          const mockInvitation = generateRandomInvitation(chat.id, currentUserId);
          mockAccessControlService.revokeUserAccess.and.returnValue(Promise.reject(error));
          
          await component.revokeInvitation(mockInvitation);
          
          // Verify revocation error was handled
          expect(mockToastController.create).toHaveBeenCalled();
          
          console.log(`✓ Property 14 error handling verified for ${errorType}: Graceful error handling maintained`);
          
        } catch (error) {
          console.error(`Property 14 error handling test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });

    it('should validate invitation form inputs correctly', async () => {
      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const chat = generateRandomChat('private');
          const currentUserId = generateRandomUserId();
          const participants = generateRandomParticipants(3);
          
          // Admin access level
          const adminAccessLevel = generateRandomAccessLevel(true);
          
          // Reset all spy calls at the beginning of each iteration
          mockAccessControlService.checkChatAccess.calls.reset();
          mockAccessControlService.getUserChatInvitations.calls.reset();
          mockAccessControlService.inviteUserToChat.calls.reset();
          mockToastController.create.calls.reset();
          
          // Setup mocks
          mockAccessControlService.checkChatAccess.and.returnValue(Promise.resolve(adminAccessLevel));
          mockAccessControlService.getUserChatInvitations.and.returnValue(Promise.resolve([]));
          
          // Set component inputs
          component.chat = chat;
          component.currentUserId = currentUserId;
          component.participants = participants;
          
          // Initialize component
          await component.ngOnInit();
          fixture.detectChanges();
          
          component.toggleInviteForm();
          
          // Test empty user ID validation
          component.inviteForm.userId = '';
          await component.sendInvitation();
          expect(mockAccessControlService.inviteUserToChat).not.toHaveBeenCalled();
          expect(mockToastController.create).toHaveBeenCalled();
          
          // Reset spy calls
          mockAccessControlService.inviteUserToChat.calls.reset();
          mockToastController.create.calls.reset();
          
          // Test self-invitation prevention
          component.inviteForm.userId = currentUserId;
          await component.sendInvitation();
          expect(mockAccessControlService.inviteUserToChat).not.toHaveBeenCalled();
          
          // Reset spy calls
          mockAccessControlService.inviteUserToChat.calls.reset();
          
          // Test existing participant validation
          const existingParticipant = participants[0];
          component.inviteForm.userId = existingParticipant.userId;
          await component.sendInvitation();
          expect(mockAccessControlService.inviteUserToChat).not.toHaveBeenCalled();
          
          // Test valid invitation
          const validUserId = generateRandomUserId();
          const newInvitation = generateRandomInvitation(chat.id, currentUserId);
          mockAccessControlService.inviteUserToChat.and.returnValue(Promise.resolve(newInvitation));
          
          component.inviteForm.userId = validUserId;
          await component.sendInvitation();
          expect(mockAccessControlService.inviteUserToChat).toHaveBeenCalledWith(chat.id, validUserId, currentUserId);
          
          console.log(`✓ Property 14 form validation verified: All validation rules working correctly`);
          
        } catch (error) {
          console.error(`Property 14 form validation test failed on iteration ${i + 1}:`, error);
          throw error;
        }
      }
    });
  });
});