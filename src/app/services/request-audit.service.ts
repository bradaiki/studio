import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import { 
  RequestAuditEntry,
  SystemError,
  SystemException
} from '../models/instructor-join-review.models';

/**
 * Service for managing audit logs of join request actions
 * Provides immutable audit trail functionality for accountability and compliance
 */
@Injectable({
  providedIn: 'root'
})
export class RequestAuditService {
  private client = generateClient<Schema>();
  private currentUserId: string | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const user = await getCurrentUser();
      this.currentUserId = user.userId;
    } catch (error) {
      console.warn('User not authenticated in RequestAuditService');
      this.currentUserId = null;
    }
  }

  /**
   * Create an immutable audit log entry for a join request action
   * Requirements: 10.1, 10.2, 10.3, 10.5
   */
  async createAuditLogEntry(entry: Omit<RequestAuditEntry, 'id'>): Promise<RequestAuditEntry> {
    try {
      if (!this.currentUserId) {
        throw new SystemException(
          SystemError.AUTHENTICATION_ERROR,
          'createAuditLogEntry',
          'User not authenticated'
        );
      }

      console.log('Creating audit log entry:', entry);

      // Create the audit log entry in the database
      const result = await this.client.models.RequestAuditLog.create({
        requestId: entry.requestId,
        action: entry.action,
        performedBy: entry.performedBy,
        performedByName: entry.performedByName,
        performedAt: entry.performedAt.toISOString(),
        details: entry.details || undefined,
        previousStatus: entry.previousStatus || undefined,
        newStatus: entry.newStatus || undefined
      });

      if (result.errors && result.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'createAuditLogEntry',
          `Failed to create audit log: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      if (!result.data) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'createAuditLogEntry',
          'No data returned from audit log creation'
        );
      }

      const auditEntry: RequestAuditEntry = {
        id: result.data.id,
        requestId: result.data.requestId,
        action: result.data.action as 'created' | 'approved' | 'rejected' | 'cancelled',
        performedBy: result.data.performedBy,
        performedByName: result.data.performedByName,
        performedAt: new Date(result.data.performedAt),
        details: result.data.details || undefined,
        previousStatus: result.data.previousStatus || undefined,
        newStatus: result.data.newStatus || undefined
      };

      console.log('Audit log entry created successfully:', auditEntry.id);
      return auditEntry;

    } catch (error) {
      console.error('Error creating audit log entry:', error);
      if (error instanceof SystemException) {
        throw error;
      }
      throw new SystemException(
        SystemError.DATABASE_ERROR,
        'createAuditLogEntry',
        'Failed to create audit log entry'
      );
    }
  }

  /**
   * Get audit trail for a specific join request
   * Requirements: 10.4
   */
  async getAuditTrailForRequest(requestId: string): Promise<RequestAuditEntry[]> {
    try {
      if (!this.currentUserId) {
        throw new SystemException(
          SystemError.AUTHENTICATION_ERROR,
          'getAuditTrailForRequest',
          'User not authenticated'
        );
      }

      console.log('Getting audit trail for request:', requestId);

      const result = await this.client.models.RequestAuditLog.list({
        filter: {
          requestId: { eq: requestId }
        }
      });

      if (result.errors && result.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'getAuditTrailForRequest',
          `Database error: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const auditEntries: RequestAuditEntry[] = (result.data || []).map(entry => ({
        id: entry.id,
        requestId: entry.requestId,
        action: entry.action as 'created' | 'approved' | 'rejected' | 'cancelled',
        performedBy: entry.performedBy,
        performedByName: entry.performedByName,
        performedAt: new Date(entry.performedAt),
        details: entry.details || undefined,
        previousStatus: entry.previousStatus || undefined,
        newStatus: entry.newStatus || undefined
      }));

      // Sort by timestamp (oldest first for chronological audit trail)
      auditEntries.sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());

      console.log(`Retrieved ${auditEntries.length} audit entries for request ${requestId}`);
      return auditEntries;

    } catch (error) {
      console.error('Error getting audit trail:', error);
      if (error instanceof SystemException) {
        throw error;
      }
      throw new SystemException(
        SystemError.DATABASE_ERROR,
        'getAuditTrailForRequest',
        'Failed to get audit trail'
      );
    }
  }

  /**
   * Get audit trail for all requests in a studio (admin function)
   * Requirements: 10.4
   */
  async getAuditTrailForStudio(studioId: string, limit?: number): Promise<RequestAuditEntry[]> {
    try {
      if (!this.currentUserId) {
        throw new SystemException(
          SystemError.AUTHENTICATION_ERROR,
          'getAuditTrailForStudio',
          'User not authenticated'
        );
      }

      console.log('Getting audit trail for studio:', studioId);

      // First get all requests for the studio to get their IDs
      const requestsResult = await this.client.models.StudioJoinRequest.list({
        filter: {
          studioId: { eq: studioId }
        }
      });

      if (requestsResult.errors && requestsResult.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'getAuditTrailForStudio',
          `Database error: ${requestsResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const requestIds = (requestsResult.data || []).map(req => req.id);
      
      if (requestIds.length === 0) {
        console.log('No requests found for studio:', studioId);
        return [];
      }

      // Get audit entries for all requests in the studio
      // Note: Amplify doesn't support 'in' filter, so we'll get all audit entries and filter client-side
      const auditResult = await this.client.models.RequestAuditLog.list({
        limit: limit || 1000
      });

      if (auditResult.errors && auditResult.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'getAuditTrailForStudio',
          `Database error: ${auditResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      // Filter client-side to only include requests from this studio
      const auditEntries: RequestAuditEntry[] = (auditResult.data || [])
        .filter(entry => requestIds.includes(entry.requestId))
        .map(entry => ({
          id: entry.id,
          requestId: entry.requestId,
          action: entry.action as 'created' | 'approved' | 'rejected' | 'cancelled',
          performedBy: entry.performedBy,
          performedByName: entry.performedByName,
          performedAt: new Date(entry.performedAt),
          details: entry.details || undefined,
          previousStatus: entry.previousStatus || undefined,
          newStatus: entry.newStatus || undefined
        }));

      // Sort by timestamp (newest first for admin overview)
      auditEntries.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());

      console.log(`Retrieved ${auditEntries.length} audit entries for studio ${studioId}`);
      return auditEntries;

    } catch (error) {
      console.error('Error getting studio audit trail:', error);
      if (error instanceof SystemException) {
        throw error;
      }
      throw new SystemException(
        SystemError.DATABASE_ERROR,
        'getAuditTrailForStudio',
        'Failed to get studio audit trail'
      );
    }
  }

  /**
   * Log approval action with all required audit information
   * Requirements: 10.1, 10.5
   */
  async logApprovalAction(
    requestId: string,
    performedBy: string,
    performedByName: string
  ): Promise<RequestAuditEntry> {
    return await this.createAuditLogEntry({
      requestId,
      action: 'approved',
      performedBy,
      performedByName,
      performedAt: new Date(),
      previousStatus: 'pending',
      newStatus: 'approved'
    });
  }

  /**
   * Log rejection action with all required audit information
   * Requirements: 10.2, 10.5
   */
  async logRejectionAction(
    requestId: string,
    performedBy: string,
    performedByName: string,
    feedback?: string
  ): Promise<RequestAuditEntry> {
    return await this.createAuditLogEntry({
      requestId,
      action: 'rejected',
      performedBy,
      performedByName,
      performedAt: new Date(),
      details: feedback,
      previousStatus: 'pending',
      newStatus: 'rejected'
    });
  }

  /**
   * Log request creation action
   * Requirements: 10.3, 10.5
   */
  async logRequestCreation(
    requestId: string,
    performedBy: string,
    performedByName: string
  ): Promise<RequestAuditEntry> {
    return await this.createAuditLogEntry({
      requestId,
      action: 'created',
      performedBy,
      performedByName,
      performedAt: new Date(),
      newStatus: 'pending'
    });
  }

  /**
   * Log request cancellation action
   * Requirements: 10.3, 10.5
   */
  async logCancellationAction(
    requestId: string,
    performedBy: string,
    performedByName: string
  ): Promise<RequestAuditEntry> {
    return await this.createAuditLogEntry({
      requestId,
      action: 'cancelled',
      performedBy,
      performedByName,
      performedAt: new Date(),
      previousStatus: 'pending',
      newStatus: 'cancelled'
    });
  }

  /**
   * Verify audit trail integrity for a request
   * Ensures all audit records are immutable and complete
   * Requirements: 10.5
   */
  async verifyAuditTrailIntegrity(requestId: string): Promise<boolean> {
    try {
      const auditTrail = await this.getAuditTrailForRequest(requestId);
      
      if (auditTrail.length === 0) {
        console.warn('No audit trail found for request:', requestId);
        return false;
      }

      // Verify chronological order
      for (let i = 1; i < auditTrail.length; i++) {
        if (auditTrail[i].performedAt.getTime() < auditTrail[i - 1].performedAt.getTime()) {
          console.error('Audit trail chronological order violation for request:', requestId);
          return false;
        }
      }

      // Verify required fields are present
      for (const entry of auditTrail) {
        if (!entry.id || !entry.requestId || !entry.action || 
            !entry.performedBy || !entry.performedByName || !entry.performedAt) {
          console.error('Audit trail missing required fields for request:', requestId);
          return false;
        }
      }

      // Verify status transitions are logical
      let currentStatus = 'pending';
      for (const entry of auditTrail) {
        if (entry.action === 'created' && entry.newStatus !== 'pending') {
          console.error('Invalid status transition in audit trail for request:', requestId);
          return false;
        }
        
        if (entry.previousStatus && entry.previousStatus !== currentStatus) {
          console.error('Status transition mismatch in audit trail for request:', requestId);
          return false;
        }
        
        if (entry.newStatus) {
          currentStatus = entry.newStatus;
        }
      }

      console.log('Audit trail integrity verified for request:', requestId);
      return true;

    } catch (error) {
      console.error('Error verifying audit trail integrity:', error);
      return false;
    }
  }
}