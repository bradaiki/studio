import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatLoadingStateService, LoadingState } from '../../services/chat-loading-state.service';

@Component({
  selector: 'app-chat-loading-indicator',
  templateUrl: './chat-loading-indicator.component.html',
  styleUrls: ['./chat-loading-indicator.component.scss']
})
export class ChatLoadingIndicatorComponent implements OnInit, OnDestroy {
  @Input() operationKey?: string;
  @Input() showProgress: boolean = false;
  @Input() showMessage: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() color: 'primary' | 'secondary' | 'tertiary' = 'primary';

  loadingState: LoadingState | null = null;
  isOnline: boolean = true;
  private loadingSubscription?: Subscription;
  private networkSubscription?: Subscription;

  constructor(private loadingStateService: ChatLoadingStateService) {}

  ngOnInit() {
    // Subscribe to loading states
    this.loadingSubscription = this.loadingStateService.getLoadingStates().subscribe(states => {
      if (this.operationKey) {
        this.loadingState = states[this.operationKey] || null;
      } else {
        // Show any active loading state if no specific operation key
        const activeStates = Object.values(states);
        this.loadingState = activeStates.length > 0 ? activeStates[0] : null;
      }
    });

    // Subscribe to network status
    this.networkSubscription = this.loadingStateService.getNetworkStatus().subscribe(isOnline => {
      this.isOnline = isOnline;
    });
  }

  ngOnDestroy() {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }

  get isLoading(): boolean {
    return this.loadingState?.isLoading || false;
  }

  get message(): string {
    if (!this.loadingState) return '';
    
    let message = this.loadingState.message || this.loadingState.operation;
    
    // Add offline indicator if needed
    if (!this.isOnline && message) {
      message += ' (offline mode)';
    }
    
    return message;
  }

  get progress(): number {
    return this.loadingState?.progress || 0;
  }

  get spinnerSize(): string {
    switch (this.size) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  }
}