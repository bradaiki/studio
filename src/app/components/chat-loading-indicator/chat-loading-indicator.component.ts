import { Component, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { IonSpinner, IonProgressBar, IonIcon } from '@ionic/angular/standalone';
import { ChatLoadingStateService, LoadingState } from '../../services/chat-loading-state.service';

@Component({
  selector: 'app-chat-loading-indicator',
  templateUrl: './chat-loading-indicator.component.html',
  styleUrls: ['./chat-loading-indicator.component.scss'],
  standalone: true,
  imports: [TranslateModule, IonSpinner, IonProgressBar, IonIcon]
})
export class ChatLoadingIndicatorComponent implements OnInit, OnDestroy {
  operationKey = input<string>();
  showProgress = input(false);
  showMessage = input(true);
  size = input<'small' | 'medium' | 'large'>('medium');
  color = input<'primary' | 'secondary' | 'tertiary'>('primary');

  loadingState = signal<LoadingState | null>(null);
  isOnline = signal(true);
  private loadingSubscription?: Subscription;
  private networkSubscription?: Subscription;

  isLoading = computed(() => this.loadingState()?.isLoading || false);

  message = computed(() => {
    const state = this.loadingState();
    if (!state) return '';

    let message = state.message || state.operation;

    if (!this.isOnline() && message) {
      message += ' (offline mode)';
    }

    return message;
  });

  progress = computed(() => this.loadingState()?.progress || 0);

  spinnerSize = computed(() => {
    switch (this.size()) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  });

  constructor(private loadingStateService: ChatLoadingStateService) {}

  ngOnInit() {
    // Subscribe to loading states
    this.loadingSubscription = this.loadingStateService.getLoadingStates().subscribe(states => {
      const key = this.operationKey();
      if (key) {
        this.loadingState.set(states[key] || null);
      } else {
        // Show any active loading state if no specific operation key
        const activeStates = Object.values(states);
        this.loadingState.set(activeStates.length > 0 ? activeStates[0] : null);
      }
    });

    // Subscribe to network status
    this.networkSubscription = this.loadingStateService.getNetworkStatus().subscribe(isOnline => {
      this.isOnline.set(isOnline);
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
}
