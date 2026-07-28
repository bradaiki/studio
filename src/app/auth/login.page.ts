import { Component, NgZone, ChangeDetectorRef, signal } from '@angular/core';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AmplifyService } from '../services/amplify.service';
import { AuthStateService } from '../services/auth-state.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage {
  // Keep as regular properties - used with [(ngModel)]
  email: string = '';
  password: string = '';
  confirmationCode: string = '';

  // Convert to signals
  isLoading = signal(false);
  isSignUp = signal(false);
  needsConfirmation = signal(false);
  pendingUsername = signal('');

  constructor(
    private amplifyService: AmplifyService,
    private authStateService: AuthStateService,
    private router: Router,
    private toastController: ToastController,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.showToast('Please fill in all fields', 'warning');
      return;
    }

    this.isLoading.set(true);

    try {
      if (this.isSignUp()) {
        await this.signUp();
      } else {
        await this.signIn();
      }
    } catch (error: any) {
      this.showToast(error.message || 'Authentication failed', 'danger');
      this.password = '';
    }

    this.isLoading.set(false);
    this.cdr.detectChanges();
  }

  private async signUp() {
    const result = await this.amplifyService.signUp(
      this.email,
      this.password,
      this.email,
    );

    if (result.isSignUpComplete) {
      this.showToast('Sign up successful! You can now sign in.', 'success');
      this.isSignUp.set(false);
    } else {
      this.needsConfirmation.set(true);
      this.pendingUsername.set(this.email);
      this.showToast(
        'Please check your email for verification code',
        'success',
      );
    }
  }

  private async signIn() {
    const result = await this.amplifyService.signIn(this.email, this.password);
    if (result.isSignedIn) {
      this.showToast('Sign in successful!', 'success');
      const user = await this.amplifyService.getCurrentUser();
      this.authStateService.setAuthState(true, user);
      window.location.href = '/dash';
    } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
      this.needsConfirmation.set(true);
      this.pendingUsername.set(this.email);
      this.showToast('Please confirm your email first', 'warning');
    } else {
      throw new Error('Sign in failed. Please check your credentials.');
    }
  }

  async confirmSignUp() {
    if (!this.confirmationCode) {
      this.showToast('Please enter confirmation code', 'warning');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.amplifyService.confirmSignUp(
        this.pendingUsername(),
        this.confirmationCode,
      );
      this.showToast('Email confirmed! You can now sign in.', 'success');
      this.needsConfirmation.set(false);
      this.isSignUp.set(false);
      this.confirmationCode = '';
    } catch (error: any) {
      this.showToast(error.message || 'Confirmation failed', 'danger');
    }

    this.isLoading.set(false);
    this.cdr.detectChanges();
  }

  toggleMode() {
    this.isSignUp.update(v => !v);
    this.needsConfirmation.set(false);
    this.email = '';
    this.password = '';
    this.confirmationCode = '';
  }

  continueAsGuest() {
    this.router.navigate(['/dash']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }
}
