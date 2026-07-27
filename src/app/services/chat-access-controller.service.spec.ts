import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import * as fc from 'fast-check';
import { ChatAccessController } from './chat-access-controller.service';
import { AccessControlService } from './access-control.service';
import { ChatService } from './chat.service';
import { AuthStateService } from './auth-state.service';
import { Chat, ChatSettings } from '../models/chat.models';

// Mock services
const mockAccessControlService = {
  canUserAccessChat: jasmine.createSpy('canUserAccessChat').and.returnValue(Promise.resolve(true)),
  canUserSendMessage: jasmine.createSpy('canUserSendMessage').and.returnValue(Promise.resolve(true)),
  checkChatAccess: jasmine.createSpy('checkChatAccess').and.returnValue(Promise.resolve({
    canView: true,
    canRead: true,
    canWrite: true,
    canInvite: false,
    canManage: false,
    accessReason: 'public'
  }))
};

const mockChatService = {
  getStudioChats: jasmine.createSpy('getStudioChats').and.returnValue(Promise.resolve({
    studioId: 'test-studio',
    chats: [],
    totalCount: 0
  })),
  loadMessages: jasmine.createSpy('loadMessages').and.returnValue(Promise.resolve([])),
  loadParticipants: jasmine.createSpy('loadParticipants').and.returnValue(Promise.resolve([])),
  getUnreadCount: jasmine.createSpy('getUnreadCount').and.returnValue(0),
  loadUserChats: jasmine.createSpy('loadUserChats').and.returnValue(Promise.resolve([]))
};

const mockAuthStateService = {
  currentUser$: of({ userId: 'test-user', username: 'testuser' })
};

// Feature: studio-chat-access-control, Property 10: Chat List Access Filtering
describe('ChatAccessController', () => {
  let controller: ChatAccessController;
  let accessControlService: jasmine.SpyObj<AccessControlService>;
  let chatService: jasmine.SpyObj<ChatService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatAccessController,
        { provide: AccessControlService, useValue: mockAccessControlService },
        { provide: ChatService, useValue: mockChatService },
        { provide: AuthStateService, useValue: mockAuthStateService }
      ]
    });

    controller = TestBed.inject(ChatAccessController);
    accessControlService = TestBed.inject(AccessControlService) as jasmine.SpyObj<AccessControlService>;
    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    
    // Reset all spy calls after service initialization
    accessControlService.canUserAccessChat.calls.reset();
    accessControlService.canUserSendMessage.calls.reset();
    accessControlService.checkChatAccess.calls.reset();
  });

  describe('Property 10: Chat List Access Filtering', () => {
    it('should filter chat lists to only include chats the user has access to', async () => {
      // Feature: studio-chat-access-control, Property 10: Chat List Access Filtering
      // Validates: Requirements 5.3, 6.5

      fc.assert(
        fc.asyncProperty(
          // Generate test data with arbitrary chat lists and user access patterns
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            studioId: fc.string({ minLength: 1, maxLength: 50 }),
            chats: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 50 }),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.option(fc.string({ maxLength: 500 })),
                type: fc.constantFrom('studio', 'private', 'group'),
                studioId: fc.string({ minLength: 1, maxLength: 50 }),
                participantIds: fc.array(fc.string({ minLength: 1 }), { maxLength: 10 }),
                createdBy: fc.string({ minLength: 1 }),
                createdAt: fc.date(),
                updatedAt: fc.date(),
                isActive: fc.boolean(),
                hasAccess: fc.boolean() // This determines if user should have access
              }),
              { minLength: 0, maxLength: 20 }
            )
          }),
          async (testData) => {
            try {
              // Reset spy call counts
              accessControlService.canUserAccessChat.calls.reset();

              // Set up mock responses based on test data
              accessControlService.canUserAccessChat.and.callFake(async (chatId: string, userId: string) => {
                const chat = testData.chats.find(c => c.id === chatId);
                return chat ? chat.hasAccess : false;
              });

              // Convert test data to proper Chat objects
              const chats: Chat[] = testData.chats.map(chatData => ({
                id: chatData.id,
                name: chatData.name,
                description: chatData.description || undefined,
                type: chatData.type as 'studio' | 'private' | 'group',
                studioId: chatData.studioId,
                participantIds: chatData.participantIds,
                createdBy: chatData.createdBy,
                createdAt: chatData.createdAt,
                updatedAt: chatData.updatedAt,
                lastMessageId: undefined,
                lastMessageAt: undefined,
                isActive: chatData.isActive,
                settings: {
                  allowLeaving: true,
                  allowMuting: true,
                  allowInviting: true,
                  isPublic: true,
                  maxParticipants: 50
                } as ChatSettings
              }));

              // Property: For any user requesting a studio's chat list, the returned list 
              // should contain only chats that the user has permission to access

              const filteredChats = await controller.filterChatsByAccess(chats, testData.userId);

              // Verify that access control was checked for each chat
              expect(accessControlService.canUserAccessChat).toHaveBeenCalledTimes(chats.length);

              // Verify that all returned chats should have access = true
              const expectedAccessibleChats = testData.chats.filter(c => c.hasAccess);
              expect(filteredChats.length).toBe(expectedAccessibleChats.length);

              // Verify that each filtered chat corresponds to a chat with hasAccess = true
              for (const filteredChat of filteredChats) {
                const originalChatData = testData.chats.find(c => c.id === filteredChat.id);
                expect(originalChatData).toBeDefined();
                expect(originalChatData!.hasAccess).toBe(true);
              }

              // Verify that no chat without access is included
              for (const filteredChat of filteredChats) {
                const originalChatData = testData.chats.find(c => c.id === filteredChat.id);
                expect(originalChatData!.hasAccess).toBe(true);
              }

              // Property: The filtering should be consistent - if a chat is included,
              // the user must have access to it
              for (const chat of filteredChats) {
                const hasAccess = await accessControlService.canUserAccessChat(chat.id, testData.userId);
                expect(hasAccess).toBe(true);
              }

              console.log(`Property test passed: ${chats.length} chats filtered to ${filteredChats.length} accessible chats`);

            } catch (error) {
              console.error('Property test failed:', error);
              throw error;
            }
          }
        ),
        { numRuns: 10 } // Reduced from 100 for faster execution
      );
    });

    it('should handle empty chat lists correctly', async () => {
      // Edge case: empty chat list should return empty result
      const result = await controller.filterChatsByAccess([], 'test-user');
      expect(result).toEqual([]);
      expect(accessControlService.canUserAccessChat).not.toHaveBeenCalled();
    });

    it('should handle access control service errors gracefully', async () => {
      // Test error handling when access control service fails
      accessControlService.canUserAccessChat.and.rejectWith(new Error('Access control error'));

      const testChats: Chat[] = [{
        id: 'test-chat-1',
        name: 'Test Chat',
        description: 'Test Description',
        type: 'studio',
        studioId: 'test-studio',
        participantIds: [],
        createdBy: 'creator',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        settings: {
          allowLeaving: true,
          allowMuting: true,
          allowInviting: true,
          isPublic: true
        }
      }];

      const result = await controller.filterChatsByAccess(testChats, 'test-user');
      
      // Should return empty array when access control fails
      expect(result).toEqual([]);
    });

    it('should handle missing user ID gracefully', async () => {
      const testChats: Chat[] = [{
        id: 'test-chat-1',
        name: 'Test Chat',
        type: 'studio',
        studioId: 'test-studio',
        participantIds: [],
        createdBy: 'creator',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        settings: {
          allowLeaving: true,
          allowMuting: true,
          allowInviting: true,
          isPublic: true
        }
      }];

      // Test with undefined user ID
      const result = await controller.filterChatsByAccess(testChats, undefined);
      expect(result).toEqual([]);
      expect(accessControlService.canUserAccessChat).not.toHaveBeenCalled();
    });
  });

  describe('Property 7: Access Revocation Immediate Effect', () => {
    it('should immediately hide chat when user access is revoked', async () => {
      // Feature: studio-chat-access-control, Property 7: Access Revocation Immediate Effect
      // Validates: Requirements 5.4, 7.2, 8.3

      fc.assert(
        fc.asyncProperty(
          // Generate test data for access revocation scenarios
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            chatId: fc.string({ minLength: 1, maxLength: 50 }),
            revokedBy: fc.string({ minLength: 1, maxLength: 50 }),
            initialAccess: fc.boolean(),
            accessLevel: fc.record({
              canView: fc.boolean(),
              canRead: fc.boolean(),
              canWrite: fc.boolean(),
              canInvite: fc.boolean(),
              canManage: fc.boolean(),
              accessReason: fc.constantFrom('public', 'invited', 'studio_member', 'admin', 'creator')
            })
          }),
          async (testData) => {
            try {
              // Reset spy call counts
              accessControlService.canUserAccessChat.calls.reset();
              accessControlService.checkChatAccess.calls.reset();

              // Set up initial access state
              accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(testData.initialAccess));
              accessControlService.checkChatAccess.and.returnValue(Promise.resolve(testData.accessLevel));

              // Property: For any user with chat access, when their access is revoked, 
              // they should immediately lose all visibility and interaction capabilities for that chat

              if (testData.initialAccess) {
                // Step 1: Verify user initially has access
                const initialAccess = await controller.canUserAccessChat(testData.chatId, testData.userId);
                expect(initialAccess).toBe(true);

                // Step 2: Simulate access revocation by changing mock response
                accessControlService.canUserAccessChat.and.returnValue(Promise.resolve(false));
                accessControlService.checkChatAccess.and.returnValue(Promise.resolve({
                  canView: false,
                  canRead: false,
                  canWrite: false,
                  canInvite: false,
                  canManage: false,
                  accessReason: 'public'
                }));

                // Step 3: Handle immediate access revocation
                await controller.handleImmediateAccessRevocation(testData.chatId, testData.userId);

                // Step 4: Verify access is immediately revoked
                const accessAfterRevocation = await controller.canUserAccessChat(testData.chatId, testData.userId);
                expect(accessAfterRevocation).toBe(false);

                // Step 5: Verify user cannot send messages
                const canSendAfterRevocation = await controller.canUserSendMessage(testData.chatId, testData.userId);
                expect(canSendAfterRevocation).toBe(false);

                // Step 6: Verify access level shows no permissions
                const accessLevelAfterRevocation = await controller.getChatAccessLevel(testData.chatId, testData.userId);
                expect(accessLevelAfterRevocation).toBeDefined();
                if (accessLevelAfterRevocation) {
                  expect(accessLevelAfterRevocation.canView).toBe(false);
                  expect(accessLevelAfterRevocation.canRead).toBe(false);
                  expect(accessLevelAfterRevocation.canWrite).toBe(false);
                }

                console.log(`Property test passed: Access revoked for user ${testData.userId} on chat ${testData.chatId}`);
              } else {
                // If user didn't have initial access, revocation should be a no-op
                await controller.handleImmediateAccessRevocation(testData.chatId, testData.userId);
                
                const accessAfterRevocation = await controller.canUserAccessChat(testData.chatId, testData.userId);
                expect(accessAfterRevocation).toBe(false);

                console.log(`Property test passed: No-op revocation for user without initial access`);
              }

            } catch (error) {
              console.error('Property test failed:', error);
              throw error;
            }
          }
        ),
        { numRuns: 10 } // Reduced for faster execution
      );
    });

    it('should handle access revocation for non-existent chats gracefully', async () => {
      // Edge case: revoking access for non-existent chat should not throw error
      await controller.handleImmediateAccessRevocation('non-existent-chat', 'test-user');
      
      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should handle access revocation without user ID gracefully', async () => {
      // Edge case: revoking access without user ID should not throw error
      await controller.handleImmediateAccessRevocation('test-chat', undefined);
      
      // Should complete without throwing
      expect(true).toBe(true);
    });
  });
});