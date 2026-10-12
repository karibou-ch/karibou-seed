import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type EditLocale = 'fr' | 'en' | 'de';

export interface I18nText {
  fr?: string | null;
  en?: string | null;
  de?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminEditLocaleService {
  private readonly subject = new BehaviorSubject<EditLocale>('fr');
  readonly locale$ = this.subject.asObservable();

  get locale(): EditLocale {
    return this.subject.value;
  }

  setLocale(locale: string): void {
    if (locale === 'fr' || locale === 'en' || locale === 'de') {
      this.subject.next(locale);
    }
  }

  text(field?: I18nText | null): string {
    if (!field) {
      return '';
    }
    return field[this.locale] || '';
  }

  isMissing(field?: I18nText | null, locale: EditLocale = this.locale): boolean {
    if (!field || locale === 'fr') {
      return false;
    }
    const source = (field.fr || '').trim();
    const value = (field[locale] || '').trim();
    return !!source && !value;
  }

  copyFromFr(field?: I18nText | null): void {
    if (!field || this.locale === 'fr') {
      return;
    }
    field[this.locale] = field.fr || '';
  }
}
