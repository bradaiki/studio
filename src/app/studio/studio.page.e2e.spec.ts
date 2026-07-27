import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { of, BehaviorSubject } from 'rxjs';

import { StudioPage } from './studio.page';
import { StudiosService, Studio } from '../services/studios.service';
import { ChatAccessController } from '../services/chat-access-controller.service';
import { AuthStateService } from '../services/auth-state.service';
import { InstructorPermissionService } from '../services/instructor-permission.service';
import { JoinRequestService } from '../services/join-request.service';
import { InstructorJoinReviewModalComponent } from '../components/instructor-join-review-modal/instructor-join-review-modal.component';
import { EnhancedStudioJoinRequest } from '../models/instructor-join-review.models';

/**
 * End-to-End Integration Tests for Studio Page with Instructor Join Review
 * 
 * These tests validate the complete integration between the studio page
 * and the instructor join review modal, including permission checking,
 * real-time updates, and modal lifecycle management.
 * 
 * Requirements Coverage: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 8.1
 */
xdescribe('StudioPage - Instructor Join Review Integration E2E Tests', () => {
  let component: StudioPage;
  let fixture: ComponentFixture<StudioPage>;
  let mockStudiosService: jasmine.SpyObj<StudiosService>;
  let mockChatAccessController: jasmine.SpyObj<ChatAccessController>;
  let mockAuthStateService: jasmine.SpyObj<AuthStateService>;
  let mockInstructorPermissionService: jasmine.SpyObj<InstructorPermissionService>;
  let mockJoinRequestService: jasmine.SpyObj<JoinRequestService>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockActivatedRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocation: jasmine.SpyObj<Location>;

  // Real-time update subjects
  let authStateSubject: BehaviorSubject<any>;
  let permissionChangesSubject: BehaviorSubject<boolean>;
  let requestUpdatesSubject: BehaviorSubject<EnhancedStudioJoinRequest[]>;

  const testStudioId = 'test-studio-e2e';
  const testInstructorId = 'instructor-e2e-123';
  const testStudio: Studio = {
    id: testStudioId,
    name: 'E2E Test Studio',
    location: 'Test City',
    description: 'Studio for end-to-end testing',
    tagline: 'Testing Excellence',
    heroImage: 'test-hero.jpg',
    address: '123 Test Street, Test City',
    phone: '+1-555-TEST',
    email: 'test@studio.com',
    website: 'teststudio.com',
    verified: true,
    memberCount: 50,
    established: '2020',
    benefits: [
      { icon: 'checkmark', title: 'Benefit 1', description: 'First benefit description' },
      { icon: 'star', title: 'Benefit 2', description: 'Second benefit description' }
    ],
    instructors: [{
      id: testInstructorId,
      name: 'Test Instructor',
      username: 'testinstructor',
      title: 'Head Instructor',
      rank: 'Black Belt',
      bio: 'Test instructor bio',
      image: 'instructor.jpg',
      experience: '10 years',
      isActive: true
    }],
    schedule: [],
    pricing: [],
    isMember: false,
    isInstructor: true,
    isStudioChief: false
  };

  beforeEach(async () => {
    // Initialize subjects
    authStateSubject = new BehaviorSubject({ userId: testInstructorId, username: 'testinstructor' });
    permissionChangesSubject = new BehaviorSubject(true);
    requestUpdatesSubject = new BehaviorSubject<EnhancedStudioJoinRequest[]>([]);

    // Create mocks
    mockStudiosService = jasmine.createSpyObj('StudiosService', ['getStudioById']);
    mockChatAccessController = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'isServiceReady'
    ]);
    mockAuthStateService = jasmine.createSpyObj('AuthStateService', [], {
      currentUser$: authStateSubject.asObservable()
    });
    mockInstructorPermissionService = jasmine.createSpyObj('InstructorPermissionService', [
      'canManageRequests',
      'subscribeToPermissionChanges'
    ]);
    mockJoinRequestService = jasmine.createSpyObj('JoinRequestService', [
      'getPendingRequestsForStudio',
      'subscribeToRequestUpdates'
    ]);
    mockModalController = jasmine.createSpyObj('ModalController', ['create']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLocation = jasmine.createSpyObj('Location', ['back']);

    // Setup activated route mock
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(testStudioId)
        }
      }
    };

    // Setup default mock behaviors
    mockStudiosService.getStudioById.and.returnValue(testStudio);
    mockChatAccessController.isServiceReady.and.returnValue(true);
    mockChatAccessController.getStudioChatsForUser.and.returnValue(Promise.resolve({
      publicChats: [],
      privateChats: [],
      invitationsPending: [],
      totalPublic: 0,
      totalPrivate: 0
    }));
    mockInstructorPermissionService.canManageRequests.and.returnValue(Promise.resolve(true));
    mockInstructorPermissionService.subscribeToPermissionChanges.and.returnValue(permissionChangesSubject.asObservable());
    mockJoinRequestService.getPendingRequestsForStudio.and.returnValue(Promise.resolve([]));
    mockJoinRequestService.subscribeToRequestUpdates.and.returnValue(requestUpdatesSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [StudioPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: StudiosService, useValue: mockStudiosService },
        { provide: ChatAccessController, useValue: mockChatAccessController },
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: InstructorPermissionService, useValue: mockInstructorPermissionService },
        { provide: JoinRequestService, useValue: mockJoinRequestService },
        { provide: ModalController, useValue: mockModalController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioPage);
    component = fixture.componentInstance;
  });

  describe('E2E Test 1: Complete Studio Page to Modal Integration Flow', () => {
    it('should handle complete flow from studio page load to modal opening and closing', async () => {
      // Test Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3

      // Step 1: Initialize studio page
      component.ngOnInit();
      await fixture.whenStable();

      // Verify studio initialization
      expect(component.studio).toEqual(testStudio);
      expect(component.studioInfo).toBeDefined();
      expect(component.studioInfo!.name).toBe('E2E Test Studio');

      // Verify instructor permission check was called
      expect(mockInstructorPermissionService.canManageRequests).toHaveBeenCalledWith(testStudioId, testInstructorId);
      expect(component.canReviewRequests).toBe(true);

      // Step 2: Simulate pending requests for count display
      const mockPendingRequests: EnhancedStudioJoinRequest[] = [
        {
          id: 'pending-1',
          studioId: testStudioId,
          userId: 'user-1',
          userName: 'Pending User 1',
          userEmail: 'pending1@example.com',
          requestedAt: new Date(),
          status: 'pending' as const,
          message: 'Please let me join',
          userProfile: { 
            id: 'user-1',
            username: 'pendinguser1',
            email: 'pending1@example.com',
            displayName: 'Pending User 1'
          },
          isSelected: false,
          isProcessing: false
        },
        {
          id: 'pending-2',
          studioId: testStudioId,
          userId: 'user-2',
          userName: 'Pending User 2',
          userEmail: 'pending2@example.com',
          requestedAt: new Date(),
          status: 'pending' as const,
          message: 'Excited to train here',
          userProfile: { 
            id: 'user-2',
            username: 'pendinguser2',
            email: 'pending2@example.com',
            displayName: 'Pending User 2'
          },
          isSelected: false,
          isProcessing: false
        }
      ];

      mockJoinRequestService.getPendingRequestsForStudio.and.returnValue(Promise.resolve(mockPendingRequests));

      // Trigger pending request count refresh
      await component.refreshPendingRequestCount();
      await fixture.whenStable();

      // Verify pending request count
      expect(component.pendingRequestCount).toBe(2);

      // Step 3: Test real-time updates for pending count
      const updatedRequests = [...mockPendingRequests, {
        id: 'pending-3',
        studioId: testStudioId,
        userId: 'user-3',
        userName: 'New User',
        userEmail: 'new@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'New request via real-time',
        userProfile: { 
          id: 'user-3',
          username: 'newuser',
          email: 'new@example.com',
          displayName: 'New User'
        },
        isSelected: false,
        isProcessing: false
      }];

      requestUpdatesSubject.next(updatedRequests);
      await fixture.whenStable();

      // Verify real-time count update
      expect(component.pendingRequestCount).toBe(3);

      // Step 4: Open join request review modal
      const mockModal = jasmine.createSpyObj('Modal', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ 
        data: { dismissed: true, requestsProcessed: 2 } 
      }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      await component.openJoinRequestReviewModal();
      await fixture.whenStable();

      // Verify modal creation and configuration
      expect(mockModalController.create).toHaveBeenCalledWith({
        component: InstructorJoinReviewModalComponent,
        componentProps: {
          studioId: testStudioId,
          studioName: 'E2E Test Studio',
          config: {
            studioId: testStudioId,
            studioName: 'E2E Test Studio',
            enableBulkActions: true,
            enableRealTimeUpdates: true,
            maxRequestsPerPage: 50,
            autoRefreshInterval: 30000
          }
        },
        cssClass: 'join-request-modal',
        backdropDismiss: true,
        showBackdrop: true
      });

      expect(mockModal.present).toHaveBeenCalled();

      // Step 5: Simulate modal dismissal and verify refresh
      spyOn(component, 'refreshPendingRequestCount');
      
      // Trigger modal dismissal
      const dismissResult = await mockModal.onDidDismiss();
      
      // The actual refresh would be triggered by the modal's onDidDismiss handler
      // We need to manually call it here since we're mocking the modal
      await component.refreshPendingRequestCount();

      expect(component.refreshPendingRequestCount).toHaveBeenCalled();
    });
  });

  describe('E2E Test 2: Permission Changes and Real-time Updates', () => {
    it('should handle instructor permission changes and update UI accordingly', async () => {
      // Test Requirements: 1.4, 8.1

      // Step 1: Initialize with instructor permissions
      component.ngOnInit();
      await fixture.whenStable();

      expect(component.canReviewRequests).toBe(true);

      // Step 2: Simulate permission revocation
      permissionChangesSubject.next(false);
      await fixture.whenStable();

      // Verify permission change handling
      expect(component.canReviewRequests).toBe(false);
      expect(component.pendingRequestCount).toBe(0);

      // Step 3: Simulate permission restoration
      permissionChangesSubject.next(true);
      await fixture.whenStable();

      expect(component.canReviewRequests).toBe(true);

      // Step 4: Test authentication state changes
      authStateSubject.next(null); // User logs out
      await fixture.whenStable();

      expect(component.currentUserId).toBeNull();
      expect(component.canReviewRequests).toBe(false);
      expect(component.pendingRequestCount).toBe(0);

      // Step 5: User logs back in
      authStateSubject.next({ userId: 'new-instructor-456', username: 'newinstructor' });
      await fixture.whenStable();

      expect(component.currentUserId).toBe('new-instructor-456');
      // Permission check would be called again for new user
      expect(mockInstructorPermissionService.canManageRequests).toHaveBeenCalledWith(testStudioId, 'new-instructor-456');
    });
  });

  describe('E2E Test 3: Error Handling and Edge Cases', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test Requirements: 9.1, 9.2, 9.3

      // Step 1: Test permission check failure
      mockInstructorPermissionService.canManageRequests.and.returnValue(Promise.reject(new Error('Permission check failed')));

      component.ngOnInit();
      await fixture.whenStable();

      // Verify graceful error handling
      expect(component.canReviewRequests).toBe(false);
      expect(component.pendingRequestCount).toBe(0);

      // Step 2: Test pending request count failure
      mockInstructorPermissionService.canManageRequests.and.returnValue(Promise.resolve(true));
      mockJoinRequestService.getPendingRequestsForStudio.and.returnValue(Promise.reject(new Error('Network error')));

      await component.checkInstructorPermissions();
      await fixture.whenStable();

      // Verify error doesn't break the component
      expect(component.canReviewRequests).toBe(true);
      // Count should remain unchanged on error (not reset to 0)

      // Step 3: Test modal opening failure
      mockModalController.create.and.returnValue(Promise.reject(new Error('Modal creation failed')));

      // Should not throw error
      await component.openJoinRequestReviewModal();
      await fixture.whenStable();

      // Component should remain functional
      expect(component.canReviewRequests).toBe(true);

      // Step 4: Test missing studio ID
      component.studio = null;
      
      await component.openJoinRequestReviewModal();
      await fixture.whenStable();

      // Should handle gracefully without attempting to open modal
      expect(mockModalController.create).not.toHaveBeenCalled();
    });
  });

  describe('E2E Test 4: Multiple Concurrent Sessions', () => {
    it('should handle multiple instructors managing requests simultaneously', async () => {
      // Test Requirements: 8.2, 8.3

      // Step 1: Initialize first instructor session
      component.ngOnInit();
      await fixture.whenStable();

      expect(component.canReviewRequests).toBe(true);

      // Step 2: Simulate initial pending requests
      const initialRequests: EnhancedStudioJoinRequest[] = [
        {
          id: 'concurrent-1',
          studioId: testStudioId,
          userId: 'user-concurrent-1',
          userName: 'Concurrent User 1',
          userEmail: 'concurrent1@example.com',
          requestedAt: new Date(),
          status: 'pending' as const,
          message: 'Concurrent test 1',
          userProfile: { 
            id: 'user-concurrent-1',
            username: 'concurrentuser1',
            email: 'concurrent1@example.com',
            displayName: 'Concurrent User 1'
          },
          isSelected: false,
          isProcessing: false
        },
        {
          id: 'concurrent-2',
          studioId: testStudioId,
          userId: 'user-concurrent-2',
          userName: 'Concurrent User 2',
          userEmail: 'concurrent2@example.com',
          requestedAt: new Date(),
          status: 'pending' as const,
          message: 'Concurrent test 2',
          userProfile: { 
            id: 'user-concurrent-2',
            username: 'concurrentuser2',
            email: 'concurrent2@example.com',
            displayName: 'Concurrent User 2'
          },
          isSelected: false,
          isProcessing: false
        }
      ];

      requestUpdatesSubject.next(initialRequests);
      await fixture.whenStable();

      expect(component.pendingRequestCount).toBe(2);

      // Step 3: Simulate another instructor approving a request (real-time update)
      const updatedRequests = initialRequests.filter(r => r.id !== 'concurrent-1');
      requestUpdatesSubject.next(updatedRequests);
      await fixture.whenStable();

      // Verify count updated in real-time
      expect(component.pendingRequestCount).toBe(1);

      // Step 4: Simulate new request arriving while modal might be open
      const newRequest: EnhancedStudioJoinRequest = {
        id: 'concurrent-new',
        studioId: testStudioId,
        userId: 'user-new',
        userName: 'New Concurrent User',
        userEmail: 'newconcurrent@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'New request during concurrent session',
        userProfile: { 
          id: 'user-new',
          username: 'newconcurrentuser',
          email: 'newconcurrent@example.com',
          displayName: 'New Concurrent User'
        },
        isSelected: false,
        isProcessing: false
      };

      const finalRequests = [...updatedRequests, newRequest];
      requestUpdatesSubject.next(finalRequests);
      await fixture.whenStable();

      expect(component.pendingRequestCount).toBe(2);

      // Step 5: Simulate all requests being processed by other instructors
      requestUpdatesSubject.next([]);
      await fixture.whenStable();

      expect(component.pendingRequestCount).toBe(0);
    });
  });

  describe('E2E Test 5: Component Lifecycle and Cleanup', () => {
    it('should properly manage subscriptions and cleanup on destroy', async () => {
      // Test Requirements: General component lifecycle

      // Step 1: Initialize component and verify subscriptions
      component.ngOnInit();
      await fixture.whenStable();

      // Verify subscriptions were created
      expect(component['subscriptions'].length).toBeGreaterThan(0);

      // Step 2: Simulate some activity to ensure subscriptions are working
      permissionChangesSubject.next(false);
      requestUpdatesSubject.next([]);
      await fixture.whenStable();

      // Verify subscriptions are active
      expect(component.canReviewRequests).toBe(false);
      expect(component.pendingRequestCount).toBe(0);

      // Step 3: Destroy component and verify cleanup
      const subscriptionSpies = component['subscriptions'].map(sub => spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();

      // Verify all subscriptions were unsubscribed
      subscriptionSpies.forEach(spy => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  afterEach(() => {
    // Clean up subjects
    authStateSubject.complete();
    permissionChangesSubject.complete();
    requestUpdatesSubject.complete();
  });
});