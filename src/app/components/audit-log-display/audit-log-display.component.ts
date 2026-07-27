import { Component, Input, OnInit } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { RequestAuditEntry } from '../../models/instructor-join-review.models';
import { RequestAuditService } from '../../services/request-audit.service';

/**
 * Component for displaying audit log entries for join requests
 * Provides administrators with visibility into all request actions
 * Requirements: 10.4
 */
@Component({
  selector: 'app-audit-log-display',
  templateUrl: './audit-log-display.component.html',
  styleUrls: ['./audit-log-display.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class AuditLogDisplayComponent implements OnInit {
  @Input() requestId?: string;
  @Input() studioId?: string;
  @Input() showRequestColumn: boolean = false;

  auditEntries: RequestAuditEntry[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private auditService: RequestAuditService) {}

  async ngOnInit() {
    await this.loadAuditEntries();
  }

  /**
   * Load audit entries based on input parameters
   */
  async loadAuditEntries(): Promise<void> {
    if (!this.requestId && !this.studioId) {
      this.error = 'Either requestId or studioId must be provided';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      if (this.requestId) {
        // Load audit trail for specific request
        this.auditEntries = await this.auditService.getAuditTrailForRequest(
          this.requestId,
        );
        this.showRequestColumn = false; // Single request, no need for request column
      } else if (this.studioId) {
        // Load audit trail for entire studio
        this.auditEntries = await this.auditService.getAuditTrailForStudio(
          this.studioId,
        );
        this.showRequestColumn = true; // Multiple requests, show request column
      }
    } catch (error) {
      console.error('Error loading audit entries:', error);
      this.error = 'Failed to load audit trail. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Refresh the audit log display
   */
  async refresh(): Promise<void> {
    await this.loadAuditEntries();
  }

  /**
   * Get display-friendly action text
   */
  getActionDisplayText(action: string): string {
    switch (action) {
      case 'created':
        return 'Request Created';
      case 'approved':
        return 'Request Approved';
      case 'rejected':
        return 'Request Rejected';
      case 'cancelled':
        return 'Request Cancelled';
      default:
        return action;
    }
  }

  /**
   * Get action-specific icon
   */
  getActionIcon(action: string): string {
    switch (action) {
      case 'created':
        return 'add-circle';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'information-circle';
    }
  }

  /**
   * Get action-specific color
   */
  getActionColor(action: string): string {
    switch (action) {
      case 'created':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  /**
   * Get status transition display text
   */
  getStatusTransitionText(entry: RequestAuditEntry): string {
    if (entry.previousStatus && entry.newStatus) {
      return `${entry.previousStatus} → ${entry.newStatus}`;
    } else if (entry.newStatus) {
      return `→ ${entry.newStatus}`;
    }
    return '';
  }

  /**
   * Check if entry has additional details
   */
  hasDetails(entry: RequestAuditEntry): boolean {
    return !!(entry.details && entry.details.trim().length > 0);
  }

  /**
   * Truncate long details for display
   */
  truncateDetails(details: string, maxLength: number = 100): string {
    if (details.length <= maxLength) {
      return details;
    }
    return details.substring(0, maxLength) + '...';
  }

  /**
   * TrackBy function for audit entries list
   */
  trackByEntryId(index: number, entry: RequestAuditEntry): string {
    return entry.id;
  }
}
