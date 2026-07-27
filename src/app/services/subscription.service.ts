import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly STORAGE_KEY = 'app_subscription_status';
  private statusSubject = new BehaviorSubject<SubscriptionStatus>(this.loadStatus());
  public status$ = this.statusSubject.asObservable();

  constructor() {}

  private loadStatus(): SubscriptionStatus {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const status: SubscriptionStatus = JSON.parse(saved);
        // Check if premium has expired
        if (status.tier === 'premium' && status.expiresAt) {
          if (new Date(status.expiresAt) < new Date()) {
            return { tier: 'free', expiresAt: null, isActive: true };
          }
        }
        return status;
      }
    } catch (e) {
      console.error('[SubscriptionService] Error loading status:', e);
    }
    return { tier: 'free', expiresAt: null, isActive: true };
  }

  private saveStatus(status: SubscriptionStatus): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    this.statusSubject.next(status);
  }

  isPremium(): boolean {
    const status = this.statusSubject.value;
    if (status.tier !== 'premium') return false;
    if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
      // Expired — revert to free
      this.saveStatus({ tier: 'free', expiresAt: null, isActive: true });
      return false;
    }
    return true;
  }

  getTier(): SubscriptionTier {
    return this.isPremium() ? 'premium' : 'free';
  }

  getStatus(): SubscriptionStatus {
    return this.statusSubject.value;
  }

  /**
   * Upgrade to premium. In production, this would be called after
   * a successful payment via Stripe, Google Play, or App Store.
   */
  upgradeToPremium(expiresAt?: string): void {
    const status: SubscriptionStatus = {
      tier: 'premium',
      expiresAt: expiresAt || null,
      isActive: true
    };
    this.saveStatus(status);
    console.log('[SubscriptionService] Upgraded to premium');
  }

  /**
   * Downgrade back to free tier.
   */
  downgradeToFree(): void {
    this.saveStatus({ tier: 'free', expiresAt: null, isActive: true });
    console.log('[SubscriptionService] Downgraded to free');
  }

  shouldShowAds(): boolean {
    return !this.isPremium();
  }
}
