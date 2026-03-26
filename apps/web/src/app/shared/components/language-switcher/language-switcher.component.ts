import { Component, inject } from '@angular/core';

import { AppLanguage } from '../../../core/i18n/app-translations';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'at-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);

  setLanguage(language: AppLanguage): void {
    this.i18n.setLanguage(language);
  }
}
