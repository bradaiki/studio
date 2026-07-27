import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AmplifyService } from '../services/amplify.service';
import { PersonProfileManagerService } from '../services/person-profile-manager.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private amplifyService: AmplifyService,
    private router: Router,
    private personProfileManager: PersonProfileManagerService
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const user = await this.amplifyService.getCurrentUser();
      if (user) {
        // Check if user has a person profile
        const hasProfile = await this.personProfileManager.hasPersonProfile();
        
        if (!hasProfile) {
          // Prompt user to create profile (don't allow skip on first login)
          const profileCreated = await this.personProfileManager.ensurePersonProfile(false);
          
          if (!profileCreated) {
            // If user somehow bypassed profile creation, redirect to login
            this.router.navigate(['/login']);
            return false;
          }
        }
        
        return true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    } catch (error) {
      this.router.navigate(['/login']);
      return false;
    }
  }
}