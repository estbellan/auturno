import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AppLanguage, appTranslations } from './app-translations';

const LANGUAGE_STORAGE_KEY = 'auturno.language';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly languageSignal = signal<AppLanguage>(this.readStoredLanguage());

  readonly language = computed(() => this.languageSignal());
  readonly supportedLanguages: AppLanguage[] = ['es', 'en'];

  constructor() {
    effect(() => {
      const language = this.languageSignal();
      this.document.documentElement.lang = language;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    });
  }

  setLanguage(language: AppLanguage): void {
    this.languageSignal.set(language);
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    const dictionary = appTranslations[this.languageSignal()];
    const fallbackDictionary = appTranslations.es;
    const template = dictionary[key] ?? fallbackDictionary[key] ?? key;

    if (!params) {
      return template;
    }

    return Object.entries(params).reduce((message, [paramKey, value]) => {
      return message.replaceAll(`{{${paramKey}}}`, `${value ?? ''}`);
    }, template);
  }

  private readStoredLanguage(): AppLanguage {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'es';
  }
}
