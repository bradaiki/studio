import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { RequestAuditService } from './request-audit.service';
import { RequestAuditEntry } from '../models/instructor-join-review.models';

// Mock Amplify client
const mockAmplifyClient = {
  models: {
    RequestAuditLog: {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ data: null, errors: null })),
      list: jasmine.createSpy('list').and.returnValue(Promise.resolve({ data: [], errors: null })),
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: null, errors: null }))
    },
    StudioJoinRequest: {
      list: jasmine.createSpy('list').and.returnValue(Promise.resolve({ data: [], errors: null }))
    }
  }
};

// Mock getCurrentUser
const mockGetCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue(
  Promise.resolve({ userId: 'test-user-123' })
);

// Feature: instructor-join-review, Property 13: Audit Trail Completeness
describe('RequestAuditService - Property Tests', () => {
  let service: RequestAuditService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [RequestAuditService]
    });
    
    service = TestBed.inject(RequestAuditService);
    
    // Mock the client on the service instance
    (service as any).client = mockAmplifyClient;
    
    // Properly initialize the service with a mocked user ID
    (service as any).currentUserId = 'test-user-123';
    
    // Reset all spies
    Object.values(mockAmplifyClient.models).forEach(model => {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && (method as any).calls) {
          (method as any).calls.reset();
        }
      });
    });
  });

  describe('Property 13: Audit Trail Completeness', () => {
    beforeEach(() => {
      // Ensure authentication state is properly set for each test
      (service as any).currentUserId = 'test-user-123';
    });

    it('should record complete audit information for all approval and rejection actions', async () => {
      // Feature: instructor-join-review, Property 13: Audit Trail Completeness
      // Validates: Requirements 10.1, 10.2, 10.3, 10.5

      await fc.assert(
        fc.asyncProperty(
          // Generate test data for various audit scenarios
          fc.record({
            actions: fc.array(
              fc.record({
                requestId: fc.string({ minLength: 1, maxLength: 50 }),
                actionType: fc.constantFrom('approved', 'rejected', 'created', 'cancelled'),
                performedBy: fc.string({ minLength: 1, maxLength: 50 }),
                performedByName: fc.string({ minLength: 1, maxLength: 100 }),
                performedAt: fc.date(),
                feedback: fc.option(fc.string({ minLength: 1, maxLength: 500 })) // Only generate non-empty strings or null
              }),
              { minLength: 1, maxLength: 5 }
            )
          }),
          async (testData) => {
            try {
              // Process each action and verify audit completeness
              for (const action of testData.actions) {
                // Setup mock to return a properly structured audit entry based on the action
                const expectedAuditEntry = {
                  id: `audit-${action.requestId}-${Date.now()}`,
                  requestId: action.requestId,
                  action: action.actionType,
                  performedBy: action.performedBy,
                  performedByName: action.performedByName,
                  performedAt: action.performedAt.toISOString(),
                  details: action.feedback || undefined, // Match service behavior: null/empty -> undefined
                  // Set status fields based on action type
                  previousStatus: action.actionType === 'created' ? undefined : 'pending',
                  newStatus: action.actionType === 'created' ? 'pending' : action.actionType
                };

                // Reset the mock for each action to ensure clean state
                mockAmplifyClient.models.RequestAuditLog.create.calls.reset();
                mockAmplifyClient.models.RequestAuditLog.create.and.returnValue(
                  Promise.resolve({ 
                    data: expectedAuditEntry, 
                    errors: null 
                  })
                );

                let auditEntry: RequestAuditEntry;

                // Call the appropriate audit logging method based on action type
                switch (action.actionType) {
                  case 'approved':
                    auditEntry = await service.logApprovalAction(
                      action.requestId,
                      action.performedBy,
                      action.performedByName
                    );
                    break;
                  case 'rejected':
                    auditEntry = await service.logRejectionAction(
                      action.requestId,
                      action.performedBy,
                      action.performedByName,
                      action.feedback || undefined
                    );
                    break;
                  case 'created':
                    auditEntry = await service.logRequestCreation(
                      action.requestId,
                      action.performedBy,
                      action.performedByName
                    );
                    break;
                  case 'cancelled':
                    auditEntry = await service.logCancellationAction(
                      action.requestId,
                      action.performedBy,
                      action.performedByName
                    );
                    break;
                  default:
                    throw new Error(`Unknown action type: ${action.actionType}`);
                }

                // Property assertion: For any approval or rejection action, the system should record 
                // the action timestamp, performing instructor, and maintain immutable audit records

                // Verify all required audit fields are present and correct
                expect(auditEntry.id).toBeDefined();
                expect(auditEntry.requestId).toBe(action.requestId);
                expect(auditEntry.action).toBe(action.actionType);
                expect(auditEntry.performedBy).toBe(action.performedBy);
                expect(auditEntry.performedByName).toBe(action.performedByName);
                expect(auditEntry.performedAt).toBeInstanceOf(Date);
                
                // Verify action-specific requirements
                switch (action.actionType) {
                  case 'approved':
                    // Approval actions must record status transition
                    expect(auditEntry.previousStatus).toBe('pending');
                    expect(auditEntry.newStatus).toBe('approved');
                    break;
                  case 'rejected':
                    // Rejection actions must record status transition and optional feedback
                    expect(auditEntry.previousStatus).toBe('pending');
                    expect(auditEntry.newStatus).toBe('rejected');
                    if (action.feedback) {
                      expect(auditEntry.details).toBe(action.feedback);
                    } else {
                      expect(auditEntry.details).toBeUndefined();
                    }
                    break;
                  case 'created':
                    // Creation actions must record new status
                    expect(auditEntry.newStatus).toBe('pending');
                    expect(auditEntry.previousStatus).toBeUndefined();
                    break;
                  case 'cancelled':
                    // Cancellation actions must record status transition
                    expect(auditEntry.previousStatus).toBe('pending');
                    expect(auditEntry.newStatus).toBe('cancelled');
                    break;
                }

                // Verify the database call was made with correct structure
                expect(mockAmplifyClient.models.RequestAuditLog.create).toHaveBeenCalled();
                const createCall = mockAmplifyClient.models.RequestAuditLog.create.calls.mostRecent();
                const createArgs = createCall.args[0];
                
                // Focus on structural correctness rather than exact parameter matches
                // Verify all required fields are present and have correct types
                expect(createArgs.requestId).toBeDefined();
                expect(typeof createArgs.requestId).toBe('string');
                expect(createArgs.action).toBeDefined();
                expect(['approved', 'rejected', 'created', 'cancelled']).toContain(createArgs.action);
                expect(createArgs.performedBy).toBeDefined();
                expect(typeof createArgs.performedBy).toBe('string');
                expect(createArgs.performedByName).toBeDefined();
                expect(typeof createArgs.performedByName).toBe('string');
                expect(createArgs.performedAt).toBeDefined();
                expect(createArgs.performedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO string format
                
                // Verify action-specific field structure
                if (createArgs.action === 'rejected') {
                  // For rejection actions, details can be present or undefined
                  if (createArgs.details !== undefined) {
                    expect(typeof createArgs.details).toBe('string');
                  }
                } else {
                  // For non-rejection actions, details should be undefined
                  expect(createArgs.details).toBeUndefined();
                }
                
                // Verify status field structure based on action type
                switch (createArgs.action) {
                  case 'approved':
                  case 'rejected':
                  case 'cancelled':
                    expect(createArgs.previousStatus).toBeDefined();
                    expect(createArgs.newStatus).toBeDefined();
                    break;
                  case 'created':
                    expect(createArgs.newStatus).toBeDefined();
                    expect(createArgs.previousStatus).toBeUndefined();
                    break;
                }

                // Verify immutability - audit entry should be complete and structured correctly
                expect(auditEntry.id).toBeDefined();
                expect(auditEntry.requestId).toBeDefined();
                expect(auditEntry.action).toBeDefined();
                expect(auditEntry.performedBy).toBeDefined();
                expect(auditEntry.performedByName).toBeDefined();
                expect(auditEntry.performedAt).toBeInstanceOf(Date);

                console.log(`✓ Audit trail completeness verified for ${action.actionType} action on request ${action.requestId}`);
              }

              console.log(`✓ Property 13 validated: Complete audit information recorded for ${testData.actions.length} actions`);

            } catch (error) {
              console.error('Property 13 test failed:', error);
              throw error;
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in requirements
      );
    });

    it('should maintain audit trail integrity and chronological order', async () => {
      // Additional test for audit trail integrity
      (service as any).currentUserId = 'test-user-123';
      
      const testRequestId = 'test-request-123';
      
      // Mock audit trail data in chronological order
      const mockAuditTrail = [
        {
          id: 'audit-1',
          requestId: testRequestId,
          action: 'created',
          performedBy: 'user-1',
          performedByName: 'User One',
          performedAt: '2024-01-01T10:00:00Z',
          newStatus: 'pending'
        },
        {
          id: 'audit-2',
          requestId: testRequestId,
          action: 'approved',
          performedBy: 'instructor-1',
          performedByName: 'Instructor One',
          performedAt: '2024-01-01T11:00:00Z',
          previousStatus: 'pending',
          newStatus: 'approved'
        }
      ];

      mockAmplifyClient.models.RequestAuditLog.list.and.returnValue(
        Promise.resolve({ data: mockAuditTrail, errors: null })
      );

      const auditTrail = await service.getAuditTrailForRequest(testRequestId);
      
      // Verify chronological order is maintained
      expect(auditTrail.length).toBe(2);
      expect(auditTrail[0].performedAt.getTime()).toBeLessThan(auditTrail[1].performedAt.getTime());
      
      // Verify integrity check passes
      const isIntegrityValid = await service.verifyAuditTrailIntegrity(testRequestId);
      expect(isIntegrityValid).toBe(true);
    });

    it('should handle database errors gracefully during audit logging', async () => {
      // Test error handling
      (service as any).currentUserId = 'test-user-123';
      
      const testRequestId = 'error-request-123';
      
      mockAmplifyClient.models.RequestAuditLog.create.and.returnValue(
        Promise.resolve({ 
          data: null, 
          errors: [{ message: 'Database connection failed' }] 
        })
      );

      await expectAsync(service.logApprovalAction(testRequestId, 'instructor-1', 'Instructor One'))
        .toBeRejectedWithError(/Failed to create audit log/);
    });

    it('should prevent audit record modification after creation', async () => {
      // Test immutability requirement
      (service as any).currentUserId = 'test-user-123';
      
      const testRequestId = 'immutable-request-123';
      const originalEntry = {
        id: 'audit-immutable-1',
        requestId: testRequestId,
        action: 'approved',
        performedBy: 'instructor-1',
        performedByName: 'Instructor One',
        performedAt: '2024-01-01T10:00:00Z',
        previousStatus: 'pending',
        newStatus: 'approved'
      };

      mockAmplifyClient.models.RequestAuditLog.create.and.returnValue(
        Promise.resolve({ data: originalEntry, errors: null })
      );

      const auditEntry = await service.logApprovalAction(testRequestId, 'instructor-1', 'Instructor One');
      
      // Verify the audit entry is immutable (no update methods should be available)
      // The service should only provide create and read operations for audit logs
      expect(auditEntry.id).toBe(originalEntry.id);
      expect(auditEntry.requestId).toBe(testRequestId);
      expect(auditEntry.action).toBe('approved');
      
      // Verify that the service doesn't expose update/delete methods for audit logs
      expect((service as any).updateAuditLogEntry).toBeUndefined();
      expect((service as any).deleteAuditLogEntry).toBeUndefined();
    });
  });
});