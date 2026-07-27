import { Injectable } from '@angular/core';
import { JoinRequestData } from '../components/simple-studio-join/simple-studio-join.component';

@Injectable({
  providedIn: 'root'
})
export class SimpleStudioJoinMockService {
  constructor() {
    console.log('SimpleStudioJoinMockService initialized');
  }

  /**
   * Mock authentication check - always returns authenticated for testing
   */
  async checkAuthentication(): Promise<{ isAuthenticated: boolean; user?: any; error?: string }> {
    return {
      isAuthenticated: true,
      user: { userId: 'test-user', signInDetails: { loginId: 'test@example.com' } }
    };
  }

  /**
   * Mock submit join request - simulates successful submission
   */
  async submitJoinRequest(requestData: JoinRequestData): Promise<void> {
    console.log('Mock submitting join request:', requestData);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
    console.log('Mock join request submitted successfully');
  }

  /**
   * Mock studio validation - always returns true for testing
   */
  async validateStudioExists(studioId: string): Promise<boolean> {
    return true;
  }
}