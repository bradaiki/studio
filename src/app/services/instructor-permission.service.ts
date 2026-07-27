import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, distinctUntilChanged } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import {
  InstructorPermissionError,
  InstructorPermissionException,
  SystemError,
  SystemException
} from '../models/instructor-join-review.models';

@Injectable({
  providedIn: 'root'
})
export class InstructorPermissionService {
  private client = generateClient<Schema>();
  
  // Cache for permission status by studio
  private permissionCache = new Map<string, { isInstructor: boolean, canManage: boolean, timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Reactive state management for permission changes
  private permissionSubjects = new Map<string, BehaviorSubject<boolean>>();
  
  private currentUserId: string | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const user = await getCurrentUser();
      this.currentUserId = user.userId;
    } catch (error) {
      console.warn('User not authenticated in InstructorPermissionService');
      this.currentUserId = null;
    }
  }

  /**
   * Check if the current user is an instructor for the specified studio
   */
  async isInstructor(studioId: string, userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        throw new InstructorPermissionException(
          InstructorPermissionError.NOT_AUTHENTICATED,
          studioId,
          '',
          'User not authenticated'
        );
      }

      // Check for test mode override (for development/testing)
      if (this.isTestModeEnabled(studioId)) {
        console.log('🧪 Test mode enabled - granting instructor permissions');
        return true;
      }

      // Check cache first
      const cacheKey = `${studioId}-${targetUserId}`;
      const cached = this.permissionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.isInstructor;
      }

      console.log('Checking instructor permissions for user:', targetUserId, 'in studio:', studioId);

      // Query studio membership
      const membershipResult = await this.client.models.StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: targetUserId },
          isActive: { eq: true }
        }
      });

      if (membershipResult.errors && membershipResult.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'isInstructor',
          `Database error: ${membershipResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const membership = membershipResult.data?.[0];
      const isInstructor = membership?.membershipType === 'instructor' || membership?.membershipType === 'admin';
      const canManage = isInstructor; // For now, instructors and admins can manage requests

      // Update cache
      this.permissionCache.set(cacheKey, {
        isInstructor,
        canManage,
        timestamp: Date.now()
      });

      // Update reactive subject
      this.updatePermissionSubject(studioId, targetUserId, canManage);

      console.log(`User ${targetUserId} instructor status for studio ${studioId}:`, isInstructor);
      return isInstructor;

    } catch (error) {
      console.error('Error checking instructor permissions:', error);
      if (error instanceof InstructorPermissionException || error instanceof SystemException) {
        throw error;
      }
      throw new InstructorPermissionException(
        InstructorPermissionError.STUDIO_NOT_FOUND,
        studioId,
        userId || this.currentUserId || '',
        'Failed to check instructor permissions'
      );
    }
  }

  /**
   * Check if the current user can manage join requests for the specified studio
   */
  async canManageRequests(studioId: string, userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        throw new InstructorPermissionException(
          InstructorPermissionError.NOT_AUTHENTICATED,
          studioId,
          '',
          'User not authenticated'
        );
      }

      // For now, instructor permission is the same as request management permission
      // This can be expanded later with more granular permissions
      return await this.isInstructor(studioId, targetUserId);

    } catch (error) {
      console.error('Error checking request management permissions:', error);
      if (error instanceof InstructorPermissionException || error instanceof SystemException) {
        throw error;
      }
      throw new InstructorPermissionException(
        InstructorPermissionError.STUDIO_NOT_FOUND,
        studioId,
        userId || this.currentUserId || '',
        'Failed to check request management permissions'
      );
    }
  }

  /**
   * Subscribe to permission changes for a user in a studio
   */
  subscribeToPermissionChanges(studioId: string, userId?: string): Observable<boolean> {
    const targetUserId = userId || this.currentUserId;
    
    if (!targetUserId) {
      throw new InstructorPermissionException(
        InstructorPermissionError.NOT_AUTHENTICATED,
        studioId,
        '',
        'User not authenticated'
      );
    }

    const subjectKey = `${studioId}-${targetUserId}`;
    
    if (!this.permissionSubjects.has(subjectKey)) {
      this.permissionSubjects.set(subjectKey, new BehaviorSubject<boolean>(false));
      
      // Load initial permission status
      this.canManageRequests(studioId, targetUserId)
        .then(canManage => {
          this.updatePermissionSubject(studioId, targetUserId, canManage);
        })
        .catch(error => {
          console.error('Error loading initial permission status:', error);
        });
    }

    return this.permissionSubjects.get(subjectKey)!.asObservable().pipe(
      distinctUntilChanged()
    );
  }

  /**
   * Get the current user's membership type for a studio
   */
  async getMembershipType(studioId: string, userId?: string): Promise<'member' | 'instructor' | 'admin' | null> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        return null;
      }

      const membershipResult = await this.client.models.StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: targetUserId },
          isActive: { eq: true }
        }
      });

      if (membershipResult.errors && membershipResult.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'getMembershipType',
          `Database error: ${membershipResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const membership = membershipResult.data?.[0];
      return membership?.membershipType as 'member' | 'instructor' | 'admin' | null;

    } catch (error) {
      console.error('Error getting membership type:', error);
      return null;
    }
  }

  /**
   * Check if user has any instructor permissions across all studios
   */
  async hasAnyInstructorPermissions(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.currentUserId;
      
      if (!targetUserId) {
        return false;
      }

      const membershipResult = await this.client.models.StudioMembership.list({
        filter: {
          userId: { eq: targetUserId },
          isActive: { eq: true }
        }
      });

      if (membershipResult.errors && membershipResult.errors.length > 0) {
        throw new SystemException(
          SystemError.DATABASE_ERROR,
          'hasAnyInstructorPermissions',
          `Database error: ${membershipResult.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const memberships = membershipResult.data || [];
      return memberships.some(membership => 
        membership.membershipType === 'instructor' || membership.membershipType === 'admin'
      );

    } catch (error) {
      console.error('Error checking any instructor permissions:', error);
      return false;
    }
  }

  /**
   * Clear permission cache for a specific studio and user
   */
  clearPermissionCache(studioId: string, userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    if (targetUserId) {
      const cacheKey = `${studioId}-${targetUserId}`;
      this.permissionCache.delete(cacheKey);
    }
  }

  /**
   * Clear all permission cache
   */
  clearAllPermissionCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Refresh permissions for a studio (clears cache and reloads)
   */
  async refreshPermissions(studioId: string, userId?: string): Promise<boolean> {
    const targetUserId = userId || this.currentUserId;
    if (targetUserId) {
      this.clearPermissionCache(studioId, targetUserId);
      return await this.canManageRequests(studioId, targetUserId);
    }
    return false;
  }

  /**
   * Private helper methods
   */

  private updatePermissionSubject(studioId: string, userId: string, canManage: boolean): void {
    const subjectKey = `${studioId}-${userId}`;
    if (!this.permissionSubjects.has(subjectKey)) {
      this.permissionSubjects.set(subjectKey, new BehaviorSubject<boolean>(canManage));
    } else {
      this.permissionSubjects.get(subjectKey)!.next(canManage);
    }
  }

  /**
   * Check if test mode is enabled for development/testing
   */
  private isTestModeEnabled(studioId: string): boolean {
    try {
      const testMode = localStorage.getItem('instructor-test-mode');
      const testStudioId = localStorage.getItem('instructor-studio-id');
      
      return testMode === 'true' && (testStudioId === studioId || testStudioId === 'all');
    } catch (error) {
      // localStorage might not be available in some environments
      return false;
    }
  }
}