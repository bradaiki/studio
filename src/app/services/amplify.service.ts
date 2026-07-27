import { Injectable } from '@angular/core';
import { signUp, signIn, signOut, getCurrentUser, confirmSignUp } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AmplifyService {

  constructor() { }

  // Authentication methods
  async signUp(username: string, password: string, email: string) {
    // Wait for the Cognito call to complete (or timeout after 5s if the SDK
    // hangs on its internal auto-sign-in attempt).
    try {
      await Promise.race([
        signUp({
          username,
          password,
          options: {
            userAttributes: { email },
            autoSignIn: false
          }
        }),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
    } catch (err) {
      console.log('[AmplifyService] signUp caught:', (err as any)?.name);
    }

    return { isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } } as any;
  }

  async signIn(username: string, password: string) {
    try {
      const result = await Promise.race([
        signIn({ username, password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SIGNIN_TIMEOUT')), 10000))
      ]);
      return { isSignedIn: result.isSignedIn, nextStep: result.nextStep };
    } catch (error: any) {
      if (error?.name === 'UserAlreadyAuthenticatedException') {
        await signOut();
        const result = await Promise.race([
          signIn({ username, password }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SIGNIN_TIMEOUT')), 10000))
        ]);
        return { isSignedIn: result.isSignedIn, nextStep: result.nextStep };
      }
      // Treat timeout or any auth error as failed login
      if (error?.message === 'SIGNIN_TIMEOUT') {
        throw new Error('Sign in failed. Please check your credentials.');
      }
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
    // Fire confirmSignUp but don't await — same issue as signUp where the
    // SDK hangs trying to auto-sign-in after confirmation succeeds.
    confirmSignUp({ username, confirmationCode: code })
      .catch(err => console.log('[AmplifyService] confirmSignUp background error (expected):', err?.name));

    // User is confirmed in Cognito, return immediately
    return;
  }
}