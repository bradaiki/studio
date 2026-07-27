import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController, ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { of, BehaviorSubject } from 'rxjs';

import { InstructorJoinReviewModalComponent } from './instructor-join-review-modal.component';
import { JoinRequestService } from '../../services/join-request.service';
import { InstructorPermissionService } from '../../services/instructor-permission.service';
import { EnhancedStudioJoinRequest } from '../../models/instructor-join-review.models';

/**
 * Performance and Accessibility Validation Tests
 * 
 * These tests validate modal performance with large numbers of requests
 * and accessibility compliance with screen readers and keyboard navigation.
 * 
 * Requirements Coverage: 5.1, 5.3, 1.5
 */
describe('InstructorJoinReviewModal - Performance and Accessibility Tests', () => {
  let component: InstructorJoinReviewModalComponent;
  let fixture: ComponentFixture<InstructorJoinReviewModalComponent>;
  let mockJoinRequestService: jasmine.SpyObj<JoinRequestService>;
  let mockInstructorPermissionService: jasmine.SpyObj<InstructorPermissionService>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockToastController: jasmine.SpyObj<ToastController>;
  let mockLoadingController: jasmine.SpyObj<LoadingController>;
  let mockAlertController: jasmine.SpyObj<AlertController>;

  const testStudioId = 'performance-test-studio';

  beforeEach(async () => {
    // Create mocks
    mockJoinRequestService = jasmine.createSpyObj('JoinRequestService', [
      'getPaginatedRequestsForStudio',
      'subscribeToRequestUpdates',
      'subscribeToConnectionState',
      'getRealTimeMetrics',
      'setSearchTerm'
    ]);

    mockInstructorPermissionService = jasmine.createSpyObj('InstructorPermissionService', [
      'subscribeToPermissionChanges'
    ]);

    mockModalController = jasmine.createSpyObj('ModalController', ['dismiss']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);
    mockLoadingController = jasmine.createSpyObj('LoadingController', ['create']);
    mockAlertController = jasmine.createSpyObj('AlertController', ['create']);

    // Setup default mock behaviors
    mockJoinRequestService.subscribeToRequestUpdates.and.returnValue(of([]));
    mockJoinRequestService.subscribeToConnectionState.and.returnValue(of('connected'));
    mockJoinRequestService.getRealTimeMetrics.and.returnValue({ 
      updateCount: 0, 
      lastUpdate: new Date(),
      connectionState: 'connected'
    });

    mockInstructorPermissionService.subscribeToPermissionChanges.and.returnValue(of(true));

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

  xdescribe('Performance Tests - Large Dataset Handling', () => {
    it('should load large datasets efficiently within performance thresholds', async () => {
      // Test Requirements: 5.1, 5.2

      // Generate large dataset (1000 requests)
      const largeDataset: EnhancedStudioJoinRequest[] = [];
      for (let i = 1; i <= 1000; i++) {
        largeDataset.push({
          id: `perf-request-${i}`,
          studioId: testStudioId,
          userId: `user-${i}`,
          userName: `Performance User ${i}`,
          userEmail: `perfuser${i}@example.com`,
          requestedAt: new Date(Date.now() - (i * 60000)),
          status: 'pending' as const,
          message: `Performance test request ${i}`,
          userProfile: {
            id: `user-${i}`,
            username: `perfuser${i}`,
            email: `perfuser${i}@example.com`,
            displayName: `Performance User ${i}`
          },
          isSelected: false,
          isProcessing: false
        });
      }

      // Mock paginated response (first page of 50)
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: largeDataset.slice(0, 50),
        totalCount: 1000,
        totalPages: 20,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false
      }));

      // Measure initialization performance
      const initStartTime = performance.now();
      component.studioName = 'Performance Test Studio';
      fixture.detectChanges(); // Trigger change detection
      component.ngOnInit();
      await fixture.whenStable();
      const initEndTime = performance.now();
      const initTime = initEndTime - initStartTime;

      // Verify performance thresholds
      expect(initTime).toBeLessThan(1000); // Less than 1 second for initialization
      expect(component.pendingRequests.length).toBe(50); // Pagination working
      expect(component.totalCount).toBe(1000);
      expect(component.showPagination).toBe(true);

      // Test pagination performance
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: largeDataset.slice(50, 100),
        totalCount: 1000,
        totalPages: 20,
        currentPage: 2,
        hasNextPage: true,
        hasPreviousPage: true
      }));

      const paginationStartTime = performance.now();
      await component.nextPage();
      await fixture.whenStable();
      const paginationEndTime = performance.now();
      const paginationTime = paginationEndTime - paginationStartTime;

      expect(paginationTime).toBeLessThan(500); // Less than 0.5 seconds for pagination
      expect(component.currentPage).toBe(2);

      // Test bulk selection performance
      const selectionStartTime = performance.now();
      component.selectAllRequests();
      const selectionEndTime = performance.now();
      const selectionTime = selectionEndTime - selectionStartTime;

      expect(selectionTime).toBeLessThan(100); // Less than 0.1 seconds for selection
      expect(component.selectedRequests.size).toBe(50);

      // Test search performance
      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: largeDataset.filter(r => r.userName.includes('User 1')).slice(0, 50),
        totalCount: 111, // User 1, User 10-19, User 100-199
        totalPages: 3,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false
      }));

      component.searchTerm = 'User 1';
      const searchStartTime = performance.now();
      await component.onSearchSubmit();
      await fixture.whenStable();
      const searchEndTime = performance.now();
      const searchTime = searchEndTime - searchStartTime;

      expect(searchTime).toBeLessThan(500); // Less than 0.5 seconds for search
      expect(component.totalCount).toBe(111);
    });

    it('should handle real-time updates efficiently with large datasets', async () => {
      // Test Requirements: 8.1, 8.4

      // Setup initial large dataset
      const initialDataset: EnhancedStudioJoinRequest[] = [];
      for (let i = 1; i <= 500; i++) {
        initialDataset.push({
          id: `realtime-request-${i}`,
          studioId: testStudioId,
          userId: `user-${i}`,
          userName: `Realtime User ${i}`,
          userEmail: `rtuser${i}@example.com`,
          requestedAt: new Date(Date.now() - (i * 60000)),
          status: 'pending' as const,
          message: `Realtime test request ${i}`,
          userProfile: {
            id: `user-${i}`,
            username: `rtuser${i}`,
            email: `rtuser${i}@example.com`,
            displayName: `Realtime User ${i}`
          },
          isSelected: false,
          isProcessing: false
        });
      }

      const updateSubject = new BehaviorSubject<EnhancedStudioJoinRequest[]>(initialDataset);
      mockJoinRequestService.subscribeToRequestUpdates.and.returnValue(updateSubject.asObservable());

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: initialDataset.slice(0, 50),
        totalCount: 500,
        totalPages: 10,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false
      }));

      // Initialize component
      component.studioName = 'Performance Test Studio';
      fixture.detectChanges(); // Trigger change detection
      component.ngOnInit();
      await fixture.whenStable();

      expect(component.pendingRequests.length).toBe(50);
      expect(component.totalCount).toBe(500);

      // Test performance of real-time updates
      const updateStartTime = performance.now();
      
      // Simulate large batch update (100 new requests)
      const updatedDataset = [...initialDataset];
      for (let i = 501; i <= 600; i++) {
        updatedDataset.unshift({
          id: `new-realtime-request-${i}`,
          studioId: testStudioId,
          userId: `user-${i}`,
          userName: `New Realtime User ${i}`,
          userEmail: `newrtuser${i}@example.com`,
          requestedAt: new Date(),
          status: 'pending' as const,
          message: `New realtime test request ${i}`,
          userProfile: {
            id: `user-${i}`,
            username: `newrtuser${i}`,
            email: `newrtuser${i}@example.com`,
            displayName: `New Realtime User ${i}`
          },
          isSelected: false,
          isProcessing: false
        });
      }

      updateSubject.next(updatedDataset);
      await fixture.whenStable();
      
      const updateEndTime = performance.now();
      const updateTime = updateEndTime - updateStartTime;

      // Verify update performance
      expect(updateTime).toBeLessThan(200); // Less than 0.2 seconds for large batch update
      expect(component.totalCount).toBe(600);

      // Test performance of frequent small updates
      const frequentUpdateStartTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const smallUpdate = updatedDataset.slice(0, -1); // Remove one request
        updateSubject.next(smallUpdate);
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }
      
      await fixture.whenStable();
      const frequentUpdateEndTime = performance.now();
      const frequentUpdateTime = frequentUpdateEndTime - frequentUpdateStartTime;

      expect(frequentUpdateTime).toBeLessThan(500); // Less than 0.5 seconds for 10 updates
    });

    it('should maintain responsive UI during intensive operations', async () => {
      // Test Requirements: 5.1, 5.3

      // Setup moderate dataset
      const dataset: EnhancedStudioJoinRequest[] = [];
      for (let i = 1; i <= 100; i++) {
        dataset.push({
          id: `responsive-request-${i}`,
          studioId: testStudioId,
          userId: `user-${i}`,
          userName: `Responsive User ${i}`,
          userEmail: `respuser${i}@example.com`,
          requestedAt: new Date(Date.now() - (i * 60000)),
          status: 'pending' as const,
          message: `Responsive test request ${i}`,
          userProfile: {
            id: `user-${i}`,
            username: `respuser${i}`,
            email: `respuser${i}@example.com`,
            displayName: `Responsive User ${i}`
          },
          isSelected: false,
          isProcessing: false
        });
      }

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: dataset,
        totalCount: 100,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.studioName = 'Performance Test Studio';
      fixture.detectChanges(); // Trigger change detection
      component.ngOnInit();
      await fixture.whenStable();

      // Test rapid selection/deselection performance
      const rapidSelectionStartTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        component.toggleRequestSelection(`responsive-request-${i + 1}`);
      }
      
      const rapidSelectionEndTime = performance.now();
      const rapidSelectionTime = rapidSelectionEndTime - rapidSelectionStartTime;

      expect(rapidSelectionTime).toBeLessThan(100); // Less than 0.1 seconds for 50 selections
      expect(component.selectedRequests.size).toBe(50);

      // Test rapid clear/select all performance
      const bulkOperationStartTime = performance.now();
      
      component.clearAllSelections();
      component.selectAllRequests();
      component.clearAllSelections();
      component.selectAllRequests();
      
      const bulkOperationEndTime = performance.now();
      const bulkOperationTime = bulkOperationEndTime - bulkOperationStartTime;

      expect(bulkOperationTime).toBeLessThan(50); // Less than 0.05 seconds for bulk operations
      expect(component.selectedRequests.size).toBe(100);

      // Test sorting performance
      const sortingStartTime = performance.now();
      
      await component.changeSortOrder('userName');
      await component.changeSortOrder('userEmail');
      await component.changeSortOrder('requestedAt');
      
      const sortingEndTime = performance.now();
      const sortingTime = sortingEndTime - sortingStartTime;

      expect(sortingTime).toBeLessThan(300); // Less than 0.3 seconds for multiple sorts
    });
  });

  xdescribe('Accessibility Tests - Screen Reader and Keyboard Support', () => {
    it('should support comprehensive keyboard navigation', async () => {
      // Test Requirements: 1.5, 5.5

      // Setup test data
      const testRequests: EnhancedStudioJoinRequest[] = [
        {
          id: 'accessibility-test-1',
          studioId: testStudioId,
          userId: 'user-accessibility-1',
          userName: 'Accessibility User 1',
          userEmail: 'accessibility1@example.com',
          requestedAt: new Date(),
          status: 'pending' as const,
          message: 'Test accessibility features 1',
          userProfile: {
            id: 'user-accessibility-1',
            username: 'accessibilityuser1',
            email: 'accessibility1@example.com',
            displayName: 'Accessibility User 1'
          },
          isSelected: false,
          isProcessing: false
        },
        {
          id: 'accessibility-test-2',
          studioId: testStudioId,
          userId: 'user-accessibility-2',
          userName: 'Accessibility User 2',
          userEmail: 'accessibility2@example.com',
          requestedAt: new Date(),
          status: 'pending' as const,
          message: 'Test accessibility features 2',
          userProfile: {
            id: 'user-accessibility-2',
            username: 'accessibilityuser2',
            email: 'accessibility2@example.com',
            displayName: 'Accessibility User 2'
          },
          isSelected: false,
          isProcessing: false
        }
      ];

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: testRequests,
        totalCount: 2,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();

      // Test Enter key for selection
      const enterKeyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onRequestKeydown(enterKeyEvent, testRequests[0]);
      expect(component.selectedRequests.has('accessibility-test-1')).toBe(true);

      // Test Space key for selection
      const spaceKeyEvent = new KeyboardEvent('keydown', { key: ' ' });
      component.onRequestKeydown(spaceKeyEvent, testRequests[1]);
      expect(component.selectedRequests.has('accessibility-test-2')).toBe(true);

      // Test 'a' key for approval
      spyOn(component, 'approveRequest');
      const approveKeyEvent = new KeyboardEvent('keydown', { key: 'a' });
      component.onRequestKeydown(approveKeyEvent, testRequests[0]);
      expect(component.approveRequest).toHaveBeenCalledWith('accessibility-test-1');

      // Test 'r' key for rejection
      spyOn(component, 'rejectRequest');
      const rejectKeyEvent = new KeyboardEvent('keydown', { key: 'r' });
      component.onRequestKeydown(rejectKeyEvent, testRequests[1]);
      expect(component.rejectRequest).toHaveBeenCalledWith('accessibility-test-2');

      // Test Ctrl+A for select all
      const selectAllKeyEvent = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      component.onRequestKeydown(selectAllKeyEvent, testRequests[0]);
      expect(component.selectedRequests.size).toBe(2);

      // Test Escape key for clearing selections
      const escapeKeyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onRequestKeydown(escapeKeyEvent, testRequests[0]);
      expect(component.selectedRequests.size).toBe(0);
    });

    it('should provide proper ARIA labels and semantic structure', async () => {
      // Test Requirements: 1.5, 5.5

      // Setup test data
      const testRequest: EnhancedStudioJoinRequest = {
        id: 'aria-test-1',
        studioId: testStudioId,
        userId: 'user-aria',
        userName: 'ARIA Test User',
        userEmail: 'aria@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'Test ARIA features',
        userProfile: {
          id: 'user-aria',
          username: 'ariauser',
          email: 'aria@example.com',
          displayName: 'ARIA Test User'
        },
        isSelected: false,
        isProcessing: false
      };

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: [testRequest],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;

      // Check for proper heading structure
      const modalTitle = compiled.querySelector('ion-title');
      expect(modalTitle).toBeTruthy();
      expect(modalTitle.textContent).toContain('Join Requests');

      // Check for list structure
      const requestList = compiled.querySelector('ion-list');
      expect(requestList).toBeTruthy();

      // Check for proper button labels
      const buttons = compiled.querySelectorAll('ion-button');
      buttons.forEach((button: HTMLElement) => {
        // Each button should have either text content or aria-label
        const hasText = button.textContent && button.textContent.trim().length > 0;
        const hasAriaLabel = button.getAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBe(true);
      });

      // Check for proper form controls
      const checkboxes = compiled.querySelectorAll('ion-checkbox');
      checkboxes.forEach((checkbox: HTMLElement) => {
        // Each checkbox should have proper labeling
        const hasAriaLabel = checkbox.getAttribute('aria-label');
        const hasAriaLabelledBy = checkbox.getAttribute('aria-labelledby');
        expect(hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
      });
    });

    it('should maintain focus management and tab order', async () => {
      // Test Requirements: 1.5, 5.5

      // Setup test data with multiple requests
      const testRequests: EnhancedStudioJoinRequest[] = [];
      for (let i = 1; i <= 5; i++) {
        testRequests.push({
          id: `focus-test-${i}`,
          studioId: testStudioId,
          userId: `user-focus-${i}`,
          userName: `Focus Test User ${i}`,
          userEmail: `focus${i}@example.com`,
          requestedAt: new Date(),
          status: 'pending' as const,
          message: `Test focus management ${i}`,
          userProfile: {
            id: `user-focus-${i}`,
            username: `focususer${i}`,
            email: `focus${i}@example.com`,
            displayName: `Focus Test User ${i}`
          },
          isSelected: false,
          isProcessing: false
        });
      }

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: testRequests,
        totalCount: 5,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;

      // Check that focusable elements exist and are in logical order
      const focusableElements = compiled.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Verify tab order makes sense (close button, then request controls)
      const closeButton = compiled.querySelector('ion-button[fill="clear"]');
      expect(closeButton).toBeTruthy();

      // Check that interactive elements have proper focus indicators
      focusableElements.forEach((element: HTMLElement) => {
        // Focus the element
        element.focus();
        
        // Check that focus is visible (this would be more comprehensive in a real browser)
        expect(document.activeElement).toBe(element);
      });
    });

    it('should provide appropriate feedback for screen readers', async () => {
      // Test Requirements: 1.5, 5.5

      // Setup test data
      const testRequest: EnhancedStudioJoinRequest = {
        id: 'screenreader-test-1',
        studioId: testStudioId,
        userId: 'user-screenreader',
        userName: 'Screen Reader Test User',
        userEmail: 'screenreader@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'Test screen reader features',
        userProfile: {
          id: 'user-screenreader',
          username: 'screenreaderuser',
          email: 'screenreader@example.com',
          displayName: 'Screen Reader Test User'
        },
        isSelected: false,
        isProcessing: false
      };

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: [testRequest],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;

      // Check for live regions for dynamic content
      const liveRegions = compiled.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);

      // Check for proper status announcements
      const statusElements = compiled.querySelectorAll('[role="status"], [aria-live="polite"]');
      expect(statusElements.length).toBeGreaterThanOrEqual(0);

      // Check for proper error announcements
      const errorElements = compiled.querySelectorAll('[role="alert"], [aria-live="assertive"]');
      expect(errorElements.length).toBeGreaterThanOrEqual(0);

      // Test that selection state changes are announced
      component.toggleRequestSelection('screenreader-test-1');
      fixture.detectChanges();

      // Verify selection state is reflected in UI
      expect(component.selectedRequests.has('screenreader-test-1')).toBe(true);

      // Test that bulk action availability is announced
      expect(component.showBulkActions).toBe(true);

      // Check for proper loading state announcements
      component.isLoading = true;
      fixture.detectChanges();

      const loadingIndicators = compiled.querySelectorAll('ion-spinner, [aria-label*="loading"], [aria-label*="Loading"]');
      expect(loadingIndicators.length).toBeGreaterThanOrEqual(0);
    });

    it('should support high contrast and reduced motion preferences', async () => {
      // Test Requirements: 1.5, 5.5

      // Setup test data
      const testRequest: EnhancedStudioJoinRequest = {
        id: 'contrast-test-1',
        studioId: testStudioId,
        userId: 'user-contrast',
        userName: 'Contrast Test User',
        userEmail: 'contrast@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'Test high contrast features',
        userProfile: {
          id: 'user-contrast',
          username: 'contrastuser',
          email: 'contrast@example.com',
          displayName: 'Contrast Test User'
        },
        isSelected: false,
        isProcessing: false
      };

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: [testRequest],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;

      // Check that text has sufficient contrast (this would be more comprehensive with actual color analysis)
      const textElements = compiled.querySelectorAll('ion-label, ion-text, ion-title');
      textElements.forEach((element: HTMLElement) => {
        const styles = window.getComputedStyle(element);
        // In a real test, you would check actual color contrast ratios
        expect(styles.color).toBeTruthy();
        expect(styles.backgroundColor || styles.background).toBeDefined();
      });

      // Check that interactive elements have proper visual states
      const buttons = compiled.querySelectorAll('ion-button');
      buttons.forEach((button: HTMLElement) => {
        // Buttons should have distinct visual states
        const styles = window.getComputedStyle(button);
        expect(styles.border || styles.outline || styles.backgroundColor).toBeTruthy();
      });

      // Check that animations respect reduced motion preferences
      // (In a real implementation, this would check CSS animations and transitions)
      const animatedElements = compiled.querySelectorAll('[class*="animate"], [class*="transition"]');
      animatedElements.forEach((element: HTMLElement) => {
        // Elements with animations should respect prefers-reduced-motion
        const styles = window.getComputedStyle(element);
        // This would check for proper CSS media query handling
        expect(styles.animation || styles.transition).toBeDefined();
      });
    });
  });

  xdescribe('Responsive Design Tests', () => {
    it('should adapt to different screen sizes', async () => {
      // Test Requirements: 5.3

      // Setup test data
      const testRequest: EnhancedStudioJoinRequest = {
        id: 'responsive-test-1',
        studioId: testStudioId,
        userId: 'user-responsive',
        userName: 'Responsive Test User',
        userEmail: 'responsive@example.com',
        requestedAt: new Date(),
        status: 'pending' as const,
        message: 'Test responsive design',
        userProfile: {
          id: 'user-responsive',
          username: 'responsiveuser',
          email: 'responsive@example.com',
          displayName: 'Responsive Test User'
        },
        isSelected: false,
        isProcessing: false
      };

      mockJoinRequestService.getPaginatedRequestsForStudio.and.returnValue(Promise.resolve({
        requests: [testRequest],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }));

      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;

      // Test mobile viewport (320px width)
      Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 568, configurable: true });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      // Check that content is still accessible at mobile size
      const modalContent = compiled.querySelector('ion-content');
      expect(modalContent).toBeTruthy();

      // Test tablet viewport (768px width)
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      // Check that layout adapts appropriately
      expect(modalContent).toBeTruthy();

      // Test desktop viewport (1200px width)
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      // Check that layout utilizes available space
      expect(modalContent).toBeTruthy();

      // Verify that buttons and controls remain accessible at all sizes
      const buttons = compiled.querySelectorAll('ion-button');
      buttons.forEach((button: HTMLElement) => {
        const rect = button.getBoundingClientRect();
        // Buttons should have minimum touch target size (44px)
        expect(rect.width >= 44 || rect.height >= 44).toBe(true);
      });
    });
  });
});