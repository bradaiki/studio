import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import { UserProfile } from '../models/instructor-join-review.models';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private client = generateClient<Schema>();
  private profileCache = new Map<string, UserProfile>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {}

  /**
   * Get user profile information with caching
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cached = this.getCachedProfile(userId);
      if (cached) {
        return cached;
      }

      // Try to get profile from various sources
      const profile = await this.fetchUserProfile(userId);
      
      if (profile) {
        this.cacheProfile(userId, profile);
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return this.createFallbackProfile(userId);
    }
  }

  /**
   * Get multiple user profiles efficiently
   */
  async getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile | null>> {
    const profiles = new Map<string, UserProfile | null>();
    const uncachedIds: string[] = [];

    // Check cache for each user
    for (const userId of userIds) {
      const cached = this.getCachedProfile(userId);
      if (cached) {
        profiles.set(userId, cached);
      } else {
        uncachedIds.push(userId);
      }
    }

    // Fetch uncached profiles
    if (uncachedIds.length > 0) {
      const fetchPromises = uncachedIds.map(async (userId) => {
        const profile = await this.fetchUserProfile(userId);
        if (profile) {
          this.cacheProfile(userId, profile);
        }
        profiles.set(userId, profile);
      });

      await Promise.all(fetchPromises);
    }

    return profiles;
  }

  /**
   * Check if user profile data is available
   */
  async isProfileDataAvailable(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile !== null && this.hasCompleteProfileData(profile);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user display name (fallback to username or email)
   */
  async getUserDisplayName(userId: string): Promise<string> {
    try {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        return profile.displayName || profile.username || profile.email || `User ${userId}`;
      }
      return `User ${userId}`;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return `User ${userId}`;
    }
  }

  /**
   * Clear profile cache for a specific user
   */
  clearProfileCache(userId: string): void {
    this.profileCache.delete(userId);
    this.cacheExpiry.delete(userId);
  }

  /**
   * Clear all profile caches
   */
  clearAllCaches(): void {
    this.profileCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Private helper methods
   */

  private async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Since there's no User model in Amplify, we'll try to construct profile
      // from available data sources like StudioMembership, ChatParticipant, etc.
      
      // Try to get user info from StudioMembership records
      const membershipResult = await this.client.models.StudioMembership.list({
        filter: { userId: { eq: userId } }
      });

      // Try to get user info from ChatParticipant records
      const participantResult = await this.client.models.ChatParticipant.list({
        filter: { userId: { eq: userId } }
      });

      // Try to get user info from StudioJoinRequest records
      const joinRequestResult = await this.client.models.StudioJoinRequest.list({
        filter: { userId: { eq: userId } }
      });

      // Construct profile from available data
      let username = `User ${userId}`;
      let email = '';
      let displayName = '';
      let avatar = '';
      let joinedAt: Date | undefined;

      // Get the most recent information from join requests
      if (joinRequestResult.data && joinRequestResult.data.length > 0) {
        const mostRecent = joinRequestResult.data
          .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
        
        if (mostRecent.userName) {
          username = mostRecent.userName;
          displayName = mostRecent.userName;
        }
        if (mostRecent.userEmail) {
          email = mostRecent.userEmail;
        }
      }

      // Get additional info from chat participants
      if (participantResult.data && participantResult.data.length > 0) {
        const mostRecent = participantResult.data
          .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())[0];
        
        if (mostRecent.userName && !displayName) {
          displayName = mostRecent.userName;
          username = mostRecent.userName;
        }
        if (mostRecent.userAvatar) {
          avatar = mostRecent.userAvatar;
        }
        if (mostRecent.joinedAt) {
          joinedAt = new Date(mostRecent.joinedAt);
        }
      }

      // Get membership info
      if (membershipResult.data && membershipResult.data.length > 0) {
        const earliestMembership = membershipResult.data
          .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())[0];
        
        if (earliestMembership.joinedAt && !joinedAt) {
          joinedAt = new Date(earliestMembership.joinedAt);
        }
      }

      // If we have any data, create a profile
      if (displayName || email || username !== `User ${userId}`) {
        return {
          id: userId,
          username: username,
          email: email,
          displayName: displayName || username,
          avatar: avatar,
          bio: undefined,
          joinedAt: joinedAt
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  private getCachedProfile(userId: string): UserProfile | null {
    const expiry = this.cacheExpiry.get(userId);
    if (expiry && Date.now() > expiry) {
      // Cache expired
      this.profileCache.delete(userId);
      this.cacheExpiry.delete(userId);
      return null;
    }
    return this.profileCache.get(userId) || null;
  }

  private cacheProfile(userId: string, profile: UserProfile): void {
    this.profileCache.set(userId, profile);
    this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION);
  }

  private createFallbackProfile(userId: string): UserProfile {
    return {
      id: userId,
      username: `User ${userId}`,
      email: `user${userId}@example.com`,
      displayName: `User ${userId}`,
      avatar: undefined,
      bio: undefined,
      joinedAt: undefined
    };
  }

  private hasCompleteProfileData(profile: UserProfile): boolean {
    return !!(profile.displayName || profile.username) && 
           !!(profile.email || profile.username !== `User ${profile.id}`);
  }
}