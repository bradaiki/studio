import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSpinner,
  IonText,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  ToastController,
  LoadingController,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  close,
  checkmark,
  closeCircle,
  refresh,
  person,
  time,
  mail,
  checkboxOutline,
  checkbox,
  alertCircle, informationCircle } from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { JoinRequestService } from '../../services/join-request.service';
import { InstructorPermissionService } from '../../services/instructor-permission.service';
import { 
  EnhancedStudioJoinRequest,
  BulkOperationResult,
  JoinRequestModalConfig,
  RequestProcessingException,
  SystemException,
  InstructorPermissionException,
  RequestProcessingError,
  SystemError,
  InstructorPermissionError
} from '../../models/instructor-join-review.models';

@Component({
  selector: 'app-instructor-join-review-modal',
  templateUrl: './instructor-join-review-modal.component.html',
  styleUrls: ['./instructor-join-review-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSpinner,
    IonText,
    IonBadge,
    IonRefresher,
    IonRefresherContent
  ]
})
export class InstructorJoinReviewModalComponent implements OnInit, OnDestroy {
  @Input() studioId!: string;
  @Input() studioName?: string;
  @Input() config?: JoinRequestModalConfig;

  // Component state
  pendingRequests: EnhancedStudioJoinRequest[] = [];
  selectedRequests = new Set<string>();
  isLoading = false;
  error: string | null = null;
  loadingProgress = 0;
  
  // Pagination state
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPreviousPage = false;
  
  // Search and filtering state
  searchTerm = '';
  sortBy: 'requestedAt' | 'userName' | 'userEmail' = 'requestedAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  isSearching = false;
  
  // Bulk operations state
  isBulkProcessing = false;
  bulkOperationProgress = 0;
  
  // Error handling and recovery state
  lastError: Error | null = null;
  retryCount = 0;
  maxRetries = 3;
  isRetrying = false;
  networkError = false;
  authenticationError = false;
  
  // Real-time updates
  private subscriptions: Subscription[] = [];
  private currentUserId: string | null = null;
  connectionState: string = 'disconnected';
  realTimeMetrics: any = null;

  constructor(
    private joinRequestService: JoinRequestService,
    private instructorPermissionService: InstructorPermissionService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private alertController: AlertController
  ) {
    addIcons({refresh,close,alertCircle,informationCircle,checkmark,closeCircle,person,time,mail,checkboxOutline,checkbox});
  }

  ngOnInit() {
    console.log('InstructorJoinReviewModalComponent initializing for studio:', this.studioId);
    
    if (!this.studioId) {
      console.error('No studioId provided to InstructorJoinReviewModalComponent');
      this.error = 'Studio ID is required';
      return;
    }

    // Set default config if not provided
    if (!this.config) {
      this.config = {
        studioId: this.studioId,
        studioName: this.studioName || 'Studio',
        enableBulkActions: true,
        enableRealTimeUpdates: true,
        maxRequestsPerPage: 50,
        autoRefreshInterval: 30000
      };
    }

    this.initializeModal();
  }

  ngOnDestroy() {
    console.log('InstructorJoinReviewModalComponent destroying');
    
    // Clean up all subscriptions
    this.subscriptions.forEach(subscription => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions = [];
    
    // Clear state
    this.pendingRequests = [];
    this.selectedRequests.clear();
    this.error = null;
  }

  /**
   * Initialize the modal by loading pending requests and setting up subscriptions
   */
  private async initializeModal(): Promise<void> {
    try {
      // Load initial data
      await this.loadPendingRequests();
      
      // Set up real-time updates if enabled
      if (this.config?.enableRealTimeUpdates) {
        this.setupRealTimeUpdates();
      }
      
    } catch (error) {
      console.error('Error initializing modal:', error);
      this.handleError(error, 'Failed to initialize modal');
    }
  }

  /**
   * Load pending join requests for the studio with pagination
   */
  async loadPendingRequests(resetPagination: boolean = false): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.networkError = false;
    this.authenticationError = false;
    this.loadingProgress = 0;

    try {
      console.log('Loading pending requests for studio:', this.studioId);
      
      // Reset pagination if requested
      if (resetPagination) {
        this.currentPage = 1;
      }
      
      // Simulate loading progress for better UX
      this.updateLoadingProgress(20);
      
      // Use automatic retry for loading requests
      await this.autoRetryOperation(async () => {
        this.updateLoadingProgress(50);
        
        const result = await this.joinRequestService.getPaginatedRequestsForStudio(this.studioId, {
          page: this.currentPage,
          pageSize: this.pageSize,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
          searchTerm: this.searchTerm || undefined
        });
        
        this.updateLoadingProgress(80);
        
        // Update pagination state
        this.pendingRequests = result.requests;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.hasNextPage = result.hasNextPage;
        this.hasPreviousPage = result.hasPreviousPage;
        
        this.updateLoadingProgress(100);
        
        console.log(`Loaded ${this.pendingRequests.length} of ${this.totalCount} requests (page ${this.currentPage}/${this.totalPages})`);
        
        // Clear any selected requests that are no longer on current page
        this.clearInvalidSelections();
      }, this.maxRetries);
      
      // Reset retry count on successful load
      this.retryCount = 0;
      this.lastError = null;
      
      // Show success feedback
      if (this.pendingRequests.length > 0) {
        const message = this.searchTerm 
          ? `Found ${this.totalCount} request${this.totalCount === 1 ? '' : 's'} matching "${this.searchTerm}"`
          : `Loaded ${this.totalCount} pending request${this.totalCount === 1 ? '' : 's'}`;
        await this.showSuccessToast(message);
      }
      
    } catch (error) {
      console.error('Error loading pending requests:', error);
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      await this.handleLoadError(error);
    } finally {
      this.isLoading = false;
      this.loadingProgress = 0;
    }
  }

  /**
   * Update loading progress with visual feedback
   */
  private updateLoadingProgress(progress: number): void {
    this.loadingProgress = Math.min(100, Math.max(0, progress));
  }

  /**
   * Set up real-time updates subscription
   */
  private setupRealTimeUpdates(): void {
    if (!this.config?.enableRealTimeUpdates) {
      return;
    }

    try {
      // Subscribe to optimized real-time updates
      const subscription = this.joinRequestService
        .subscribeToRequestUpdates(this.studioId)
        .subscribe({
          next: (requests) => {
            console.log('Received optimized real-time update:', requests.length, 'requests');
            
            // Update requests with pagination awareness
            if (this.currentPage === 1 || requests.length <= this.pageSize) {
              // If we're on first page or total requests fit in one page, update directly
              this.pendingRequests = requests.slice(0, this.pageSize);
              this.totalCount = requests.length;
              this.totalPages = Math.ceil(requests.length / this.pageSize);
              this.hasNextPage = this.totalPages > this.currentPage;
              this.hasPreviousPage = this.currentPage > 1;
            } else {
              // For other pages, we need to refresh to maintain pagination consistency
              this.loadPendingRequests();
            }
            
            // Clear any selected requests that are no longer present
            this.clearInvalidSelections();
          },
          error: (error) => {
            console.error('Error in optimized real-time updates:', error);
            // Don't show error toast for real-time update failures
            // Just log the error and continue with cached data
          }
        });

      this.subscriptions.push(subscription);

      // Subscribe to connection state changes
      const connectionSubscription = this.joinRequestService
        .subscribeToConnectionState(this.studioId)
        .subscribe({
          next: (state) => {
            this.connectionState = state;
            console.log('Connection state changed:', state);
          },
          error: (error) => {
            console.error('Error in connection state subscription:', error);
          }
        });

      this.subscriptions.push(connectionSubscription);

      // Periodically update performance metrics for debugging
      const metricsInterval = setInterval(() => {
        this.realTimeMetrics = this.joinRequestService.getRealTimeMetrics(this.studioId);
      }, 10000); // Every 10 seconds

      // Store interval for cleanup
      this.subscriptions.push({
        unsubscribe: () => clearInterval(metricsInterval)
      } as any);

    } catch (error) {
      console.error('Error setting up optimized real-time updates:', error);
    }
  }

  /**
   * Handle pull-to-refresh
   */
  async onRefresh(event: any): Promise<void> {
    try {
      await this.loadPendingRequests(true); // Reset pagination on refresh
    } finally {
      event.target.complete();
    }
  }

  /**
   * Handle search input changes with debouncing
   */
  onSearchChange(event: any): void {
    const searchTerm = event.target.value || '';
    this.searchTerm = searchTerm;
    this.isSearching = true;
    
    // Use the service's debounced search
    this.joinRequestService.setSearchTerm(this.studioId, searchTerm, 300);
  }

  /**
   * Handle search submission (Enter key or search button)
   */
  async onSearchSubmit(): Promise<void> {
    this.isSearching = true;
    try {
      await this.loadPendingRequests(true); // Reset to first page when searching
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Clear search and reload
   */
  async clearSearch(): Promise<void> {
    this.searchTerm = '';
    this.joinRequestService.setSearchTerm(this.studioId, '', 0); // Immediate clear
    await this.loadPendingRequests(true);
  }

  /**
   * Change sort order
   */
  async changeSortOrder(sortBy: 'requestedAt' | 'userName' | 'userEmail'): Promise<void> {
    if (this.sortBy === sortBy) {
      // Toggle sort order if same field
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Change field and default to desc
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    
    await this.loadPendingRequests(true); // Reset to first page when sorting changes
  }

  /**
   * Go to next page
   */
  async nextPage(): Promise<void> {
    if (this.hasNextPage && !this.isLoading) {
      this.currentPage++;
      await this.loadPendingRequests();
    }
  }

  /**
   * Go to previous page
   */
  async previousPage(): Promise<void> {
    if (this.hasPreviousPage && !this.isLoading) {
      this.currentPage--;
      await this.loadPendingRequests();
    }
  }

  /**
   * Go to specific page
   */
  async goToPage(page: number): Promise<void> {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage && !this.isLoading) {
      this.currentPage = page;
      await this.loadPendingRequests();
    }
  }

  /**
   * Change page size
   */
  async changePageSize(newPageSize: number): Promise<void> {
    if (newPageSize !== this.pageSize && !this.isLoading) {
      this.pageSize = newPageSize;
      this.currentPage = 1; // Reset to first page
      await this.loadPendingRequests();
    }
  }

  /**
   * Toggle selection of a request
   */
  toggleRequestSelection(requestId: string): void {
    if (this.selectedRequests.has(requestId)) {
      this.selectedRequests.delete(requestId);
    } else {
      this.selectedRequests.add(requestId);
    }
    
    // Update the request's selection state for UI binding
    const request = this.pendingRequests.find(req => req.id === requestId);
    if (request) {
      request.isSelected = this.selectedRequests.has(requestId);
    }
  }

  /**
   * Select all requests
   */
  selectAllRequests(): void {
    this.pendingRequests.forEach(request => {
      this.selectedRequests.add(request.id);
      request.isSelected = true;
    });
  }

  /**
   * Clear all selections
   */
  clearAllSelections(): void {
    this.selectedRequests.clear();
    this.pendingRequests.forEach(request => {
      request.isSelected = false;
    });
  }

  /**
   * Approve a single request
   */
  async approveRequest(requestId: string): Promise<void> {
    await this.processRequest(requestId, 'approve');
  }

  /**
   * Reject a single request
   */
  async rejectRequest(requestId: string): Promise<void> {
    await this.processRequest(requestId, 'reject');
  }

  /**
   * Process a single request (approve or reject) with optimistic updates
   */
  private async processRequest(requestId: string, action: 'approve' | 'reject'): Promise<void> {
    const request = this.pendingRequests.find(req => req.id === requestId);
    if (!request) {
      await this.showErrorToast('Request not found');
      return;
    }

    // Set processing state for optimistic UI update
    request.isProcessing = true;

    const loading = await this.loadingController.create({
      message: `${action === 'approve' ? 'Approving' : 'Rejecting'} request...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Use automatic retry with concurrent modification handling
      await this.autoRetryOperation(async () => {
        if (action === 'approve') {
          await this.joinRequestService.approveJoinRequest(requestId, this.currentUserId || 'unknown');
        } else {
          // For rejection, we could show a prompt for feedback, but for now just reject
          await this.joinRequestService.rejectJoinRequest(requestId, this.currentUserId || 'unknown');
        }
      }, 3); // Allow more retries for concurrent modifications

      const userName = request.userProfile?.displayName || request.userName || 'Unknown User';
      const actionPastTense = action === 'approve' ? 'Approved' : 'Rejected';
      await this.showSuccessToast(`${actionPastTense} request from ${userName}`);

      // Optimistic update: Remove from local list immediately
      // Real-time updates will handle the authoritative state, but this provides immediate feedback
      this.removePendingRequest(requestId);

    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      
      // Handle concurrent modification specifically
      if (error instanceof RequestProcessingException && 
          error.errorCode === RequestProcessingError.CONCURRENT_MODIFICATION) {
        
        // Refresh the list to get current state after concurrent modification
        await this.loadPendingRequests();
        await this.showErrorToast('Another instructor processed this request. The list has been refreshed.');
        
      } else {
        await this.handleRequestProcessingError(error, action, request);
      }
    } finally {
      request.isProcessing = false;
      await loading.dismiss();
    }
  }

  /**
   * Bulk approve selected requests
   */
  async bulkApproveRequests(): Promise<void> {
    await this.performBulkOperation('approve');
  }

  /**
   * Bulk reject selected requests
   */
  async bulkRejectRequests(): Promise<void> {
    await this.performBulkOperation('reject');
  }

  /**
   * Perform bulk operation on selected requests
   */
  private async performBulkOperation(action: 'approve' | 'reject'): Promise<void> {
    if (this.selectedRequests.size === 0) {
      await this.showErrorToast('No requests selected');
      return;
    }

    const selectedIds = Array.from(this.selectedRequests);
    
    // Show confirmation dialog
    const alert = await this.alertController.create({
      header: `${action === 'approve' ? 'Approve' : 'Reject'} Requests`,
      message: `Are you sure you want to ${action} ${selectedIds.length} request(s)?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: action === 'approve' ? 'Approve All' : 'Reject All',
          handler: async () => {
            await this.executeBulkOperation(selectedIds, action);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Execute the bulk operation with optimistic updates and concurrent handling
   */
  private async executeBulkOperation(requestIds: string[], action: 'approve' | 'reject'): Promise<void> {
    this.isBulkProcessing = true;
    this.bulkOperationProgress = 0;

    // Optimistic update: Mark all selected requests as processing
    requestIds.forEach(id => {
      const request = this.pendingRequests.find(req => req.id === id);
      if (request) {
        request.isProcessing = true;
      }
    });

    // Show initial progress
    this.updateBulkProgress(10);

    const loading = await this.loadingController.create({
      message: `${action === 'approve' ? 'Approving' : 'Rejecting'} ${requestIds.length} request(s)...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      let result: BulkOperationResult;
      
      this.updateBulkProgress(30);
      
      // Use the service's bulk operations which handle concurrent modifications internally
      if (action === 'approve') {
        result = await this.joinRequestService.bulkApproveRequests(requestIds, this.currentUserId || 'unknown');
      } else {
        result = await this.joinRequestService.bulkRejectRequests(requestIds, this.currentUserId || 'unknown', undefined);
      }

      this.updateBulkProgress(80);

      // Handle results and concurrent modifications
      if (result.failedOperations === 0) {
        const actionPastTense = action === 'approve' ? 'approved' : 'rejected';
        await this.showSuccessToast(`Successfully ${actionPastTense} ${result.successfulOperations} request(s)`);
        
        // Optimistic update: Remove successfully processed requests
        requestIds.forEach(id => this.removePendingRequest(id));
        
      } else {
        // Some operations failed - could be due to concurrent modifications
        const actionPastTense = action === 'approve' ? 'approved' : 'rejected';
        await this.showBulkOperationResults(result, actionPastTense);
        
        // Refresh the list to get current state after any concurrent modifications
        await this.loadPendingRequests();
      }

      this.updateBulkProgress(100);

      // Clear selections
      this.clearAllSelections();

    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
      
      // Reset processing state on error
      requestIds.forEach(id => {
        const request = this.pendingRequests.find(req => req.id === id);
        if (request) {
          request.isProcessing = false;
        }
      });
      
      await this.handleBulkOperationError(error, action, requestIds);
      
      // Refresh the list to ensure we have current state
      await this.loadPendingRequests();
      
    } finally {
      // Reset processing states
      requestIds.forEach(id => {
        const request = this.pendingRequests.find(req => req.id === id);
        if (request) {
          request.isProcessing = false;
        }
      });
      
      this.isBulkProcessing = false;
      this.bulkOperationProgress = 0;
      await loading.dismiss();
    }
  }

  /**
   * Update bulk operation progress
   */
  private updateBulkProgress(progress: number): void {
    this.bulkOperationProgress = Math.min(100, Math.max(0, progress));
  }

  /**
   * Close the modal
   */
  async closeModal(): Promise<void> {
    try {
      await this.modalController.dismiss({
        dismissed: true,
        requestsProcessed: this.pendingRequests.length
      });
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }

  /**
   * Get formatted date string for display
   */
  getFormattedDate(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const minutes = Math.max(1, diffMinutes);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Check if bulk actions should be shown
   */
  get showBulkActions(): boolean {
    return !!(this.config?.enableBulkActions && this.selectedRequests.size > 0);
  }

  /**
   * Get the count of selected requests
   */
  get selectedCount(): number {
    return this.selectedRequests.size;
  }

  /**
   * Check if all requests are selected
   */
  get allSelected(): boolean {
    return this.pendingRequests.length > 0 && this.selectedRequests.size === this.pendingRequests.length;
  }

  /**
   * Check if some (but not all) requests are selected
   */
  get someSelected(): boolean {
    return this.selectedRequests.size > 0 && this.selectedRequests.size < this.pendingRequests.length;
  }

  /**
   * Get pagination info for display
   */
  get paginationInfo(): string {
    if (this.totalCount === 0) {
      return 'No requests';
    }
    
    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(this.currentPage * this.pageSize, this.totalCount);
    
    return `${startItem}-${endItem} of ${this.totalCount}`;
  }

  /**
   * Check if pagination controls should be shown
   */
  get showPagination(): boolean {
    return this.totalPages > 1;
  }

  /**
   * Get array of page numbers for pagination controls
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  /**
   * Check if search is active
   */
  get hasActiveSearch(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  /**
   * Get connection status display info
   */
  get connectionStatusInfo(): { color: string; icon: string; text: string } {
    switch (this.connectionState) {
      case 'connected':
        return { color: 'success', icon: 'checkmark-circle', text: 'Connected' };
      case 'reconnecting':
        return { color: 'warning', icon: 'refresh', text: 'Reconnecting...' };
      case 'disconnected':
      default:
        return { color: 'danger', icon: 'close-circle', text: 'Disconnected' };
    }
  }

  /**
   * Check if real-time updates are working
   */
  get isRealTimeActive(): boolean {
    return this.connectionState === 'connected' && this.config?.enableRealTimeUpdates === true;
  }

  /**
   * Handle keyboard navigation for request items
   */
  onRequestKeydown(event: KeyboardEvent, request: EnhancedStudioJoinRequest): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.config?.enableBulkActions) {
          this.toggleRequestSelection(request.id);
        }
        break;
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.selectAllRequests();
        } else if (!request.isProcessing) {
          event.preventDefault();
          this.approveRequest(request.id);
        }
        break;
      case 'r':
      case 'R':
        if (!request.isProcessing) {
          event.preventDefault();
          this.rejectRequest(request.id);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.clearAllSelections();
        break;
    }
  }

  /**
   * Navigate to user profile (placeholder method)
   */
  navigateToProfile(userId: string): void {
    // This method would be implemented to navigate to the user's profile
    console.log('Navigate to profile for user:', userId);
    // For now, just show a toast indicating the action
    this.showSuccessToast('Profile navigation would open here');
  }

  /**
   * Show rejection history (placeholder method)
   */
  showRejectionHistory(userId: string): void {
    // This method would be implemented to show rejection history
    console.log('Show rejection history for user:', userId);
    // For now, just show a toast indicating the action
    this.showSuccessToast('Rejection history would be displayed here');
  }

  /**
   * Private helper methods
   */

  /**
   * Handle errors when loading pending requests
   */
  private async handleLoadError(error: any): Promise<void> {
    if (error instanceof SystemException) {
      if (error.errorCode === SystemError.AUTHENTICATION_ERROR) {
        this.authenticationError = true;
        this.error = 'Authentication required. Please log in again.';
        await this.showAuthenticationErrorDialog();
        return;
      } else if (error.errorCode === SystemError.NETWORK_ERROR) {
        this.networkError = true;
        this.error = 'Network connection error. Check your internet connection.';
        // Schedule automatic refresh for network errors
        await this.handleTransientFailure(error, 'load requests');
      } else if (error.errorCode === SystemError.DATABASE_ERROR) {
        this.error = 'Database error. Please try again later.';
        // Schedule automatic refresh for database errors
        await this.handleTransientFailure(error, 'load requests');
      } else {
        this.error = `System error: ${error.message}`;
      }
    } else if (error instanceof InstructorPermissionException) {
      this.error = `Permission error: ${error.message}`;
      await this.showPermissionErrorDialog();
      return;
    } else {
      this.error = 'Failed to load pending requests. Please try again.';
      // Schedule automatic refresh for unknown errors
      await this.handleTransientFailure(error, 'load requests');
    }

    // Offer manual retry for recoverable errors
    if (this.retryCount < this.maxRetries && this.isRecoverableError(error)) {
      await this.showRetryDialog('loading requests');
    }
  }

  /**
   * Handle errors when processing individual requests
   */
  private async handleRequestProcessingError(error: any, action: 'approve' | 'reject', request: EnhancedStudioJoinRequest): Promise<void> {
    let errorMessage = `Failed to ${action} request from ${request.userName}`;
    let showRetry = false;

    if (error instanceof RequestProcessingException) {
      switch (error.errorCode) {
        case RequestProcessingError.REQUEST_NOT_FOUND:
          errorMessage = `Request from ${request.userName} no longer exists. It may have been processed by another instructor.`;
          break;
        case RequestProcessingError.REQUEST_ALREADY_PROCESSED:
          errorMessage = `Request from ${request.userName} has already been ${error.message.includes('approved') ? 'approved' : 'rejected'} by another instructor.`;
          break;
        case RequestProcessingError.MEMBERSHIP_CREATION_FAILED:
          errorMessage = `Failed to create studio membership for ${request.userName}. Please try again.`;
          showRetry = true;
          break;
        case RequestProcessingError.CONCURRENT_MODIFICATION:
          errorMessage = `Another instructor is processing ${request.userName}'s request. Please wait and try again.`;
          showRetry = true;
          break;
        default:
          errorMessage = `Processing error for ${request.userName}: ${error.message}`;
          showRetry = true;
      }
    } else if (error instanceof SystemException) {
      if (error.errorCode === SystemError.NETWORK_ERROR) {
        errorMessage = `Network error while processing ${request.userName}'s request. Check your connection and try again.`;
        showRetry = true;
      } else if (error.errorCode === SystemError.AUTHENTICATION_ERROR) {
        errorMessage = `Authentication error while processing ${request.userName}'s request. Please log in again.`;
        await this.showAuthenticationErrorDialog();
        return;
      } else {
        errorMessage = `System error while processing ${request.userName}'s request: ${error.message}`;
        showRetry = true;
      }
    }

    await this.showErrorToast(errorMessage);

    if (showRetry) {
      await this.showRequestRetryDialog(request.id, action, request.userName);
    } else {
      // Refresh the list to get current state
      await this.loadPendingRequests();
    }
  }

  /**
   * Handle errors in bulk operations
   */
  private async handleBulkOperationError(error: any, action: 'approve' | 'reject', requestIds: string[]): Promise<void> {
    let errorMessage = `Failed to ${action} requests`;
    let showRetry = false;

    if (error instanceof SystemException) {
      if (error.errorCode === SystemError.NETWORK_ERROR) {
        errorMessage = 'Network error during bulk operation. Some requests may have been processed.';
        showRetry = true;
      } else if (error.errorCode === SystemError.AUTHENTICATION_ERROR) {
        errorMessage = 'Authentication error. Please log in again.';
        await this.showAuthenticationErrorDialog();
        return;
      } else {
        errorMessage = `System error during bulk operation: ${error.message}`;
        showRetry = true;
      }
    }

    await this.showErrorToast(errorMessage);

    if (showRetry) {
      await this.showBulkRetryDialog(requestIds, action);
    }

    // Always refresh the list after bulk operation errors
    await this.loadPendingRequests();
  }

  /**
   * Show detailed results for bulk operations with partial failures
   */
  private async showBulkOperationResults(result: BulkOperationResult, actionPastTense: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Bulk Operation Results',
      message: `
        <p><strong>Successfully ${actionPastTense}:</strong> ${result.successfulOperations} request(s)</p>
        <p><strong>Failed:</strong> ${result.failedOperations} request(s)</p>
        ${result.errors.length > 0 ? '<p><strong>Errors:</strong></p><ul>' + 
          result.errors.slice(0, 3).map(err => `<li>${err.requestName}: ${err.error}</li>`).join('') +
          (result.errors.length > 3 ? `<li>... and ${result.errors.length - 3} more</li>` : '') +
          '</ul>' : ''}
      `,
      buttons: [
        {
          text: 'Retry Failed',
          handler: async () => {
            const failedIds = result.errors.map(err => err.requestId);
            await this.showBulkRetryDialog(failedIds, actionPastTense === 'approved' ? 'approve' : 'reject');
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  /**
   * Show authentication error dialog with options
   */
  private async showAuthenticationErrorDialog(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Authentication Required',
      message: 'Your session has expired. Please log in again to continue managing join requests.',
      buttons: [
        {
          text: 'Close Modal',
          handler: () => {
            this.closeModal();
          }
        },
        {
          text: 'Refresh',
          handler: async () => {
            await this.loadPendingRequests();
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Show permission error dialog
   */
  private async showPermissionErrorDialog(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Error',
      message: 'You do not have permission to manage join requests for this studio. Your instructor status may have changed.',
      buttons: [
        {
          text: 'Close Modal',
          handler: () => {
            this.closeModal();
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Show retry dialog for general operations
   */
  private async showRetryDialog(operation: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Operation Failed',
      message: `Failed ${operation}. Would you like to try again?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Retry',
          handler: async () => {
            this.retryCount++;
            this.isRetrying = true;
            try {
              await this.loadPendingRequests();
            } finally {
              this.isRetrying = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Show retry dialog for individual request processing
   */
  private async showRequestRetryDialog(requestId: string, action: 'approve' | 'reject', userName: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Request Processing Failed',
      message: `Failed to ${action} request from ${userName}. Would you like to try again?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Retry',
          handler: async () => {
            await this.processRequest(requestId, action);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Show retry dialog for bulk operations
   */
  private async showBulkRetryDialog(requestIds: string[], action: 'approve' | 'reject'): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Bulk Operation Failed',
      message: `Failed to ${action} ${requestIds.length} request(s). Would you like to retry the failed requests?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Retry',
          handler: async () => {
            await this.executeBulkOperation(requestIds, action);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Check if an error is recoverable (can be retried)
   */
  private isRecoverableError(error: any): boolean {
    if (error instanceof SystemException) {
      return error.errorCode === SystemError.NETWORK_ERROR || 
             error.errorCode === SystemError.DATABASE_ERROR ||
             error.errorCode === SystemError.RATE_LIMIT_EXCEEDED;
    }
    if (error instanceof RequestProcessingException) {
      return error.errorCode === RequestProcessingError.CONCURRENT_MODIFICATION ||
             error.errorCode === RequestProcessingError.MEMBERSHIP_CREATION_FAILED;
    }
    return false;
  }

  /**
   * Perform optimistic update for better UX during request processing
   */
  private performOptimisticUpdate(requestId: string, newStatus: 'processing' | 'approved' | 'rejected'): void {
    const request = this.pendingRequests.find(req => req.id === requestId);
    if (request) {
      if (newStatus === 'processing') {
        request.isProcessing = true;
      } else {
        // For approved/rejected, remove from pending list optimistically
        // Real-time updates will provide the authoritative state
        this.removePendingRequest(requestId);
      }
    }
  }

  /**
   * Revert optimistic update if operation fails
   */
  private revertOptimisticUpdate(requestId: string): void {
    // Since we removed the request optimistically, we need to refresh the list
    // to get the current state from the server
    this.loadPendingRequests();
  }

  /**
   * Enhanced automatic retry mechanism with concurrent modification handling
   */
  private async autoRetryOperation(operation: () => Promise<void>, maxRetries: number = 3): Promise<void> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxRetries) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        attempts++;
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Special handling for concurrent modifications
        if (error instanceof RequestProcessingException && 
            error.errorCode === RequestProcessingError.CONCURRENT_MODIFICATION) {
          
          if (attempts < maxRetries) {
            // Wait with exponential backoff before retrying concurrent modifications
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 3000);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Refresh data before retry to get current state
            await this.loadPendingRequests();
            continue;
          }
        } else if (this.isRecoverableError(error)) {
          if (attempts < maxRetries) {
            // Wait before retrying other recoverable errors
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            break;
          }
        } else {
          break; // Non-recoverable error, don't retry
        }
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      throw lastError;
    }
  }

  /**
   * Refresh mechanism for failed data loads
   */
  async refreshData(): Promise<void> {
    this.error = null;
    this.networkError = false;
    this.authenticationError = false;
    this.retryCount = 0;
    
    await this.loadPendingRequests(); // Don't reset pagination on manual refresh
  }

  /**
   * Automatic refresh with exponential backoff for critical failures
   */
  private async scheduleAutoRefresh(delayMs: number = 5000): Promise<void> {
    if (this.config?.enableRealTimeUpdates && this.retryCount < this.maxRetries) {
      setTimeout(async () => {
        if (!this.isLoading && this.error) {
          console.log(`Auto-refreshing after ${delayMs}ms delay (attempt ${this.retryCount + 1})`);
          try {
            await this.refreshData();
          } catch (error) {
            console.error('Auto-refresh failed:', error);
            // Schedule another refresh with exponential backoff
            const nextDelay = Math.min(delayMs * 2, 30000); // Cap at 30 seconds
            await this.scheduleAutoRefresh(nextDelay);
          }
        }
      }, delayMs);
    }
  }

  /**
   * Enhanced error recovery with automatic refresh for transient failures
   */
  private async handleTransientFailure(error: any, context: string): Promise<void> {
    if (this.isRecoverableError(error)) {
      console.log(`Handling transient failure in ${context}, scheduling auto-refresh`);
      await this.scheduleAutoRefresh();
    }
  }

  private removePendingRequest(requestId: string): void {
    this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
    this.selectedRequests.delete(requestId);
  }

  private clearInvalidSelections(): void {
    const validIds = new Set(this.pendingRequests.map(req => req.id));
    const invalidSelections = Array.from(this.selectedRequests).filter(id => !validIds.has(id));
    
    invalidSelections.forEach(id => this.selectedRequests.delete(id));
  }

  private handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;
    
    if (error instanceof RequestProcessingException) {
      errorMessage = `Request processing error: ${error.message}`;
    } else if (error instanceof SystemException) {
      errorMessage = `System error: ${error.message}`;
    } else if (error instanceof InstructorPermissionException) {
      errorMessage = `Permission error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    this.error = errorMessage;
    this.showErrorToast(errorMessage);
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Track by function for ngFor performance
   */
  trackByRequestId(index: number, request: EnhancedStudioJoinRequest): string {
    return request.id;
  }

  /**
   * Show info toast for user feedback
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
}