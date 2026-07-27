import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoadingController } from '@ionic/angular';

export interface LoadingState {
  isLoading: boolean;
  operation: string;
  message?: string;
  progress?: number;
}

export interface CachedAccessPermission {
  chatId: string;
  userId: string;
  canView: boolean;
  canRead: boolean;
  canWrite: boolean;
  canInvite: boolean;
  canManage: boolean;
  accessReason: string;
  cachedAt: Date;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatLoadingStateService {
  private loadingStates = new BehaviorSubject<{ [key: string]: LoadingState }>({});
  private activeLoadings = new Map<string, HTMLIonLoadingElement>();
  
  // Offline cache for access permissions
  private accessPermissionsCache = new Map<string, CachedAccessPermission>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly OFFLINE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for offline

  // Network status
  private isOnline = navigator.onLine;
  private networkStatusSubject = new BehaviorSubject<boolean>(this.isOnline);

  constructor(private loadingController: LoadingController) {
    this.initializeNetworkMonitoring();
    this.initializeOfflineCache();
  }

  /**
   * Get loading states observable
   */
  getLoadingStates(): Observable<{ [key: string]: LoadingState }> {
    return this.loadingStates.asObservable();
  }

  /**
   * Get network status observable
   */
  getNetworkStatus(): Observable<boolean> {
    return this.networkStatusSubject.asObservable();
  }

  /**
   * Check if currently online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Start loading state for an operation
   */
  async startLoading(
    operationKey: string, 
    operation: string, 
    message?: string,
    showSpinner: boolean = false
  ): Promise<void> {
    const loadingState: LoadingState = {
      isLoading: true,
      operation,
      message,
      progress: 0
    };

    // Update loading states
    const currentStates = this.loadingStates.value;
    this.loadingStates.next({
      ...currentStates,
      [operationKey]: loadingState
    });

    // Show loading spinner if requested
    if (showSpinner) {
      await this.showLoadingSpinner(operationKey, message || operation);
    }
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(operationKey: string, progress: number, message?: string): void {
    const currentStates = this.loadingStates.value;
    const currentState = currentStates[operationKey];

    if (currentState) {
      this.loadingStates.next({
        ...currentStates,
        [operationKey]: {
          ...currentState,
          progress,
          message: message || currentState.message
        }
      });
    }
  }

  /**
   * Stop loading state for an operation
   */
  async stopLoading(operationKey: string): Promise<void> {
    // Remove from loading states
    const currentStates = this.loadingStates.value;
    const { [operationKey]: removed, ...remainingStates } = currentStates;
    this.loadingStates.next(remainingStates);

    // Hide loading spinner if active
    await this.hideLoadingSpinner(operationKey);
  }

  /**
   * Check if an operation is currently loading
   */
  isLoading(operationKey: string): boolean {
    const currentStates = this.loadingStates.value;
    return currentStates[operationKey]?.isLoading || false;
  }

  /**
   * Get loading state for an operation
   */
  getLoadingState(operationKey: string): LoadingState | null {
    const currentStates = this.loadingStates.value;
    return currentStates[operationKey] || null;
  }

  /**
   * Show loading spinner with Ionic LoadingController
   */
  private async showLoadingSpinner(operationKey: string, message: string): Promise<void> {
    // Don't show multiple spinners for the same operation
    if (this.activeLoadings.has(operationKey)) {
      return;
    }

    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent',
      translucent: true,
      cssClass: 'chat-loading-spinner'
    });

    this.activeLoadings.set(operationKey, loading);
    await loading.present();
  }

  /**
   * Hide loading spinner
   */
  private async hideLoadingSpinner(operationKey: string): Promise<void> {
    const loading = this.activeLoadings.get(operationKey);
    if (loading) {
      await loading.dismiss();
      this.activeLoadings.delete(operationKey);
    }
  }

  // ==================== OFFLINE CACHE MANAGEMENT ====================

  /**
   * Cache access permissions for offline use
   */
  cacheAccessPermissions(
    chatId: string,
    userId: string,
    permissions: {
      canView: boolean;
      canRead: boolean;
      canWrite: boolean;
      canInvite: boolean;
      canManage: boolean;
      accessReason: string;
    }
  ): void {
    const cacheKey = `${chatId}_${userId}`;
    const now = new Date();
    const cacheDuration = this.isOnline ? this.CACHE_DURATION : this.OFFLINE_CACHE_DURATION;

    const cachedPermission: CachedAccessPermission = {
      chatId,
      userId,
      ...permissions,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + cacheDuration)
    };

    this.accessPermissionsCache.set(cacheKey, cachedPermission);

    // Also store in localStorage for persistence across sessions
    try {
      const cacheData = {
        ...cachedPermission,
        cachedAt: cachedPermission.cachedAt.toISOString(),
        expiresAt: cachedPermission.expiresAt.toISOString()
      };
      localStorage.setItem(`chat_access_${cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to store access permissions in localStorage:', error);
    }
  }

  /**
   * Get cached access permissions
   */
  getCachedAccessPermissions(chatId: string, userId: string): CachedAccessPermission | null {
    const cacheKey = `${chatId}_${userId}`;
    
    // Check memory cache first
    let cached = this.accessPermissionsCache.get(cacheKey);
    
    // If not in memory, try localStorage
    if (!cached) {
      try {
        const storedData = localStorage.getItem(`chat_access_${cacheKey}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const restoredCached: CachedAccessPermission = {
            ...parsedData,
            cachedAt: new Date(parsedData.cachedAt),
            expiresAt: new Date(parsedData.expiresAt)
          };
          
          // Restore to memory cache
          this.accessPermissionsCache.set(cacheKey, restoredCached);
          cached = restoredCached;
        }
      } catch (error) {
        console.warn('Failed to load access permissions from localStorage:', error);
      }
    }

    // Check if cache is still valid
    if (cached) {
      const now = new Date();
      if (now > cached.expiresAt) {
        // Cache expired
        this.clearCachedAccessPermissions(chatId, userId);
        return null;
      }
      
      // For offline mode, extend cache validity
      if (!this.isOnline && cached.expiresAt.getTime() - now.getTime() < this.CACHE_DURATION) {
        const updatedCached = { ...cached };
        updatedCached.expiresAt = new Date(now.getTime() + this.OFFLINE_CACHE_DURATION);
        this.accessPermissionsCache.set(cacheKey, updatedCached);
        return updatedCached;
      }
      
      return cached;
    }

    return null;
  }

  /**
   * Clear cached access permissions for a specific chat/user
   */
  clearCachedAccessPermissions(chatId: string, userId: string): void {
    const cacheKey = `${chatId}_${userId}`;
    this.accessPermissionsCache.delete(cacheKey);
    
    try {
      localStorage.removeItem(`chat_access_${cacheKey}`);
    } catch (error) {
      console.warn('Failed to remove access permissions from localStorage:', error);
    }
  }

  /**
   * Clear all cached access permissions
   */
  clearAllCachedAccessPermissions(): void {
    this.accessPermissionsCache.clear();
    
    // Clear from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_access_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear access permissions from localStorage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number;
    validCached: number;
    expiredCached: number;
    memorySize: number;
    storageSize: number;
  } {
    const now = new Date();
    let validCount = 0;
    let expiredCount = 0;

    this.accessPermissionsCache.forEach(cached => {
      if (now <= cached.expiresAt) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    // Estimate storage size
    let storageSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_access_')) {
          const value = localStorage.getItem(key);
          if (value) {
            storageSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage size:', error);
    }

    return {
      totalCached: this.accessPermissionsCache.size,
      validCached: validCount,
      expiredCached: expiredCount,
      memorySize: this.accessPermissionsCache.size,
      storageSize
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    // Clean memory cache
    this.accessPermissionsCache.forEach((cached, key) => {
      if (now > cached.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.accessPermissionsCache.delete(key);
    });

    // Clean localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_access_')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsedData = JSON.parse(value);
              const expiresAt = new Date(parsedData.expiresAt);
              if (now > expiresAt) {
                keysToRemove.push(key);
              }
            } catch (parseError) {
              // Invalid data, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (expiredKeys.length > 0 || keysToRemove.length > 0) {
        console.log(`Cleaned up ${expiredKeys.length} memory cache entries and ${keysToRemove.length} storage entries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup expired cache from localStorage:', error);
    }
  }

  // ==================== NETWORK MONITORING ====================

  /**
   * Initialize network status monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.networkStatusSubject.next(true);
      console.log('Network status: Online');
      
      // Clean up expired cache when coming back online
      this.cleanupExpiredCache();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.networkStatusSubject.next(false);
      console.log('Network status: Offline');
    });

    // Initial network status
    this.networkStatusSubject.next(this.isOnline);
  }

  /**
   * Initialize offline cache from localStorage
   */
  private initializeOfflineCache(): void {
    try {
      // Load cached permissions from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_access_')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsedData = JSON.parse(value);
              const cached: CachedAccessPermission = {
                ...parsedData,
                cachedAt: new Date(parsedData.cachedAt),
                expiresAt: new Date(parsedData.expiresAt)
              };
              
              // Only load non-expired cache
              const now = new Date();
              if (now <= cached.expiresAt) {
                const cacheKey = `${cached.chatId}_${cached.userId}`;
                this.accessPermissionsCache.set(cacheKey, cached);
              }
            } catch (parseError) {
              console.warn('Failed to parse cached access permission:', parseError);
              // Remove invalid cache entry
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      console.log(`Loaded ${this.accessPermissionsCache.size} cached access permissions from storage`);
    } catch (error) {
      console.warn('Failed to initialize offline cache:', error);
    }

    // Set up periodic cache cleanup (every 10 minutes)
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000);
  }

  /**
   * Check if we should use cached data (offline or cache preference)
   */
  shouldUseCachedData(): boolean {
    return !this.isOnline;
  }

  /**
   * Get offline fallback message
   */
  getOfflineFallbackMessage(operation: string): string {
    return `${operation} - Using cached data (offline mode)`;
  }

  /**
   * Clear all loading states (useful for cleanup)
   */
  async clearAllLoadingStates(): Promise<void> {
    // Hide all active loading spinners
    const hidePromises = Array.from(this.activeLoadings.keys()).map(key => 
      this.hideLoadingSpinner(key)
    );
    await Promise.all(hidePromises);

    // Clear loading states
    this.loadingStates.next({});
  }

  /**
   * Get service status for debugging
   */
  getServiceStatus(): any {
    const cacheStats = this.getCacheStats();
    const currentStates = this.loadingStates.value;
    
    return {
      isOnline: this.isOnline,
      activeLoadings: this.activeLoadings.size,
      loadingStates: Object.keys(currentStates).length,
      cacheStats,
      networkStatus: this.isOnline ? 'online' : 'offline'
    };
  }
}