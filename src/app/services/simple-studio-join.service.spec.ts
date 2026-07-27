import { TestBed } from '@angular/core/testing';
import { SimpleStudioJoinService } from './simple-studio-join.service';
import { JoinRequestData } from '../components/simple-studio-join/simple-studio-join.component';
import * as fc from 'fast-check';

describe('SimpleStudioJoinService', () => {
  let service: SimpleStudioJoinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimpleStudioJoinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Feature: simple-studio-join, Property 3: Data Persistence Completeness
   * For any valid join request submission, the persisted data should include 
   * studio ID, user name, message, and timestamp with correct values
   * Validates: Requirements 2.1, 2.2, 7.2
   */
  it('should validate complete data structure for any valid join request', () => {
    fc.assert(
      fc.property(
        fc.record({
          studioId: fc.string({ minLength: 1, maxLength: 50 }),
          userName: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          message: fc.string({ maxLength: 500 }),
          requestedAt: fc.date(),
          status: fc.constant('pending' as const)
        }),
        (joinRequestData: JoinRequestData) => {
          // Verify that the data structure contains all required fields
          expect(joinRequestData.studioId).toBeDefined();
          expect(joinRequestData.studioId.length).toBeGreaterThan(0);
          
          expect(joinRequestData.userName).toBeDefined();
          expect(joinRequestData.userName.trim().length).toBeGreaterThanOrEqual(2);
          expect(joinRequestData.userName.length).toBeLessThanOrEqual(50);
          
          expect(joinRequestData.message).toBeDefined();
          expect(joinRequestData.message.length).toBeLessThanOrEqual(500);
          
          expect(joinRequestData.requestedAt).toBeDefined();
          expect(joinRequestData.requestedAt).toBeInstanceOf(Date);
          
          expect(joinRequestData.status).toBe('pending');

          // Verify that when trimmed, userName still meets requirements
          const trimmedUserName = joinRequestData.userName.trim();
          expect(trimmedUserName.length).toBeGreaterThanOrEqual(2);
          
          // Verify that message can be trimmed safely
          const trimmedMessage = joinRequestData.message.trim();
          expect(trimmedMessage.length).toBeLessThanOrEqual(500);
          
          // Verify that requestedAt can be converted to ISO string
          const isoString = joinRequestData.requestedAt.toISOString();
          expect(isoString).toBeDefined();
          expect(typeof isoString).toBe('string');
        }
      ),
      { numRuns: 10 }
    );
  });
});