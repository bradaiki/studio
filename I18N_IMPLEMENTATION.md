# Internationalization (i18n) and Localization (l10n) Implementation

## Overview
Implemented comprehensive internationalization and localization support using `@ngx-translate` for runtime language switching in the Ionic Angular application.

## Supported Languages

1. **English (en)** 🇺🇸 - Default language
2. **Spanish (es)** 🇪🇸 - Español
3. **Japanese (ja)** 🇯🇵 - 日本語

## Features

### 1. Runtime Language Switching
- Users can switch languages without restarting the app
- Language preference is saved in localStorage
- Automatic browser language detection on first launch

### 2. Translation Files
Located in `src/assets/i18n/`:
- `en.json` - English translations
- `es.json` - Spanish translations
- `ja.json` - Japanese translations

### 3. Translation Service
**File**: `src/app/services/translation.service.ts`

Features:
- Centralized language management
- Language persistence
- Browser language detection
- Easy-to-use API for translations

### 4. Language Selector Component
**Location**: `src/app/components/language-selector/`

Features:
- Visual language selector with flags
- Popover interface for language selection
- Shows current language
- Highlights selected language

## Usage

### In Templates (HTML)

```html
<!-- Simple translation -->
<ion-title>{{ 'app.title' | translate }}</ion-title>

<!-- Translation with parameters -->
<p>{{ 'arts.results' | translate: {count: artCount} }}</p>

<!-- Translation in attributes -->
<ion-searchbar [placeholder]="'arts.search_placeholder' | translate"></ion-searchbar>
```

### In TypeScript

```typescript
import { TranslationService } from './services/translation.service';

constructor(private translationService: TranslationService) {}

// Get instant translation
const message = this.translationService.getTranslation('messages.saved');

// Get translation with parameters
const message = this.translationService.getTranslation('arts.results', { count: 5 });

// Get async translation
const message = await this.translationService.getTranslationAsync('messages.saved');

// Change language
this.translationService.setLanguage('es');

// Get current language
const currentLang = this.translationService.getCurrentLanguage();

// Get current language info
const langInfo = this.translationService.getCurrentLanguageInfo();
```

## Translation Keys Structure

```json
{
  "app": {
    "title": "Application title",
    "loading": "Loading message",
    ...
  },
  "tabs": {
    "feed": "Feed tab label",
    "arts": "Arts tab label",
    ...
  },
  "arts": {
    "title": "Arts page title",
    "search_placeholder": "Search placeholder",
    ...
  },
  ...
}
```

## Adding New Languages

### 1. Create Translation File
Create a new JSON file in `src/assets/i18n/`:
```bash
src/assets/i18n/fr.json  # For French
```

### 2. Add Language to Service
Update `src/app/services/translation.service.ts`:

```typescript
public readonly availableLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }  // New
];
```

### 3. Translate Content
Copy `en.json` and translate all values to the new language.

## Adding New Translation Keys

### 1. Add to English File
Add the key to `src/assets/i18n/en.json`:

```json
{
  "new_feature": {
    "title": "New Feature Title",
    "description": "New feature description"
  }
}
```

### 2. Add to All Language Files
Add the same key structure to `es.json`, `ja.json`, etc. with translated values.

### 3. Use in Application
```html
<h1>{{ 'new_feature.title' | translate }}</h1>
<p>{{ 'new_feature.description' | translate }}</p>
```

## Best Practices

### 1. Key Naming Convention
- Use dot notation for hierarchy: `section.subsection.key`
- Use lowercase with underscores: `my_feature_name`
- Be descriptive: `arts.search_placeholder` not `arts.sp`

### 2. Pluralization
Use separate keys for singular and plural:
```json
{
  "results": "{{count}} result found",
  "results_plural": "{{count}} results found"
}
```

### 3. Parameters
Use double curly braces for parameters:
```json
{
  "welcome": "Welcome, {{name}}!"
}
```

### 4. Fallback
Always provide English translations as fallback.

### 5. Context
Group related translations together:
```json
{
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "signup": "Sign Up"
  }
}
```

## Components Using Translations

### Currently Implemented
- ✅ Tabs Page (navigation labels)
- ✅ Language Selector Component
- ✅ Translation Service

### To Be Implemented
- ⏳ Arts Page
- ⏳ Studios Page
- ⏳ People Page
- ⏳ Events Page
- ⏳ Organizations Page
- ⏳ Feed Page
- ⏳ Profile Page
- ⏳ Auth Pages

## Testing

### Manual Testing
1. Open the application
2. Click the language selector (flag icon in header)
3. Select a different language
4. Verify all visible text changes
5. Refresh the page - language should persist
6. Check localStorage for saved language preference

### Automated Testing
```typescript
import { TranslationService } from './services/translation.service';

describe('TranslationService', () => {
  it('should change language', () => {
    service.setLanguage('es');
    expect(service.getCurrentLanguage()).toBe('es');
  });
  
  it('should get translation', () => {
    const translation = service.getTranslation('app.title');
    expect(translation).toBeTruthy();
  });
});
```

## Performance Considerations

1. **Lazy Loading**: Translation files are loaded on demand
2. **Caching**: Translations are cached after first load
3. **Bundle Size**: Each language file adds ~10-15KB to assets
4. **Memory**: Only current language is kept in memory

## Troubleshooting

### Translations Not Showing
1. Check if TranslateModule is imported in component
2. Verify translation key exists in JSON file
3. Check browser console for errors
4. Ensure translation files are in `src/assets/i18n/`

### Language Not Persisting
1. Check localStorage is enabled
2. Verify STORAGE_KEY in TranslationService
3. Check browser privacy settings

### Missing Translations
1. Falls back to English (default language)
2. Shows translation key if not found
3. Check browser console for warnings

## Future Enhancements

- [ ] Add more languages (French, German, Portuguese, Chinese, Korean)
- [ ] Implement date/time localization
- [ ] Add number formatting per locale
- [ ] Currency formatting
- [ ] RTL (Right-to-Left) language support
- [ ] Translation management UI
- [ ] Automatic translation suggestions
- [ ] Translation completion tracking
- [ ] Export/Import translation files
- [ ] Integration with translation services (Crowdin, Lokalise)

## Resources

- [ngx-translate Documentation](https://github.com/ngx-translate/core)
- [Angular i18n Guide](https://angular.io/guide/i18n)
- [Ionic Internationalization](https://ionicframework.com/docs/angular/your-first-app/internationalization)
- [Unicode CLDR](http://cldr.unicode.org/) - For locale data

## Support

For questions or issues with translations:
1. Check this documentation
2. Review translation files in `src/assets/i18n/`
3. Check TranslationService implementation
4. Consult ngx-translate documentation
