import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { getCurrentUser } from 'aws-amplify/auth';
import { PeopleService, Person } from './people.service';
import { PersonProfileSetupComponent } from '../components/person-profile-setup/person-profile-setup.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PersonProfileManagerService {
  private profileCheckInProgress = false;
  private profileUpdated$ = new Subject<void>();

  // Observable that components can subscribe to for profile updates
  public onProfileUpdated$ = this.profileUpdated$.asObservable();

  constructor(
    private peopleService: PeopleService,
    private modalController: ModalController
  ) {}

  /**
   * Check if the current user has a person profile
   */
  async hasPersonProfile(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return false;
      }

      // Check database first
      const person = await this.peopleService.getPersonByIdAsync(user.userId);
      return !!person;
    } catch (error) {
      console.error('Error checking person profile:', error);
      return false;
    }
  }

  /**
   * Get the current user's person profile (from database)
   */
  async getCurrentPersonProfile(): Promise<Person | undefined> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return undefined;
      }

      // Fetch from database instead of in-memory cache
      return await this.peopleService.getPersonByIdAsync(user.userId);
    } catch (error) {
      console.error('Error getting person profile:', error);
      return undefined;
    }
  }

  /**
   * Prompt user to create a person profile if they don't have one
   * Returns true if profile was created or already exists, false if skipped/cancelled
   */
  async ensurePersonProfile(allowSkip: boolean = false): Promise<boolean> {
    // Prevent multiple simultaneous checks
    if (this.profileCheckInProgress) {
      return false;
    }

    this.profileCheckInProgress = true;

    try {
      // Check if user already has a profile
      const hasProfile = await this.hasPersonProfile();
      if (hasProfile) {
        return true;
      }

      // Show profile setup modal
      const modal = await this.modalController.create({
        component: PersonProfileSetupComponent,
        backdropDismiss: allowSkip,
        componentProps: {
          canDismiss: allowSkip
        }
      });

      await modal.present();
      const { data } = await modal.onWillDismiss();

      if (data?.success) {
        console.log('Person profile created successfully:', data.person);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error ensuring person profile:', error);
      return false;
    } finally {
      this.profileCheckInProgress = false;
    }
  }

  /**
   * Show profile setup modal manually
   */
  async showProfileSetup(existingPerson?: Person): Promise<Person | null> {
    try {
      const modal = await this.modalController.create({
        component: PersonProfileSetupComponent,
        backdropDismiss: true,
        componentProps: {
          canDismiss: true,
          existingPerson: existingPerson
        }
      });

      await modal.present();
      const { data } = await modal.onWillDismiss();

      if (data?.success && data?.person) {
        return data.person;
      }

      return null;
    } catch (error) {
      console.error('Error showing profile setup:', error);
      return null;
    }
  }

  /**
   * Update person profile
   */
  async updatePersonProfile(updates: Partial<Person>): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return false;
      }

      return this.peopleService.updatePerson(user.userId, updates);
    } catch (error) {
      console.error('Error updating person profile:', error);
      return false;
    }
  }

  /**
   * Check if profile is complete (has all required fields)
   */
  isProfileComplete(person: Person): boolean {
    return !!(
      person.name &&
      person.username &&
      person.location &&
      person.bio
    );
  }

  /**
   * Notify that the person profile has been updated
   * This can be used by other components to refresh their data
   */
  notifyProfileUpdated(): void {
    console.log('Person profile updated notification');
    this.profileUpdated$.next();
  }
}
