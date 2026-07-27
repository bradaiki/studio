export interface StudioJoinRequest {
  id: string;
  studioId: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewMessage?: string;
}

export interface StudioInvitation {
  id: string;
  studioId: string;
  studioName: string;
  invitedUserId: string;
  invitedUserEmail: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expiresAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export interface StudioMembershipRequest {
  studioId: string;
  message?: string;
}

export interface StudioInvitationRequest {
  studioId: string;
  userEmail: string;
  message?: string;
  expiresInDays?: number;
}

export interface StudioMembershipStatus {
  isMember: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  membershipType?: 'member' | 'instructor' | 'admin';
  joinedAt?: Date;
  hasPendingRequest?: boolean;
  hasPendingInvitation?: boolean;
}

export enum StudioMembershipError {
  STUDIO_NOT_FOUND = 'STUDIO_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  PENDING_REQUEST_EXISTS = 'PENDING_REQUEST_EXISTS',
  PENDING_INVITATION_EXISTS = 'PENDING_INVITATION_EXISTS',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_EMAIL = 'INVALID_EMAIL'
}

export class StudioMembershipException extends Error {
  constructor(
    public errorCode: StudioMembershipError,
    public studioId: string,
    public userId: string,
    message?: string
  ) {
    super(message || errorCode);
    this.name = 'StudioMembershipException';
  }
}