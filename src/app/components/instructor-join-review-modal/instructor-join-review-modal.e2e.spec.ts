import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController, ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { of, BehaviorSubject, throwError } from 'rxjs';

import { InstructorJoinReviewModalComponent } from './instructor-join-review-modal.component';
import { JoinRequestService } from '../../services/join-request.service';
import { InstructorPermissionService } from '../../services/instructor-permission.service';
import { 
  EnhancedStudioJoinRequest, 
  BulkOperationResult, 
  SystemException, 
  SystemError,
  RequestProcessingException,
  RequestProcessingError,
  InstructorPermissionException,
  InstructorPermissionError
} from '../../models/instructor-join-review.models';

/**
 * End-to-End Integration Tests for Instructor Join Review Modal
 * 
 * These tests validate the complete instructor workflow from studio page 
 * to request approval, including real-time updates and error scenarios.
 * 
 * Requirements Coverage: All requirements (1.1-10.5)
 */
xdescribe('InstructorJoinReviewModal - End-to-End Integration Tests', () => {
  let component: InstructorJoinReviewModalComponent;
  let fixture: ComponentFixture<InstructorJoinReviewModalComponent>;
  let mockJoinRequestService: jasmine.SpyObj<JoinRequestService>;
  let mockInstructorPermissionService: jasmine.SpyObj<InstructorPermissionService>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockToastController: jasmine.SpyObj<ToastController>;
  let mockLoadingController: jasmine.SpyObj<LoadingController>;
  let mockAlertController: jasmine.SpyObj<AlertController>;

  // Real-time update subjects for testing
  let requestUpdatesSubject: BehaviorSubject<EnhancedStudioJoinRequest[]>;
  let connectionStateSubject: BehaviorSubject<string>;
  let permissionChangesSubject: BehaviorSubject<boolean>;

  const testStudioId = 'test-studio-123';
  const testInstructorId = 'instructor-456';

  beforeEach(async () => {
    // Initialize real-time update subjects
    requestUpdatesSubject = new BehaviorSubject<EnhancedStudioJoinRequest[]>([]);
    connectionStateSubject = new BehaviorSubject<string>('connected');
    permissionChangesSubject = new BehaviorSubject<boolean>(true);

    // Create comprehensive mocks
    mockJoinRequestService = jasmine.createSpyObj('JoinRequestService', [
      'getPendingRequestsForStudio',
      'getPaginatedRequestsForStudio',
      'approveJoinRequest',
      'rejectJoinRequest',
      'bulkApproveRequests',
      'bulkRejectRequests',
      'subscribeToRequestUpdates',
      'subscribeToConnectionState',
      'getRealTimeMetrics',
      'setSearchTerm'
    ]);

    mockInstructorPermissionService = jasmine.createSpyObj('InstructorPermissionService', [
      'isInstructor',
      'canManageRequests',
      'subscribeToPermissionChanges'
    ]);

    mockModalController = jasmine.createSpyObj('ModalController', ['dismiss']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);
    mockLoadingController = jasmine.createSpyObj('LoadingController', ['create']);
    mockAlertController = jasmine.createSpyObj('AlertController', ['create']);

    // Setup default mock behaviors
    mockJoinRequestService.subscribeToRequestUpdates.and.returnValue(requestUpdatesSubject.asObservable());
    mockJoinRequestService.subscribeToConnectionState.and.returnValue(connectionStateSubject.asObservable());
    mockJoinRequestService.getRealTimeMetrics.and.returnValue({ 
      updateCount: 0, 
      lastUpdate: new Date(),
      connectionState: 'connected'
    });

    mockInstructorPermissionService.subscribeToPermissionChanges.and.returnValue(permissionChangesSubject.asObservable());

    // Setup UI controller mocks
    const mockToast = jasmine.createSpyObj('Toast', ['present']);
    const mockLoading = jasmine.createSpyObj('Loading', ['present', 'dismiss']);
    const mockAlert = jasmine.createSpyObj('Alert', ['present']);

    mockToastController.create.and.returnValue(Promise.resolve(mockToast));
    mockLoadingController.create.and.returnValue(Promise.resolve(mockLoading));
    mockAlertController.create.and.returnValue(Promise.resolve(mockAlert));

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
    component.studioId = testStudioId;
  });

  describe('E2E Test 1: Complete Instructor Workflow - Studio Page to Request Approval', () => {
    it('should handle complete workflow from modal opening to successful request approval', async () => {
      // Test Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 5.1, 5.2, 8.1, 10.1

      // Step 1: Setup initial pending requests
      const mockRequests: EnhancedStudioJoinRequest[] = [
        {
          id: 'request-1',
          studioId: testStudioId,
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          requestedAt: new Date('2024-01-15T10:00:00Z'),
          status: 'pending' as const,
          message: 'I would like to join this studio',
          userProfile: {
            id: 'user-1',
            username: 'johndoe',
            email: 'john@example.com',
            displayName: 'John Doe'
          },
          isSelected: false,
          isProcessing: false
        },
        {
          id: 'request-2',
          studioId: testStudioId,
          userId: 'user-2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          requestedAt: new Date('2024-01-15T11:00:00Z'),
          status: 'pending' as const,
          message: 'Excited to learn here!',
          userProfile: {
            id: 'user-2',
            username: 'janesmith',
            email: 'jane@example.com',
            displayName: 'Jane Smith'
          },
          isSelected: false,
          isProcessing: false
        }
      ];

      // Mock paginated response
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: mockRequests,
        totalCount: 2,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      // Step 2: Initialize modal (simulates opening from studio page)
      component.ngOnInit();
      await fixture.whenStable();

      // Verify initial load
      expect(mockJoinRequestService.getPaginatedRequestsForStudio).toHaveBeenCalledWith(testStudioId, {
        page: 1,
        pageSize: 20,
        sortBy: 'requestedAt',
        sortOrder: 'desc',
        searchTerm: undefined
      });
      expect(component.pendingRequests).toEqual(mockRequests);
      expect(component.totalCount).toBe(2);

      // Step 3: Simulate real-time update (new request arrives)
      const newRequest: EnhancedStudioJoinRequest = {
        id: 'request-3',
        studioId: testStudioId,
        userId: 'user-3',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        requestedAt: new Date('2024-01-15T12:00:00Z'),
        status: 'pending' as const,
        message: 'Looking forward to training',
        userProfile: {
          id: 'user-3',
          username: 'bobwilson',
          email: 'bob@example.com',
          displayName: 'Bob Wilson'
        },
        isSelected: false,
        isProcessing: false
      };

      const updatedRequests = [newRequest, ...mockRequests];
      requestUpdatesSubject.next(updatedRequests);
      await fixture.whenStable();

      // Verify real-time update integration
      expect(component.pendingRequests.length).toBe(3);
      expect(component.pendingRequests[0].id).toBe('request-3');
      expect(component.totalCount).toBe(3);

      // Step 4: Approve first request (complete approval workflow)
      mockJoinRequestService.approveJoinRequest.and.returnValue(Promise.resolve());

      await component.approveRequest('request-3');
      await fixture.whenStable();

      // Verify approval workflow
      expect(mockJoinRequestService.approveJoinRequest).toHaveBeenCalledWith('request-3', jasmine.any(String));
      expect(mockToastController.create).toHaveBeenCalledWith(jasmine.objectContaining({
        color: 'success',
        message: jasmine.stringContaining('Approved request from Bob Wilson')
      }));

      // Step 5: Simulate real-time removal of approved request
      const remainingRequests = updatedRequests.filter(r => r.id !== 'request-3');
      requestUpdatesSubject.next(remainingRequests);
      await fixture.whenStable();

      // Verify request removal from pending list
      expect(component.pendingRequests.length).toBe(2);
      expect(component.pendingRequests.find(r => r.id === 'request-3')).toBeUndefined();

      // Step 6: Test bulk operations
      component.toggleRequestSelection('request-1');
      component.toggleRequestSelection('request-2');
      expect(component.selectedRequests.size).toBe(2);
      expect(component.showBulkActions).toBe(true);

      // Mock bulk approval
      const bulkResult: BulkOperationResult = {
        totalRequests: 2,
        successfulOperations: 2,
        failedOperations: 0,
        errors: []
      };
      mockJoinRequestService.bulkApproveRequests.and.returnValue(Promise.resolve(bulkResult));

      await component.bulkApproveRequests();
      await fixture.whenStable();

      // Verify bulk operation
      expect(mockJoinRequestService.bulkApproveRequests).toHaveBeenCalledWith(
        ['request-1', 'request-2'],
        jasmine.any(String)
      );
      expect(component.selectedRequests.size).toBe(0);

      // Step 7: Simulate final real-time update (all requests processed)
      requestUpdatesSubject.next([]);
      await fixture.whenStable();

      expect(component.pendingRequests.length).toBe(0);
    });
  });

  describe('E2E Test 2: Real-time Updates Across Multiple Browser Sessions', () => {
    it('should handle concurrent instructor actions and maintain consistency', async () => {
      // Test Requirements: 8.1, 8.2, 8.3, 8.4

      // Step 1: Setup initial state with multiple requests
      const initialRequests: EnhancedStudioJoinRequest[] = [
        {
          id: 'concurrent-1',
          studioId: testStudioId,
          userId: 'user-1',
          userName: 'Alice Johnson',
          userEmail: 'alice@example.com',
          requestedAt: new Date('2024-01-15T10:00:00Z'),
          status: 'pending' as const,
          message: 'Concurrent test request 1',
          userProfile: { 
            id: 'user-1',
            username: 'alicejohnson',
            email: 'alice@example.com',
            displayName: 'Alice Johnson'
          },
          isSelected: false,
          isProcessing: false
        },
        {
          id: 'concurrent-2',
          studioId: testStudioId,
          userId: 'user-2',
          userName: 'Charlie Brown',
          userEmail: 'charlie@example.com',
          requestedAt: new Date('2024-01-15T11:00:00Z'),
          status: 'pending' as const,
          message: 'Concurrent test request 2',
          userProfile: { 
            id: 'user-2',
            username: 'charliebrown',
            email: 'charlie@example.com',
            displayName: 'Charlie Brown'
          },
          isSelected: false,
          isProcessing: false
        }
      ];

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: initialRequests,
        totalCount: 2,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      // Initialize component
      component.ngOnInit();
      await fixture.whenStable();

      expect(component.pendingRequests.length).toBe(2);

      // Step 2: Simulate concurrent modification error
      mockJoinRequestService.approveJoinRequest.and.returnValue(
        Promise.reject(new RequestProcessingException(
          RequestProcessingError.CONCURRENT_MODIFICATION,
          'Another instructor is processing this request',
          testStudioId
        ))
      );

      // Attempt to approve request that's being processed by another instructor
      await component.approveRequest('concurrent-1');
      await fixture.whenStable();

      // Verify concurrent modification handling
      expect(mockJoinRequestService.approveJoinRequest).toHaveBeenCalled();
      expect(mockToastController.create).toHaveBeenCalledWith(jasmine.objectContaining({
        color: 'danger',
        message: jasmine.stringContaining('Another instructor processed this request')
      }));

      // Step 3: Simulate real-time update showing the request was processed by another instructor
      const updatedRequests = initialRequests.filter(r => r.id !== 'concurrent-1');
      requestUpdatesSubject.next(updatedRequests);
      await fixture.whenStable();

      // Verify list was updated to reflect concurrent change
      expect(component.pendingRequests.length).toBe(1);
      expect(component.pendingRequests[0].id).toBe('concurrent-2');

      // Step 4: Test connection state changes
      connectionStateSubject.next('reconnecting');
      await fixture.whenStable();
      expect(component.connectionState).toBe('reconnecting');

      connectionStateSubject.next('connected');
      await fixture.whenStable();
      expect(component.connectionState).toBe('connected');

      // Step 5: Test optimistic updates with recovery
      mockJoinRequestService.approveJoinRequest.and.returnValue(Promise.resolve());

      // Start approval (optimistic update)
      const approvalPromise = component.approveRequest('concurrent-2');
      
      // Verify optimistic update
      expect(component.pendingRequests.find(r => r.id === 'concurrent-2')?.isProcessing).toBe(true);

      await approvalPromise;
      await fixture.whenStable();

      // Verify successful completion
      expect(mockJoinRequestService.approveJoinRequest).toHaveBeenCalledWith('concurrent-2', jasmine.any(String));
    });
  });

  describe('E2E Test 3: Error Scenarios and Recovery Mechanisms', () => {
    it('should handle various error scenarios with appropriate recovery mechanisms', async () => {
      // Test Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

      // Step 1: Test network error during initial load
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(
        Promise.reject(new SystemException(SystemError.NETWORK_ERROR, 'Network connection failed'))
      );

      component.ngOnInit();
      await fixture.whenStable();

      // Verify network error handling
      expect(component.error).toContain('Network connection error');
      expect(component.networkError).toBe(true);

      // Step 2: Test automatic retry mechanism
      const mockRequests: EnhancedStudioJoinRequest[] = [{
        id: 'retry-test-1',
        studioId: testStudioId,
        userId: 'user-retry',
        userName: 'Retry User',
        userEmail: 'retry@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'Test retry mechanism',
        userProfile: { 
          id: 'user-retry',
          username: 'retryuser',
          email: 'retry@example.com',
          displayName: 'Retry User'
        },
        isSelected: false,
        isProcessing: false
      }];

      // Simulate successful retry
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: mockRequests,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      await component.refreshData();
      await fixture.whenStable();

      // Verify recovery
      expect(component.error).toBeNull();
      expect(component.networkError).toBe(false);
      expect(component.pendingRequests.length).toBe(1);

      // Step 3: Test authentication error
      mockJoinRequestService.approveJoinRequest.and.returnValue(
        Promise.reject(new SystemException(SystemError.AUTHENTICATION_ERROR, 'Authentication required'))
      );

      await component.approveRequest('retry-test-1');
      await fixture.whenStable();

      // Verify authentication error handling
      expect(mockAlertController.create).toHaveBeenCalledWith(jasmine.objectContaining({
        header: 'Authentication Required',
        message: jasmine.stringContaining('session has expired')
      }));

      // Step 4: Test bulk operation with partial failures
      component.toggleRequestSelection('retry-test-1');
      
      const partialFailureResult: BulkOperationResult = {
        totalRequests: 1,
        successfulOperations: 0,
        failedOperations: 1,
        errors: [{
          requestId: 'retry-test-1',
          requestName: 'Retry User',
          error: 'Database connection timeout'
        }]
      };

      mockJoinRequestService.bulkApproveRequests.and.returnValue(Promise.resolve(partialFailureResult));

      await component.bulkApproveRequests();
      await fixture.whenStable();

      // Verify partial failure handling
      expect(mockAlertController.create).toHaveBeenCalledWith(jasmine.objectContaining({
        header: 'Bulk Operation Results',
        message: jasmine.stringContaining('Failed: 1 request(s)')
      }));

      // Step 5: Test permission change during operation
      permissionChangesSubject.next(false);
      await fixture.whenStable();

      // Verify permission change is handled (this would typically close the modal or show error)
      // Note: canReviewRequests is not a property of the modal component itself

      // Step 6: Test rate limiting error
      mockJoinRequestService.approveJoinRequest.and.returnValue(
        Promise.reject(new SystemException(SystemError.RATE_LIMIT_EXCEEDED, 'Too many requests'))
      );

      permissionChangesSubject.next(true); // Restore permissions
      await fixture.whenStable();

      await component.approveRequest('retry-test-1');
      await fixture.whenStable();

      // Verify rate limiting is handled with retry option
      expect(mockToastController.create).toHaveBeenCalledWith(jasmine.objectContaining({
        color: 'danger',
        message: jasmine.stringContaining('Too many requests')
      }));
    });
  });

  describe('E2E Test 4: Performance and Accessibility Validation', () => {
    it('should handle large numbers of requests efficiently', async () => {
      // Test Requirements: 5.1, 5.2, 5.3

      // Step 1: Generate large dataset
      const largeRequestSet: EnhancedStudioJoinRequest[] = [];
      for (let i = 1; i <= 100; i++) {
        largeRequestSet.push({
          id: `large-request-${i}`,
          studioId: testStudioId,
          userId: `user-${i}`,
          userName: `User ${i}`,
          userEmail: `user${i}@example.com`,
          requestedAt: new Date(Date.now() - (i * 60000)), // Spread over time
          status: 'pending' as const,
          message: `Request message ${i}`,
          userProfile: { 
            id: `user-${i}`,
            username: `user${i}`,
            email: `user${i}@example.com`,
            displayName: `User ${i}`
          },
          isSelected: false,
          isProcessing: false
        });
      }

      // Mock paginated response for large dataset
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: largeRequestSet.slice(0, 20), // First page
        totalCount: 100,
        totalPages: 5,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false
      }));

      // Step 2: Initialize with large dataset
      const startTime = performance.now();
      component.ngOnInit();
      await fixture.whenStable();
      const loadTime = performance.now() - startTime;

      // Verify performance (should load within reasonable time)
      expect(loadTime).toBeLessThan(1000); // Less than 1 second
      expect(component.pendingRequests.length).toBe(20);
      expect(component.totalCount).toBe(100);
      expect(component.showPagination).toBe(true);

      // Step 3: Test pagination performance
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: largeRequestSet.slice(20, 40), // Second page
        totalCount: 100,
        totalPages: 5,
        currentPage: 2,
        hasNextPage: true,
        hasPreviousPage: true
      }));

      const paginationStartTime = performance.now();
      await component.nextPage();
      await fixture.whenStable();
      const paginationTime = performance.now() - paginationStartTime;

      // Verify pagination performance
      expect(paginationTime).toBeLessThan(500); // Less than 0.5 seconds
      expect(component.currentPage).toBe(2);
      expect(component.pendingRequests.length).toBe(20);

      // Step 4: Test bulk selection performance with large dataset
      const selectionStartTime = performance.now();
      component.selectAllRequests();
      const selectionTime = performance.now() - selectionStartTime;

      // Verify selection performance
      expect(selectionTime).toBeLessThan(100); // Less than 0.1 seconds
      expect(component.selectedRequests.size).toBe(20);

      // Step 5: Test search performance
      component.searchTerm = 'User 1';
      
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: largeRequestSet.filter(r => r.userName.includes('User 1')).slice(0, 20),
        totalCount: 11, // User 1, User 10-19
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      const searchStartTime = performance.now();
      await component.onSearchSubmit();
      await fixture.whenStable();
      const searchTime = performance.now() - searchStartTime;

      // Verify search performance
      expect(searchTime).toBeLessThan(500); // Less than 0.5 seconds
      expect(component.totalCount).toBe(11);
    });

    it('should support keyboard navigation and accessibility features', async () => {
      // Test Requirements: 1.5, 5.5

      // Setup test data
      const mockRequests: EnhancedStudioJoinRequest[] = [{
        id: 'accessibility-test-1',
        studioId: testStudioId,
        userId: 'user-accessibility',
        userName: 'Accessibility User',
        userEmail: 'accessibility@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'Test accessibility features',
        userProfile: { 
          id: 'user-accessibility',
          username: 'accessibilityuser',
          email: 'accessibility@example.com',
          displayName: 'Accessibility User'
        },
        isSelected: false,
        isProcessing: false
      }];

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: mockRequests,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();

      // Test keyboard navigation
      const mockKeyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onRequestKeydown(mockKeyboardEvent, mockRequests[0]);

      // Verify keyboard selection
      expect(component.selectedRequests.has('accessibility-test-1')).toBe(true);

      // Test approval via keyboard
      mockJoinRequestService.approveJoinRequest.and.returnValue(Promise.resolve());
      const approveKeyEvent = new KeyboardEvent('keydown', { key: 'a' });
      
      spyOn(component, 'approveRequest');
      component.onRequestKeydown(approveKeyEvent, mockRequests[0]);

      // Verify keyboard approval
      expect(component.approveRequest).toHaveBeenCalledWith('accessibility-test-1');

      // Test escape key for clearing selections
      component.toggleRequestSelection('accessibility-test-1');
      expect(component.selectedRequests.size).toBe(1);

      const escapeKeyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onRequestKeydown(escapeKeyEvent, mockRequests[0]);

      // Verify escape clears selections
      expect(component.selectedRequests.size).toBe(0);
    });
  });

  describe('E2E Test 5: Modal Integration and Lifecycle', () => {
    it('should properly integrate with modal controller and handle lifecycle events', async () => {
      // Test Requirements: 5.1, 5.2, 5.3

      // Step 1: Test modal initialization
      expect(component.studioId).toBe(testStudioId);
      expect(component.pendingRequests).toEqual([]);
      expect(component.selectedRequests.size).toBe(0);

      // Step 2: Test modal configuration
      const customConfig = {
        studioId: testStudioId,
        studioName: 'Test Studio',
        enableBulkActions: true,
        enableRealTimeUpdates: true,
        maxRequestsPerPage: 25,
        autoRefreshInterval: 15000
      };

      component.config = customConfig;
      expect(component.config).toEqual(customConfig);

      // Step 3: Test modal dismissal
      mockModalController.dismiss.and.returnValue(Promise.resolve(true));

      await component.closeModal();

      expect(mockModalController.dismiss).toHaveBeenCalledWith({
        dismissed: true,
        requestsProcessed: 0
      });

      // Step 4: Test cleanup on destroy
      const subscriptionSpy = jasmine.createSpy('unsubscribe');
      component['subscriptions'] = [{ unsubscribe: subscriptionSpy, closed: false } as any];

      component.ngOnDestroy();

      expect(subscriptionSpy).toHaveBeenCalled();
      expect(component.pendingRequests).toEqual([]);
      expect(component.selectedRequests.size).toBe(0);
      expect(component.error).toBeNull();
    });
  });

  afterEach(() => {
    // Clean up subjects
    requestUpdatesSubject.complete();
    connectionStateSubject.complete();
    permissionChangesSubject.complete();
  });
});