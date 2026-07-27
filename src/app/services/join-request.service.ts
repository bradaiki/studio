import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import {
  EnhancedStudioJoinRequest,
  RequestAuditEntry,
  BulkOperationResult,
  UserProfile,
  RequestProcessingError,
  RequestProcessingException,
  SystemError,
  SystemException
} from '../models/instructor-join-review.models';
import { UserProfileService } from './user-profile.service';
import { RequestAuditService } from './request-audit.service';
import { RequestCacheService } from './request-cache.service';
import { RealTimeUpdateOptimizerService } from './real-time-update-optimizer.service';

export interface PaginatedRequestsResult {
  requests: EnhancedStudioJoinRequest[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RequestSearchFilters {
  searchTerm?: string;
  sortBy?: 'requestedAt' | 'userName' | 'userEmail';
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class JoinRequestService {
  private client = generateClient<Schema>();
  
  // Reactive state management for pending requests by studio
  private pendingRequestsSubjects = new Map<string, BehaviorSubject<EnhancedStudioJoinRequest[]>>();
  
  // Real-time subscription management
  private realtimeSubscriptions = new Map<string, any>();
  private pollingIntervals = new Map<string, ReturnType<typeof setInterval>>();
  
  private currentUserId: string | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private auditService: RequestAuditService,
    private cacheService: RequestCacheService,
    private realTimeOptimizer: RealTimeUpdateOptimizerService
  ) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const user = await getCurrentUser();
      this.currentUserId = user.userId;
    } catch (error) {
      console.warn('User not authenticated in JoinRequestService');
      this.currentUserId = null;
    }
  }

  /**
   * Get pending join requests for a specific studio (legacy method for backward compatibility)
   */
  async getPendingRequestsForStudio(studioId: string): Promise<EnhancedStudioJoinRequest[]> {
    const result = await this.getPaginatedRequestsForStudio(studioId, {
      page: 1,
      pageSize: 100, // Large page size for backward compatibility
      sortBy: 'requestedAt',
      sortOrder: 'desc'
    });
    
    return result.requests;
  }

  /**
   * Get paginated pending join requests for a specific studio with caching
   */
  async getPaginatedRequestsForStudio(
    studioId: string, 
    config: {
      page: number;
      pageSize: number;
      sortBy?: 'requestedAt' | 'userName' | 'userEmail';
      sortOrder?: 'asc' | 'desc';
      searchTerm?: string;
    }
  ): Promise<PaginatedRequestsResult> {
    try {
      if (!this.currentUserId) {
        throw new SystemException(
          SystemError.AUTHENTICATION_ERROR,
          'getPaginatedRequestsForStudio',
          'User not authenticated'
        );
      }

      const paginationConfig = {
        page: config.page,
        pageSize: config.pageSize,
        sortBy: config.sortBy || 'requestedAt',
        sortOrder: config.sortOrder || 'desc',
        searchTerm: config.searchTerm
      };

      console.log('Loading paginated requests for studio:', studioId, 'config:', paginationConfig);

      // Check cache first
      const cachedRequests = this.cacheService.getCachedRequests(studioId, paginationConfig);
      if (cachedRequests) {
        console.log(`Using cached data for studio ${studioId}, page ${config.page}`);
        
        const totalCount = this.cacheService.getTotalCount(studioId) || cachedRequests.length;
        const totalPages = Math.ceil(totalCount / config.pageSize);
        
        return {
          requests: cachedRequests,
          totalCount,
          currentPage: config.page,
          totalPages,
          hasNextPage: config.page < totalPages,
          hasPreviousPage: config.page > 1
        };
      }

      // Build filter for database query
      let filter: any = {
        studioId: { eq: studioId },
        status: { eq: 'pending' }
      };

      // Add search filter if provided
      if (config.searchTerm && config.searchTerm.trim()) {
        const searchTerm = config.searchTerm.trim().toLowerCase();
        filter = {
          ...filter,
          or: [
            { userName: { contains: searchTerm } },
            { userEmail: { contains: searchTerm } },
            { message: { contains: searchTerm } }
          ]
        };
      }

      // Calculate offset for pagination
      const offset = (config.page - 1) * config.pageSize;

      // Query with pagination
      const result = await this.client.models.StudioJoinRequest.list({
        filter,
        limit: config.pageSize,
        // Note: Amplify DataStore doesn't support offset directly
        // We'll implement client-side pagination for now
      });

      if (result.errors && result.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'getPaginatedRequestsForStudio',
          `Database error: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      let allRequests: EnhancedStudioJoinRequest[] = (result.data || []).map(req => ({
        id: req.id,
        studioId: req.studioId,
        userId: req.userId,
        userName: req.userName,
        userEmail: req.userEmail,
        requestedAt: new Date(req.requestedAt),
        status: req.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
        message: req.message || undefined,
        reviewedBy: req.reviewedBy || undefined,
        reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
        reviewMessage: req.reviewMessage || undefined,
        isSelected: false,
        isProcessing: false
      }));

      // Apply client-side search filtering if needed
      if (config.searchTerm && config.searchTerm.trim()) {
        const searchTerm = config.searchTerm.trim().toLowerCase();
        allRequests = allRequests.filter(req => 
          req.userName.toLowerCase().includes(searchTerm) ||
          req.userEmail.toLowerCase().includes(searchTerm) ||
          (req.message && req.message.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      allRequests.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (paginationConfig.sortBy) {
          case 'userName':
            aValue = a.userName.toLowerCase();
            bValue = b.userName.toLowerCase();
            break;
          case 'userEmail':
            aValue = a.userEmail.toLowerCase();
            bValue = b.userEmail.toLowerCase();
            break;
          case 'requestedAt':
          default:
            aValue = a.requestedAt.getTime();
            bValue = b.requestedAt.getTime();
            break;
        }
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return paginationConfig.sortOrder === 'asc' ? comparison : -comparison;
      });

      // Calculate pagination info
      const totalCount = allRequests.length;
      const totalPages = Math.ceil(totalCount / config.pageSize);
      
      // Apply client-side pagination
      const startIndex = offset;
      const endIndex = startIndex + config.pageSize;
      const paginatedRequests = allRequests.slice(startIndex, endIndex);

      // Fetch user profiles for paginated requests
      await this.enrichRequestsWithProfiles(paginatedRequests);

      // Cache the results
      this.cacheService.cacheRequests(studioId, paginationConfig, paginatedRequests, totalCount);

      // Update the subject for this studio (for backward compatibility)
      this.updatePendingRequestsSubject(studioId, paginatedRequests);

      console.log(`Loaded ${paginatedRequests.length} of ${totalCount} requests for studio ${studioId}, page ${config.page}`);
      
      return {
        requests: paginatedRequests,
        totalCount,
        currentPage: config.page,
        totalPages,
        hasNextPage: config.page < totalPages,
        hasPreviousPage: config.page > 1
      };

    } catch (error) {
      console.error('Error loading paginated requests:', error);
      if (error instanceof SystemException) {
        throw error;
      }
      throw new SystemException(
        SystemError.DATABASE_ERROR,
        'getPaginatedRequestsForStudio',
        'Failed to load paginated requests'
      );
    }
  }

  /**
   * Approve a join request and create studio membership
   */
  async approveJoinRequest(requestId: string, reviewedBy: string): Promise<void> {
    try {
      if (!this.currentUserId) {
        throw new SystemException(
          SystemError.AUTHENTICATION_ERROR,
          'approveJoinRequest',
          'User not authenticated'
        );
      }

      console.log('Approving join request:', requestId);

      // Get the request details first
      const requestResult = await this.client.models.StudioJoinRequest.get({ id: requestId });
      
      if (requestResult.errors || !requestResult.data) {
        throw new RequestProcessingException(
          RequestProcessingError.REQUEST_NOT_FOUND,
          requestId,
          '',
          'Join request not found'
        );
      }

      const request = requestResult.data;

      // Check if request is still pending
      if (request.status !== 'pending') {
        throw new RequestProcessingException(
          RequestProcessingError.REQUEST_ALREADY_PROCESSED,
          requestId,
          request.studioId,
          `Request is already ${request.status}`
        );
      }

      // Create studio membership
      const membershipResult = await this.client.models.StudioMembership.create({
        studioId: request.studioId,
        userId: request.userId,
        membershipType: 'member',
        joinedAt: new Date().toISOString(),
        isActive: true
      });

      if (membershipResult.errors) {
        throw new RequestProcessingException(
          RequestProcessingError.MEMBERSHIP_CREATION_FAILED,
          requestId,
          request.studioId,
          `Failed to create membership: ${membershipResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      // Update request status
      const updateResult = await this.client.models.StudioJoinRequest.update({
        id: requestId,
        status: 'approved',
        reviewedBy: reviewedBy,
        reviewedAt: new Date().toISOString()
      });

      if (updateResult.errors) {
        throw new RequestProcessingException(
          RequestProcessingError.INVALID_REQUEST_STATUS,
          requestId,
          request.studioId,
          `Failed to update request status: ${updateResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      // Create audit log entry
      await this.auditService.logApprovalAction(requestId, reviewedBy, await this.getUserDisplayName(reviewedBy));

      // Invalidate cache for this studio
      this.cacheService.invalidateRequest(request.studioId, requestId);

      // Remove from pending requests
      await this.removePendingRequest(request.studioId, requestId);

      console.log('Join request approved successfully:', requestId);

    } catch (error) {
      console.error('Error approving join request:', error);
      if (error instanceof RequestProcessingException || error instanceof SystemException) {
        throw error;
      }
      throw new RequestProcessingException(
        RequestProcessingError.REQUEST_NOT_FOUND,
        requestId,
        '',
        'Failed to approve join request'
      );
    }
  }

  /**
   * Reject a join request with optional feedback
   */
  async rejectJoinRequest(requestId: string, reviewedBy: string, feedback?: string): Promise<void> {
    try {
      if (!this.currentUserId) {
        throw new SystemException(
          SystemError.AUTHENTICATION_ERROR,
          'rejectJoinRequest',
          'User not authenticated'
        );
      }

      console.log('Rejecting join request:', requestId);

      // Get the request details first
      const requestResult = await this.client.models.StudioJoinRequest.get({ id: requestId });
      
      if (requestResult.errors || !requestResult.data) {
        throw new RequestProcessingException(
          RequestProcessingError.REQUEST_NOT_FOUND,
          requestId,
          '',
          'Join request not found'
        );
      }

      const request = requestResult.data;

      // Check if request is still pending
      if (request.status !== 'pending') {
        throw new RequestProcessingException(
          RequestProcessingError.REQUEST_ALREADY_PROCESSED,
          requestId,
          request.studioId,
          `Request is already ${request.status}`
        );
      }

      // Update request status
      const updateResult = await this.client.models.StudioJoinRequest.update({
        id: requestId,
        status: 'rejected',
        reviewedBy: reviewedBy,
        reviewedAt: new Date().toISOString(),
        reviewMessage: feedback || undefined
      });

      if (updateResult.errors) {
        throw new RequestProcessingException(
          RequestProcessingError.INVALID_REQUEST_STATUS,
          requestId,
          request.studioId,
          `Failed to update request status: ${updateResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      // Create audit log entry
      await this.auditService.logRejectionAction(requestId, reviewedBy, await this.getUserDisplayName(reviewedBy), feedback);

      // Invalidate cache for this studio
      this.cacheService.invalidateRequest(request.studioId, requestId);

      // Remove from pending requests
      await this.removePendingRequest(request.studioId, requestId);

      console.log('Join request rejected successfully:', requestId);

    } catch (error) {
      console.error('Error rejecting join request:', error);
      if (error instanceof RequestProcessingException || error instanceof SystemException) {
        throw error;
      }
      throw new RequestProcessingException(
        RequestProcessingError.REQUEST_NOT_FOUND,
        requestId,
        '',
        'Failed to reject join request'
      );
    }
  }

  /**
   * Subscribe to real-time updates for pending requests in a studio (optimized)
   */
  subscribeToRequestUpdates(studioId: string): Observable<EnhancedStudioJoinRequest[]> {
    if (!this.pendingRequestsSubjects.has(studioId)) {
      this.pendingRequestsSubjects.set(studioId, new BehaviorSubject<EnhancedStudioJoinRequest[]>([]));
      
      // Set up optimized real-time subscription
      this.setupOptimizedRealTimeSubscription(studioId);
    }

    return this.pendingRequestsSubjects.get(studioId)!.asObservable();
  }

  /**
   * Set up optimized real-time subscription for a studio's pending requests
   */
  private setupOptimizedRealTimeSubscription(studioId: string): void {
    try {
      console.log('Setting up optimized real-time subscription for studio:', studioId);

      // Initialize the optimizer for this studio
      const optimizedUpdates = this.realTimeOptimizer.initializeStudioUpdates(studioId, {
        debounceMs: 150,      // Slightly higher debounce for better batching
        throttleMs: 300,      // Allow more frequent updates for better responsiveness
        batchSize: 15,        // Larger batch size for efficiency
        maxBatchWaitMs: 800   // Shorter wait for better responsiveness
      });

      // Subscribe to batched updates
      optimizedUpdates.subscribe({
        next: async (batch) => {
          if (batch && batch.updates.length > 0) {
            console.log(`Processing batched update for studio ${studioId}: ${batch.updates.length} updates`);
            
            try {
              await this.processBatchedUpdates(studioId, batch.updates);
            } catch (error) {
              console.error('Error processing batched updates:', error);
            }
          }
        },
        error: (error) => {
          console.error('Error in optimized real-time subscription for studio', studioId, ':', error);
          this.realTimeOptimizer.setConnectionState(studioId, 'disconnected');
          
          // Fall back to periodic polling
          this.setupFallbackPolling(studioId);
        }
      });

      // Set up the actual Amplify subscription
      const subscription = this.client.models.StudioJoinRequest.observeQuery({
        filter: {
          studioId: { eq: studioId },
          status: { eq: 'pending' }
        }
      }).subscribe({
        next: ({ items }) => {
          // Convert to update events and emit through optimizer
          const updateEvents = items.map(item => ({
            type: 'update' as const,
            requestId: item.id,
            request: this.convertToEnhancedRequest(item),
            timestamp: Date.now()
          }));

          // Emit through optimizer for batching and debouncing
          this.realTimeOptimizer.emitBatchUpdate(studioId, updateEvents);
          this.realTimeOptimizer.setConnectionState(studioId, 'connected');
        },
        error: (error) => {
          console.error('Error in Amplify subscription for studio', studioId, ':', error);
          this.realTimeOptimizer.setConnectionState(studioId, 'disconnected');
          
          // Fall back to periodic polling
          this.setupFallbackPolling(studioId);
        }
      });

      // Store subscription for cleanup
      if (!this.realtimeSubscriptions) {
        this.realtimeSubscriptions = new Map();
      }
      this.realtimeSubscriptions.set(studioId, subscription);

      // Set initial connection state
      this.realTimeOptimizer.setConnectionState(studioId, 'connected');

    } catch (error) {
      console.error('Error setting up optimized real-time subscription:', error);
      this.realTimeOptimizer.setConnectionState(studioId, 'disconnected');
      
      // Fall back to periodic polling
      this.setupFallbackPolling(studioId);
    }
  }

  /**
   * Process batched updates efficiently
   */
  private async processBatchedUpdates(studioId: string, updates: any[]): Promise<void> {
    try {
      // Get current requests
      const currentRequests = this.pendingRequestsSubjects.get(studioId)?.value || [];
      const requestMap = new Map(currentRequests.map(req => [req.id, req]));

      // Process updates in batch
      const updatedRequests: EnhancedStudioJoinRequest[] = [];
      const requestsToEnrich: EnhancedStudioJoinRequest[] = [];

      for (const update of updates) {
        if (update.type === 'delete') {
          // Remove from map
          requestMap.delete(update.requestId);
        } else if (update.request) {
          // Add or update request
          const enhancedRequest = update.request;
          requestMap.set(update.requestId, enhancedRequest);
          
          // Mark for profile enrichment if it's new or doesn't have profile
          if (!enhancedRequest.userProfile) {
            requestsToEnrich.push(enhancedRequest);
          }
        }
      }

      // Convert map back to array
      const finalRequests = Array.from(requestMap.values());

      // Enrich profiles for new/updated requests in batch
      if (requestsToEnrich.length > 0) {
        await this.enrichRequestsWithProfiles(requestsToEnrich);
      }

      // Sort by submission date (newest first)
      finalRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

      // Update the subject
      this.updatePendingRequestsSubject(studioId, finalRequests);

      // Invalidate relevant cache entries
      this.cacheService.invalidateStudioCache(studioId);

      console.log(`Processed ${updates.length} batched updates for studio ${studioId}, resulting in ${finalRequests.length} requests`);

    } catch (error) {
      console.error('Error processing batched updates:', error);
      
      // Fall back to full refresh on error
      try {
        await this.getPendingRequestsForStudio(studioId);
      } catch (refreshError) {
        console.error('Error during fallback refresh:', refreshError);
      }
    }
  }

  /**
   * Convert Amplify model to enhanced request
   */
  private convertToEnhancedRequest(item: any): EnhancedStudioJoinRequest {
    return {
      id: item.id,
      studioId: item.studioId,
      userId: item.userId,
      userName: item.userName,
      userEmail: item.userEmail,
      requestedAt: new Date(item.requestedAt),
      status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      message: item.message || undefined,
      reviewedBy: item.reviewedBy || undefined,
      reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : undefined,
      reviewMessage: item.reviewMessage || undefined,
      isSelected: false,
      isProcessing: false
    };
  }

  /**
   * Set up fallback polling when real-time subscriptions fail
   */
  private setupFallbackPolling(studioId: string): void {
    console.log('Setting up fallback polling for studio:', studioId);
    
    // Poll every 30 seconds as fallback
    const pollInterval = setInterval(async () => {
      try {
        await this.getPendingRequestsForStudio(studioId);
      } catch (error) {
        console.error('Error in fallback polling:', error);
      }
    }, 30000);

    // Store interval for cleanup
    if (!this.pollingIntervals) {
      this.pollingIntervals = new Map();
    }
    this.pollingIntervals.set(studioId, pollInterval);
  }

  /**
   * Get audit log for a specific request
   */
  async getRequestAuditLog(requestId: string): Promise<RequestAuditEntry[]> {
    try {
      console.log('Getting audit log for request:', requestId);
      return await this.auditService.getAuditTrailForRequest(requestId);
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }

  /**
   * Perform bulk approval of multiple requests
   */
  async bulkApproveRequests(requestIds: string[], reviewedBy: string): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      totalRequests: requestIds.length,
      successfulOperations: 0,
      failedOperations: 0,
      errors: []
    };

    for (const requestId of requestIds) {
      try {
        await this.approveJoinRequest(requestId, reviewedBy);
        result.successfulOperations++;
      } catch (error) {
        result.failedOperations++;
        result.errors.push({
          requestId: requestId,
          requestName: `Request ${requestId}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Perform bulk rejection of multiple requests
   */
  async bulkRejectRequests(requestIds: string[], reviewedBy: string, feedback?: string): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      totalRequests: requestIds.length,
      successfulOperations: 0,
      failedOperations: 0,
      errors: []
    };

    for (const requestId of requestIds) {
      try {
        await this.rejectJoinRequest(requestId, reviewedBy, feedback);
        result.successfulOperations++;
      } catch (error) {
        result.failedOperations++;
        result.errors.push({
          requestId: requestId,
          requestName: `Request ${requestId}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Get user profile information for display
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return await this.userProfileService.getUserProfile(userId);
  }

  /**
   * Check if user profile navigation is available
   */
  async canNavigateToProfile(userId: string): Promise<boolean> {
    return await this.userProfileService.isProfileDataAvailable(userId);
  }

  /**
   * Get rejection history for a user in a specific studio
   */
  async getRejectionHistory(userId: string, studioId: string): Promise<EnhancedStudioJoinRequest[]> {
    try {
      console.log('Getting rejection history for user:', userId, 'in studio:', studioId);

      const result = await this.client.models.StudioJoinRequest.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: userId },
          status: { eq: 'rejected' }
        }
      });

      if (result.errors && result.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'getRejectionHistory',
          `Database error: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const rejectedRequests: EnhancedStudioJoinRequest[] = (result.data || []).map(req => ({
        id: req.id,
        studioId: req.studioId,
        userId: req.userId,
        userName: req.userName,
        userEmail: req.userEmail,
        requestedAt: new Date(req.requestedAt),
        status: req.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
        message: req.message || undefined,
        reviewedBy: req.reviewedBy || undefined,
        reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
        reviewMessage: req.reviewMessage || undefined,
        isSelected: false,
        isProcessing: false
      }));

      // Sort by rejection date (newest first)
      rejectedRequests.sort((a, b) => {
        const aDate = a.reviewedAt || a.requestedAt;
        const bDate = b.reviewedAt || b.requestedAt;
        return bDate.getTime() - aDate.getTime();
      });

      console.log(`Found ${rejectedRequests.length} rejected requests for user ${userId} in studio ${studioId}`);
      return rejectedRequests;

    } catch (error) {
      console.error('Error getting rejection history:', error);
      if (error instanceof SystemException) {
        throw error;
      }
      throw new SystemException(
        SystemError.DATABASE_ERROR,
        'getRejectionHistory',
        'Failed to get rejection history'
      );
    }
  }

  /**
   * Get pagination configuration for a studio
   */
  getPaginationConfig(studioId: string) {
    return this.cacheService.getPaginationConfig(studioId);
  }

  /**
   * Update pagination configuration
   */
  updatePaginationConfig(studioId: string, config: any) {
    this.cacheService.updatePaginationConfig(studioId, config);
  }

  /**
   * Subscribe to pagination changes
   */
  subscribeToPaginationChanges(studioId: string) {
    return this.cacheService.subscribeToPaginationChanges(studioId);
  }

  /**
   * Set search term with debouncing
   */
  setSearchTerm(studioId: string, searchTerm: string, debounceMs: number = 300) {
    this.cacheService.setSearchTerm(studioId, searchTerm, debounceMs);
  }

  /**
   * Subscribe to search changes
   */
  subscribeToSearchChanges(studioId: string) {
    return this.cacheService.subscribeToSearchChanges(studioId);
  }

  /**
   * Get current search term
   */
  getCurrentSearchTerm(studioId: string): string {
    return this.cacheService.getCurrentSearchTerm(studioId);
  }

  /**
   * Check if there are more pages available
   */
  hasMorePages(studioId: string): boolean {
    return this.cacheService.hasMorePages(studioId);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  /**
   * Get real-time update performance metrics
   */
  getRealTimeMetrics(studioId?: string) {
    if (studioId) {
      return this.realTimeOptimizer.getPerformanceMetrics(studioId);
    }
    return this.realTimeOptimizer.getAllPerformanceMetrics();
  }

  /**
   * Get connection state for real-time updates
   */
  getConnectionState(studioId: string): string {
    return this.realTimeOptimizer.getConnectionState(studioId);
  }

  /**
   * Subscribe to connection state changes
   */
  subscribeToConnectionState(studioId: string) {
    return this.realTimeOptimizer.subscribeToConnectionState(studioId);
  }
  /**
   * Clean up subscriptions for a specific studio
   */
  unsubscribeFromStudio(studioId: string): void {
    // Clean up real-time subscription
    if (this.realtimeSubscriptions.has(studioId)) {
      const subscription = this.realtimeSubscriptions.get(studioId);
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
      this.realtimeSubscriptions.delete(studioId);
    }

    // Clean up polling interval
    if (this.pollingIntervals.has(studioId)) {
      const interval = this.pollingIntervals.get(studioId);
      if (interval) {
        clearInterval(interval);
      }
      this.pollingIntervals.delete(studioId);
    }

    // Clean up subject
    if (this.pendingRequestsSubjects.has(studioId)) {
      const subject = this.pendingRequestsSubjects.get(studioId);
      if (subject) {
        subject.complete();
      }
      this.pendingRequestsSubjects.delete(studioId);
    }

    // Clean up cache service resources
    this.cacheService.cleanupStudio(studioId);

    // Clean up real-time optimizer resources
    this.realTimeOptimizer.cleanupStudio(studioId);

    console.log('Cleaned up subscriptions for studio:', studioId);
  }

  /**
   * Clean up all subscriptions (call on service destroy)
   */
  /**
   * Clean up all subscriptions (call on service destroy)
   */
  cleanup(): void {
    // Clean up all real-time subscriptions
    this.realtimeSubscriptions.forEach((subscription, studioId) => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.realtimeSubscriptions.clear();

    // Clean up all polling intervals
    this.pollingIntervals.forEach((interval, studioId) => {
      if (interval) {
        clearInterval(interval);
      }
    });
    this.pollingIntervals.clear();

    // Complete all subjects
    this.pendingRequestsSubjects.forEach((subject, studioId) => {
      if (subject) {
        subject.complete();
      }
    });
    this.pendingRequestsSubjects.clear();

    // Clean up cache service
    this.cacheService.clearCache();

    // Clean up real-time optimizer
    this.realTimeOptimizer.cleanup();

    console.log('JoinRequestService cleanup complete');
  }

  /**
   * Handle concurrent modifications with optimistic updates
   */
  private async handleConcurrentModification(
    requestId: string, 
    studioId: string, 
    operation: () => Promise<void>
  ): Promise<void> {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        // Perform optimistic update first
        this.performOptimisticUpdate(requestId, studioId, 'processing');
        
        // Execute the actual operation
        await operation();
        
        // Success - the real-time subscription will handle the final update
        return;
        
      } catch (error) {
        attempts++;
        
        if (error instanceof RequestProcessingException && 
            error.errorCode === RequestProcessingError.CONCURRENT_MODIFICATION) {
          
          if (attempts < maxRetries) {
            // Wait with exponential backoff before retrying
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Refresh data before retry
            await this.getPendingRequestsForStudio(studioId);
            continue;
          }
        }
        
        // Revert optimistic update on failure
        this.revertOptimisticUpdate(requestId, studioId);
        throw error;
      }
    }
  }

  /**
   * Perform optimistic update for better UX
   */
  private performOptimisticUpdate(requestId: string, studioId: string, status: 'processing' | 'approved' | 'rejected'): void {
    if (this.pendingRequestsSubjects.has(studioId)) {
      const currentRequests = this.pendingRequestsSubjects.get(studioId)!.value;
      const updatedRequests = currentRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            isProcessing: status === 'processing',
            status: status === 'processing' ? req.status : status as 'approved' | 'rejected'
          };
        }
        return req;
      });
      
      // If approved or rejected, remove from pending list
      const finalRequests = (status === 'approved' || status === 'rejected') 
        ? updatedRequests.filter(req => req.id !== requestId)
        : updatedRequests;
      
      this.pendingRequestsSubjects.get(studioId)!.next(finalRequests);
    }
  }

  /**
   * Revert optimistic update on failure
   */
  private revertOptimisticUpdate(requestId: string, studioId: string): void {
    if (this.pendingRequestsSubjects.has(studioId)) {
      const currentRequests = this.pendingRequestsSubjects.get(studioId)!.value;
      const revertedRequests = currentRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            isProcessing: false,
            status: 'pending' as const
          };
        }
        return req;
      });
      
      this.pendingRequestsSubjects.get(studioId)!.next(revertedRequests);
    }
  }

  /**
   * Enrich requests with user profile information
   */
  private async enrichRequestsWithProfiles(requests: EnhancedStudioJoinRequest[]): Promise<void> {
    if (requests.length === 0) {
      return;
    }

    try {
      // Get all unique user IDs
      const userIds = [...new Set(requests.map(req => req.userId))];
      
      // Fetch profiles for all users
      const profiles = await this.userProfileService.getUserProfiles(userIds);
      
      // Attach profiles to requests
      for (const request of requests) {
        const profile = profiles.get(request.userId);
        if (profile) {
          request.userProfile = profile;
          
          // Update display name if profile has better info
          if (profile.displayName && profile.displayName !== request.userName) {
            // Keep original userName but add profile for display
            request.userProfile.displayName = profile.displayName;
          }
        }
      }
      
      console.log(`Enriched ${requests.length} requests with profile data`);
    } catch (error) {
      console.error('Error enriching requests with profiles:', error);
      // Don't throw - this is enhancement, not critical
    }
  }

  private updatePendingRequestsSubject(studioId: string, requests: EnhancedStudioJoinRequest[]): void {
    if (!this.pendingRequestsSubjects.has(studioId)) {
      this.pendingRequestsSubjects.set(studioId, new BehaviorSubject<EnhancedStudioJoinRequest[]>([]));
    }
    this.pendingRequestsSubjects.get(studioId)!.next(requests);
  }

  private async removePendingRequest(studioId: string, requestId: string): Promise<void> {
    if (this.pendingRequestsSubjects.has(studioId)) {
      const currentRequests = this.pendingRequestsSubjects.get(studioId)!.value;
      const updatedRequests = currentRequests.filter(req => req.id !== requestId);
      this.pendingRequestsSubjects.get(studioId)!.next(updatedRequests);
    }
  }

  private async createAuditLogEntry(entry: Omit<RequestAuditEntry, 'id'>): Promise<void> {
    try {
      // Use the audit service to create the log entry
      await this.auditService.createAuditLogEntry(entry);
    } catch (error) {
      console.error('Error creating audit log entry:', error);
    }
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    try {
      // For now, return a simple display name
      // This can be enhanced later with actual user data
      return `User ${userId}`;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return 'Unknown User';
    }
  }
}