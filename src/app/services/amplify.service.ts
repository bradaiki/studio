import { Injectable } from '@angular/core';
import { signUp, signIn, signOut, getCurrentUser, confirmSignUp } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AmplifyService {

  constructor() { }

  // Authentication methods
  async signUp(username: string, password: string, email: string) {
    try {
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
          }
        }
      });
      return result;
    } catch (error) {
      console.log('Error signing up:', error);
      throw error;
    }
  }

  async signIn(username: string, password: string) {
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password });
      return { isSignedIn, nextStep };
    } catch (error: any) {
      // If already authenticated (e.g. refreshed login page on logged-in tab),
      // sign out first then retry
      if (error?.name === 'UserAlreadyAuthenticatedException') {
        await signOut();
        const { isSignedIn, nextStep } = await signIn({ username, password });
        return { isSignedIn, nextStep };
      }
      console.log('Error signing in:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut();
    } catch (error) {
      console.log('Error signing out:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      console.log('No authenticated user:', error);
      return null;
    }
  }

  async confirmSignUp(username: string, code: string) {
    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      console.log('Error confirming sign up:', error);
      throw error;
    }
  }
}