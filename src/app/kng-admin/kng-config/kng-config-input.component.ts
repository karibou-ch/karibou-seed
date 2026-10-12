import { Component, EventEmitter, forwardRef, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Config, Hub, UserAddress } from 'kng2-core';
import { Subscription } from 'rxjs';
import { i18n, KngNavigationStateService, KngUtils } from 'src/app/common';
import { AdminEditLocaleService, EditLocale, I18nText } from '../admin-edit-locale.service';
import { AdminShellService } from '../admin-shell.service';

type ConfigValue = string | UserAddress | boolean | null;

@Component({
  selector: 'kng-config-input',
  templateUrl: './kng-config-input.component.html',
  styleUrls: ['./kng-config-input.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => KngConfigInputComponent),
    multi: true
  }]
})
export class KngConfigInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private _value: ConfigValue = null;
  private subs = new Subscription();

  @Input() address?: Partial<UserAddress>;
  @Input() config: Config;
  @Input() withCheck: boolean;
  @Input() disabled = false;
  @Input() name: string;
  @Input() hubs: Hub[];
  @Input() clazz: string;
  @Input() format: string;
  @Input() checked: boolean;
  @Input() label: string;
  @Input() description: string;
  @Input() i18nField?: I18nText | null;
  @Input() geo: Record<string, unknown>;
  @Output() checkChange = new EventEmitter<boolean>();
  @Output() imageChange = new EventEmitter<string>();

  @HostBinding('class') readonly hostClass = 'config';
  @HostBinding('class.kng-is-filtered') filtered = false;

  locale: EditLocale = 'fr';

  constructor(
    private $i18n: i18n,
    private $util: KngUtils,
    private $navigation: KngNavigationStateService,
    private edit: AdminEditLocaleService,
    private shell: AdminShellService
  ) {}

  get i18n() {
    return this.$i18n;
  }

  get labels() {
    return this.$i18n.adm();
  }

  get store() {
    return this.$navigation.store;
  }

  get value() {
    return this._value;
  }

  set value(next: ConfigValue) {
    if (next !== undefined && this._value !== next) {
      this._value = next;
      this.onChange(next);
      this.onTouched();
    }
  }

  get displayValue(): string {
    if (this.i18nField) {
      return this.i18nField[this.locale] || '';
    }
    return typeof this._value === 'string' ? this._value : '';
  }

  get translatable(): boolean {
    return !!this.i18nField;
  }

  get missing(): boolean {
    return this.edit.isMissing(this.i18nField, this.locale);
  }

  get swatch(): string {
    return typeof this._value === 'string' && this._value ? this._value : 'transparent';
  }

  ngOnInit(): void {
    this.locale = this.edit.locale;
    this.subs.add(this.edit.locale$.subscribe(locale => this.locale = locale));
    this.subs.add(this.shell.search$.subscribe(() => {
      const hay = `${this.label || ''} ${this.description || ''}`;
      this.filtered = !this.shell.matches(hay);
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onUserInput(next: string): void {
    if (this.i18nField) {
      this.i18nField[this.locale] = next;
      return;
    }
    this.value = next;
  }

  copyFromFr(): void {
    this.edit.copyFromFr(this.i18nField);
  }

  isValueAddress(): boolean {
    const v = this._value;
    return !!(v && typeof v === 'object' && (v as UserAddress).streetAdress && (v as UserAddress).postalCode);
  }

  onChange: (value: ConfigValue) => void = () => {};
  onTouched: () => void = () => {};

  onUpload(event: { cdnUrl: string }): void {
    this.value = event.cdnUrl;
    this.imageChange.emit(this.value as string);
  }

  onDialogOpen(dialog: { done: (cb: (dlg: { state: () => string }) => void) => void }): void {
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.imageChange.emit('rejected');
      }
    });
  }

  ucValidator(info: { size: number | null }): void {
    if (info.size !== null && info.size > 1024 * 1024 * 10) {
      throw new Error('fileMaximumSize');
    }
  }

  getStaticMap(): string | undefined {
    if (!this.config || !this._value || typeof this._value !== 'object') {
      return;
    }
    return KngUtils.getStaticMap(this._value as UserAddress);
  }

  onCheck(checked: boolean): void {
    this.checkChange.emit(checked);
  }

  writeValue(value: ConfigValue): void {
    this._value = value;
  }

  registerOnChange(fn: (value: ConfigValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
