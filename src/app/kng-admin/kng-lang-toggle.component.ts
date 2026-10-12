import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { i18n } from '../common';
import { AdminEditLocaleService, EditLocale, I18nText } from './admin-edit-locale.service';

@Component({
  selector: 'kng-lang-toggle',
  template: `
    <div class="kng-lang-banner" *ngIf="banner; else compact">
      <p class="kng-lang-banner__text">
        <strong>{{ labels.edit_lang }} : {{ locale }}</strong>
        {{ labels.edit_lang_help }}
      </p>
      <ng-container *ngTemplateOutlet="radios"></ng-container>
    </div>
    <ng-template #compact>
      <ng-container *ngTemplateOutlet="radios"></ng-container>
    </ng-template>
    <ng-template #radios>
      <wa-radio-group class="kng-lang-toggle" size="small" orientation="horizontal"
                      [value]="locale" [label]="labels.edit_lang"
                      (change)="onChange($any($event.target).value)">
        <wa-radio appearance="button" value="fr">
          <span class="kng-lang-option">{{ labels.lang_source }}</span>
        </wa-radio>
        <wa-radio appearance="button" value="en">
          <span class="kng-lang-option">
            EN
            <span class="kng-lang-dot" *ngIf="missing('en')" [attr.aria-label]="labels.lang_missing"></span>
          </span>
        </wa-radio>
        <wa-radio appearance="button" value="de">
          <span class="kng-lang-option">
            DE
            <span class="kng-lang-dot" *ngIf="missing('de')" [attr.aria-label]="labels.lang_missing"></span>
          </span>
        </wa-radio>
      </wa-radio-group>
    </ng-template>
  `
})
export class KngLangToggleComponent implements OnInit, OnDestroy {
  @Input() banner = false;
  @Input() fields: Array<I18nText | null | undefined> = [];
  locale: EditLocale = 'fr';
  private sub?: Subscription;

  constructor(
    private edit: AdminEditLocaleService,
    public $i18n: i18n
  ) {}

  get labels() {
    return this.$i18n.adm();
  }

  ngOnInit(): void {
    this.locale = this.edit.locale;
    this.sub = this.edit.locale$.subscribe(locale => this.locale = locale);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onChange(locale: string): void {
    this.edit.setLocale(locale);
  }

  missing(locale: EditLocale): boolean {
    return (this.fields || []).some(field => this.edit.isMissing(field, locale));
  }
}
