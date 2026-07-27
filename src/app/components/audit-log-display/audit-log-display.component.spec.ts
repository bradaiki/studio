import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogDisplayComponent } from './audit-log-display.component';
import { RequestAuditService } from '../../services/request-audit.service';
import { RequestAuditEntry } from '../../models/instructor-join-review.models';

// Mock RequestAuditService
const mockAuditService = {
  getAuditTrailForRequest: jasmine.createSpy('getAuditTrailForRequest').and.returnValue(Promise.resolve([])),
  getAuditTrailForStudio: jasmine.createSpy('getAuditTrailForStudio').and.returnValue(Promise.resolve([]))
};

describe('AuditLogDisplayComponent', () => {
  let component: AuditLogDisplayComponent;
  let fixture: ComponentFixture<AuditLogDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogDisplayComponent],
      providers: [
        { provide: RequestAuditService, useValue: mockAuditService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load audit entries for specific request', async () => {
    const mockEntries: RequestAuditEntry[] = [
      {
        id: 'audit-1',
        requestId: 'req-1',
        action: 'approved',
        performedBy: 'instructor-1',
        performedByName: 'Instructor One',
        performedAt: new Date(),
        previousStatus: 'pending',
        newStatus: 'approved'
      }
    ];

    mockAuditService.getAuditTrailForRequest.and.returnValue(Promise.resolve(mockEntries));
    
    component.requestId = 'req-1';
    await component.loadAuditEntries();

    expect(component.auditEntries).toEqual(mockEntries);
    expect(component.showRequestColumn).toBe(false);
    expect(mockAuditService.getAuditTrailForRequest).toHaveBeenCalledWith('req-1');
  });

  it('should load audit entries for studio', async () => {
    const mockEntries: RequestAuditEntry[] = [
      {
        id: 'audit-1',
        requestId: 'req-1',
        action: 'approved',
        performedBy: 'instructor-1',
        performedByName: 'Instructor One',
        performedAt: new Date(),
        previousStatus: 'pending',
        newStatus: 'approved'
      }
    ];

    mockAuditService.getAuditTrailForStudio.and.returnValue(Promise.resolve(mockEntries));
    
    component.studioId = 'studio-1';
    await component.loadAuditEntries();

    expect(component.auditEntries).toEqual(mockEntries);
    expect(component.showRequestColumn).toBe(true);
    expect(mockAuditService.getAuditTrailForStudio).toHaveBeenCalledWith('studio-1');
  });

  it('should handle error when neither requestId nor studioId provided', async () => {
    await component.loadAuditEntries();
    
    expect(component.error).toBe('Either requestId or studioId must be provided');
  });

  it('should get correct action display text', () => {
    expect(component.getActionDisplayText('created')).toBe('Request Created');
    expect(component.getActionDisplayText('approved')).toBe('Request Approved');
    expect(component.getActionDisplayText('rejected')).toBe('Request Rejected');
    expect(component.getActionDisplayText('cancelled')).toBe('Request Cancelled');
  });

  it('should get correct action icons', () => {
    expect(component.getActionIcon('created')).toBe('add-circle');
    expect(component.getActionIcon('approved')).toBe('checkmark-circle');
    expect(component.getActionIcon('rejected')).toBe('close-circle');
    expect(component.getActionIcon('cancelled')).toBe('ban');
  });

  it('should get correct action colors', () => {
    expect(component.getActionColor('created')).toBe('primary');
    expect(component.getActionColor('approved')).toBe('success');
    expect(component.getActionColor('rejected')).toBe('danger');
    expect(component.getActionColor('cancelled')).toBe('warning');
  });

  it('should format status transition text correctly', () => {
    const entry: RequestAuditEntry = {
      id: 'audit-1',
      requestId: 'req-1',
      action: 'approved',
      performedBy: 'instructor-1',
      performedByName: 'Instructor One',
      performedAt: new Date(),
      previousStatus: 'pending',
      newStatus: 'approved'
    };

    expect(component.getStatusTransitionText(entry)).toBe('pending → approved');
  });

  it('should detect when entry has details', () => {
    const entryWithDetails: RequestAuditEntry = {
      id: 'audit-1',
      requestId: 'req-1',
      action: 'rejected',
      performedBy: 'instructor-1',
      performedByName: 'Instructor One',
      performedAt: new Date(),
      details: 'Not qualified'
    };

    const entryWithoutDetails: RequestAuditEntry = {
      id: 'audit-2',
      requestId: 'req-2',
      action: 'approved',
      performedBy: 'instructor-1',
      performedByName: 'Instructor One',
      performedAt: new Date()
    };

    expect(component.hasDetails(entryWithDetails)).toBe(true);
    expect(component.hasDetails(entryWithoutDetails)).toBe(false);
  });

  it('should track entries by ID', () => {
    const entry: RequestAuditEntry = {
      id: 'audit-1',
      requestId: 'req-1',
      action: 'approved',
      performedBy: 'instructor-1',
      performedByName: 'Instructor One',
      performedAt: new Date()
    };

    expect(component.trackByEntryId(0, entry)).toBe('audit-1');
  });
});