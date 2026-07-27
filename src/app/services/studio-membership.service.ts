import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import {
  StudioJoinRequest,
  StudioMembershipRequest,
  StudioMembershipStatus,
  StudioMembershipError,
  StudioMembershipException
} from '../models/studio-membership.models';

@Injectable({
  providedIn: 'root'
})
export class StudioMembershipService {
  private client = generateClient<Schema>();

  constructor() {
    console.log('[StudioMembership] Service initialized');
  }

  /**
   * Request to join a studio
   */
  async requestToJoin(request: StudioMembershipRequest): Promise<StudioJoinRequest> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;
      const userName = currentUser.username || 'User';
      const userEmail = currentUser.signInDetails?.loginId || '';

      console.log('[StudioMembership] Requesting to join studio:', request.studioId);

      // Check if user is already a member
      const membershipStatus = await this.getMembershipStatus(request.studioId);
      if (membershipStatus.isMember) {
        throw new StudioMembershipException(
          StudioMembershipError.ALREADY_MEMBER,
          request.studioId,
          userId,
          'You are already a member of this studio'
        );
      }

      // Check if there's already a pending request
      if (membershipStatus.hasPendingRequest) {
        throw new StudioMembershipException(
          StudioMembershipError.PENDING_REQUEST_EXISTS,
          request.studioId,
          userId,
          'You already have a pending join request for this studio'
        );
      }

      // Create the join request
      const result = await this.client.models.StudioJoinRequest.create({
        studioId: request.studioId,
        userId,
        userName,
        userEmail,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        message: request.message
      });

      if (result.errors || !result.data) {
        throw new Error('Failed to create join request');
      }

      const joinRequest: StudioJoinRequest = {
        id: result.data.id,
        studioId: result.data.studioId,
        userId: result.data.userId,
        userName: result.data.userName,
        userEmail: result.data.userEmail,
        requestedAt: new Date(result.data.requestedAt),
        status: result.data.status as any,
        message: result.data.message || undefined
      };

      console.log('[StudioMembership] Join request created:', joinRequest.id);
      return joinRequest;
    } catch (error) {
      console.error('[StudioMembership] Failed to request join:', error);
      throw error;
    }
  }

  /**
   * Get pending join requests for a studio (instructors only)
   */
  async getStudioJoinRequests(studioId: string): Promise<StudioJoinRequest[]> {
    try {
      console.log('[StudioMembership] Getting join requests for studio:', studioId);
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;
      console.log('[StudioMembership] Current user:', userId);

      // Check if user is an instructor
      const membershipStatus = await this.getMembershipStatus(studioId);
      console.log('[StudioMembership] Membership status:', membershipStatus);
      
      if (!membershipStatus.isInstructor && !membershipStatus.isAdmin) {
        throw new StudioMembershipException(
          StudioMembershipError.INSUFFICIENT_PERMISSIONS,
          studioId,
          userId,
          'Only instructors can view join requests'
        );
      }

      console.log('[StudioMembership] Querying StudioJoinRequest table...');
      const result = await this.client.models.StudioJoinRequest.list({
        filter: {
          studioId: { eq: studioId },
          status: { eq: 'pending' }
        }
      });

      console.log('[StudioMembership] Query result:', result);
      
      if (result.errors || !result.data) {
        console.log('[StudioMembership] No data or errors:', result.errors);
        return [];
      }

      console.log('[StudioMembership] Found', result.data.length, 'pending requests');
      
      return result.data.map(req => ({
        id: req.id,
        studioId: req.studioId,
        userId: req.userId,
        userName: req.userName,
        userEmail: req.userEmail,
        requestedAt: new Date(req.requestedAt),
        status: req.status as any,
        message: req.message || undefined,
        reviewedBy: req.reviewedBy || undefined,
        reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
        reviewMessage: req.reviewMessage || undefined
      }));
    } catch (error) {
      console.error('[StudioMembership] Failed to get join requests:', error);
      throw error;
    }
  }

  /**
   * Approve a join request (instructors only)
   */
  async approveJoinRequest(requestId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Get the request
      const requestResult = await this.client.models.StudioJoinRequest.get({ id: requestId });
      if (requestResult.errors || !requestResult.data) {
        throw new StudioMembershipException(
          StudioMembershipError.REQUEST_NOT_FOUND,
          '',
          userId,
          'Join request not found'
        );
      }

      const request = requestResult.data;

      // Check if user is an instructor
      const membershipStatus = await this.getMembershipStatus(request.studioId);
      if (!membershipStatus.isInstructor && !membershipStatus.isAdmin) {
        throw new StudioMembershipException(
          StudioMembershipError.INSUFFICIENT_PERMISSIONS,
          request.studioId,
          userId,
          'Only instructors can approve join requests'
        );
      }

      // Update request status
      await this.client.models.StudioJoinRequest.update({
        id: requestId,
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: new Date().toISOString()
      });

      // Create studio membership
      await this.client.models.StudioMembership.create({
        studioId: request.studioId,
        userId: request.userId,
        membershipType: 'member',
        joinedAt: new Date().toISOString(),
        isActive: true
      });

      console.log('[StudioMembership] Join request approved:', requestId);
    } catch (error) {
      console.error('[StudioMembership] Failed to approve join request:', error);
      throw error;
    }
  }

  /**
   * Reject a join request (instructors only)
   */
  async rejectJoinRequest(requestId: string, reviewMessage?: string): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Get the request
      const requestResult = await this.client.models.StudioJoinRequest.get({ id: requestId });
      if (requestResult.errors || !requestResult.data) {
        throw new StudioMembershipException(
          StudioMembershipError.REQUEST_NOT_FOUND,
          '',
          userId,
          'Join request not found'
        );
      }

      const request = requestResult.data;

      // Check if user is an instructor
      const membershipStatus = await this.getMembershipStatus(request.studioId);
      if (!membershipStatus.isInstructor && !membershipStatus.isAdmin) {
        throw new StudioMembershipException(
          StudioMembershipError.INSUFFICIENT_PERMISSIONS,
          request.studioId,
          userId,
          'Only instructors can reject join requests'
        );
      }

      // Update request status
      await this.client.models.StudioJoinRequest.update({
        id: requestId,
        status: 'rejected',
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        reviewMessage
      });

      console.log('[StudioMembership] Join request rejected:', requestId);
    } catch (error) {
      console.error('[StudioMembership] Failed to reject join request:', error);
      throw error;
    }
  }

  /**
   * Get membership status for current user
   */
  async getMembershipStatus(studioId: string): Promise<StudioMembershipStatus> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Check if user is a member
      const membershipResult = await this.client.models.StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: userId },
          isActive: { eq: true }
        }
      });

      const membership = membershipResult.data?.[0];
      const isMember = !!membership;
      const isInstructor = membership?.membershipType === 'instructor' || membership?.membershipType === 'admin';
      const isAdmin = membership?.membershipType === 'admin';

      // Check for pending request
      const requestResult = await this.client.models.StudioJoinRequest.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: userId },
          status: { eq: 'pending' }
        }
      });

      const hasPendingRequest = (requestResult.data?.length || 0) > 0;

      return {
        isMember,
        isInstructor,
        isAdmin,
        membershipType: membership?.membershipType as any,
        joinedAt: membership?.joinedAt ? new Date(membership.joinedAt) : undefined,
        hasPendingRequest
      };
    } catch (error) {
      console.error('[StudioMembership] Failed to get membership status:', error);
      return {
        isMember: false,
        isInstructor: false,
        isAdmin: false
      };
    }
  }

  /**
   * Cancel a join request
   */
  async cancelJoinRequest(requestId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      // Get the request
      const requestResult = await this.client.models.StudioJoinRequest.get({ id: requestId });
      if (requestResult.errors || !requestResult.data) {
        throw new StudioMembershipException(
          StudioMembershipError.REQUEST_NOT_FOUND,
          '',
          userId,
          'Join request not found'
        );
      }

      const request = requestResult.data;

      // Verify the request belongs to the current user
      if (request.userId !== userId) {
        throw new StudioMembershipException(
          StudioMembershipError.INSUFFICIENT_PERMISSIONS,
          request.studioId,
          userId,
          'You can only cancel your own join requests'
        );
      }

      // Update request status
      await this.client.models.StudioJoinRequest.update({
        id: requestId,
        status: 'cancelled'
      });

      console.log('[StudioMembership] Join request cancelled:', requestId);
    } catch (error) {
      console.error('[StudioMembership] Failed to cancel join request:', error);
      throw error;
    }
  }

  /**
   * Get user's own join requests
   */
  async getMyJoinRequests(): Promise<StudioJoinRequest[]> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      const result = await this.client.models.StudioJoinRequest.list({
        filter: {
          userId: { eq: userId }
        }
      });

      if (result.errors || !result.data) {
        return [];
      }

      return result.data.map(req => ({
        id: req.id,
        studioId: req.studioId,
        userId: req.userId,
        userName: req.userName,
        userEmail: req.userEmail,
        requestedAt: new Date(req.requestedAt),
        status: req.status as any,
        message: req.message || undefined,
        reviewedBy: req.reviewedBy || undefined,
        reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
        reviewMessage: req.reviewMessage || undefined
      }));
    } catch (error) {
      console.error('[StudioMembership] Failed to get my join requests:', error);
      return [];
    }
  }

  /**
   * Get visible studio members (excluding those who have hidden themselves)
   * Returns user IDs of members who are visible in the student list
   */
  async getVisibleStudioMembers(studioId: string): Promise<string[]> {
    try {
      console.log('[StudioMembership] Getting visible members for studio:', studioId);

      const result = await (this.client.models as any).StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          isActive: { eq: true },
          membershipType: { eq: 'member' }, // Only get regular members, not instructors
          hideFromStudentList: { ne: true } // Exclude hidden members
        }
      });

      if (result.errors || !result.data) {
        console.error('[StudioMembership] Failed to get visible members:', result.errors);
        return [];
      }

      const visibleUserIds = result.data.map((membership: any) => membership.userId);
      console.log('[StudioMembership] Found', visibleUserIds.length, 'visible members');
      
      return visibleUserIds;
    } catch (error) {
      console.error('[StudioMembership] Failed to get visible members:', error);
      return [];
    }
  }

  /**
   * Toggle visibility in studio student list
   */
  async toggleStudentListVisibility(studioId: string, hide: boolean): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      console.log('[StudioMembership] Toggling student list visibility:', { studioId, userId, hide });

      // Find the membership record
      const result = await (this.client.models as any).StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          userId: { eq: userId }
        }
      });

      if (result.errors || !result.data || result.data.length === 0) {
        console.error('[StudioMembership] Membership not found');
        return false;
      }

      const membership = result.data[0];

      // Update the hideFromStudentList field
      const updateResult = await (this.client.models as any).StudioMembership.update({
        id: membership.id,
        hideFromStudentList: hide
      });

      if (updateResult.errors) {
        console.error('[StudioMembership] Failed to update visibility:', updateResult.errors);
        return false;
      }

      console.log('[StudioMembership] Successfully updated visibility');
      return true;
    } catch (error) {
      console.error('[StudioMembership] Failed to toggle visibility:', error);
      return false;
    }
  }

  /**
   * Get studio students with full Person data
   * Returns only visible students (those who haven't hidden themselves)
   */
  async getStudioStudents(studioId: string): Promise<any[]> {
    try {
      console.log('[StudioMembership] Getting students for studio:', studioId);

      // Get visible member user IDs
      const visibleUserIds = await this.getVisibleStudioMembers(studioId);
      console.log('[StudioMembership] Found', visibleUserIds.length, 'visible student user IDs');

      if (visibleUserIds.length === 0) {
        return [];
      }

      // Load Person records for these students
      const students: any[] = [];

      for (const userId of visibleUserIds) {
        try {
          const personResult = await (this.client.models as any).Person.list({
            filter: {
              userId: { eq: userId }
            }
          });

          if (personResult.data && personResult.data.length > 0) {
            const person = personResult.data[0];
            students.push({
              id: person.id,
              name: person.displayName || person.name || 'Unknown',
              username: person.username || person.handle || '',
              handle: person.handle || '',
              avatar: person.profileImage || person.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg',
              bio: person.bio || '',
              location: person.location || '',
              joinDate: person.joinedDate || '',
              followers: person.followers || 0,
              following: person.following || 0,
              postsCount: person.postsCount || 0,
              isFollowing: false,
              tags: person.tags || [],
              isVerified: person.isVerified || false,
              rank: person.rank || '',
              studioAffiliations: person.studioAffiliations || [],
              experience: person.experience || '',
              specialties: person.specialties || [],
              achievements: person.achievements || [],
              socialMedia: person.socialMedia || []
            });
          }
        } catch (error) {
          console.error('[StudioMembership] Failed to load person for student:', userId, error);
        }
      }

      console.log('[StudioMembership] Loaded', students.length, 'students');
      return students;
    } catch (error) {
      console.error('[StudioMembership] Failed to get studio students:', error);
      return [];
    }
  }

  /**
   * Leave a studio - removes user's membership
   */
  async leaveStudio(studioId: string): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      const result = await (this.client.models as any).StudioMembership.list({
        filter: { studioId: { eq: studioId }, userId: { eq: userId } }
      });

      if (result.errors || !result.data || result.data.length === 0) {
        console.error('[StudioMembership] Membership not found');
        return false;
      }

      const deleteResult = await (this.client.models as any).StudioMembership.delete({ id: result.data[0].id });
      if (deleteResult.errors) {
        console.error('[StudioMembership] Failed to delete membership:', deleteResult.errors);
        return false;
      }

      console.log('[StudioMembership] Successfully left studio');
      return true;
    } catch (error) {
      console.error('[StudioMembership] Failed to leave studio:', error);
      return false;
    }
  }

  /**
   * Get all studio memberships for a user
   */
  async getUserStudioMemberships(userId: string): Promise<{ memberStudios: string[], instructorStudios: string[] }> {
    try {
      const result = await (this.client.models as any).StudioMembership.list({
        filter: { userId: { eq: userId }, isActive: { eq: true } }
      });

      if (result.errors || !result.data) {
        return { memberStudios: [], instructorStudios: [] };
      }

      const memberStudios: string[] = [];
      const instructorStudios: string[] = [];

      result.data.forEach((membership: any) => {
        if (membership.membershipType === 'instructor' || membership.membershipType === 'admin') {
          instructorStudios.push(membership.studioId);
        } else {
          memberStudios.push(membership.studioId);
        }
      });

      return { memberStudios, instructorStudios };
    } catch (error) {
      console.error('[StudioMembership] Failed to get user studio memberships:', error);
      return { memberStudios: [], instructorStudios: [] };
    }
  }
}
