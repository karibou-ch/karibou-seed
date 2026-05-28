import { Component, forwardRef, Input, EventEmitter, Output, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Config, Hub, UserAddress } from 'kng2-core';
import { i18n, KngUtils, KngNavigationStateService } from 'src/app/common';

type ConfigValue = string | UserAddress | null;

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
export class KngConfigInputComponent implements ControlValueAccessor {
  private _value: ConfigValue = null;
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
  @Input() geo: Record<string, unknown>;
  @Output() checkChange = new EventEmitter<boolean>();
  @Output() imageChange = new EventEmitter<string>();

  @HostBinding('class') readonly hostClass = 'config';

  constructor(
    private $i18n: i18n,
    private $util: KngUtils,
    private $navigation: KngNavigationStateService
  ) {}

  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get menuElements() {
    const admin = this.$navigation.getMenuItems('admin');
    return admin;
  }

  get store() {
    return this.$navigation.store;
  }

  get HUBs() {
    return this.hubs || this.$navigation.HUBs;
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

  //
  // verify the case of the value is an address
  isValueAddress(): boolean {
    const v = this._value;
    return !!(v && typeof v === 'object' && (v as UserAddress).streetAdress && (v as UserAddress).postalCode);
  }

  onChange: (value: ConfigValue) => void = () => {};
  onTouched: () => void = () => {};


  onUpload(event: { cdnUrl: string }): void {
    this.value = event.cdnUrl;
    this.imageChange.emit(this.value);
  }

  onDialogOpen(dialog: { done: (cb: (dlg: { state: () => string }) => void) => void }): void {
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.imageChange.emit('rejected');
      }
    });
  }

  onLang(_event: Event, lang: string): void {
    this.$i18n.locale = lang;
  }

  ucValidator(info: { size: number | null }): void {
    if (info.size !== null && info.size > 1024 * 1024 * 10) {
      throw new Error('fileMaximumSize');
    }
  }

  getStaticMap(): string | undefined {
    if (!this.config || !this._value || typeof this._value === 'string') {
      return;
    }
    return KngUtils.getStaticMap(this._value);
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
