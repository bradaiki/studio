# Translation Examples

## Quick Reference Guide

### Basic Usage in Templates

```html
<!-- Simple translation -->
<ion-title>{{ 'arts.title' | translate }}</ion-title>

<!-- Translation with placeholder -->
<ion-searchbar [placeholder]="'arts.search_placeholder' | translate"></ion-searchbar>

<!-- Translation with parameters -->
<p>{{ 'arts.results' | translate: {count: filteredArts.length} }}</p>
```

### Usage in TypeScript

```typescript
import { TranslationService } from './services/translation.service';

constructor(private translationService: TranslationService) {}

// Get instant translation
const title = this.translationService.getTranslation('arts.title');

// Get translation with parameters
const message = this.translationService.getTranslation('arts.results', { count: 5 });

// Change language
this.translationService.setLanguage('es'); // Spanish
this.translationService.setLanguage('ja'); // Japanese
this.translationService.setLanguage('en'); // English
```

## Example: Arts Page with Translations

### HTML Template
```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title>{{ 'arts.title' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <div class="arts-container">
    <!-- Search Bar -->
    <ion-searchbar 
      [(ngModel)]="searchTerm"
      [placeholder]="'arts.search_placeholder' | translate">
    </ion-searchbar>
    
    <!-- Category Segment -->
    <ion-segment [(ngModel)]="selectedCategory">
      <ion-segment-button value="my-arts">
        <ion-label>{{ 'arts.my_arts' | translate }}</ion-label>
      </ion-segment-button>
      <ion-segment-button value="all">
        <ion-label>{{ 'arts.all_arts' | translate }}</ion-label>
      </ion-segment-button>
      <ion-segment-button value="martial-arts">
        <ion-label>{{ 'arts.martial_arts' | translate }}</ion-label>
      </ion-segment-button>
    </ion-segment>
    
    <!-- Results Count -->
    <ion-text color="medium">
      <p>{{ (filteredArts.length === 1 ? 'arts.results' : 'arts.results_plural') | translate: {count: filteredArts.length} }}</p>
    </ion-text>
    
    <!-- Empty State -->
    <div *ngIf="filteredArts.length === 0" class="empty-state">
      <h3>{{ 'arts.no_arts' | translate }}</h3>
      <ion-button (click)="clearFilters()">
        {{ 'arts.clear_filters' | translate }}
      </ion-button>
    </div>
    
    <!-- Infinite Scroll -->
    <ion-infinite-scroll (ionInfinite)="loadMore($event)">
      <ion-infinite-scroll-content
        [loadingText]="'arts.loading_more' | translate">
      </ion-infinite-scroll-content>
    </ion-infinite-scroll>
  </div>
</ion-content>
```

### TypeScript Component
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-arts',
  templateUrl: 'arts.page.html',
  styleUrls: ['arts.page.scss'],
  imports: [
    // ... other imports
    TranslateModule
  ]
})
export class ArtsPage {
  // Component logic
}
```

## Example: Dynamic Toast Messages

```typescript
import { TranslationService } from './services/translation.service';
import { ToastController } from '@ionic/angular/standalone';

constructor(
  private translationService: TranslationService,
  private toastController: ToastController
) {}

async showSuccessMessage() {
  const message = this.translationService.getTranslation('messages.saved');
  const toast = await this.toastController.create({
    message: message,
    duration: 2000,
    color: 'success'
  });
  await toast.present();
}

async showErrorMessage() {
  const message = this.translationService.getTranslation('errors.unknown');
  const toast = await this.toastController.create({
    message: message,
    duration: 2000,
    color: 'danger'
  });
  await toast.present();
}
```

## Example: Conditional Translations

```html
<!-- Show different message based on condition -->
<h3>
  {{ selectedCategory === 'my-arts' ? 
     ('arts.no_my_arts' | translate) : 
     ('arts.no_arts' | translate) }}
</h3>

<!-- Button with conditional text -->
<ion-button (click)="clearFilters()">
  {{ selectedCategory === 'my-arts' ? 
     ('arts.explore_all' | translate) : 
     ('arts.clear_filters' | translate) }}
</ion-button>
```

## Example: Difficulty Levels

```html
<!-- Translate difficulty level -->
<ion-chip [color]="getDifficultyColor(art.difficulty)">
  <ion-label>{{ 'arts.difficulty_levels.' + art.difficulty | translate }}</ion-label>
</ion-chip>

<!-- Translate intensity level -->
<ion-chip [color]="getIntensityColor(art.physicalDemands)">
  <ion-label>{{ 'arts.intensity_levels.' + art.physicalDemands | translate }}</ion-label>
</ion-chip>
```

## Example: Event Types

```html
<!-- Translate event type -->
<ion-chip [color]="getEventTypeColor(event.type)">
  {{ 'events.event_types.' + event.type | translate }}
</ion-chip>
```

## Example: Pluralization

```typescript
// In translation file (en.json)
{
  "studios": {
    "members": "{{count}} member",
    "members_plural": "{{count}} members"
  }
}
```

```html
<!-- In template -->
<p>
  {{ (studio.memberCount === 1 ? 'studios.members' : 'studios.members_plural') 
     | translate: {count: studio.memberCount} }}
</p>
```

## Example: Language Selector in Profile Page

```html
<!-- Language Settings Card -->
<ion-card class="language-card">
  <ion-card-header>
    <ion-card-title>
      <ion-icon name="language-outline" color="primary"></ion-icon>
      {{ 'profile.language' | translate }}
    </ion-card-title>
  </ion-card-header>

  <ion-card-content>
    <ion-item lines="none">
      <ion-label>
        <h3>{{ 'profile.language' | translate }}</h3>
        <p>Choose your preferred language</p>
      </ion-label>
      <app-language-selector></app-language-selector>
    </ion-item>
  </ion-card-content>
</ion-card>
```

## Testing Translations

### Manual Testing Steps
1. Open the application
2. Click the language selector (flag icon)
3. Select Spanish (🇪🇸)
4. Verify all text changes to Spanish
5. Select Japanese (🇯🇵)
6. Verify all text changes to Japanese
7. Refresh the page
8. Verify language persists

### Browser Console Testing
```javascript
// Check current language
localStorage.getItem('app_language')

// Change language manually
localStorage.setItem('app_language', 'es')
location.reload()
```

## Common Patterns

### Loading States
```html
<ion-spinner *ngIf="loading"></ion-spinner>
<p *ngIf="loading">{{ 'common.loading' | translate }}</p>
```

### Error Messages
```html
<ion-text color="danger" *ngIf="error">
  {{ 'errors.network' | translate }}
</ion-text>
```

### Action Buttons
```html
<ion-button (click)="save()">
  {{ 'app.save' | translate }}
</ion-button>

<ion-button (click)="cancel()">
  {{ 'app.cancel' | translate }}
</ion-button>

<ion-button (click)="delete()">
  {{ 'app.delete' | translate }}
</ion-button>
```

### Form Labels
```html
<ion-item>
  <ion-label position="floating">{{ 'auth.email' | translate }}</ion-label>
  <ion-input type="email"></ion-input>
</ion-item>

<ion-item>
  <ion-label position="floating">{{ 'auth.password' | translate }}</ion-label>
  <ion-input type="password"></ion-input>
</ion-item>
```

## Best Practices

1. **Always use translation keys** - Never hardcode text
2. **Group related translations** - Use dot notation for hierarchy
3. **Provide context** - Use descriptive key names
4. **Handle pluralization** - Use separate keys for singular/plural
5. **Test all languages** - Verify translations work correctly
6. **Keep translations updated** - Add new keys to all language files
7. **Use parameters** - For dynamic content like counts and names
8. **Fallback to English** - Always provide English translations

## Next Steps

To fully implement translations across the app:

1. Add TranslateModule to each page component
2. Replace hardcoded text with translation pipes
3. Update TypeScript code to use TranslationService
4. Test each page in all languages
5. Add missing translation keys as needed
6. Update documentation with new keys
