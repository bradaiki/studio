import { TestBed } from '@angular/core/testing';
import { ToastController, AlertController } from '@ionic/angular';
import { ChatErrorHandlerService } from './chat-error-handler.service';
import { ChatAccessException, ChatAccessError } from './access-control.service';

describe('ChatErrorHandlerService', () => {
  let service: ChatErrorHandlerService;
  let toastController: jasmine.SpyObj<ToastController>;
  let alertController: jasmine.SpyObj<AlertController>;

  beforeEach(() => {
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const alertSpy = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      providers: [
        ChatErrorHandlerService,
        { provide: ToastController, useValue: toastSpy },
        { provide: AlertController, useValue: alertSpy }
      ]
    });

    service = TestBed.inject(ChatErrorHandlerService);
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle ChatAccessException correctly', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastController.create.and.returnValue(Promise.resolve(mockToast));

    const exception = new ChatAccessException(
      ChatAccessError.ACCESS_DENIED,
      'chat123',
      'user456',
      'Test access denied'
    );

    try {
      await service.handleAccessControlError(exception, 'test context');
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBe(exception);
    }

    expect(toastController.create).toHaveBeenCalled();
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('should handle network errors and show toast', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastController.create.and.returnValue(Promise.resolve(mockToast));

    const networkError = new Error('Network request failed');

    const result = await service.handleNetworkError(
      networkError,
      'test context',
      {
        fallbackValue: 'fallback'
      }
    );

    expect(result).toBe('fallback');
    expect(toastController.create).toHaveBeenCalled();
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('should handle network errors with successful retry', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastController.create.and.returnValue(Promise.resolve(mockToast));

    const networkError = new Error('Network request failed');
    const retryCallback = jasmine.createSpy('retryCallback').and.returnValue(Promise.resolve('success'));

    // Mock the delay method to avoid waiting for exponential backoff
    spyOn<any>(service, 'delay').and.returnValue(Promise.resolve());

    const result = await service.handleNetworkError(
      networkError,
      'test context',
      {
        retryCallback,
        maxRetries: 1
      }
    );

    expect(result).toBe('success');
    expect(retryCallback).toHaveBeenCalledTimes(1);
    expect(toastController.create).toHaveBeenCalled();
  });

  it('should return fallback value when provided', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastController.create.and.returnValue(Promise.resolve(mockToast));

    const error = new Error('Test error');
    const fallbackValue = { test: 'fallback' };

    const result = await service.handleGeneralError(
      error,
      'test context',
      {
        fallbackValue,
        showToast: false
      }
    );

    expect(result).toBe(fallbackValue);
  });

  it('should identify network errors correctly', () => {
    expect(service['isNetworkError']('Network request failed')).toBe(true);
    expect(service['isNetworkError']('fetch error occurred')).toBe(true);
    expect(service['isNetworkError']('connection timeout')).toBe(true);
    expect(service['isNetworkError']('some other error')).toBe(false);
  });

  it('should identify authentication errors correctly', () => {
    expect(service['isAuthenticationError']('User not authenticated')).toBe(true);
    expect(service['isAuthenticationError']('Please log in')).toBe(true);
    expect(service['isAuthenticationError']('unauthorized access')).toBe(true);
    expect(service['isAuthenticationError']('some other error')).toBe(false);
  });
});