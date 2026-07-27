import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ModalController, ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';

import { InstructorJoinReviewModalComponent } from './instructor-join-review-modal.component';
import { JoinRequestService } from '../../services/join-request.service';
import { InstructorPermissionService } from '../../services/instructor-permission.service';
import { EnhancedStudioJoinRequest, SystemException, SystemError } from '../../models/instructor-join-review.models';

// Mock services
const mockJoinRequestService = {
  getPendingRequestsForStudio: jasmine.createSpy('getPendingRequestsForStudio').and.returnValue(Promise.resolve({ requests: [], totalCount: 0, currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false })),
  getPaginatedRequestsForStudio: jasmine.createSpy('getPaginatedRequestsForStudio').and.returnValue(Promise.resolve({
    requests: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })),
  subscribeToRequestUpdates: jasmine.createSpy('subscribeToRequestUpdates').and.returnValue({
    subscribe: jasmine.createSpy('subscribe')
  }),
  subscribeToConnectionState: jasmine.createSpy('subscribeToConnectionState').and.returnValue({
    subscribe: jasmine.createSpy('subscribe')
  }),
  approveJoinRequest: jasmine.createSpy('approveJoinRequest').and.returnValue(Promise.resolve()),
  rejectJoinRequest: jasmine.createSpy('rejectJoinRequest').and.returnValue(Promise.resolve()),
  bulkApproveRequests: jasmine.createSpy('bulkApproveRequests').and.returnValue(Promise.resolve({
    totalRequests: 0,
    successfulOperations: 0,
    failedOperations: 0,
    errors: []
  })),
  bulkRejectRequests: jasmine.createSpy('bulkRejectRequests').and.returnValue(Promise.resolve({
    totalRequests: 0,
    successfulOperations: 0,
    failedOperations: 0,
    errors: []
  })),
  getRequestAuditLog: jasmine.createSpy('getRequestAuditLog').and.returnValue(Promise.resolve({ requests: [], totalCount: 0, currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false })),
  getRealTimeMetrics: jasmine.createSpy('getRealTimeMetrics').and.returnValue(Promise.resolve({
    totalPendingRequests: 0,
    averageProcessingTime: 0,
    successRate: 100
  }))
};

const mockInstructorPermissionService = {
  isInstructor: jasmine.createSpy('isInstructor').and.returnValue(Promise.resolve(true)),
  canManageRequests: jasmine.createSpy('canManageRequests').and.returnValue(Promise.resolve(true)),
  subscribeToPermissionChanges: jasmine.createSpy('subscribeToPermissionChanges').and.returnValue({
    subscribe: jasmine.createSpy('subscribe')
  })
};

const mockModalController = {
  dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
};

const mockToastController = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
  }))
};

const mockLoadingController = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
  }))
};

const mockAlertController = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
  }))
};

describe('InstructorJoinReviewModalComponent', () => {
  let component: InstructorJoinReviewModalComponent;
  let fixture: ComponentFixture<InstructorJoinReviewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorJoinReviewModalComponent],
      providers: [
        { provide: JoinRequestService, useValue: mockJoinRequestService },
        { provide: InstructorPermissionService, useValue: mockInstructorPermissionService },
        { provide: ModalController, useValue: mockModalController },
        { provide: ToastController, useValue: mockToastController },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: AlertController, useValue: mockAlertController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorJoinReviewModalComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.studioId = 'test-studio-123';
    component.studioName = 'Test Studio';
    
    // Reset all spies before each test
    Object.values(mockJoinRequestService).forEach(spy => {
      if (typeof spy === 'function' && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });
    Object.values(mockInstructorPermissionService).forEach(spy => {
      if (typeof spy === 'function' && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });
    Object.values(mockModalController).forEach(spy => {
      if (typeof spy === 'function' && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });
    Object.values(mockToastController).forEach(spy => {
      if (typeof spy === 'function' && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });
    Object.values(mockLoadingController).forEach(spy => {
      if (typeof spy === 'function' && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });
    Object.values(mockAlertController).forEach(spy => {
      if (typeof spy === 'function' && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });

    // Reset default return values
    mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
      requests: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    }));
    mockJoinRequestService.approveJoinRequest.and.returnValue(Promise.resolve());
    mockJoinRequestService.rejectJoinRequest.and.returnValue(Promise.resolve());
  });

  /**
   * Helper method to safely initialize the component for template rendering
   */
  async function initializeComponentForRendering(): Promise<void> {
    // Ensure the component is properly initialized before template rendering
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    expect(component).toBeTruthy();
    
    // Initialize the component for rendering to ensure methods are bound
    fixture.detectChanges();
    
    // Verify that the component methods are properly bound
    expect(typeof component.getFormattedDate).toBe('function');
    expect(typeof component.getRelativeTime).toBe('function');
  }, 5000);

  it('should load pending requests', async () => {
    const testRequest: EnhancedStudioJoinRequest = {
      id: 'test-request-1',
      studioId: 'test-studio-123',
      userId: 'user-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      requestedAt: new Date(),
      status: 'pending',
      message: 'Test message',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewMessage: undefined,
      isSelected: false,
      isProcessing: false
    };

    mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(
      Promise.resolve({ requests: [testRequest], totalCount: 1, currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })
    );

    await component.loadPendingRequests();
    fixture.detectChanges();

    expect(component.pendingRequests.length).toBe(1);
    expect(component.pendingRequests[0].id).toBe('test-request-1');
  }, 10000);

  it('should approve a request', async () => {
    const testRequest: EnhancedStudioJoinRequest = {
      id: 'test-request-1',
      studioId: 'test-studio-123',
      userId: 'user-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      requestedAt: new Date(),
      status: 'pending',
      message: 'Test message',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewMessage: undefined,
      isSelected: false,
      isProcessing: false
    };

    mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(
      Promise.resolve({ requests: [testRequest], totalCount: 1, currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })
    );

    await component.loadPendingRequests();
    fixture.detectChanges();

    await component.approveRequest('test-request-1');

    expect(mockJoinRequestService.approveJoinRequest).toHaveBeenCalledWith('test-request-1', jasmine.any(String));
    expect(mockToastController.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        color: 'success',
        message: jasmine.stringMatching(/^Approved request from .+$/)
      })
    );
  }, 10000);

  it('should reject a request', async () => {
    const testRequest: EnhancedStudioJoinRequest = {
      id: 'test-request-1',
      studioId: 'test-studio-123',
      userId: 'user-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      requestedAt: new Date(),
      status: 'pending',
      message: 'Test message',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewMessage: undefined,
      isSelected: false,
      isProcessing: false
    };

    mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(
      Promise.resolve({ requests: [testRequest], totalCount: 1, currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })
    );

    await component.loadPendingRequests();
    fixture.detectChanges();

    await component.rejectRequest('test-request-1');

    expect(mockJoinRequestService.rejectJoinRequest).toHaveBeenCalledWith('test-request-1', jasmine.any(String));
    expect(mockToastController.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        color: 'success',
        message: jasmine.stringMatching(/^Rejected request from .+$/)
      })
    );
  }, 10000);

  it('should handle approval errors gracefully', async () => {
    const testRequest: EnhancedStudioJoinRequest = {
      id: 'failing-request-123',
      studioId: 'test-studio-123',
      userId: 'user-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      requestedAt: new Date(),
      status: 'pending',
      message: 'Test message',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewMessage: undefined,
      isSelected: false,
      isProcessing: false
    };

    mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(
      Promise.resolve({ requests: [testRequest], totalCount: 1, currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })
    );

    const approvalError = new SystemException(SystemError.AUTHENTICATION_ERROR, 'approval', 'Approval failed');
    mockJoinRequestService.approveJoinRequest.and.returnValue(Promise.reject(approvalError));

    await component.loadPendingRequests();
    fixture.detectChanges();

    // Execute the approval (should fail)
    await component.approveRequest(testRequest.id);

    // Verify error handling - should show authentication error dialog
    expect(mockAlertController.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        header: 'Authentication Required'
      })
    );

    // Verify the request remains in pending state (not removed from list)
    expect(component.pendingRequests.length).toBe(1);
    expect(component.pendingRequests[0].id).toBe(testRequest.id);
  }, 5000);

  it('should handle rejection errors gracefully', async () => {
    const testRequest: EnhancedStudioJoinRequest = {
      id: 'failing-request-123',
      studioId: 'test-studio-123',
      userId: 'user-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      requestedAt: new Date(),
      status: 'pending',
      message: 'Test message',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewMessage: undefined,
      isSelected: false,
      isProcessing: false
    };

    mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(
      Promise.resolve({ requests: [testRequest], totalCount: 1, currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })
    );

    const rejectionError = new SystemException(SystemError.AUTHENTICATION_ERROR, 'rejection', 'Rejection failed');
    mockJoinRequestService.rejectJoinRequest.and.returnValue(Promise.reject(rejectionError));

    await component.loadPendingRequests();
    fixture.detectChanges();

    // Execute the rejection (should fail)
    await component.rejectRequest(testRequest.id);

    // Verify error handling - should show authentication error dialog
    expect(mockAlertController.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        header: 'Authentication Required'
      })
    );

    // Verify the request remains in pending state (not removed from list)
    expect(component.pendingRequests.length).toBe(1);
    expect(component.pendingRequests[0].id).toBe(testRequest.id);
  }, 5000);
});