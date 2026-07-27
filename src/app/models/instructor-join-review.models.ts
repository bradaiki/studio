import { StudioJoinRequest } from './studio-membership.models';

/**
 * Enhanced StudioJoinRequest interface with additional UI and processing fields
 */
export interface EnhancedStudioJoinRequest extends StudioJoinRequest {
  // Existing fields from base StudioJoinRequest are inherited
  
  // Computed fields for UI
  isSelected?: boolean;
  isProcessing?: boolean;
  userProfile?: UserProfile;
}

/**
 * User profile information for join request display
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  joinedAt?: Date;
}

/**
 * Audit trail entry for join request actions
 */
export interface RequestAuditEntry {
  id: string;
  requestId: string;
  action: 'created' | 'approved' | 'rejected' | 'cancelled';
  performedBy: string;
  performedByName: string;
  performedAt: Date;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

/**
 * Result of bulk operations on join requests
 */
export interface BulkOperationResult {
  totalRequests: number;
  successfulOperations: number;
  failedOperations: number;
  errors: BulkOperationError[];
}

/**
 * Error information for failed bulk operations
 */
export interface BulkOperationError {
  requestId: string;
  requestName: string;
  error: string;
}

/**
 * Configuration for the join request modal
 */
export interface JoinRequestModalConfig {
  studioId: string;
  studioName: string;
  enableBulkActions: boolean;
  enableRealTimeUpdates: boolean;
  maxRequestsPerPage: number;
  autoRefreshInterval: number;
}

/**
 * Error types specific to instructor join request review
 */
export enum InstructorPermissionError {
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  NOT_INSTRUCTOR = 'NOT_INSTRUCTOR',
  STUDIO_NOT_FOUND = 'STUDIO_NOT_FOUND',
  PERMISSION_EXPIRED = 'PERMISSION_EXPIRED'
}

/**
 * Error types for request processing
 */
export enum RequestProcessingError {
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  REQUEST_ALREADY_PROCESSED = 'REQUEST_ALREADY_PROCESSED',
  MEMBERSHIP_CREATION_FAILED = 'MEMBERSHIP_CREATION_FAILED',
  INVALID_REQUEST_STATUS = 'INVALID_REQUEST_STATUS',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION'
}

/**
 * System and network error types
 */
export enum SystemError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Exception class for instructor permission errors
 */
export class InstructorPermissionException extends Error {
  constructor(
    public errorCode: InstructorPermissionError,
    public studioId: string,
    public userId: string,
    message?: string
  ) {
    super(message || errorCode);
    this.name = 'InstructorPermissionException';
  }
}

/**
 * Exception class for request processing errors
 */
export class RequestProcessingException extends Error {
  constructor(
    public errorCode: RequestProcessingError,
    public requestId: string,
    public studioId: string,
    message?: string
  ) {
    super(message || errorCode);
    this.name = 'RequestProcessingException';
  }
}

/**
 * Exception class for system errors
 */
export class SystemException extends Error {
  constructor(
    public errorCode: SystemError,
    public context: string,
    message?: string
  ) {
    super(message || errorCode);
    this.name = 'SystemException';
  }
}