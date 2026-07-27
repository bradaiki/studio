import { TestBed } from '@angular/core/testing';
import { AccessControlService, ChatAccessLevel, ChatAccessError, ChatAccessException } from './access-control.service';

// Mock Amplify client
const mockClient = {
  models: {
    Chat: {
      get: jasmine.createSpy('get'),
      update: jasmine.createSpy('update')
    },
    ChatInvitation: {
      list: jasmine.createSpy('list'),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update'),
      get: jasmine.createSpy('get')
    },
    StudioMembership: {
      list: jasmine.createSpy('list')
    },
    ChatParticipant: {
      list: jasmine.createSpy('list'),
      update: jasmine.createSpy('update'),
      create: jasmine.createSpy('create')
    }
  }
};

// Feature: studio-chat-access-control, Property 12: Access Control Validation Consistency
describe('AccessControlService', () => {
  let service: AccessControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccessControlService]
    });
    service = TestBed.inject(AccessControlService);
    
    // Mock the client on the service instance
    (service as any).client = mockClient;
    
    // Reset all spies
    Object.values(mockClient.models).forEach(model => {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && (method as any).calls) {
          (method as any).calls.reset();
        }
      });
    });
  });

  describe('Property 12: Access Control Validation Consistency', () => {
    it('should consistently validate permissions before allowing any action', async () => {
      // Feature: studio-chat-access-control, Property 12: Access Control Validation Consistency
      // Validates: Requirements 5.1, 5.2
      
      const testCases = [
        {
          chatId: 'chat-1',
          userId: 'user-1',
          createdBy: 'user-1', // User is creator
          accessLevel: 'private' as const,
          invitationRequired: true,
          studioMembershipRequired: false,
          studioId: 'studio-1',
          participantIds: ['user-1'],
          hasValidInvitation: false,
          isStudioMember: false
        },
        {
          chatId: 'chat-2',
          userId: 'user-2',
          createdBy: 'user-1',
          accessLevel: 'public' as const,
          invitationRequired: false,
          studioMembershipRequired: false,
          studioId: 'studio-1',
          participantIds: ['user-1'],
          hasValidInvitation: false,
          isStudioMember: false
        }
      ];

      for (const testData of testCases) {
        // Setup mock responses based on test data
        const chatData = {
          id: testData.chatId,
          createdBy: testData.createdBy,
          accessLevel: testData.accessLevel,
          invitationRequired: testData.invitationRequired,
          studioMembershipRequired: testData.studioMembershipRequired,
          studioId: testData.studioId,
          participantIds: testData.participantIds
        };

        // Mock chat retrieval
        (mockClient.models.Chat.get as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: chatData,
            errors: null
          })
        );

        // Mock invitation check
        (mockClient.models.ChatInvitation.list as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: testData.hasValidInvitation ? [{
              id: 'invitation-1',
              chatId: testData.chatId,
              invitedUserId: testData.userId,
              status: 'accepted',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }] : [],
            errors: null
          })
        );

        // Mock studio membership check
        (mockClient.models.StudioMembership.list as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: testData.isStudioMember ? [{
              id: 'membership-1',
              studioId: testData.studioId,
              userId: testData.userId,
              isActive: true
            }] : [],
            errors: null
          })
        );

        try {
          // Property: For any user action (view, send, invite), the system should 
          // consistently validate permissions before allowing the action

          // Test checkChatAccess consistency
          const accessLevel = await service.checkChatAccess(testData.chatId, testData.userId);
          
          // Test canUserAccessChat consistency
          const canAccess = await service.canUserAccessChat(testData.chatId, testData.userId);
          
          // Test canUserSendMessage consistency
          const canSendMessage = await service.canUserSendMessage(testData.chatId, testData.userId);

          // Property: Access validation should be consistent across all methods
          expect(canAccess).toBe(accessLevel.canView && accessLevel.canRead);
          expect(canSendMessage).toBe(accessLevel.canWrite);

          // Validate access logic consistency
          if (testData.userId === testData.createdBy) {
            // Creator should have full access
            expect(accessLevel.canView).toBe(true);
            expect(accessLevel.canRead).toBe(true);
            expect(accessLevel.canWrite).toBe(true);
            expect(accessLevel.canInvite).toBe(true);
            expect(accessLevel.canManage).toBe(true);
            expect(accessLevel.accessReason).toBe('creator');
          } else if (testData.accessLevel === 'public' || (!testData.invitationRequired && !testData.studioMembershipRequired)) {
            // Public chat should be accessible to all
            expect(accessLevel.canView).toBe(true);
            expect(accessLevel.canRead).toBe(true);
            expect(accessLevel.canWrite).toBe(true);
            expect(accessLevel.accessReason).toBe('public');
          }

          // Consistency check: if user can't view, they shouldn't be able to read or write
          if (!accessLevel.canView) {
            expect(accessLevel.canRead).toBe(false);
            expect(accessLevel.canWrite).toBe(false);
          }

          // Consistency check: if user can't read, they shouldn't be able to write
          if (!accessLevel.canRead) {
            expect(accessLevel.canWrite).toBe(false);
          }

        } catch (error: any) {
          // If access is denied, it should be a proper ChatAccessException
          if (error instanceof ChatAccessException) {
            expect(error.errorCode).toBeDefined();
            expect(error.chatId).toBe(testData.chatId);
            expect(error.userId).toBeDefined();
          } else {
            // Re-throw unexpected errors
            throw error;
          }
        }
      }
    });
  });

  describe('Property 6: Invitation Access Grant', () => {
    it('should grant immediate access when user accepts invitation', async () => {
      // Feature: studio-chat-access-control, Property 6: Invitation Access Grant
      // Validates: Requirements 3.4, 7.1
      
      const testCases = [
        {
          invitationId: 'invitation-1',
          chatId: 'private-chat-1',
          invitedUserId: 'user-2',
          invitedBy: 'user-1',
          status: 'pending' as const,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          chatData: {
            id: 'private-chat-1',
            createdBy: 'user-1',
            accessLevel: 'private' as const,
            invitationRequired: true,
            studioMembershipRequired: false,
            studioId: 'studio-1',
            participantIds: ['user-1']
          }
        },
        {
          invitationId: 'invitation-2',
          chatId: 'private-chat-2',
          invitedUserId: 'user-3',
          invitedBy: 'user-1',
          status: 'pending' as const,
          expiresAt: undefined, // No expiration
          chatData: {
            id: 'private-chat-2',
            createdBy: 'user-1',
            accessLevel: 'private' as const,
            invitationRequired: true,
            studioMembershipRequired: false,
            studioId: 'studio-1',
            participantIds: ['user-1']
          }
        }
      ];

      for (const testData of testCases) {
        // Setup mock responses for invitation acceptance
        
        // Mock getting the invitation
        (mockClient.models.ChatInvitation.get as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: {
              id: testData.invitationId,
              chatId: testData.chatId,
              invitedUserId: testData.invitedUserId,
              invitedBy: testData.invitedBy,
              status: testData.status,
              expiresAt: testData.expiresAt,
              invitedAt: new Date().toISOString()
            },
            errors: null
          })
        );

        // Mock updating invitation status
        (mockClient.models.ChatInvitation.update as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: { id: testData.invitationId, status: 'accepted' },
            errors: null
          })
        );

        // Mock getting chat data
        (mockClient.models.Chat.get as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: testData.chatData,
            errors: null
          })
        );

        // Mock updating chat participants
        (mockClient.models.Chat.update as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: { 
              id: testData.chatId, 
              participantIds: [...testData.chatData.participantIds, testData.invitedUserId] 
            },
            errors: null
          })
        );

        // Mock ChatParticipant operations
        (mockClient.models.ChatParticipant.list as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: [], // No existing participant
            errors: null
          })
        );

        (mockClient.models.ChatParticipant.create as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: {
              id: 'participant-1',
              chatId: testData.chatId,
              userId: testData.invitedUserId,
              userName: testData.invitedUserId,
              joinedAt: new Date().toISOString(),
              isActive: true
            },
            errors: null
          })
        );

        // Property: When a user accepts an invitation, they should immediately gain access
        
        // Step 1: Verify user doesn't have access before accepting invitation
        // Reset mocks for access check before invitation acceptance
        (mockClient.models.Chat.get as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: testData.chatData,
            errors: null
          })
        );

        (mockClient.models.ChatInvitation.list as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: [], // No accepted invitations yet
            errors: null
          })
        );

        const accessBeforeAcceptance = await service.canUserAccessChat(testData.chatId, testData.invitedUserId);
        expect(accessBeforeAcceptance).toBe(false);

        // Step 2: Accept the invitation
        await service.acceptChatInvitation(testData.invitationId);

        // Step 3: Verify user now has access after accepting invitation
        // Mock the accepted invitation for access check
        (mockClient.models.ChatInvitation.list as jasmine.Spy).and.returnValue(
          Promise.resolve({
            data: [{
              id: testData.invitationId,
              chatId: testData.chatId,
              invitedUserId: testData.invitedUserId,
              status: 'accepted',
              expiresAt: testData.expiresAt,
              invitedAt: new Date().toISOString()
            }],
            errors: null
          })
        );

        const accessAfterAcceptance = await service.canUserAccessChat(testData.chatId, testData.invitedUserId);
        expect(accessAfterAcceptance).toBe(true);

        // Property: User should have full access permissions after accepting invitation
        const fullAccess = await service.checkChatAccess(testData.chatId, testData.invitedUserId);
        expect(fullAccess.canView).toBe(true);
        expect(fullAccess.canRead).toBe(true);
        expect(fullAccess.canWrite).toBe(true);
        expect(fullAccess.accessReason).toBe('invited');

        // Verify the invitation was marked as accepted
        expect(mockClient.models.ChatInvitation.update).toHaveBeenCalledWith({
          id: testData.invitationId,
          status: 'accepted'
        });

        // Verify user was added to chat participants
        expect(mockClient.models.Chat.update).toHaveBeenCalledWith({
          id: testData.chatId,
          participantIds: [...testData.chatData.participantIds, testData.invitedUserId]
        });

        // Verify ChatParticipant record was created
        expect(mockClient.models.ChatParticipant.create).toHaveBeenCalledWith({
          chatId: testData.chatId,
          userId: testData.invitedUserId,
          userName: testData.invitedUserId,
          joinedAt: jasmine.any(String),
          isActive: true
        });
      }
    });

    it('should handle expired invitations correctly', async () => {
      const expiredInvitationData = {
        invitationId: 'expired-invitation',
        chatId: 'private-chat-1',
        invitedUserId: 'user-2',
        invitedBy: 'user-1',
        status: 'pending' as const,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      };

      // Mock getting the expired invitation
      (mockClient.models.ChatInvitation.get as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: {
            id: expiredInvitationData.invitationId,
            chatId: expiredInvitationData.chatId,
            invitedUserId: expiredInvitationData.invitedUserId,
            invitedBy: expiredInvitationData.invitedBy,
            status: expiredInvitationData.status,
            expiresAt: expiredInvitationData.expiresAt,
            invitedAt: new Date().toISOString()
          },
          errors: null
        })
      );

      // Mock updating invitation to revoked
      (mockClient.models.ChatInvitation.update as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { id: expiredInvitationData.invitationId, status: 'revoked' },
          errors: null
        })
      );

      // Property: Expired invitations should be rejected and marked as revoked
      try {
        await service.acceptChatInvitation(expiredInvitationData.invitationId);
        fail('Should have thrown ChatAccessException for expired invitation');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ChatAccessException);
        expect(error.errorCode).toBe(ChatAccessError.INVITATION_EXPIRED);
        expect(error.chatId).toBe(expiredInvitationData.chatId);
        expect(error.userId).toBe(expiredInvitationData.invitedUserId);
      }

      // Verify the invitation was marked as revoked
      expect(mockClient.models.ChatInvitation.update).toHaveBeenCalledWith({
        id: expiredInvitationData.invitationId,
        status: 'revoked'
      });
    });

    it('should get user invitations with proper filtering and expiration handling', async () => {
      const userId = 'user-1';
      const mockInvitations = [
        {
          id: 'invitation-1',
          chatId: 'chat-1',
          invitedUserId: userId,
          invitedBy: 'user-2',
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid
          invitedAt: new Date().toISOString()
        },
        {
          id: 'invitation-2',
          chatId: 'chat-2',
          invitedUserId: userId,
          invitedBy: 'user-3',
          status: 'pending',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired
          invitedAt: new Date().toISOString()
        },
        {
          id: 'invitation-3',
          chatId: 'chat-3',
          invitedUserId: userId,
          invitedBy: 'user-4',
          status: 'accepted',
          expiresAt: null,
          invitedAt: new Date().toISOString()
        }
      ];

      // Mock getting user invitations
      (mockClient.models.ChatInvitation.list as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: mockInvitations,
          errors: null
        })
      );

      // Mock updating expired invitation
      (mockClient.models.ChatInvitation.update as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { id: 'invitation-2', status: 'revoked' },
          errors: null
        })
      );

      // Property: getUserChatInvitations should return all invitations and handle expiration
      const invitations = await service.getUserChatInvitations(userId);

      expect(invitations).toBeDefined();
      expect(invitations.length).toBe(3);

      // Check that expired invitation was marked as revoked
      const expiredInvitation = invitations.find(inv => inv.id === 'invitation-2');
      expect(expiredInvitation?.status).toBe('revoked');

      // Verify expired invitation was updated in database
      expect(mockClient.models.ChatInvitation.update).toHaveBeenCalledWith({
        id: 'invitation-2',
        status: 'revoked'
      });

      // Check valid invitation remains pending
      const validInvitation = invitations.find(inv => inv.id === 'invitation-1');
      expect(validInvitation?.status).toBe('pending');

      // Check accepted invitation
      const acceptedInvitation = invitations.find(inv => inv.id === 'invitation-3');
      expect(acceptedInvitation?.status).toBe('accepted');
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate ChatAccessException for invalid scenarios', async () => {
      const testData = {
        chatId: 'nonexistent-chat',
        userId: 'user-1',
        chatExists: false
      };

      // Mock chat not found scenario
      (mockClient.models.Chat.get as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: null,
          errors: [{ message: 'Chat not found' }]
        })
      );

      try {
        await service.checkChatAccess(testData.chatId, testData.userId);
        fail('Should have thrown ChatAccessException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ChatAccessException);
        expect(error.errorCode).toBe(ChatAccessError.CHAT_NOT_FOUND);
        expect(error.chatId).toBe(testData.chatId);
        expect(error.userId).toBe(testData.userId);
      }
    });
  });
});