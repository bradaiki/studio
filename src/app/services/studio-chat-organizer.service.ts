import { Injectable } from '@angular/core';
import { Chat, ChatListItem } from '../models/chat.models';

export interface OrganizedStudioChats {
  publicChats: ChatListItem[];
  privateChats: ChatListItem[];
  invitationsPending: any[]; // ChatInvitation[] - keeping as any for now to avoid circular dependencies
  totalPublic: number;
  totalPrivate: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudioChatOrganizer {

  constructor() {
    console.log('StudioChatOrganizer service initialized');
  }

  /**
   * Organize studio chats into public and private sections with proper sorting
   * Implements Requirements 6.1, 6.4
   */
  organizeStudioChats(chatListItems: ChatListItem[]): OrganizedStudioChats {
    try {
      console.log('Organizing', chatListItems.length, 'chat list items');

      // Separate public and private chats
      const { publicChats, privateChats } = this.separatePublicPrivateChats(chatListItems);

      // Sort each section by activity
      const sortedPublicChats = this.sortChatsByActivity(publicChats);
      const sortedPrivateChats = this.sortChatsByActivity(privateChats);

      const result: OrganizedStudioChats = {
        publicChats: sortedPublicChats,
        privateChats: sortedPrivateChats,
        invitationsPending: [], // Will be populated by caller if needed
        totalPublic: sortedPublicChats.length,
        totalPrivate: sortedPrivateChats.length
      };

      console.log('Organized chats:', {
        publicCount: result.totalPublic,
        privateCount: result.totalPrivate
      });

      return result;

    } catch (error) {
      console.error('Error organizing studio chats:', error);
      
      // Return empty result on error
      return {
        publicChats: [],
        privateChats: [],
        invitationsPending: [],
        totalPublic: 0,
        totalPrivate: 0
      };
    }
  }

  /**
   * Separate chat list items into public and private categories
   * Implements Requirement 6.1
   */
  separatePublicPrivateChats(chatListItems: ChatListItem[]): { publicChats: ChatListItem[], privateChats: ChatListItem[] } {
    try {
      const publicChats: ChatListItem[] = [];
      const privateChats: ChatListItem[] = [];

      for (const item of chatListItems) {
        // Skip malformed items
        if (!item || !item.chat) {
          console.warn('Skipping malformed chat list item:', item);
          continue;
        }

        const chat = item.chat;
        
        // Determine if chat is public or private based on access level and settings
        const isPublic = this.isChatPublic(chat);
        
        if (isPublic) {
          publicChats.push(item);
        } else {
          privateChats.push(item);
        }
      }

      console.log(`Separated chats: ${publicChats.length} public, ${privateChats.length} private`);

      return { publicChats, privateChats };

    } catch (error) {
      console.error('Error separating public/private chats:', error);
      return { publicChats: [], privateChats: [] };
    }
  }

  /**
   * Sort chat list items by recent activity (most recent first)
   * Implements Requirement 6.4
   */
  sortChatsByActivity(chatListItems: ChatListItem[]): ChatListItem[] {
    try {
      return [...chatListItems].sort((a, b) => {
        // Get the most recent activity timestamp for each chat
        const aTime = this.getChatActivityTimestamp(a);
        const bTime = this.getChatActivityTimestamp(b);
        
        // Sort in descending order (most recent first)
        return bTime - aTime;
      });

    } catch (error) {
      console.error('Error sorting chats by activity:', error);
      return chatListItems;
    }
  }

  /**
   * Sort raw Chat objects by recent activity (for backward compatibility)
   */
  sortChatsByActivityRaw(chats: Chat[]): Chat[] {
    try {
      return [...chats].sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
        
        // Sort in descending order (most recent first)
        return bTime - aTime;
      });

    } catch (error) {
      console.error('Error sorting raw chats by activity:', error);
      return chats;
    }
  }

  /**
   * Get organized chats with additional sorting options
   */
  organizeStudioChatsWithOptions(
    chatListItems: ChatListItem[], 
    options: {
      sortBy?: 'activity' | 'name' | 'created' | 'memberCount';
      groupPinnedFirst?: boolean;
      separateByType?: boolean;
    } = {}
  ): OrganizedStudioChats {
    try {
      console.log('Organizing chats with options:', options);

      let organizedChats: ChatListItem[];

      if (options.separateByType !== false) {
        // Default behavior: separate by public/private
        const { publicChats, privateChats } = this.separatePublicPrivateChats(chatListItems);
        
        // Sort each section
        const sortedPublicChats = this.sortChatListItems(publicChats, options);
        const sortedPrivateChats = this.sortChatListItems(privateChats, options);

        return {
          publicChats: sortedPublicChats,
          privateChats: sortedPrivateChats,
          invitationsPending: [],
          totalPublic: sortedPublicChats.length,
          totalPrivate: sortedPrivateChats.length
        };
      } else {
        // Don't separate by type, just sort all together
        organizedChats = this.sortChatListItems(chatListItems, options);

        return {
          publicChats: organizedChats,
          privateChats: [],
          invitationsPending: [],
          totalPublic: organizedChats.length,
          totalPrivate: 0
        };
      }

    } catch (error) {
      console.error('Error organizing chats with options:', error);
      return this.organizeStudioChats(chatListItems);
    }
  }

  /**
   * Check if a chat should be considered public
   */
  private isChatPublic(chat: Chat): boolean {
    try {
      // Handle null or undefined chat
      if (!chat) {
        console.warn('Cannot determine publicity of null/undefined chat');
        return false;
      }

      // Check explicit access level first
      if (chat.accessLevel) {
        return chat.accessLevel === 'public';
      }

      // Check invitation requirements
      if (chat.invitationRequired === true) {
        return false;
      }

      // Check studio membership requirements
      if (chat.studioMembershipRequired === true) {
        return false;
      }

      // Check chat settings
      if (chat.settings) {
        // If explicitly marked as not public
        if (chat.settings.isPublic === false) {
          return false;
        }

        // If inviting is disabled, it might be more restricted
        if (chat.settings.allowInviting === false && chat.type === 'private') {
          return false;
        }
      }

      // Check chat type
      if (chat.type === 'private') {
        return false;
      }

      // Default to public for studio and group chats
      return chat.type === 'studio' || chat.type === 'group';

    } catch (error) {
      console.error('Error determining if chat is public:', error);
      // Default to private on error for security
      return false;
    }
  }

  /**
   * Get the most recent activity timestamp for a chat list item
   */
  private getChatActivityTimestamp(chatListItem: ChatListItem): number {
    try {
      const chat = chatListItem.chat;
      const lastMessage = chatListItem.lastMessage;

      // Priority order: last message timestamp, chat's lastMessageAt, updatedAt, createdAt
      if (lastMessage && lastMessage.timestamp) {
        return lastMessage.timestamp.getTime();
      }

      if (chat.lastMessageAt) {
        return chat.lastMessageAt.getTime();
      }

      if (chat.updatedAt) {
        return chat.updatedAt.getTime();
      }

      if (chat.createdAt) {
        return chat.createdAt.getTime();
      }

      // Fallback to 0 if no timestamps available
      return 0;

    } catch (error) {
      console.error('Error getting chat activity timestamp:', error);
      return 0;
    }
  }

  /**
   * Sort chat list items with various options
   */
  private sortChatListItems(
    chatListItems: ChatListItem[], 
    options: {
      sortBy?: 'activity' | 'name' | 'created' | 'memberCount';
      groupPinnedFirst?: boolean;
    }
  ): ChatListItem[] {
    try {
      let sortedItems = [...chatListItems];

      // Primary sort based on sortBy option
      switch (options.sortBy) {
        case 'name':
          sortedItems.sort((a, b) => a.chat.name.localeCompare(b.chat.name));
          break;
        
        case 'created':
          sortedItems.sort((a, b) => {
            const aTime = a.chat.createdAt?.getTime() || 0;
            const bTime = b.chat.createdAt?.getTime() || 0;
            return bTime - aTime; // Newest first
          });
          break;
        
        case 'memberCount':
          sortedItems.sort((a, b) => {
            const aCount = a.participants?.length || a.chat.participantIds?.length || 0;
            const bCount = b.participants?.length || b.chat.participantIds?.length || 0;
            return bCount - aCount; // Most members first
          });
          break;
        
        case 'activity':
        default:
          sortedItems = this.sortChatsByActivity(sortedItems);
          break;
      }

      // Secondary sort: group pinned chats first if requested
      if (options.groupPinnedFirst) {
        sortedItems.sort((a, b) => {
          const aPinned = a.userPreferences?.isPinned || false;
          const bPinned = b.userPreferences?.isPinned || false;
          
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return 0; // Maintain existing order for items with same pin status
        });
      }

      return sortedItems;

    } catch (error) {
      console.error('Error sorting chat list items:', error);
      return chatListItems;
    }
  }

  /**
   * Get chat statistics for a list of organized chats
   */
  getChatStatistics(organizedChats: OrganizedStudioChats): {
    totalChats: number;
    publicChats: number;
    privateChats: number;
    totalParticipants: number;
    averageParticipantsPerChat: number;
    chatsWithRecentActivity: number;
  } {
    try {
      const allChats = [...organizedChats.publicChats, ...organizedChats.privateChats];
      const totalChats = allChats.length;
      
      let totalParticipants = 0;
      let chatsWithRecentActivity = 0;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const chatItem of allChats) {
        // Count participants
        const participantCount = chatItem.participants?.length || chatItem.chat.participantIds?.length || 0;
        totalParticipants += participantCount;

        // Check for recent activity
        const activityTime = this.getChatActivityTimestamp(chatItem);
        if (activityTime > oneDayAgo.getTime()) {
          chatsWithRecentActivity++;
        }
      }

      const averageParticipantsPerChat = totalChats > 0 ? totalParticipants / totalChats : 0;

      return {
        totalChats,
        publicChats: organizedChats.totalPublic,
        privateChats: organizedChats.totalPrivate,
        totalParticipants,
        averageParticipantsPerChat: Math.round(averageParticipantsPerChat * 100) / 100,
        chatsWithRecentActivity
      };

    } catch (error) {
      console.error('Error calculating chat statistics:', error);
      return {
        totalChats: 0,
        publicChats: 0,
        privateChats: 0,
        totalParticipants: 0,
        averageParticipantsPerChat: 0,
        chatsWithRecentActivity: 0
      };
    }
  }

  /**
   * Filter organized chats by search query
   */
  filterOrganizedChats(
    organizedChats: OrganizedStudioChats, 
    searchQuery: string
  ): OrganizedStudioChats {
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return organizedChats;
      }

      const query = searchQuery.toLowerCase().trim();

      const filterChatItems = (items: ChatListItem[]): ChatListItem[] => {
        return items.filter(item => {
          const chat = item.chat;
          
          // Search in chat name
          if (chat.name.toLowerCase().includes(query)) {
            return true;
          }

          // Search in chat description
          if (chat.description && chat.description.toLowerCase().includes(query)) {
            return true;
          }

          // Search in last message content
          if (item.lastMessage && item.lastMessage.message.toLowerCase().includes(query)) {
            return true;
          }

          // Search in participant names (if available)
          if (item.participants) {
            for (const participant of item.participants) {
              if (participant.userName.toLowerCase().includes(query)) {
                return true;
              }
            }
          }

          return false;
        });
      };

      const filteredPublicChats = filterChatItems(organizedChats.publicChats);
      const filteredPrivateChats = filterChatItems(organizedChats.privateChats);

      return {
        publicChats: filteredPublicChats,
        privateChats: filteredPrivateChats,
        invitationsPending: organizedChats.invitationsPending,
        totalPublic: filteredPublicChats.length,
        totalPrivate: filteredPrivateChats.length
      };

    } catch (error) {
      console.error('Error filtering organized chats:', error);
      return organizedChats;
    }
  }
}