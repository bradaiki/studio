# i18n Quick Start Guide

## 🚀 5-Minute Setup for New Pages

### Step 1: Import TranslateModule
Add to your component imports:

```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-your-page',
  templateUrl: './your-page.html',
  imports: [
    // ... other imports
    TranslateModule  // Add this
  ]
})
```

### Step 2: Use Translation Pipe in Template
Replace hardcoded text:

```html
<!-- Before -->
<ion-title>My Page</ion-title>

<!-- After -->
<ion-title>{{ 'mypage.title' | translate }}</ion-title>
```

### Step 3: Add Translation Keys
Add to all language files (`en.json`, `es.json`, `ja.json`):

```json
{
  "mypage": {
    "title": "My Page",
    "description": "Page description"
  }
}
```

### Step 4: Test
1. Run `npm start`
2. Click language selector (flag icon)
3. Switch languages
4. Verify text changes

## 📝 Common Patterns

### Page Title
```html
<ion-title>{{ 'page.title' | translate }}</ion-title>
```

### Search Placeholder
```html
<ion-searchbar [placeholder]="'page.search' | translate"></ion-searchbar>
```

### Button Text
```html
<ion-button>{{ 'app.save' | translate }}</ion-button>
```

### With Parameters
```html
<p>{{ 'page.results' | translate: {count: items.length} }}</p>
```

### Loading Text
```html
<ion-infinite-scroll-content
  [loadingText]="'page.loading_more' | translate">
</ion-infinite-scroll-content>
```

## 🎯 Translation Key Naming

Use this pattern: `section.subsection.key`

Examples:
- `arts.title` - Arts page title
- `arts.search_placeholder` - Arts search placeholder
- `arts.no_results` - Arts empty state message
- `studios.my_studios` - My Studios tab label
- `events.register` - Register button text

## 🌍 Supported Languages

- 🇺🇸 English (en) - Default
- 🇪🇸 Spanish (es)
- 🇯🇵 Japanese (ja)

## 🔧 Using TranslationService

For dynamic translations in TypeScript:

```typescript
import { TranslationService } from './services/translation.service';

constructor(private translationService: TranslationService) {}

// Get translation
const message = this.translationService.getTranslation('messages.saved');

// With parameters
const text = this.translationService.getTranslation('arts.results', { count: 5 });

// Change language
this.translationService.setLanguage('es');
```

## ✅ Checklist for New Pages

- [ ] Import TranslateModule
- [ ] Replace all hardcoded text with translation pipes
- [ ] Add translation keys to en.json
- [ ] Copy and translate keys to es.json
- [ ] Copy and translate keys to ja.json
- [ ] Test in all 3 languages
- [ ] Verify no missing keys in console

## 🐛 Troubleshooting

**Problem**: Translation not showing
- ✅ Check TranslateModule is imported
- ✅ Verify key exists in JSON files
- ✅ Check browser console for errors

**Problem**: Shows translation key instead of text
- ✅ Key doesn't exist in current language file
- ✅ Add the key to the language file

**Problem**: Language not changing
- ✅ Clear browser cache
- ✅ Check localStorage for 'app_language'
- ✅ Verify translation files loaded (Network tab)

## 📚 Full Documentation

- [I18N_IMPLEMENTATION.md](./I18N_IMPLEMENTATION.md) - Complete guide
- [TRANSLATION_EXAMPLES.md](./TRANSLATION_EXAMPLES.md) - Usage examples
- [I18N_SUMMARY.md](./I18N_SUMMARY.md) - Implementation summary

## 💡 Pro Tips

1. **Copy from existing pages** - Look at tabs.page.html for examples
2. **Use consistent naming** - Follow existing key patterns
3. **Test early** - Switch languages while developing
4. **Group related keys** - Keep translations organized
5. **Reuse common keys** - Use `app.*` and `common.*` keys

---

**Need Help?** Check the full documentation or existing translated components!
