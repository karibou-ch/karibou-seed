import { Component, forwardRef, Input, EventEmitter, Output, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Config, Hub, UserAddress } from 'kng2-core';
import { i18n, KngUtils, KngNavigationStateService } from 'src/app/common';
import { MdcDialog } from '@angular-mdc/web';
import { KngUploadcareComponent } from '../kng-uploadcare';

// Create a mgModel Component
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
  private _value: string | any;
  @Input() address: UserAddress;
  @Input() config: Config;
  @Input() withCheck: boolean;
  @Input() disabled = false;
  @Input() name: string;
  @Input() hubs: Hub[];
  @Input() clazz: string;
  @Input() format: string;
  @Input() checked: boolean;
  @Input() label: string;
  @Input() geo: {};
  @Output() checkChange = new EventEmitter<string>();
  @Output() imageChange = new EventEmitter<any>();


  constructor(
    private $i18n: i18n,
    private $util: KngUtils,
    private $navigation: KngNavigationStateService,
    private $dlg: MdcDialog
  ) {
  }

  @HostBinding('class.config') true;

  // adminMenu(store: string){
  //   const menus = location.pathname.split('/');
  //   return '/store/' + store + '/admin/' + menus[menus.length - 1];
  // }
  changeHub(hub) {
    const menus = location.pathname.split('/');
    const slug = this.getHubSlug(hub);
    if (!slug) {
      return;
    }
    location.href = '/store/' + slug + '/admin/' + menus[menus.length - 1];
  }

  isCurrentHub(slug){
    return location.pathname.indexOf('store/' + slug) > -1;
  }

  getHubSlug(hub) {
    if (!hub || !hub.slug) {
      return '';
    }
    return Array.isArray(hub.slug) ? hub.slug[0] : hub.slug;
  }

  get adminMenu() {
    const menus = location.pathname.split('/');
    return '/admin/' + menus[menus.length - 1];
  }

  get i18n(){
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

  set value($value) {
    if ($value !== undefined && this._value !== $value) {
      this._value = $value;
      //
      // case of address
      // if (this.address && this.format !== 'geo') {
      //   KngConfigInputComponent._geo$.next(this.address);
      // }

      this.onChange($value);
      this.onTouched($value);
    }
  }

  //
  // verify the case of the value is an address
  isValueAddress() {
    return this._value && this._value.streetAdress && this._value.postalCode;
  }

  // Function to call when the input changes.
  onChange = (text: string) => {};

  // Function to call when the input is touched (when check is clicked).
  onTouched = (text: string) => {};


  onUpload($event) {
    this.value = $event.cdnUrl;
    this.imageChange.emit(this.value);
  }

  onDialogOpen(dialog) {
    dialog.done(async dlg => {
      if (dlg.state() === 'rejected') {
        this.imageChange.emit('rejected');
      }
    });
  }

  openUploadcareGallery() {
    const dialogRef = this.$dlg.open(KngUploadcareComponent, {
      escapeToClose: true,
      clickOutsideToClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(url => {
      if (!url) {
        return;
      }
      this.value = url;
      this.imageChange.emit(this.value);
    });
  }

  onLang($event, lang) {
    this.$i18n.locale = lang;
  }


  ucValidator(info) {
      if (info.size !== null && info.size > 1024 * 1024 * 10) {
      throw new Error('fileMaximumSize');
    }
  }

  getStaticMap() {
    if (!this.config || !this._value) {
      return;
    }
    return KngUtils.getStaticMap(this._value);
  }

  // onGeloc(address) {
  //   const street = (address.streetAddress || address.street);o
  //   if (!street) {
  //        return;
  //   }
  //   this.$util.getGeoCode(street,
  //                       address.postalCode,
  //                       address.region).subscribe(result => {
  //       this._value.geo = (result.geo || {}).location;
  //       this.value = this._value;
  //   });
  // }



  onCheck($event) {
    this.checkChange.emit($event.checked);
  }

  writeValue(value: string): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
