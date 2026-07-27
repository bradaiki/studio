import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'app_language';
  
  public readonly availableLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
  ];

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Set available languages
    const languageCodes = this.availableLanguages.map(lang => lang.code);
    this.translate.addLangs(languageCodes);

    // Get saved language or detect browser language
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const defaultLanguage = 'en';

    // Determine which language to use
    let languageToUse = defaultLanguage;
    
    if (savedLanguage && languageCodes.includes(savedLanguage)) {
      languageToUse = savedLanguage;
    } else if (browserLanguage && languageCodes.includes(browserLanguage)) {
      languageToUse = browserLanguage;
    }

    // Set the language
    this.translate.setDefaultLang(defaultLanguage);
    this.translate.use(languageToUse);
    
    console.log(`[Translation Service] Language initialized: ${languageToUse}`);
  }

  private getBrowserLanguage(): string | null {
    const browserLang = this.translate.getBrowserLang();
    return browserLang || null;
  }

  private getSavedLanguage(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  public getCurrentLanguage(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  public getCurrentLanguageInfo(): Language | undefined {
    const currentLang = this.getCurrentLanguage();
    return this.availableLanguages.find(lang => lang.code === currentLang);
  }

  public setLanguage(languageCode: string): void {
    if (this.availableLanguages.some(lang => lang.code === languageCode)) {
      this.translate.use(languageCode);
      localStorage.setItem(this.STORAGE_KEY, languageCode);
      console.log(`[Translation Service] Language changed to: ${languageCode}`);
    } else {
      console.error(`[Translation Service] Language not supported: ${languageCode}`);
    }
  }

  public getTranslation(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  public async getTranslationAsync(key: string, params?: any): Promise<string> {
    return new Promise((resolve) => {
      this.translate.get(key, params).subscribe(translation => {
        resolve(translation);
      });
    });
  }

  public getTranslations(keys: string[]): any {
    const translations: any = {};
    keys.forEach(key => {
      translations[key] = this.translate.instant(key);
    });
    return translations;
  }

  public onLanguageChange() {
    return this.translate.onLangChange;
  }
}
