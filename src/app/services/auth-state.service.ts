import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AmplifyService } from './amplify.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private amplifyService: AmplifyService) {
    this.checkAuthState();
  }

  async checkAuthState() {
    try {
      const user = await this.amplifyService.getCurrentUser();
      if (user) {
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(user);
      } else {
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    }
  }

  async signOut() {
    try {
      await this.amplifyService.signOut();
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  setAuthState(isAuthenticated: boolean, user: any = null) {
    this.isAuthenticatedSubject.next(isAuthenticated);
    this.currentUserSubject.next(user);
  }

  async getCurrentUser() {
    return await this.amplifyService.getCurrentUser();
  }
}