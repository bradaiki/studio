import { Component, signal } from '@angular/core';

import {
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  PopoverController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { languageOutline, checkmark } from 'ionicons/icons';
import {
  TranslationService,
  Language,
} from '../../services/translation.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, TranslateModule],
})
export class LanguageSelectorComponent {
  availableLanguages = signal<Language[]>([]);
  currentLanguage = signal('');

  constructor(
    private translationService: TranslationService,
    private popoverController: PopoverController,
  ) {
    addIcons({ languageOutline, checkmark });
    this.availableLanguages.set(this.translationService.availableLanguages);
    this.currentLanguage.set(this.translationService.getCurrentLanguage());

    // Subscribe to language changes
    this.translationService.onLanguageChange().subscribe(() => {
      this.currentLanguage.set(this.translationService.getCurrentLanguage());
    });
  }

  async presentLanguagePopover(event: Event) {
    const popover = await this.popoverController.create({
      component: LanguageListComponent,
      event: event,
      translucent: true,
      componentProps: {
        languages: this.availableLanguages(),
        currentLanguage: this.currentLanguage(),
        onLanguageSelect: (languageCode: string) => {
          this.selectLanguage(languageCode);
          popover.dismiss();
        },
      },
    });

    await popover.present();
  }

  selectLanguage(languageCode: string) {
    this.translationService.setLanguage(languageCode);
    this.currentLanguage.set(languageCode);
  }

  getCurrentLanguageInfo(): Language | undefined {
    return this.translationService.getCurrentLanguageInfo();
  }
}

// Inline component for the language list popover
@Component({
  selector: 'app-language-list',
  template: `
    <ion-list>
      @for (language of languages; track language) {
        <ion-item
          button
          (click)="onLanguageSelect(language.code)"
          [class.selected]="language.code === currentLanguage"
        >
          <span class="language-flag">{{ language.flag }}</span>
          <ion-label>
            <h3>{{ language.nativeName }}</h3>
            <p>{{ language.name }}</p>
          </ion-label>
          @if (language.code === currentLanguage) {
            <ion-icon name="checkmark" color="primary" slot="end"> </ion-icon>
          }
        </ion-item>
      }
    </ion-list>
  `,
  styles: [
    `
      .language-flag {
        font-size: 1.5rem;
        margin-right: 12px;
      }

      ion-item.selected {
        --background: var(--ion-color-primary-tint);
      }

      ion-label h3 {
        font-weight: 600;
        margin-bottom: 4px;
      }

      ion-label p {
        font-size: 0.85rem;
        color: var(--ion-color-medium);
      }
    `,
  ],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonIcon],
})
export class LanguageListComponent {
  languages: Language[] = [];
  currentLanguage: string = '';
  onLanguageSelect: (languageCode: string) => void = () => {};
}
