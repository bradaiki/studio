import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EnhancedStudioJoinRequest } from '../models/instructor-join-review.models';

interface CacheEntry {
  data: EnhancedStudioJoinRequest[];
  timestamp: number;
  totalCount: number;
  lastPage: number;
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  sortBy: 'requestedAt' | 'userName' | 'userEmail';
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestCacheService {
  private cache = new Map<string, CacheEntry>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 50; // Maximum number of cached studios
  
  // Pagination state management
  private paginationStates = new Map<string, PaginationConfig>();
  private paginationSubjects = new Map<string, BehaviorSubject<PaginationConfig>>();
  
  // Search and filter state
  private searchSubjects = new Map<string, BehaviorSubject<string>>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    // Clean up expired cache entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  /**
   * Get cached requests for a studio with pagination
   */
  getCachedRequests(studioId: string, config: PaginationConfig): EnhancedStudioJoinRequest[] | null {
    const cacheKey = this.getCacheKey(studioId, config);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache requests for a studio with pagination info
   */
  cacheRequests(
    studioId: string, 
    config: PaginationConfig, 
    requests: EnhancedStudioJoinRequest[], 
    totalCount: number
  ): void {
    const cacheKey = this.getCacheKey(studioId, config);
    
    // Implement LRU cache by removing oldest entries if we exceed max size
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(cacheKey, {
      data: requests,
      timestamp: Date.now(),
      totalCount,
      lastPage: config.page
    });
    
    console.log(`Cached ${requests.length} requests for studio ${studioId}, page ${config.page}`);
  }

  /**
   * Invalidate cache for a specific studio
   */
  invalidateStudioCache(studioId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${studioId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Invalidated cache for studio ${studioId}, removed ${keysToDelete.length} entries`);
  }

  /**
   * Invalidate specific request from all cached pages
   */
  invalidateRequest(studioId: string, requestId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${studioId}:`)) {
        // Remove the request from cached data
        entry.data = entry.data.filter(req => req.id !== requestId);
        entry.totalCount = Math.max(0, entry.totalCount - 1);
        
        // If page is now empty, remove the cache entry
        if (entry.data.length === 0) {
          this.cache.delete(key);
        }
      }
    }
    
    console.log(`Invalidated request ${requestId} from studio ${studioId} cache`);
  }

  /**
   * Get pagination configuration for a studio
   */
  getPaginationConfig(studioId: string): PaginationConfig {
    return this.paginationStates.get(studioId) || {
      page: 1,
      pageSize: 20,
      sortBy: 'requestedAt',
      sortOrder: 'desc'
    };
  }

  /**
   * Update pagination configuration for a studio
   */
  updatePaginationConfig(studioId: string, config: Partial<PaginationConfig>): void {
    const currentConfig = this.getPaginationConfig(studioId);
    const newConfig = { ...currentConfig, ...config };
    
    this.paginationStates.set(studioId, newConfig);
    
    // Notify subscribers
    if (!this.paginationSubjects.has(studioId)) {
      this.paginationSubjects.set(studioId, new BehaviorSubject(newConfig));
    } else {
      this.paginationSubjects.get(studioId)!.next(newConfig);
    }
  }

  /**
   * Subscribe to pagination changes for a studio
   */
  subscribeToPaginationChanges(studioId: string): Observable<PaginationConfig> {
    if (!this.paginationSubjects.has(studioId)) {
      const initialConfig = this.getPaginationConfig(studioId);
      this.paginationSubjects.set(studioId, new BehaviorSubject(initialConfig));
    }
    
    return this.paginationSubjects.get(studioId)!.asObservable();
  }

  /**
   * Set search term with debouncing
   */
  setSearchTerm(studioId: string, searchTerm: string, debounceMs: number = 300): void {
    // Clear existing debounce timer
    if (this.debounceTimers.has(studioId)) {
      clearTimeout(this.debounceTimers.get(studioId)!);
    }
    
    // Set new debounce timer
    const timer = setTimeout(() => {
      const currentConfig = this.getPaginationConfig(studioId);
      this.updatePaginationConfig(studioId, { 
        searchTerm: searchTerm.trim() || undefined,
        page: 1 // Reset to first page when searching
      });
      
      // Invalidate cache when search changes
      if (searchTerm.trim() !== (currentConfig.searchTerm || '')) {
        this.invalidateStudioCache(studioId);
      }
      
      // Notify search subscribers
      if (!this.searchSubjects.has(studioId)) {
        this.searchSubjects.set(studioId, new BehaviorSubject(searchTerm));
      } else {
        this.searchSubjects.get(studioId)!.next(searchTerm);
      }
      
      this.debounceTimers.delete(studioId);
    }, debounceMs);
    
    this.debounceTimers.set(studioId, timer);
  }

  /**
   * Subscribe to search term changes
   */
  subscribeToSearchChanges(studioId: string): Observable<string> {
    if (!this.searchSubjects.has(studioId)) {
      this.searchSubjects.set(studioId, new BehaviorSubject(''));
    }
    
    return this.searchSubjects.get(studioId)!.asObservable();
  }

  /**
   * Get current search term
   */
  getCurrentSearchTerm(studioId: string): string {
    return this.getPaginationConfig(studioId).searchTerm || '';
  }

  /**
   * Check if there are more pages available
   */
  hasMorePages(studioId: string): boolean {
    const config = this.getPaginationConfig(studioId);
    
    // Check if we have cached data that indicates total count
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${studioId}:`)) {
        const totalPages = Math.ceil(entry.totalCount / config.pageSize);
        return config.page < totalPages;
      }
    }
    
    return true; // Assume more pages if we don't have cached info
  }

  /**
   * Get total count for a studio (from cache)
   */
  getTotalCount(studioId: string): number | null {
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${studioId}:`)) {
        return entry.totalCount;
      }
    }
    
    return null;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cleared all request cache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; studios: number; totalRequests: number } {
    let totalRequests = 0;
    const studios = new Set<string>();
    
    for (const [key, entry] of this.cache.entries()) {
      totalRequests += entry.data.length;
      const studioId = key.split(':')[0];
      studios.add(studioId);
    }
    
    return {
      size: this.cache.size,
      studios: studios.size,
      totalRequests
    };
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Generate cache key for pagination config
   */
  private getCacheKey(studioId: string, config: PaginationConfig): string {
    const searchKey = config.searchTerm ? `search:${config.searchTerm}` : 'no-search';
    return `${studioId}:${config.page}:${config.pageSize}:${config.sortBy}:${config.sortOrder}:${searchKey}`;
  }

  /**
   * Cleanup resources for a studio
   */
  cleanupStudio(studioId: string): void {
    // Clear cache
    this.invalidateStudioCache(studioId);
    
    // Clear pagination state
    this.paginationStates.delete(studioId);
    
    // Complete and remove subjects
    if (this.paginationSubjects.has(studioId)) {
      this.paginationSubjects.get(studioId)!.complete();
      this.paginationSubjects.delete(studioId);
    }
    
    if (this.searchSubjects.has(studioId)) {
      this.searchSubjects.get(studioId)!.complete();
      this.searchSubjects.delete(studioId);
    }
    
    // Clear debounce timer
    if (this.debounceTimers.has(studioId)) {
      clearTimeout(this.debounceTimers.get(studioId)!);
      this.debounceTimers.delete(studioId);
    }
    
    console.log(`Cleaned up all resources for studio ${studioId}`);
  }
}