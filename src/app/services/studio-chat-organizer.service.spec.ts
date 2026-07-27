import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { StudioChatOrganizer, OrganizedStudioChats } from './studio-chat-organizer.service';
import { Chat, ChatListItem, ChatSettings } from '../models/chat.models';

// Feature: studio-chat-access-control, Property 13: Chat Organization Correctness
describe('StudioChatOrganizer', () => {
  let service: StudioChatOrganizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudioChatOrganizer]
    });
    service = TestBed.inject(StudioChatOrganizer);
  });

  describe('Property 13: Chat Organization Correctness', () => {
    it('should correctly organize chats into public and private sections with proper sorting', async () => {
      // Feature: studio-chat-access-control, Property 13: Chat Organization Correctness
      // Validates: Requirements 6.1, 6.4

      fc.assert(
        fc.property(
          // Generate test data with arbitrary chat list items
          fc.record({
            studioId: fc.string({ minLength: 1, maxLength: 50 }),
            chatListItems: fc.array(
              fc.record({
                chatId: fc.string({ minLength: 1, maxLength: 50 }),
                chatName: fc.string({ minLength: 1, maxLength: 100 }),
                chatType: fc.constantFrom('studio', 'private', 'group'),
                accessLevel: fc.option(fc.constantFrom('public', 'private')),
                invitationRequired: fc.boolean(),
                studioMembershipRequired: fc.boolean(),
                isPublic: fc.boolean(),
                allowInviting: fc.boolean(),
                lastMessageTimestamp: fc.option(fc.date()),
                updatedAt: fc.option(fc.date()),
                createdAt: fc.date(),
                participantCount: fc.integer({ min: 0, max: 100 }),
                lastMessageContent: fc.option(fc.string({ maxLength: 200 }))
              }),
              { minLength: 0, maxLength: 30 }
            )
          }),
          (testData) => {
            try {
              // Convert test data to proper ChatListItem objects
              const chatListItems: ChatListItem[] = testData.chatListItems.map(itemData => {
                const chat: Chat = {
                  id: itemData.chatId,
                  name: itemData.chatName,
                  type: itemData.chatType as 'studio' | 'private' | 'group',
                  studioId: testData.studioId,
                  participantIds: Array.from({ length: itemData.participantCount }, (_, i) => `user-${i}`),
                  createdBy: 'creator',
                  createdAt: itemData.createdAt,
                  updatedAt: itemData.updatedAt || itemData.createdAt,
                  lastMessageAt: itemData.lastMessageTimestamp || undefined,
                  isActive: true,
                  accessLevel: itemData.accessLevel || undefined,
                  invitationRequired: itemData.invitationRequired,
                  studioMembershipRequired: itemData.studioMembershipRequired,
                  settings: {
                    allowLeaving: true,
                    allowMuting: true,
                    allowInviting: itemData.allowInviting,
                    isPublic: itemData.isPublic,
                    maxParticipants: 50
                  } as ChatSettings
                };

                const chatListItem: ChatListItem = {
                  chat: chat,
                  lastMessage: itemData.lastMessageContent ? {
                    id: 'msg-1',
                    chatId: chat.id,
                    senderId: 'sender',
                    senderName: 'Sender User',
                    message: itemData.lastMessageContent,
                    timestamp: itemData.lastMessageTimestamp || itemData.createdAt,
                    isRead: true,
                    isOwn: false,
                    messageType: 'text'
                  } : undefined,
                  participants: Array.from({ length: itemData.participantCount }, (_, i) => ({
                    id: `participant-${i}`,
                    chatId: chat.id,
                    userId: `user-${i}`,
                    userName: `User ${i}`,
                    role: 'member',
                    joinedAt: itemData.createdAt,
                    isMuted: false,
                    isActive: true
                  })),
                  unreadCount: 0,
                  userPreferences: {
                    id: `pref-${chat.id}`,
                    userId: 'test-user',
                    chatId: chat.id,
                    isFavorite: false,
                    isMuted: false,
                    isPinned: false,
                    createdAt: itemData.createdAt,
                    updatedAt: itemData.createdAt
                  }
                };

                return chatListItem;
              });

              // Property: For any list of chat items, the organization should correctly
              // separate public and private chats and sort each section by activity

              const organizedChats: OrganizedStudioChats = service.organizeStudioChats(chatListItems);

              // Requirement 6.1: Chats should be grouped into public and private sections
              
              // Verify that all public chats are actually public
              for (const publicChatItem of organizedChats.publicChats) {
                const chat = publicChatItem.chat;
                const isActuallyPublic = service['isChatPublic'](chat);
                expect(isActuallyPublic).toBe(true);
              }

              // Verify that all private chats are actually private
              for (const privateChatItem of organizedChats.privateChats) {
                const chat = privateChatItem.chat;
                const isActuallyPublic = service['isChatPublic'](chat);
                expect(isActuallyPublic).toBe(false);
              }

              // Verify that no chats are lost or duplicated
              const totalOrganizedChats = organizedChats.publicChats.length + organizedChats.privateChats.length;
              expect(totalOrganizedChats).toBe(chatListItems.length);

              // Verify that counts are accurate
              expect(organizedChats.totalPublic).toBe(organizedChats.publicChats.length);
              expect(organizedChats.totalPrivate).toBe(organizedChats.privateChats.length);

              // Requirement 6.4: Chats should be sorted by recent activity within each section

              // Verify public chats are sorted by activity (most recent first)
              for (let i = 0; i < organizedChats.publicChats.length - 1; i++) {
                const currentItem = organizedChats.publicChats[i];
                const nextItem = organizedChats.publicChats[i + 1];
                
                const currentTimestamp = service['getChatActivityTimestamp'](currentItem);
                const nextTimestamp = service['getChatActivityTimestamp'](nextItem);
                
                // Most recent should come first (descending order)
                expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
              }

              // Verify private chats are sorted by activity (most recent first)
              for (let i = 0; i < organizedChats.privateChats.length - 1; i++) {
                const currentItem = organizedChats.privateChats[i];
                const nextItem = organizedChats.privateChats[i + 1];
                
                const currentTimestamp = service['getChatActivityTimestamp'](currentItem);
                const nextTimestamp = service['getChatActivityTimestamp'](nextItem);
                
                // Most recent should come first (descending order)
                expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
              }

              // Verify that the organization is deterministic - same input should produce same output
              const organizedChats2 = service.organizeStudioChats(chatListItems);
              expect(organizedChats.publicChats.length).toBe(organizedChats2.publicChats.length);
              expect(organizedChats.privateChats.length).toBe(organizedChats2.privateChats.length);

              // Verify that chat IDs match between runs (deterministic ordering)
              for (let i = 0; i < organizedChats.publicChats.length; i++) {
                expect(organizedChats.publicChats[i].chat.id).toBe(organizedChats2.publicChats[i].chat.id);
              }
              for (let i = 0; i < organizedChats.privateChats.length; i++) {
                expect(organizedChats.privateChats[i].chat.id).toBe(organizedChats2.privateChats[i].chat.id);
              }

              console.log(`Property test passed: ${chatListItems.length} chats organized into ${organizedChats.totalPublic} public and ${organizedChats.totalPrivate} private chats`);

            } catch (error) {
              console.error('Property test failed:', error);
              throw error;
            }
          }
        ),
        { numRuns: 15 } // Sufficient runs to test various combinations
      );
    });

    it('should handle empty chat lists correctly', () => {
      // Edge case: empty chat list should return empty organized result
      const result = service.organizeStudioChats([]);
      
      expect(result.publicChats).toEqual([]);
      expect(result.privateChats).toEqual([]);
      expect(result.totalPublic).toBe(0);
      expect(result.totalPrivate).toBe(0);
      expect(result.invitationsPending).toEqual([]);
    });

    it('should handle chats with missing timestamps gracefully', () => {
      // Test chats with no activity timestamps
      const chatWithoutTimestamps: ChatListItem = {
        chat: {
          id: 'test-chat-1',
          name: 'Test Chat',
          type: 'studio',
          studioId: 'test-studio',
          participantIds: [],
          createdBy: 'creator',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          isActive: true,
          settings: {
            allowLeaving: true,
            allowMuting: true,
            allowInviting: true,
            isPublic: true
          }
        },
        participants: [],
        unreadCount: 0
      };

      const result = service.organizeStudioChats([chatWithoutTimestamps]);
      
      expect(result.publicChats.length).toBe(1);
      expect(result.privateChats.length).toBe(0);
      expect(result.totalPublic).toBe(1);
      expect(result.totalPrivate).toBe(0);
    });

    it('should correctly determine chat publicity based on various criteria', () => {
      // Test the isChatPublic method with different chat configurations
      const testCases = [
        {
          description: 'explicit public access level',
          chat: { accessLevel: 'public', type: 'studio' } as Chat,
          expectedPublic: true
        },
        {
          description: 'explicit private access level',
          chat: { accessLevel: 'private', type: 'studio' } as Chat,
          expectedPublic: false
        },
        {
          description: 'invitation required',
          chat: { invitationRequired: true, type: 'studio' } as Chat,
          expectedPublic: false
        },
        {
          description: 'studio membership required',
          chat: { studioMembershipRequired: true, type: 'studio' } as Chat,
          expectedPublic: false
        },
        {
          description: 'private chat type',
          chat: { type: 'private' } as Chat,
          expectedPublic: false
        },
        {
          description: 'studio chat type with public settings',
          chat: { 
            type: 'studio',
            settings: { isPublic: true, allowInviting: true }
          } as Chat,
          expectedPublic: true
        },
        {
          description: 'group chat type',
          chat: { type: 'group' } as Chat,
          expectedPublic: true
        }
      ];

      for (const testCase of testCases) {
        // Fill in required fields for Chat interface
        const completeChat: Chat = {
          ...testCase.chat,
          id: testCase.chat.id || 'test-id',
          name: testCase.chat.name || 'Test Chat',
          studioId: testCase.chat.studioId || 'test-studio',
          participantIds: testCase.chat.participantIds || [],
          createdBy: testCase.chat.createdBy || 'creator',
          createdAt: testCase.chat.createdAt || new Date(),
          updatedAt: testCase.chat.updatedAt || new Date(),
          isActive: testCase.chat.isActive !== undefined ? testCase.chat.isActive : true,
          settings: testCase.chat.settings || {
            allowLeaving: true,
            allowMuting: true,
            allowInviting: true,
            isPublic: true
          }
        };

        const isPublic = service['isChatPublic'](completeChat);
        expect(isPublic).toBe(testCase.expectedPublic, 
          `Failed for ${testCase.description}: expected ${testCase.expectedPublic}, got ${isPublic}`);
      }
    });

    it('should handle service errors gracefully', () => {
      // Test error handling when chat data is malformed
      const malformedChatItem = {
        chat: null, // This should cause an error
        participants: [],
        unreadCount: 0
      } as any;

      // Should not throw an error, but return empty result due to error handling
      const result = service.organizeStudioChats([malformedChatItem]);
      
      // The service should handle the error and return empty result
      expect(result.publicChats).toEqual([]);
      expect(result.privateChats).toEqual([]);
      expect(result.totalPublic).toBe(0);
      expect(result.totalPrivate).toBe(0);
    });
  });

  describe('Additional Organization Features', () => {
    it('should provide chat statistics correctly', () => {
      // Test the getChatStatistics method
      const testChatItems: ChatListItem[] = [
        {
          chat: {
            id: 'public-1',
            name: 'Public Chat 1',
            type: 'studio',
            studioId: 'test-studio',
            participantIds: ['user1', 'user2'],
            createdBy: 'creator',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMessageAt: new Date(), // Recent activity
            isActive: true,
            settings: { isPublic: true }
          } as Chat,
          participants: [
            { 
              id: 'participant-1',
              chatId: 'public-1',
              userId: 'user1', 
              userName: 'User 1', 
              role: 'member',
              joinedAt: new Date(),
              isMuted: false,
              isActive: true
            },
            { 
              id: 'participant-2',
              chatId: 'public-1',
              userId: 'user2', 
              userName: 'User 2', 
              role: 'member',
              joinedAt: new Date(),
              isMuted: false,
              isActive: true
            }
          ],
          unreadCount: 0
        },
        {
          chat: {
            id: 'private-1',
            name: 'Private Chat 1',
            type: 'private',
            studioId: 'test-studio',
            participantIds: ['user1'],
            createdBy: 'creator',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isActive: true,
            settings: {
              allowLeaving: true,
              allowMuting: true,
              allowInviting: true,
              isPublic: false
            }
          } as Chat,
          participants: [
            { 
              id: 'participant-3',
              chatId: 'private-1',
              userId: 'user1', 
              userName: 'User 1', 
              role: 'member',
              joinedAt: new Date(),
              isMuted: false,
              isActive: true
            }
          ],
          unreadCount: 0
        }
      ];

      const organizedChats = service.organizeStudioChats(testChatItems);
      const stats = service.getChatStatistics(organizedChats);

      expect(stats.totalChats).toBe(2);
      expect(stats.publicChats).toBe(1);
      expect(stats.privateChats).toBe(1);
      expect(stats.totalParticipants).toBe(3); // 2 + 1
      expect(stats.averageParticipantsPerChat).toBe(1.5);
      expect(stats.chatsWithRecentActivity).toBe(1); // Only the one with recent lastMessageAt
    });

    it('should filter organized chats by search query', () => {
      // Test the filterOrganizedChats method
      const testChatItems: ChatListItem[] = [
        {
          chat: {
            id: 'chat-1',
            name: 'General Discussion',
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
          } as Chat,
          participants: [],
          unreadCount: 0
        },
        {
          chat: {
            id: 'chat-2',
            name: 'Private Planning',
            type: 'private',
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
              isPublic: false
            }
          } as Chat,
          participants: [],
          unreadCount: 0
        }
      ];

      const organizedChats = service.organizeStudioChats(testChatItems);
      
      // Filter by "General"
      const filteredChats = service.filterOrganizedChats(organizedChats, 'General');
      
      expect(filteredChats.publicChats.length).toBe(1);
      expect(filteredChats.privateChats.length).toBe(0);
      expect(filteredChats.publicChats[0].chat.name).toBe('General Discussion');
      
      // Filter by "Planning"
      const filteredChats2 = service.filterOrganizedChats(organizedChats, 'Planning');
      
      expect(filteredChats2.publicChats.length).toBe(0);
      expect(filteredChats2.privateChats.length).toBe(1);
      expect(filteredChats2.privateChats[0].chat.name).toBe('Private Planning');
      
      // Empty search should return all chats
      const filteredChats3 = service.filterOrganizedChats(organizedChats, '');
      expect(filteredChats3.publicChats.length).toBe(organizedChats.publicChats.length);
      expect(filteredChats3.privateChats.length).toBe(organizedChats.privateChats.length);
    });
  });
});