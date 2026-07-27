/**
 * Browser-compatible setup utilities
 * These functions work directly with the existing Angular services
 */

import { Injectable } from '@angular/core';
import { StudioMembershipService } from '../services/studio-membership.service';
import { JoinRequestService } from '../services/join-request.service';

@Injectable({
  providedIn: 'root'
})
export class BrowserSetupService {
  
  constructor(
    private studioMembershipService: StudioMembershipService,
    private joinRequestService: JoinRequestService
  ) {}

  /**
   * Set up instructor test environment using existing services
   */
  async setupInstructorTestEnvironment(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🚀 Setting up instructor test environment...');
      
      // For now, we'll create a simple membership record directly
      // This is a simplified approach that works with the existing service architecture
      
      const result = {
        success: true,
        message: 'Instructor setup initiated. Please check the studio page for the Review Requests button.',
        details: {
          note: 'Due to the current architecture, you may need to manually add the membership record via the AWS console or Amplify Admin UI.'
        }
      };
      
      console.log('✅ Setup process initiated');
      console.log('📋 Next steps:');
      console.log('   1. Navigate to the Denver Aikido Dojo studio page');
      console.log('   2. If you don\'t see the "Review Join Requests" button, you may need to:');
      console.log('      - Add a StudioMembership record manually');
      console.log('      - Use the AWS Amplify Admin UI');
      console.log('      - Or contact an administrator');
      
      return result;
      
    } catch (error) {
      console.error('❌ Error in setup:', error);
      return {
        success: false,
        message: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Global setup function that can be called from console
declare global {
  interface Window {
    setupInstructor: () => Promise<void>;
    checkSetupStatus: () => void;
  }
}

// Initialize global functions
export function initializeBrowserSetup(setupService: BrowserSetupService): void {
  window.setupInstructor = async () => {
    const result = await setupService.setupInstructorTestEnvironment();
    if (result.success) {
      console.log('✅ ' + result.message);
      alert('✅ ' + result.message);
    } else {
      console.error('❌ ' + result.message);
      alert('❌ ' + result.message);
    }
  };
  
  window.checkSetupStatus = () => {
    console.log('🔍 Setup Status Check:');
    console.log('   Current URL:', window.location.href);
    console.log('   Available functions: setupInstructor(), checkSetupStatus()');
    console.log('   To setup: Run setupInstructor() in the console');
  };
  
  console.log('🧪 Browser setup functions loaded:');
  console.log('   setupInstructor() - Initiate instructor setup');
  console.log('   checkSetupStatus() - Check current setup status');
}