import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SubscriptionService } from '../../services/subscription.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showAds) {
      <div class="ad-container" [ngClass]="'ad-' + format">
        <div class="ad-label">Advertisement</div>
        <div class="ad-slot" #adContainer>
          <!-- Real AdSense ad (only rendered in production with valid config) -->
          @if (isProduction && hasValidConfig) {
            <ins
              class="adsbygoogle"
              [style.display]="'block'"
              [style.width]="'100%'"
              [style.height]="format === 'banner' ? '90px' : '250px'"
              [attr.data-ad-client]="adClient"
              [attr.data-ad-slot]="adSlotId"
              [attr.data-ad-format]="
                format === 'banner' ? 'horizontal' : 'auto'
              "
              [attr.data-full-width-responsive]="'true'"
            >
            </ins>
          }
          <!-- Placeholder shown in development or when AdSense isn't configured -->
          @if (!isProduction || !hasValidConfig) {
            <div class="ad-placeholder">
              <div class="placeholder-icon">📢</div>
              <div class="placeholder-text">Ad Space</div>
              <div class="placeholder-subtext">
                {{
                  format === 'banner' ? '320×50 Banner' : '300×250 Rectangle'
                }}
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ad-container {
        width: 100%;
        text-align: center;
        background: var(--ion-color-light, #f4f4f4);
        border-top: 1px solid var(--ion-color-light-shade, #ddd);
        border-bottom: 1px solid var(--ion-color-light-shade, #ddd);
        padding: 4px 8px;
        overflow: hidden;
        box-sizing: border-box;
      }
      .ad-label {
        font-size: 9px;
        color: var(--ion-color-medium, #999);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .ad-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      .ad-banner .ad-slot {
        min-height: 50px;
        max-height: 90px;
      }
      .ad-rectangle .ad-slot {
        min-height: 250px;
      }
      .ad-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 50px;
        background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 8px;
      }
      .ad-banner .ad-placeholder {
        min-height: 50px;
        max-height: 90px;
        flex-direction: row;
        gap: 8px;
      }
      .ad-rectangle .ad-placeholder {
        min-height: 250px;
      }
      .placeholder-icon {
        font-size: 20px;
      }
      .placeholder-text {
        font-size: 12px;
        font-weight: 600;
        color: #666;
      }
      .placeholder-subtext {
        font-size: 10px;
        color: #999;
      }
    `,
  ],
})
export class AdBannerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('adContainer') adContainer!: ElementRef;

  /** Your AdSense publisher ID (ca-pub-XXXXXXXXXXXXXXXX) */
  @Input() adClient = '';

  /** The ad unit slot ID */
  @Input() adSlotId = '';

  /** Ad format: 'banner' for thin horizontal, 'rectangle' for in-feed */
  @Input() format: 'banner' | 'rectangle' = 'banner';

  showAds = true;
  isProduction = environment.production;
  hasValidConfig = false;
  private subscription?: Subscription;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.showAds = this.subscriptionService.shouldShowAds();
    this.hasValidConfig = !!(
      this.adClient &&
      this.adSlotId &&
      !this.adClient.includes('XXXX') &&
      this.adSlotId !== '1234567890'
    );

    this.subscription = this.subscriptionService.status$.subscribe(() => {
      this.showAds = this.subscriptionService.shouldShowAds();
    });
  }

  ngAfterViewInit(): void {
    if (this.showAds && this.isProduction && this.hasValidConfig) {
      this.loadAd();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadAd(): void {
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle = adsbygoogle;
      adsbygoogle.push({});
    } catch (e) {
      console.warn('[AdBanner] AdSense not loaded:', e);
    }
  }
}
