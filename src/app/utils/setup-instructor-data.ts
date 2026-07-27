/**
 * Utility function to set up instructor test data
 * 
 * This can be called from within the application when a user is authenticated
 * to set up the instructor permissions and sample data for testing.
 */

import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';

export interface SetupResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Set up the current authenticated user as an instructor at Denver Aikido Dojo
 */
export async function setupCurrentUserAsInstructor(): Promise<SetupResult> {
  try {
    const client = generateClient<Schema>();
    
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user || !user.userId) {
      return {
        success: false,
        message: 'No authenticated user found. Please log in first.'
      };
    }
    
    const userId = user.userId;
    const studioId = 'studio_1'; // Denver Aikido Dojo
    
    console.log(`Setting up user ${userId} as instructor at studio ${studioId}`);
    
    // Check if membership already exists
    const existingMembership = await client.models.StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: userId }
      }
    });
    
    if (existingMembership.data && existingMembership.data.length > 0) {
      // Update existing membership to instructor
      const membership = existingMembership.data[0];
      const updateResult = await client.models.StudioMembership.update({
        id: membership.id,
        membershipType: 'instructor',
        isActive: true
      });
      
      if (updateResult.errors && updateResult.errors.length > 0) {
        return {
          success: false,
          message: 'Failed to update membership to instructor role',
          details: updateResult.errors
        };
      }
      
      return {
        success: true,
        message: 'Successfully updated existing membership to instructor role',
        details: { userId, studioId, action: 'updated' }
      };
    } else {
      // Create new instructor membership
      const membershipData = {
        studioId: studioId,
        userId: userId,
        membershipType: 'instructor' as const,
        joinedAt: new Date().toISOString(),
        isActive: true
      };
      
      const result = await client.models.StudioMembership.create(membershipData);
      
      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          message: 'Failed to create instructor membership',
          details: result.errors
        };
      }
      
      return {
        success: true,
        message: 'Successfully created instructor membership',
        details: { userId, studioId, action: 'created' }
      };
    }
    
  } catch (error) {
    console.error('Error setting up instructor:', error);
    return {
      success: false,
      message: `Error setting up instructor: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Create sample join requests for testing the instructor review functionality
 */
export async function createSampleJoinRequests(): Promise<SetupResult> {
  try {
    const client = generateClient<Schema>();
    const studioId = 'studio_1'; // Denver Aikido Dojo
    
    const sampleRequests = [
      {
        studioId: studioId,
        userId: 'sample-user-1',
        userName: 'Alice Johnson',
        userEmail: 'alice.johnson@example.com',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'pending' as const,
        message: 'I have been practicing Aikido for 3 years and would love to join your dojo. I am particularly interested in traditional techniques and weapons training.'
      },
      {
        studioId: studioId,
        userId: 'sample-user-2',
        userName: 'Michael Chen',
        userEmail: 'michael.chen@example.com',
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'pending' as const,
        message: 'New to Aikido but very interested in learning. I have experience in other martial arts and am looking for a traditional dojo to begin my Aikido journey.'
      },
      {
        studioId: studioId,
        userId: 'sample-user-3',
        userName: 'Sarah Williams',
        userEmail: 'sarah.williams@example.com',
        requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        status: 'pending' as const,
        message: 'I am relocating to Denver and looking for a new dojo. I have been practicing Aikido for 5 years and hold a 2nd kyu rank.'
      }
    ];
    
    const results: any[] = [];
    let created = 0;
    let skipped = 0;
    
    for (const requestData of sampleRequests) {
      try {
        // Check if request already exists
        const existingRequest = await client.models.StudioJoinRequest.list({
          filter: {
            studioId: { eq: requestData.studioId },
            userId: { eq: requestData.userId }
          }
        });
        
        if (existingRequest.data && existingRequest.data.length > 0) {
          console.log(`Request from ${requestData.userName} already exists, skipping...`);
          skipped++;
          continue;
        }
        
        const result = await client.models.StudioJoinRequest.create(requestData);
        
        if (result.errors && result.errors.length > 0) {
          console.warn(`Warning creating request from ${requestData.userName}:`, result.errors);
        } else {
          console.log(`Created sample request from ${requestData.userName}`);
          created++;
        }
        
        results.push({ user: requestData.userName, success: !result.errors?.length });
      } catch (error) {
        console.warn(`Warning creating request from ${requestData.userName}:`, error);
        results.push({ user: requestData.userName, success: false, error });
      }
    }
    
    return {
      success: true,
      message: `Sample requests setup complete: ${created} created, ${skipped} skipped`,
      details: { created, skipped, results }
    };
    
  } catch (error) {
    console.error('Error creating sample requests:', error);
    return {
      success: false,
      message: `Error creating sample requests: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Complete setup: make current user instructor and create sample requests
 */
export async function setupInstructorTestEnvironment(): Promise<SetupResult> {
  try {
    console.log('🚀 Setting up instructor test environment...');
    
    // Step 1: Set up instructor membership
    const membershipResult = await setupCurrentUserAsInstructor();
    if (!membershipResult.success) {
      return membershipResult;
    }
    
    console.log('✅ Instructor membership set up');
    
    // Step 2: Create sample join requests
    const requestsResult = await createSampleJoinRequests();
    if (!requestsResult.success) {
      return {
        success: false,
        message: `Instructor setup succeeded but sample requests failed: ${requestsResult.message}`,
        details: { membershipResult, requestsResult }
      };
    }
    
    console.log('✅ Sample join requests created');
    
    return {
      success: true,
      message: 'Instructor test environment setup complete! You can now test the instructor join review functionality.',
      details: { membershipResult, requestsResult }
    };
    
  } catch (error) {
    console.error('Error setting up test environment:', error);
    return {
      success: false,
      message: `Error setting up test environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Check if current user is already an instructor at Denver Aikido Dojo
 */
export async function checkInstructorStatus(): Promise<{ isInstructor: boolean; membership?: any }> {
  try {
    const client = generateClient<Schema>();
    const user = await getCurrentUser();
    
    if (!user || !user.userId) {
      return { isInstructor: false };
    }
    
    const studioId = 'studio_1'; // Denver Aikido Dojo
    
    const membership = await client.models.StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: user.userId }
      }
    });
    
    const userMembership = membership.data?.[0];
    const isInstructor = userMembership?.membershipType === 'instructor' || userMembership?.membershipType === 'admin';
    
    return {
      isInstructor,
      membership: userMembership
    };
    
  } catch (error) {
    console.error('Error checking instructor status:', error);
    return { isInstructor: false };
  }
}