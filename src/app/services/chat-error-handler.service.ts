import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { ChatAccessError, ChatAccessException } from './access-control.service';
import { TranslationService } from './translation.service';

export interface ErrorHandlingOptions {
  showToast?: boolean;
  showAlert?: boolean;
  logError?: boolean;
  fallbackValue?: any;
  retryCallback?: () => Promise<any>;
  maxRetries?: number;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionText?: string;
  actionCallback?: () => void;
  severity: 'info' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ChatErrorHandlerService {
  private retryAttempts = new Map<string, number>();

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private translationService: TranslationService
  ) {}

  /**
   * Handle access control errors with user-friendly messages
   * Implements Requirements 2.3, 5.1, 5.2
   */
  async handleAccessControlError(
    error: any, 
    context: string, 
    options: ErrorHandlingOptions = {}
  ): Promise<any> {
    const defaultOptions: ErrorHandlingOptions = {
      showToast: true,
      showAlert: false,
      logError: true,
      maxRetries: 0,
      ...options
    };

    if (defaultOptions.logError) {
      console.error(`Access control error in ${context}:`, error);
    }

    let userFriendlyError: UserFriendlyError;

    if (error instanceof ChatAccessException) {
      userFriendlyError = this.mapAccessExceptionToUserError(error);
    } else if (error?.message) {
      userFriendlyError = this.mapGenericErrorToUserError(error.message, context);
    } else {
      userFriendlyError = {
        title: 'Access Error',
        message: 'Unable to access chat. Please try again.',
        severity: 'error'
      };
    }

    // Show user feedback
    if (defaultOptions.showToast) {
      await this.showErrorToast(userFriendlyError);
    }

    if (defaultOptions.showAlert) {
      await this.showErrorAlert(userFriendlyError);
    }

    // Handle retry logic
    if (defaultOptions.retryCallback && defaultOptions.maxRetries && defaultOptions.maxRetries > 0) {
      const retryKey = `${context}_${Date.now()}`;
      const currentAttempts = this.retryAttempts.get(retryKey) || 0;
      
      if (currentAttempts < defaultOptions.maxRetries) {
        this.retryAttempts.set(retryKey, currentAttempts + 1);
        
        try {
          const result = await defaultOptions.retryCallback();
          this.retryAttempts.delete(retryKey);
          return result;
        } catch (retryError) {
          if (currentAttempts + 1 >= defaultOptions.maxRetries) {
            this.retryAttempts.delete(retryKey);
            // Show final error after all retries exhausted
            await this.showErrorToast({
              title: 'Operation Failed',
              message: 'Unable to complete operation after multiple attempts.',
              severity: 'error'
            });
          }
          throw retryError;
        }
      }
    }

    // Return fallback value if provided
    if (defaultOptions.fallbackValue !== undefined) {
      return defaultOptions.fallbackValue;
    }

    throw error;
  }

  /**
   * Handle network and connectivity errors with graceful degradation
   */
  async handleNetworkError(
    error: any,
    context: string,
    options: ErrorHandlingOptions = {}
  ): Promise<any> {
    const defaultOptions: ErrorHandlingOptions = {
      showToast: true,
      logError: true,
      maxRetries: 2,
      ...options
    };

    if (defaultOptions.logError) {
      console.error(`Network error in ${context}:`, error);
    }

    const errorMessage = error?.message || String(error);
    let userFriendlyError: UserFriendlyError;

    if (this.isNetworkError(errorMessage)) {
      userFriendlyError = {
        title: 'Connection Error',
        message: 'Unable to connect to chat service. Please check your internet connection.',
        actionText: 'Retry',
        actionCallback: options.retryCallback,
        severity: 'warning'
      };
    } else if (this.isServerError(errorMessage)) {
      userFriendlyError = {
        title: 'Service Unavailable',
        message: 'Chat service is temporarily unavailable. Please try again later.',
        actionText: 'Retry',
        actionCallback: options.retryCallback,
        severity: 'warning'
      };
    } else {
      userFriendlyError = {
        title: 'Connection Issue',
        message: 'Unable to complete operation. Please try again.',
        actionText: 'Retry',
        actionCallback: options.retryCallback,
        severity: 'error'
      };
    }

    if (defaultOptions.showToast) {
      await this.showErrorToast(userFriendlyError);
    }

    // Implement exponential backoff for retries
    if (defaultOptions.retryCallback && defaultOptions.maxRetries && defaultOptions.maxRetries > 0) {
      const retryKey = `${context}_network`;
      const currentAttempts = this.retryAttempts.get(retryKey) || 0;
      
      if (currentAttempts < defaultOptions.maxRetries) {
        this.retryAttempts.set(retryKey, currentAttempts + 1);
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, currentAttempts) * 1000;
        await this.delay(delay);
        
        try {
          const result = await defaultOptions.retryCallback();
          this.retryAttempts.delete(retryKey);
          return result;
        } catch (retryError) {
          if (currentAttempts + 1 >= defaultOptions.maxRetries) {
            this.retryAttempts.delete(retryKey);
          }
          throw retryError;
        }
      }
    }

    if (defaultOptions.fallbackValue !== undefined) {
      return defaultOptions.fallbackValue;
    }

    throw error;
  }

  /**
   * Handle authentication errors
   */
  async handleAuthenticationError(
    error: any,
    context: string,
    options: ErrorHandlingOptions = {}
  ): Promise<any> {
    const defaultOptions: ErrorHandlingOptions = {
      showAlert: true,
      logError: true,
      ...options
    };

    if (defaultOptions.logError) {
      console.error(`Authentication error in ${context}:`, error);
    }

    const userFriendlyError: UserFriendlyError = {
      title: 'Authentication Required',
      message: 'Please log in to access chat features.',
      actionText: 'Log In',
      actionCallback: () => {
        // Navigate to login - this would be handled by the component
        console.log('Navigate to login requested');
      },
      severity: 'warning'
    };

    if (defaultOptions.showAlert) {
      await this.showErrorAlert(userFriendlyError);
    }

    if (defaultOptions.fallbackValue !== undefined) {
      return defaultOptions.fallbackValue;
    }

    throw error;
  }

  /**
   * Handle general errors with graceful degradation
   */
  async handleGeneralError(
    error: any,
    context: string,
    options: ErrorHandlingOptions = {}
  ): Promise<any> {
    const defaultOptions: ErrorHandlingOptions = {
      showToast: true,
      logError: true,
      ...options
    };

    if (defaultOptions.logError) {
      console.error(`General error in ${context}:`, error);
    }

    const errorMessage = error?.message || String(error);

    // Categorize error and handle appropriately
    if (this.isAuthenticationError(errorMessage)) {
      return this.handleAuthenticationError(error, context, options);
    }

    if (this.isNetworkError(errorMessage) || this.isServerError(errorMessage)) {
      return this.handleNetworkError(error, context, options);
    }

    if (error instanceof ChatAccessException) {
      return this.handleAccessControlError(error, context, options);
    }

    // Generic error handling
    const userFriendlyError: UserFriendlyError = {
      title: 'Operation Failed',
      message: 'An unexpected error occurred. Please try again.',
      actionText: options.retryCallback ? 'Retry' : undefined,
      actionCallback: options.retryCallback,
      severity: 'error'
    };

    if (defaultOptions.showToast) {
      await this.showErrorToast(userFriendlyError);
    }

    if (defaultOptions.fallbackValue !== undefined) {
      return defaultOptions.fallbackValue;
    }

    throw error;
  }

  /**
   * Map ChatAccessException to user-friendly error
   */
  private mapAccessExceptionToUserError(exception: ChatAccessException): UserFriendlyError {
    switch (exception.errorCode) {
      case ChatAccessError.CHAT_NOT_FOUND:
        return {
          title: 'Chat Not Found',
          message: 'The requested chat could not be found or may have been deleted.',
          severity: 'warning'
        };

      case ChatAccessError.ACCESS_DENIED:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this chat.',
          severity: 'warning'
        };

      case ChatAccessError.INVITATION_REQUIRED:
        return {
          title: 'Invitation Required',
          message: 'This is a private chat. You need an invitation to participate.',
          severity: 'info'
        };

      case ChatAccessError.MEMBERSHIP_REQUIRED:
        return {
          title: 'Membership Required',
          message: 'You must be a studio member to access this chat.',
          severity: 'info'
        };

      case ChatAccessError.INVITATION_EXPIRED:
        return {
          title: 'Invitation Expired',
          message: 'Your invitation to this chat has expired. Please request a new invitation.',
          severity: 'warning'
        };

      case ChatAccessError.INVITATION_REVOKED:
        return {
          title: 'Access Revoked',
          message: 'Your access to this chat has been revoked.',
          severity: 'warning'
        };

      case ChatAccessError.ALREADY_MEMBER:
        return {
          title: 'Already a Member',
          message: 'You already have access to this chat.',
          severity: 'info'
        };

      case ChatAccessError.INVALID_INVITATION:
        return {
          title: 'Invalid Invitation',
          message: 'The invitation is invalid or has been revoked.',
          severity: 'warning'
        };

      default:
        return {
          title: 'Access Error',
          message: exception.message || 'Unable to access chat.',
          severity: 'error'
        };
    }
  }

  /**
   * Map generic error messages to user-friendly errors
   */
  private mapGenericErrorToUserError(errorMessage: string, context: string): UserFriendlyError {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('not authenticated') || lowerMessage.includes('log in')) {
      return {
        title: 'Authentication Required',
        message: 'Please log in to access chat features.',
        severity: 'warning'
      };
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to chat service. Please check your internet connection.',
        severity: 'warning'
      };
    }

    if (lowerMessage.includes('graphql') || lowerMessage.includes('api') || lowerMessage.includes('server')) {
      return {
        title: 'Service Unavailable',
        message: 'Chat service is temporarily unavailable. Please try again later.',
        severity: 'warning'
      };
    }

    if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        severity: 'warning'
      };
    }

    return {
      title: 'Error',
      message: `Unable to complete ${context}. Please try again.`,
      severity: 'error'
    };
  }

  /**
   * Show error toast with action button if provided
   */
  private async showErrorToast(error: UserFriendlyError): Promise<void> {
    const toast = await this.toastController.create({
      header: error.title,
      message: error.message,
      duration: error.severity === 'error' ? 5000 : 3000,
      color: error.severity === 'error' ? 'danger' : error.severity === 'warning' ? 'warning' : 'medium',
      position: 'bottom',
      buttons: error.actionText && error.actionCallback ? [
        {
          text: error.actionText,
          handler: () => {
            error.actionCallback?.();
          }
        },
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ] : [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  /**
   * Show error alert with action button if provided
   */
  private async showErrorAlert(error: UserFriendlyError): Promise<void> {
    const buttons: any[] = [];

    if (error.actionText && error.actionCallback) {
      buttons.push({
        text: error.actionText,
        handler: () => {
          error.actionCallback?.();
        }
      });
    }

    buttons.push({
      text: this.translationService.getTranslation('app.ok'),
      role: 'cancel'
    });

    const alert = await this.alertController.create({
      header: error.title,
      message: error.message,
      buttons: buttons
    });

    await alert.present();
  }

  /**
   * Check if error is a network-related error
   */
  private isNetworkError(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase();
    return lowerMessage.includes('network') || 
           lowerMessage.includes('fetch') || 
           lowerMessage.includes('connection') ||
           lowerMessage.includes('timeout') ||
           lowerMessage.includes('offline');
  }

  /**
   * Check if error is a server-related error
   */
  private isServerError(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase();
    return lowerMessage.includes('graphql') || 
           lowerMessage.includes('api') || 
           lowerMessage.includes('server') ||
           lowerMessage.includes('service unavailable') ||
           lowerMessage.includes('internal server error');
  }

  /**
   * Check if error is an authentication error
   */
  private isAuthenticationError(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase();
    return lowerMessage.includes('not authenticated') || 
           lowerMessage.includes('authentication') ||
           lowerMessage.includes('log in') ||
           lowerMessage.includes('unauthorized') ||
           lowerMessage.includes('token');
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear retry attempts for a specific context
   */
  clearRetryAttempts(context: string): void {
    const keysToDelete = Array.from(this.retryAttempts.keys()).filter(key => key.startsWith(context));
    keysToDelete.forEach(key => this.retryAttempts.delete(key));
  }

  /**
   * Get retry attempt count for a context
   */
  getRetryAttempts(context: string): number {
    const keys = Array.from(this.retryAttempts.keys()).filter(key => key.startsWith(context));
    return keys.reduce((total, key) => total + (this.retryAttempts.get(key) || 0), 0);
  }
}