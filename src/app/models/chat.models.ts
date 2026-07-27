export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isOwn: boolean;
  messageType: 'text' | 'image' | 'file' | 'system';
  replyToId?: string; // For threaded conversations
  editedAt?: Date;
  deletedAt?: Date;
}

export interface Chat {
  id: string;
  name: string;
  description?: string;
  type: 'studio' | 'private' | 'group';
  studioId?: string; // For studio chats
  participantIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageId?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  settings: ChatSettings;
  accessLevel?: 'public' | 'private' | 'restricted';
  invitationRequired?: boolean;
  studioMembershipRequired?: boolean;
}

export interface UserChatPreferences {
  id: string;
  userId: string;
  chatId: string;
  isFavorite: boolean;
  isPinned: boolean;
  isMuted: boolean;
  lastReadAt?: Date;
  lastReadMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudioChatList {
  studioId: string;
  chats: Chat[];
  totalCount: number;
}

export interface UserFavoriteChatList {
  userId: string;
  favoriteChats: ChatListItem[];
  totalCount: number;
}

export interface ChatSettings {
  allowLeaving: boolean;
  allowMuting: boolean;
  allowInviting: boolean;
  isPublic: boolean;
  maxParticipants?: number;
}

export interface EnhancedChatSettings extends ChatSettings {
  requiresInvitation: boolean;
  requiresStudioMembership: boolean;
  autoApproveInvitations: boolean;
  allowGuestViewing: boolean;
}

export interface ChatInvitation {
  id: string;
  chatId: string;
  invitedUserId: string;
  invitedUserHandle?: string; // User's @handle for display
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  expiresAt?: Date;
  message?: string;
}

export interface ChatAccessLevel {
  canView: boolean;
  canRead: boolean;
  canWrite: boolean;
  canInvite: boolean;
  canManage: boolean;
  accessReason: 'public' | 'invited' | 'studio_member' | 'admin' | 'creator';
}

export interface OrganizedStudioChats {
  publicChats: ChatListItem[];
  privateChats: ChatListItem[];
  invitationsPending: ChatInvitation[];
  totalPublic: number;
  totalPrivate: number;
}

export interface StudioMembership {
  id: string;
  studioId: string;
  userId: string;
  membershipType: 'member' | 'instructor' | 'admin';
  joinedAt: Date;
  isActive: boolean;
}

export interface CreateInvitationRequest {
  chatId: string;
  invitedUserId: string;
  message?: string;
  expiresAt?: Date;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  isMuted: boolean;
  isActive: boolean;
}

export interface ChatUnreadCount {
  chatId: string;
  userId: string;
  unreadCount: number;
  lastReadMessageId?: string;
  lastReadAt?: Date;
}

export interface CreateChatRequest {
  name: string;
  description?: string;
  type: 'studio' | 'private' | 'group';
  studioId?: string;
  participantIds: string[];
  settings?: Partial<ChatSettings>;
  accessLevel?: 'public' | 'private' | 'restricted';
  invitationRequired?: boolean;
  studioMembershipRequired?: boolean;
}

export interface ChatTypeConversionRequest {
  chatId: string;
  newAccessLevel: 'public' | 'private' | 'restricted';
  invitationRequired?: boolean;
  studioMembershipRequired?: boolean;
  confirmationRequired?: boolean;
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
  messageType?: 'text' | 'image' | 'file';
  replyToId?: string;
}

export interface ChatListItem {
  chat: Chat;
  lastMessage?: ChatMessage;
  unreadCount: number;
  participants: ChatParticipant[];
  userPreferences?: UserChatPreferences; // User's personal preferences for this chat
}

export interface ChatLoadOptions {
  pageSize?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
}

export interface ChatSearchOptions {
  query: string;
  chatId?: string;
  senderId?: string;
  messageType?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface StudioChatListRequest {
  studioId: string;
  pageSize?: number;
  offset?: number;
  searchQuery?: string;
  sortBy?: 'recent' | 'name' | 'created';
}

export interface UserFavoritesRequest {
  userId: string;
  pageSize?: number;
  offset?: number;
}

export interface UpdateChatPreferencesRequest {
  userId: string;
  chatId: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
}

// Access Control Error Types
export enum ChatAccessError {
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVITATION_REQUIRED = 'INVITATION_REQUIRED',
  MEMBERSHIP_REQUIRED = 'MEMBERSHIP_REQUIRED',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_REVOKED = 'INVITATION_REVOKED',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  INVALID_INVITATION = 'INVALID_INVITATION'
}

export class ChatAccessException extends Error {
  constructor(
    public errorCode: ChatAccessError,
    public chatId: string,
    public userId: string,
    message?: string
  ) {
    super(message || errorCode);
    this.name = 'ChatAccessException';
  }
}

// ==================== SERVICE INTERFACE DEFINITIONS ====================

// AccessControlService Interface
export interface IAccessControlService {
  checkChatAccess(chatId: string, userId: string): Promise<ChatAccessLevel>;
  canUserAccessChat(chatId: string, userId: string): Promise<boolean>;
  canUserSendMessage(chatId: string, userId: string): Promise<boolean>;
  inviteUserToChat(chatId: string, userId: string, invitedBy: string): Promise<ChatInvitation>;
  revokeUserAccess(chatId: string, userId: string, revokedBy: string): Promise<void>;
  getUserChatInvitations(userId: string): Promise<ChatInvitation[]>;
  getAllUserChatInvitations(userId: string): Promise<ChatInvitation[]>;
  acceptChatInvitation(invitationId: string): Promise<void>;
}

// ChatAccessController Interface
export interface IChatAccessController {
  getStudioChatsForUser(studioId: string, userId?: string): Promise<OrganizedStudioChats>;
  canUserAccessChat(chatId: string, userId?: string): Promise<boolean>;
  canUserSendMessage(chatId: string, userId?: string): Promise<boolean>;
  filterChatsByAccess(chats: Chat[], userId?: string): Promise<Chat[]>;
  getChatAccessLevel(chatId: string, userId?: string): Promise<ChatAccessLevel | null>;
  refreshUserAccess(userId?: string): Promise<void>;
  getCurrentUserId(): string | null;
  isServiceReady(): boolean;
  startAccessMonitoring(chatId: string, userId?: string): void;
  stopAccessMonitoring(chatId: string, userId?: string): void;
  startBulkAccessMonitoring(chatIds: string[], userId?: string): void;
  stopBulkAccessMonitoring(chatIds: string[], userId?: string): void;
  forceAccessRefresh(userId?: string): Promise<void>;
  handleImmediateAccessRevocation(chatId: string, userId?: string): Promise<void>;
  handleImmediateAccessGrant(chatId: string, userId?: string, accessLevel?: ChatAccessLevel): Promise<void>;
}

// StudioChatOrganizer Interface
export interface IStudioChatOrganizer {
  organizeStudioChats(chatListItems: ChatListItem[]): OrganizedStudioChats;
  separatePublicPrivateChats(chatListItems: ChatListItem[]): { publicChats: ChatListItem[], privateChats: ChatListItem[] };
  sortChatsByActivity(chatListItems: ChatListItem[]): ChatListItem[];
  sortChatsByActivityRaw(chats: Chat[]): Chat[];
  organizeStudioChatsWithOptions(
    chatListItems: ChatListItem[], 
    options?: {
      sortBy?: 'activity' | 'name' | 'created' | 'memberCount';
      groupPinnedFirst?: boolean;
      separateByType?: boolean;
    }
  ): OrganizedStudioChats;
  getChatStatistics(organizedChats: OrganizedStudioChats): ChatStatistics;
  filterOrganizedChats(organizedChats: OrganizedStudioChats, searchQuery: string): OrganizedStudioChats;
}

// ChatPersistenceService Interface (for access control extensions)
export interface IChatPersistenceService {
  createInvitation(invitation: CreateInvitationRequest): Promise<ChatInvitation>;
  updateInvitationStatus(invitationId: string, status: 'accepted' | 'declined' | 'revoked'): Promise<void>;
  getInvitationsByUser(userId: string): Promise<ChatInvitation[]>;
  getInvitationsByChat(chatId: string): Promise<ChatInvitation[]>;
  cleanupExpiredInvitations(): Promise<void>;
  createChat(request: CreateChatRequest): Promise<Chat>;
  updateChatAccessLevel(chatId: string, accessLevel: 'public' | 'private' | 'restricted'): Promise<void>;
  convertChatType(request: ChatTypeConversionRequest): Promise<void>;
}

// ==================== ADDITIONAL TYPE DEFINITIONS ====================

export interface AccessChangeEvent {
  chatId: string;
  userId: string;
  hasAccess: boolean;
  accessLevel?: ChatAccessLevel;
  changeType: 'granted' | 'revoked' | 'updated';
  timestamp: Date;
}

export interface ChatVisibilityUpdate {
  chatId: string;
  userId: string;
  isVisible: boolean;
  reason: string;
}

export interface ChatStatistics {
  totalChats: number;
  publicChats: number;
  privateChats: number;
  totalParticipants: number;
  averageParticipantsPerChat: number;
  chatsWithRecentActivity: number;
}

export interface ChatOrganizationOptions {
  sortBy?: 'activity' | 'name' | 'created' | 'memberCount';
  groupPinnedFirst?: boolean;
  separateByType?: boolean;
}

export interface AccessControlOptions {
  enableRealTimeUpdates?: boolean;
  cacheTimeout?: number;
  maxCacheSize?: number;
  enableAccessLogging?: boolean;
  strictModeEnabled?: boolean;
}

export interface InvitationNotificationData {
  invitationId: string;
  chatId: string;
  chatName: string;
  invitedBy: string;
  invitedByName?: string;
  message?: string;
  expiresAt?: Date;
}

export interface AccessAuditLog {
  id: string;
  userId: string;
  chatId: string;
  action: 'access_granted' | 'access_revoked' | 'invitation_sent' | 'invitation_accepted' | 'invitation_declined';
  performedBy?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// Type guards for runtime type checking
export function isChatAccessLevel(obj: any): obj is ChatAccessLevel {
  return obj && 
    typeof obj.canView === 'boolean' &&
    typeof obj.canRead === 'boolean' &&
    typeof obj.canWrite === 'boolean' &&
    typeof obj.canInvite === 'boolean' &&
    typeof obj.canManage === 'boolean' &&
    typeof obj.accessReason === 'string';
}

export function isChatInvitation(obj: any): obj is ChatInvitation {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.chatId === 'string' &&
    typeof obj.invitedUserId === 'string' &&
    typeof obj.invitedBy === 'string' &&
    obj.invitedAt instanceof Date &&
    ['pending', 'accepted', 'declined', 'revoked'].includes(obj.status);
}

export function isOrganizedStudioChats(obj: any): obj is OrganizedStudioChats {
  return obj &&
    Array.isArray(obj.publicChats) &&
    Array.isArray(obj.privateChats) &&
    Array.isArray(obj.invitationsPending) &&
    typeof obj.totalPublic === 'number' &&
    typeof obj.totalPrivate === 'number';
}