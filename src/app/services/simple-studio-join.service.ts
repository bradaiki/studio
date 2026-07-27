import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import { JoinRequestData } from '../components/simple-studio-join/simple-studio-join.component';

@Injectable({
  providedIn: 'root'
})
export class SimpleStudioJoinService {
  private client = generateClient<Schema>();

  constructor() {
    console.log('SimpleStudioJoinService initialized');
  }

  /**
   * Check if user is authenticated and has valid session
   */
  async checkAuthentication(): Promise<{ isAuthenticated: boolean; user?: any; error?: string }> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication check timeout')), 5000); // 5 second timeout
      });

      // First check if we have valid tokens with timeout
      const session = await Promise.race([
        fetchAuthSession(),
        timeoutPromise
      ]);

      if (!session.tokens) {
        return {
          isAuthenticated: false,
          error: 'No valid authentication tokens found'
        };
      }

      // Then get current user with timeout
      const user = await Promise.race([
        getCurrentUser(),
        timeoutPromise
      ]);

      if (!user) {
        return {
          isAuthenticated: false,
          error: 'User not authenticated'
        };
      }

      return {
        isAuthenticated: true,
        user
      };
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            isAuthenticated: false,
            error: 'Authentication check timed out'
          };
        }
        if (error.message.includes('not configured')) {
          return {
            isAuthenticated: false,
            error: 'Authentication not configured'
          };
        }
      }
      
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      };
    }
  }

  /**
   * Sanitize user input to prevent XSS and other security issues
   */
  private sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove potentially dangerous characters and normalize whitespace
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove HTML/XML special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000); // Limit length as additional safety measure
  }

  /**
   * Validate studio ID format and security
   */
  private validateStudioId(studioId: string): boolean {
    if (!studioId || typeof studioId !== 'string') {
      return false;
    }
    
    // Studio IDs should be alphanumeric with hyphens/underscores only
    const studioIdPattern = /^[a-zA-Z0-9_-]+$/;
    return studioIdPattern.test(studioId) && studioId.length >= 3 && studioId.length <= 50;
  }

  /**
   * Submit a join request to the backend with authentication checks
   */
  async submitJoinRequest(requestData: JoinRequestData): Promise<void> {
    try {
      console.log('Submitting join request:', requestData);

      // Perform comprehensive authentication check
      const authResult = await this.checkAuthentication();
      if (!authResult.isAuthenticated) {
        throw new Error(`authentication: ${authResult.error || 'User not authenticated'}`);
      }

      const user = authResult.user!;

      // Validate and sanitize studio ID
      if (!this.validateStudioId(requestData.studioId)) {
        throw new Error('Invalid studio ID format');
      }

      // Sanitize and validate user input
      const sanitizedUserName = this.sanitizeInput(requestData.userName);
      if (!sanitizedUserName || sanitizedUserName.length < 2) {
        throw new Error('User name is required and must be at least 2 characters');
      }

      const sanitizedMessage = this.sanitizeInput(requestData.message || '');

      // Additional validation for name length after sanitization
      if (sanitizedUserName.length > 50) {
        throw new Error('User name must be less than 50 characters');
      }

      if (sanitizedMessage.length > 500) {
        throw new Error('Message must be less than 500 characters');
      }

      // Check if user already has a pending request for this studio
      const existingRequests = await this.client.models.StudioJoinRequest.list({
        filter: {
          studioId: { eq: requestData.studioId },
          userId: { eq: user.userId },
          status: { eq: 'pending' }
        }
      });

      if (existingRequests.data && existingRequests.data.length > 0) {
        throw new Error('You already have a pending join request for this studio');
      }

      // Create the join request with authenticated user data and sanitized input
      const joinRequestPayload = {
        studioId: requestData.studioId,
        userId: user.userId,
        userName: sanitizedUserName,
        userEmail: user.signInDetails?.loginId || '',
        requestedAt: requestData.requestedAt.toISOString(),
        status: requestData.status,
        message: sanitizedMessage || undefined
      };

      const result = await this.client.models.StudioJoinRequest.create(joinRequestPayload);

      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors.map(e => e.message).join(', ');
        throw new Error(`Failed to create join request: ${errorMessage}`);
      }

      if (!result.data) {
        throw new Error('Failed to create join request: No data returned');
      }

      console.log('Join request created successfully:', result.data);

    } catch (error) {
      console.error('Error in submitJoinRequest:', error);
      
      // Re-throw with more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('authentication:') || error.message.includes('not authenticated')) {
          throw new Error('authentication: Please log in to send a join request');
        } else if (error.message.includes('Invalid studio ID')) {
          throw new Error('validation: Invalid studio ID provided');
        } else if (error.message.includes('network')) {
          throw new Error('network: Please check your internet connection');
        } else if (error.message.includes('already have a pending')) {
          throw new Error('already exists: You already have a pending join request for this studio');
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
          throw new Error('permission: You do not have permission to perform this action');
        } else if (error.message.includes('401')) {
          throw new Error('authentication: Your session has expired. Please log in again');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred while submitting your join request');
    }
  }

  /**
   * Validate that a studio exists with authentication and security checks
   */
  async validateStudioExists(studioId: string): Promise<boolean> {
    try {
      // Validate studio ID format first for security
      if (!this.validateStudioId(studioId)) {
        console.warn('Invalid studio ID format provided for validation');
        return false;
      }

      // Check authentication first
      const authResult = await this.checkAuthentication();
      if (!authResult.isAuthenticated) {
        console.warn('Cannot validate studio existence: User not authenticated');
        return false;
      }

      const result = await this.client.models.Studio.get({ id: studioId });
      return !!(result.data && !result.errors);
    } catch (error) {
      console.error('Error validating studio existence:', error);
      return false;
    }
  }
}