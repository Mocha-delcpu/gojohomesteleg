import { TranslationDictionary } from './types';
import { en } from './en';
import { am } from './am';

export const i18n = {
  en,
  am,
  get(lang: 'en' | 'am' = 'en'): TranslationDictionary {
    return this[lang] || this.en;
  }
};
