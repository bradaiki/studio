import { Component, OnInit, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonText,
  IonIcon,
  ModalController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  locationOutline,
  closeOutline,
  atOutline,
} from 'ionicons/icons';
import { PeopleService, Person } from '../../services/people.service';
import { getCurrentUser } from 'aws-amplify/auth';

@Component({
  selector: 'app-person-profile-setup',
  templateUrl: './person-profile-setup.component.html',
  styleUrls: ['./person-profile-setup.component.scss'],
  imports: [
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonTextarea,
    IonItem,
    IonLabel,
    IonText,
    IonIcon,
    IonSpinner,
  ],
  standalone: true,
})
export class PersonProfileSetupComponent implements OnInit {
  @Input() existingPerson?: Person; // For edit mode
  @Input() canDismiss: boolean = false;

  name: string = '';
  username: string = '';
  handle: string = '';
  bio: string = '';
  location: string = '';
  email: string = '';
  rank: string = '';
  experience: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;

  constructor(
    private modalController: ModalController,
    private peopleService: PeopleService,
  ) {
    addIcons({
      personOutline,
      mailOutline,
      locationOutline,
      closeOutline,
      atOutline,
    });
  }

  async ngOnInit() {
    try {
      // Check if we're in edit mode
      if (this.existingPerson) {
        this.isEditMode = true;
        this.loadExistingProfile();
      } else {
        // Pre-fill email from Cognito user for new profiles
        const user = await getCurrentUser();
        if (user) {
          const attributes = user.signInDetails;
          this.email = attributes?.loginId || '';
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  loadExistingProfile() {
    if (!this.existingPerson) return;

    this.name = this.existingPerson.name;
    this.username = this.existingPerson.username;
    this.handle = this.existingPerson.handle;
    this.bio = this.existingPerson.bio;
    this.location = this.existingPerson.location;
    this.rank = this.existingPerson.rank || '';
    this.experience = this.existingPerson.experience || '';
    this.email = ''; // Don't show email in edit mode
  }

  onHandleInput(event: any) {
    let value = event.target.value;

    // Ensure handle starts with @
    if (value && !value.startsWith('@')) {
      value = '@' + value;
    }

    // Remove any spaces and special characters except underscore
    value = value.replace(/[^@a-zA-Z0-9_]/g, '');

    this.handle = value;
  }

  async onSubmit() {
    // Validate required fields
    if (!this.name.trim()) {
      this.errorMessage = 'Name is required';
      return;
    }

    if (!this.username.trim()) {
      this.errorMessage = 'Username is required';
      return;
    }

    if (!this.handle.trim() || this.handle === '@') {
      this.errorMessage = 'Handle is required';
      return;
    }

    if (!this.location.trim()) {
      this.errorMessage = 'Location is required';
      return;
    }

    // Validate handle format
    if (!this.handle.startsWith('@')) {
      this.errorMessage = 'Handle must start with @';
      return;
    }

    if (this.handle.length < 3) {
      this.errorMessage = 'Handle must be at least 2 characters (plus @)';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // Get current user ID
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (this.isEditMode && this.existingPerson) {
        // Update existing person
        const updates: Partial<Person> = {
          name: this.name.trim(),
          username: this.username.trim(),
          handle: this.handle.trim(),
          bio: this.bio.trim() || 'New member of the martial arts community',
          location: this.location.trim(),
          rank: this.rank.trim() || undefined,
          experience: this.experience.trim() || undefined,
        };

        const success = this.peopleService.updatePerson(
          this.existingPerson.id,
          updates,
        );

        if (!success) {
          throw new Error('Failed to update profile');
        }

        // Get updated person
        const updatedPerson = this.peopleService.getPersonById(
          this.existingPerson.id,
        );

        await this.modalController.dismiss({
          success: true,
          person: updatedPerson,
          isEdit: true,
        });
      } else {
        // Create new person profile
        const newPerson: Person = {
          id: user.userId,
          name: this.name.trim(),
          username: this.username.trim(),
          handle: this.handle.trim(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&size=150&background=random`,
          bio: this.bio.trim() || 'New member of the martial arts community',
          location: this.location.trim(),
          joinDate: new Date().toISOString().split('T')[0],
          followers: 0,
          following: 0,
          postsCount: 0,
          isFollowing: false,
          tags: ['new-member'],
          isVerified: false,
          studioAffiliations: [],
          experience: this.experience.trim() || 'Beginner',
          rank: this.rank.trim() || undefined,
        };

        // Add person to the service
        this.peopleService.addPerson(newPerson);

        // Close modal with success
        await this.modalController.dismiss({
          success: true,
          person: newPerson,
          isEdit: false,
        });
      }
    } catch (error: any) {
      console.error('Error saving person profile:', error);
      this.errorMessage =
        error.message || 'Failed to save profile. Please try again.';
      this.isSubmitting = false;
    }
  }

  async onSkip() {
    // Only allow skip if explicitly enabled
    if (this.canDismiss) {
      await this.modalController.dismiss({
        success: false,
        skipped: true,
      });
    }
  }

  async onClose() {
    // Only allow close if explicitly enabled
    if (this.canDismiss) {
      await this.modalController.dismiss({
        success: false,
        cancelled: true,
      });
    }
  }
}
