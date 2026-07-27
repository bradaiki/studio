import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, throttleTime, bufferTime, filter } from 'rxjs/operators';
import { EnhancedStudioJoinRequest } from '../models/instructor-join-review.models';

interface UpdateBatch {
  studioId: string;
  updates: UpdateEvent[];
  timestamp: number;
}

interface UpdateEvent {
  type: 'create' | 'update' | 'delete';
  requestId: string;
  request?: EnhancedStudioJoinRequest;
  timestamp: number;
}

interface SubscriptionConfig {
  studioId: string;
  debounceMs: number;
  throttleMs: number;
  batchSize: number;
  maxBatchWaitMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeUpdateOptimizerService {
  private updateSubjects = new Map<string, Subject<UpdateEvent>>();
  private batchedUpdateSubjects = new Map<string, BehaviorSubject<UpdateBatch | null>>();
  private subscriptionConfigs = new Map<string, SubscriptionConfig>();
  
  // Connection state management
  private connectionStates = new Map<string, 'connected' | 'disconnected' | 'reconnecting'>();
  private connectionSubjects = new Map<string, BehaviorSubject<string>>();
  
  // Performance monitoring
  private updateCounts = new Map<string, number>();
  private lastUpdateTimes = new Map<string, number>();
  private performanceMetrics = new Map<string, {
    totalUpdates: number;
    batchedUpdates: number;
    averageBatchSize: number;
    lastResetTime: number;
  }>();

  constructor() {
    // Clean up metrics periodically
    setInterval(() => this.cleanupMetrics(), 300000); // Every 5 minutes
  }

  /**
   * Initialize optimized real-time updates for a studio
   */
  initializeStudioUpdates(studioId: string, config?: Partial<SubscriptionConfig>): Observable<UpdateBatch | null> {
    const defaultConfig: SubscriptionConfig = {
      studioId,
      debounceMs: 100,      // Debounce rapid updates
      throttleMs: 500,      // Throttle to max 2 updates per second
      batchSize: 10,        // Batch up to 10 updates
      maxBatchWaitMs: 1000  // Wait max 1 second for batch
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.subscriptionConfigs.set(studioId, finalConfig);

    // Initialize subjects if not exists
    if (!this.updateSubjects.has(studioId)) {
      this.updateSubjects.set(studioId, new Subject<UpdateEvent>());
    }

    if (!this.batchedUpdateSubjects.has(studioId)) {
      this.batchedUpdateSubjects.set(studioId, new BehaviorSubject<UpdateBatch | null>(null));
    }

    if (!this.connectionSubjects.has(studioId)) {
      this.connectionSubjects.set(studioId, new BehaviorSubject<string>('disconnected'));
    }

    // Set up optimized update pipeline
    this.setupUpdatePipeline(studioId, finalConfig);

    // Initialize performance metrics
    this.performanceMetrics.set(studioId, {
      totalUpdates: 0,
      batchedUpdates: 0,
      averageBatchSize: 0,
      lastResetTime: Date.now()
    });

    console.log(`Initialized optimized real-time updates for studio ${studioId}`, finalConfig);

    return this.batchedUpdateSubjects.get(studioId)!.asObservable();
  }

  /**
   * Emit a single update event
   */
  emitUpdate(studioId: string, event: UpdateEvent): void {
    const subject = this.updateSubjects.get(studioId);
    if (subject) {
      // Add timestamp if not provided
      if (!event.timestamp) {
        event.timestamp = Date.now();
      }

      subject.next(event);

      // Update performance metrics
      this.updatePerformanceMetrics(studioId);
    }
  }

  /**
   * Emit multiple update events
   */
  emitBatchUpdate(studioId: string, events: UpdateEvent[]): void {
    const subject = this.updateSubjects.get(studioId);
    if (subject && events.length > 0) {
      const now = Date.now();
      
      // Emit each event with timestamp
      events.forEach(event => {
        if (!event.timestamp) {
          event.timestamp = now;
        }
        subject.next(event);
      });

      // Update performance metrics
      this.updatePerformanceMetrics(studioId, events.length);
    }
  }

  /**
   * Set connection state for a studio
   */
  setConnectionState(studioId: string, state: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.connectionStates.set(studioId, state);
    
    const subject = this.connectionSubjects.get(studioId);
    if (subject) {
      subject.next(state);
    }

    console.log(`Connection state for studio ${studioId}: ${state}`);
  }

  /**
   * Subscribe to connection state changes
   */
  subscribeToConnectionState(studioId: string): Observable<string> {
    if (!this.connectionSubjects.has(studioId)) {
      this.connectionSubjects.set(studioId, new BehaviorSubject<string>('disconnected'));
    }
    
    return this.connectionSubjects.get(studioId)!.asObservable();
  }

  /**
   * Get current connection state
   */
  getConnectionState(studioId: string): string {
    return this.connectionStates.get(studioId) || 'disconnected';
  }

  /**
   * Update subscription configuration
   */
  updateConfig(studioId: string, config: Partial<SubscriptionConfig>): void {
    const currentConfig = this.subscriptionConfigs.get(studioId);
    if (currentConfig) {
      const newConfig = { ...currentConfig, ...config };
      this.subscriptionConfigs.set(studioId, newConfig);
      
      // Restart the update pipeline with new config
      this.setupUpdatePipeline(studioId, newConfig);
      
      console.log(`Updated config for studio ${studioId}`, newConfig);
    }
  }

  /**
   * Get performance metrics for a studio
   */
  getPerformanceMetrics(studioId: string) {
    return this.performanceMetrics.get(studioId) || {
      totalUpdates: 0,
      batchedUpdates: 0,
      averageBatchSize: 0,
      lastResetTime: Date.now()
    };
  }

  /**
   * Reset performance metrics for a studio
   */
  resetPerformanceMetrics(studioId: string): void {
    this.performanceMetrics.set(studioId, {
      totalUpdates: 0,
      batchedUpdates: 0,
      averageBatchSize: 0,
      lastResetTime: Date.now()
    });
    
    console.log(`Reset performance metrics for studio ${studioId}`);
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics() {
    const metrics: { [studioId: string]: any } = {};
    
    for (const [studioId, metric] of this.performanceMetrics.entries()) {
      metrics[studioId] = {
        ...metric,
        connectionState: this.getConnectionState(studioId),
        config: this.subscriptionConfigs.get(studioId)
      };
    }
    
    return metrics;
  }

  /**
   * Cleanup resources for a studio
   */
  cleanupStudio(studioId: string): void {
    // Complete and remove subjects
    if (this.updateSubjects.has(studioId)) {
      this.updateSubjects.get(studioId)!.complete();
      this.updateSubjects.delete(studioId);
    }

    if (this.batchedUpdateSubjects.has(studioId)) {
      this.batchedUpdateSubjects.get(studioId)!.complete();
      this.batchedUpdateSubjects.delete(studioId);
    }

    if (this.connectionSubjects.has(studioId)) {
      this.connectionSubjects.get(studioId)!.complete();
      this.connectionSubjects.delete(studioId);
    }

    // Remove state and config
    this.subscriptionConfigs.delete(studioId);
    this.connectionStates.delete(studioId);
    this.updateCounts.delete(studioId);
    this.lastUpdateTimes.delete(studioId);
    this.performanceMetrics.delete(studioId);

    console.log(`Cleaned up real-time update resources for studio ${studioId}`);
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Complete all subjects
    this.updateSubjects.forEach(subject => subject.complete());
    this.batchedUpdateSubjects.forEach(subject => subject.complete());
    this.connectionSubjects.forEach(subject => subject.complete());

    // Clear all maps
    this.updateSubjects.clear();
    this.batchedUpdateSubjects.clear();
    this.connectionSubjects.clear();
    this.subscriptionConfigs.clear();
    this.connectionStates.clear();
    this.updateCounts.clear();
    this.lastUpdateTimes.clear();
    this.performanceMetrics.clear();

    console.log('Real-time update optimizer cleanup complete');
  }

  /**
   * Set up optimized update pipeline with debouncing, throttling, and batching
   */
  private setupUpdatePipeline(studioId: string, config: SubscriptionConfig): void {
    const updateSubject = this.updateSubjects.get(studioId);
    const batchedSubject = this.batchedUpdateSubjects.get(studioId);

    if (!updateSubject || !batchedSubject) {
      return;
    }

    // Create optimized pipeline
    updateSubject.pipe(
      // Debounce rapid updates
      debounceTime(config.debounceMs),
      
      // Throttle to prevent overwhelming the UI
      throttleTime(config.throttleMs),
      
      // Buffer updates for batching
      bufferTime(config.maxBatchWaitMs, null, config.batchSize),
      
      // Filter out empty batches
      filter(updates => updates.length > 0),
      
      // Remove duplicate updates for the same request
      distinctUntilChanged((prev, curr) => {
        if (prev.length !== curr.length) return false;
        
        // Check if all updates are the same
        return prev.every((prevUpdate, index) => {
          const currUpdate = curr[index];
          return prevUpdate.requestId === currUpdate.requestId && 
                 prevUpdate.type === currUpdate.type &&
                 prevUpdate.timestamp === currUpdate.timestamp;
        });
      })
    ).subscribe({
      next: (updates) => {
        if (updates.length > 0) {
          const batch: UpdateBatch = {
            studioId,
            updates: this.deduplicateUpdates(updates),
            timestamp: Date.now()
          };

          batchedSubject.next(batch);

          // Update batched metrics
          const metrics = this.performanceMetrics.get(studioId);
          if (metrics) {
            metrics.batchedUpdates++;
            metrics.averageBatchSize = (metrics.averageBatchSize * (metrics.batchedUpdates - 1) + batch.updates.length) / metrics.batchedUpdates;
          }

          console.log(`Emitted batch update for studio ${studioId}: ${batch.updates.length} updates`);
        }
      },
      error: (error) => {
        console.error(`Error in update pipeline for studio ${studioId}:`, error);
        this.setConnectionState(studioId, 'disconnected');
      }
    });
  }

  /**
   * Remove duplicate updates, keeping the latest for each request
   */
  private deduplicateUpdates(updates: UpdateEvent[]): UpdateEvent[] {
    const latestUpdates = new Map<string, UpdateEvent>();

    // Keep only the latest update for each request
    updates.forEach(update => {
      const existing = latestUpdates.get(update.requestId);
      if (!existing || update.timestamp > existing.timestamp) {
        latestUpdates.set(update.requestId, update);
      }
    });

    return Array.from(latestUpdates.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(studioId: string, count: number = 1): void {
    const now = Date.now();
    
    // Update counts
    const currentCount = this.updateCounts.get(studioId) || 0;
    this.updateCounts.set(studioId, currentCount + count);
    this.lastUpdateTimes.set(studioId, now);

    // Update metrics
    const metrics = this.performanceMetrics.get(studioId);
    if (metrics) {
      metrics.totalUpdates += count;
    }
  }

  /**
   * Clean up old metrics periodically
   */
  private cleanupMetrics(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [studioId, metrics] of this.performanceMetrics.entries()) {
      if (now - metrics.lastResetTime > maxAge) {
        this.resetPerformanceMetrics(studioId);
      }
    }
  }
}