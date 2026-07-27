import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSpinner,
  ToastController, 
  LoadingController,
  ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  person, 
  mail, 
  send,
  close,
  refresh
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { StudioMembershipService } from '../../services/studio-membership.service';
import { getCurrentUser } from 'aws-amplify/auth';

export interface JoinRequestData {
  studioId: string;
  userName: string;
  message: string;
  requestedAt: Date;
  status: 'pending';
}

export interface ValidationErrors {
  userName?: string;
  message?: string;
  general?: string;
}

export interface ErrorMessageMapping {
  [key: string]: string;
}

@Component({
  selector: 'app-simple-studio-join',
  templateUrl: './simple-studio-join.component.html',
  styleUrls: ['./simple-studio-join.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSpinner
  ]
})
export class SimpleStudioJoinComponent implements OnInit, OnDestroy {
  @Input() studioId!: string;
  @Input() studioName?: string;

  joinForm!: FormGroup;
  isSubmitting = false;
  errors: ValidationErrors = {};
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second delay
  private hasSubmissionError = false; // Track if we have a submission error
  private subscriptions: Subscription[] = []; // Track subscriptions for cleanup
  private isInModal = false; // Check modal context during initialization
  private modalContextTimeout?: number; // Track timeout for cleanup
  private retryTimeout?: number; // Track retry timeout for cleanup

  // Enhanced error message mapping for different error types
  private errorMessageMap: ErrorMessageMapping = {
    'authentication': 'Please log in to send a join request.',
    'session_expired': 'Your session has expired. Please log in again.',
    'network': 'Network error. Please check your connection and try again.',
    'already exists': 'You already have a pending join request for this studio.',
    'validation': 'Please check your input and try again.',
    'server': 'Server error. Please try again later.',
    'timeout': 'Request timed out. Please try again.',
    'permission': 'You do not have permission to perform this action.',
    'studio_not_found': 'The requested studio could not be found.',
    'user_not_found': 'User information could not be found.',
    'rate_limit': 'Too many requests. Please wait a moment and try again.',
    'maintenance': 'The service is temporarily unavailable for maintenance.',
    'default': 'An unexpected error occurred. Please try again.'
  };

  constructor(
    private formBuilder: FormBuilder,
    private studioMembershipService: StudioMembershipService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {
    addIcons({
      person,
      mail,
      send,
      close,
      refresh
    });
  }

  /**
   * Sanitize user input on the client side for additional security
   */
  private sanitizeUserInput(input: string): string {
    if (!input) return '';
    
    // Remove potentially dangerous characters and normalize whitespace
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove HTML/XML special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000); // Limit length as additional safety measure
  }

  /**
   * Validate studio ID format for security
   */
  private validateStudioIdFormat(studioId: string): boolean {
    if (!studioId || typeof studioId !== 'string') {
      return false;
    }
    
    // Studio IDs should be alphanumeric with hyphens/underscores only
    const studioIdPattern = /^[a-zA-Z0-9_-]+$/;
    return studioIdPattern.test(studioId) && studioId.length >= 3 && studioId.length <= 50;
  }

  ngOnInit() {
    console.log('SimpleStudioJoinComponent initializing for studio:', this.studioId);
    
    if (!this.studioId) {
      console.error('No studioId provided to SimpleStudioJoinComponent');
      this.errors.general = 'Studio ID is required';
      return;
    }

    // Validate studio ID format for security
    if (!this.validateStudioIdFormat(this.studioId)) {
      console.error('Invalid studio ID format provided:', this.studioId);
      this.errors.general = 'Invalid studio ID format';
      return;
    }

    // Initialize form immediately - this should be synchronous and fast
    this.initializeFormSync();
    
    // Check modal context asynchronously
    this.checkModalContext();
    
    console.log('SimpleStudioJoinComponent initialization complete');
  }

  ngOnDestroy() {
    console.log('SimpleStudioJoinComponent destroying');
    
    // Clean up modal context timeout if still pending
    if (this.modalContextTimeout) {
      clearTimeout(this.modalContextTimeout);
      this.modalContextTimeout = undefined;
    }
    
    // Clean up retry timeout if still pending
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
    
    // Clean up all subscriptions to prevent memory leaks
    this.subscriptions.forEach(subscription => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions = [];
    
    // Clear errors and reset state
    this.errors = {};
    this.isSubmitting = false;
    this.retryCount = 0;
    this.hasSubmissionError = false;
  }

  /**
   * Check if component is running in modal context
   */
  private async checkModalContext() {
    try {
      const topModal = await this.modalController.getTop();
      this.isInModal = !!topModal;
    } catch (error) {
      console.error('Error checking modal context:', error);
      this.isInModal = false; // Default to not in modal on error
    }
  }

  /**
   * Set modal context for testing purposes
   * @internal - This method is for testing only
   */
  setModalContextForTesting(isInModal: boolean) {
    this.isInModal = isInModal;
  }

  private noWhitespaceValidator(control: any) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  private validateUserNameRealTime() {
    const userNameControl = this.joinForm?.get('userName');
    
    if (userNameControl && (userNameControl.touched || userNameControl.dirty || userNameControl.value)) {
      if (userNameControl.errors) {
        if (userNameControl.errors['required']) {
          this.errors.userName = 'Name is required';
        } else if (userNameControl.errors['minlength']) {
          this.errors.userName = 'Name must be at least 2 characters';
        } else if (userNameControl.errors['maxlength']) {
          this.errors.userName = 'Name must be less than 50 characters';
        } else if (userNameControl.errors['whitespace']) {
          this.errors.userName = 'Name cannot be only whitespace';
        }
      } else {
        delete this.errors.userName;
      }
    } else if (!userNameControl?.value && !userNameControl?.touched) {
      delete this.errors.userName;
    }
  }

  private validateMessageRealTime() {
    const messageControl = this.joinForm?.get('message');
    
    if (messageControl && (messageControl.touched || messageControl.dirty)) {
      if (messageControl.errors) {
        if (messageControl.errors['maxlength']) {
          this.errors.message = 'Message must be less than 500 characters';
        }
      } else {
        delete this.errors.message;
      }
    }
  }

  /**
   * Initialize form synchronously without any async operations or subscriptions
   */
  private initializeFormSync() {
    try {
      console.log('Initializing form synchronously...');
      
      this.joinForm = this.formBuilder.group({
        userName: ['', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          this.noWhitespaceValidator
        ]],
        message: ['', [
          Validators.maxLength(500)
        ]]
      });

      // Set up value change subscriptions to clear field errors when input becomes valid
      this.setupFormValueChangeSubscriptions();

      console.log('Form initialized successfully');
    } catch (error) {
      console.error('Error initializing form:', error);
      this.errors.general = 'Failed to initialize form. Please refresh the page.';
    }
  }

  /**
   * Set up subscriptions to automatically clear field errors when input becomes valid
   */
  private setupFormValueChangeSubscriptions() {
    if (!this.joinForm) {
      return;
    }

    // Clear userName errors when field becomes valid
    const userNameSubscription = this.joinForm.get('userName')?.valueChanges.subscribe(() => {
      this.clearFieldError('userName');
      this.clearGeneralErrorIfResolved();
    });

    // Clear message errors when field becomes valid
    const messageSubscription = this.joinForm.get('message')?.valueChanges.subscribe(() => {
      this.clearFieldError('message');
      this.clearGeneralErrorIfResolved();
    });

    // Track subscriptions for cleanup
    if (userNameSubscription) {
      this.subscriptions.push(userNameSubscription);
    }
    if (messageSubscription) {
      this.subscriptions.push(messageSubscription);
    }
  }

  /**
   * Handle real-time input events for userName field with sanitization
   */
  onUserNameInput(event: any) {
    // Simple validation without subscriptions
    const userNameControl = this.joinForm?.get('userName');
    if (userNameControl) {
      const sanitizedValue = this.sanitizeUserInput(event.target.value);
      if (sanitizedValue !== event.target.value) {
        userNameControl.setValue(sanitizedValue);
      }
      userNameControl.markAsDirty();
      this.validateUserNameRealTime();
    }
  }

  /**
   * Handle blur events for userName field
   */
  onUserNameBlur() {
    const userNameControl = this.joinForm?.get('userName');
    if (userNameControl) {
      userNameControl.markAsTouched();
      this.validateUserNameRealTime();
    }
  }

  /**
   * Handle real-time input events for message field with sanitization
   */
  onMessageInput(event: any) {
    const messageControl = this.joinForm?.get('message');
    if (messageControl) {
      const sanitizedValue = this.sanitizeUserInput(event.target.value);
      if (sanitizedValue !== event.target.value) {
        messageControl.setValue(sanitizedValue);
      }
      messageControl.markAsDirty();
      this.validateMessageRealTime();
    }
  }

  /**
   * Handle blur events for message field
   */
  onMessageBlur() {
    const messageControl = this.joinForm?.get('message');
    if (messageControl) {
      messageControl.markAsTouched();
      this.validateMessageRealTime();
    }
  }

  /**
   * Get appropriate color for character count based on usage
   */
  getCharacterCountColor(): string {
    const messageLength = this.joinForm?.get('message')?.value?.length || 0;
    if (messageLength > 450) {
      return 'danger';
    } else if (messageLength > 400) {
      return 'warning';
    } else {
      return 'medium';
    }
  }

  /**
   * Determine if form validation status should be shown
   */
  showFormValidationStatus(): boolean {
    return this.hasFormInteraction() && !this.isSubmitting;
  }

  /**
   * Check if user has interacted with the form
   */
  hasFormInteraction(): boolean {
    if (!this.joinForm) {
      return false;
    }
    
    const userNameControl = this.joinForm.get('userName');
    const messageControl = this.joinForm.get('message');
    
    return !!(
      (userNameControl && (userNameControl.touched || userNameControl.dirty)) ||
      (messageControl && (messageControl.touched || messageControl.dirty))
    );
  }

  /**
   * Get dynamic submission status text based on current state
   */
  getSubmissionStatusText(): string {
    if (this.retryCount > 0) {
      return `Retrying... (${this.retryCount}/${this.maxRetries})`;
    }
    return 'Sending...';
  }

  /**
   * Disable form controls during submission to prevent user input
   */
  private setFormControlsDisabledState(disabled: boolean) {
    if (!this.joinForm) {
      return;
    }
    
    if (disabled) {
      this.joinForm.disable();
    } else {
      this.joinForm.enable();
    }
  }

  private clearFieldError(field: keyof ValidationErrors) {
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }

  private clearAllErrors() {
    this.errors = {};
    this.retryCount = 0; // Reset retry count when clearing errors
    this.hasSubmissionError = false; // Reset submission error flag only when explicitly clearing all errors
  }

  /**
   * Automatically clear general errors when form becomes valid
   */
  private clearGeneralErrorIfResolved() {
    // Don't clear submission errors automatically - only clear validation errors
    // Only clear general errors if they are validation-related, not submission-related
    if (this.errors.general && this.joinForm?.valid && !this.isSubmitting && !this.hasSubmissionError) {
      delete this.errors.general;
      this.retryCount = 0; // Reset retry count when error is resolved
    }
  }

  get isFormValid(): boolean {
    return this.joinForm?.valid ?? false;
  }

  async onSubmit() {
    if (!this.isFormValid || this.isSubmitting) {
      return;
    }

    // Set isSubmitting immediately to prevent duplicate submissions
    this.isSubmitting = true;

    // Double-check authentication before submission
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        this.errors.general = 'Please log in to send a join request';
        this.hasSubmissionError = true;
        this.isSubmitting = false; // Reset on authentication failure
        await this.showErrorToast('Authentication required. Please log in and try again.');
        return;
      }
    } catch (error) {
      console.error('Authentication check failed during submission:', error);
      this.errors.general = 'Authentication check failed. Please try again.';
      this.hasSubmissionError = true;
      this.isSubmitting = false; // Reset on authentication error
      await this.showErrorToast('Authentication error. Please refresh the page and try again.');
      return;
    }

    await this.submitWithRetry();
  }

  /**
   * Submit form with automatic retry logic for transient failures
   */
  private async submitWithRetry(): Promise<void> {
    // isSubmitting is already set to true in onSubmit()
    this.setFormControlsDisabledState(true); // Disable form controls during submission
    
    // Only clear errors on the first attempt, not on retries
    if (this.retryCount === 0) {
      this.clearAllErrors();
    }

    const loading = await this.loadingController.create({
      message: this.retryCount > 0 ? `Retrying... (${this.retryCount}/${this.maxRetries})` : 'Sending join request...',
      spinner: 'crescent',
      translucent: true
    });
    await loading.present();

    try {
      const userName = this.sanitizeUserInput(this.joinForm?.get('userName')?.value || '');
      const message = this.sanitizeUserInput(this.joinForm?.get('message')?.value || '');

      console.log('[SimpleStudioJoin] Submitting join request:', { studioId: this.studioId, userName, message });
      
      await this.studioMembershipService.requestToJoin({
        studioId: this.studioId,
        message: message || undefined
      });

      console.log('[SimpleStudioJoin] Join request submitted successfully');
      await loading.dismiss();
      
      // Enhanced success feedback with more detailed message
      const successMessage = `Join request sent successfully! You will be notified when an instructor reviews your request for ${this.studioName || 'this studio'}.`;
      
      await this.showSuccessToast(successMessage);

      // Reset retry count on success
      this.retryCount = 0;
      this.hasSubmissionError = false; // Clear submission error flag on success

      // Close modal on success with success data
      if (this.isInModal) {
        await this.modalController.dismiss({
          dismissed: true,
          membershipChanged: true, // Indicate that membership status may have changed
          success: true
        });
      } else {
        // If not in modal, just close normally
        await this.closeModal();
      }

    } catch (error) {
      await loading.dismiss();
      
      console.error('Error submitting join request:', error);
      
      const errorMessage = this.mapErrorToUserMessage(error);
      const isTransientError = this.isTransientError(error);
      
      // Always set the general error for user feedback and mark as submission error
      this.errors.general = errorMessage;
      this.hasSubmissionError = true; // Mark that we have a submission error
      
      if (isTransientError && this.retryCount < this.maxRetries) {
        // Attempt automatic retry for transient errors
        this.retryCount++;
        
        const retryMessage = `Request failed. Retrying automatically in ${this.retryDelay / 1000} seconds... (${this.retryCount}/${this.maxRetries})`;
        
        const retryToast = await this.toastController.create({
          message: retryMessage,
          duration: this.retryDelay,
          color: 'warning',
          position: 'top'
        });
        await retryToast.present();
        
        // Wait before retrying with exponential backoff
        this.retryTimeout = window.setTimeout(async () => {
          this.retryDelay *= 2; // Exponential backoff
          await this.submitWithRetry();
        }, this.retryDelay);
        
        return; // Don't set isSubmitting to false yet or re-enable form
      } else {
        // Show error toast for non-transient errors or max retries reached
        const errorToastMessage = this.retryCount >= this.maxRetries 
          ? `${errorMessage} Maximum retry attempts reached.`
          : errorMessage;
        
        await this.showErrorToast(errorToastMessage);
        
        // Reset retry count after max attempts
        if (this.retryCount >= this.maxRetries) {
          this.retryCount = 0;
          this.retryDelay = 1000; // Reset delay
        }
      }
    } finally {
      this.isSubmitting = false;
      this.setFormControlsDisabledState(false); // Re-enable form controls
    }
  }

  /**
   * Determine if an error is transient and should be retried
   */
  private isTransientError(error: any): boolean {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Network-related errors that might be temporary
      const transientPatterns = [
        'network',
        'timeout',
        'connection',
        'fetch',
        '502',
        '503',
        '504',
        'rate limit',
        'too many requests'
      ];
      
      return transientPatterns.some(pattern => errorMessage.includes(pattern));
    }
    
    return false;
  }

  async closeModal() {
    try {
      // Only attempt to dismiss if we're actually in a modal context
      if (this.isInModal) {
        await this.modalController.dismiss({
          dismissed: true,
          membershipChanged: false // Could be set to true if join was successful
        });
        console.log('Modal dismissed successfully');
      } else {
        console.log('Not in modal context, no modal to dismiss');
      }
    } catch (error) {
      console.log('Modal dismiss called but no modal to dismiss or error occurred:', error);
      // This is not necessarily an error - component might not be in a modal
    }
  }

  async onCancel() {
    console.log('Cancel button clicked');
    
    // If form has been modified, could show confirmation dialog here
    // For now, just close the modal
    await this.closeModal();
  }

  /**
   * Manual retry method that users can trigger
   */
  async onRetry() {
    if (this.isSubmitting) {
      return;
    }
    
    this.retryCount = 0; // Reset retry count for manual retry
    this.retryDelay = 1000; // Reset delay
    await this.onSubmit();
  }

  /**
   * Maps various error types to user-friendly messages
   */
  private mapErrorToUserMessage(error: any): string {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Check for specific error patterns and map to user-friendly messages
      for (const [errorType, userMessage] of Object.entries(this.errorMessageMap)) {
        if (errorMessage.includes(errorType)) {
          return userMessage;
        }
      }
      
      // Handle HTTP status codes if present
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return this.errorMessageMap['authentication'];
      } else if (errorMessage.includes('session') && errorMessage.includes('expired')) {
        return this.errorMessageMap['session_expired'];
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        return this.errorMessageMap['permission'];
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return this.errorMessageMap['studio_not_found'];
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return this.errorMessageMap['rate_limit'];
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        return this.errorMessageMap['server'];
      } else if (errorMessage.includes('timeout')) {
        return this.errorMessageMap['timeout'];
      } else if (errorMessage.includes('invalid') && errorMessage.includes('studio')) {
        return 'Invalid studio ID provided';
      }
    }
    
    // Default fallback message
    return this.errorMessageMap['default'];
  }

  /**
   * Shows a success toast with customizable message
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 5000,
      color: 'success',
      position: 'top',
      buttons: [
        {
          text: 'Great!',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Shows an error toast with customizable message
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}