import { Component, EventEmitter , Input, Output, OnDestroy } from '@angular/core';

import { User,
         UserAddress,
         UserService,
         Config,
         Utils} from 'kng2-core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { KngUtils, i18n } from '../common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';


export interface AddressEvent {
  address?: UserAddress;
  error?: Error|any;
}


@Component({
  selector: 'kng-user-address',
  templateUrl: './user-address.component.html',
  styleUrls: ['./user-address.component.scss']
})
export class AddressComponent implements OnDestroy{

  private _config: Config;
  private _defaultUser: User = new User();

  @Output() updated: EventEmitter<AddressEvent> = new EventEmitter<AddressEvent>();

  @Input() small: boolean;
  @Input() user: User;
  @Input() address: UserAddress;
  @Input() action: boolean;
  @Input() set config(config: Config) {
    this._config = config;
  }

  i18n: any = {
    fr: {
      list_title: 'Vos adresses actives',
      list_select: 'Éditer une adresse',
      list_add: 'Ajouter ou éditer une adresse',
      address_edit: 'Modifer',
    },
    en: {
      list_title: 'Your active shipping addresses',
      list_select: 'Edit an address',
      list_add: 'Add a new shipping address',
      address_edit: 'Update',
    }
  };

  idx: number;
  isLoading: boolean;

  constructor(
    public  $i18n: i18n,
    private $user: UserService
  ) {
    this.isLoading = false;
    this.idx = -1;
  }

  ngOnDestroy() {
  }

  ngOnInit() {
    this.address = new UserAddress({});
    if(this.user.addresses.length){
      this.address = this.user.addresses[0];
      this.idx = 0;
    }
  }

  get defaultUser() {
    return this.user || this._defaultUser;
  }


  get phone() {
    return this.defaultUser.phoneNumbers.length ? this.defaultUser.phoneNumbers[0].number : '';
  }

  get label() {
    return this.i18n[this.$i18n.locale];
  }
  get locale() {
    return this.$i18n.locale;
  }

  get config() {
    return this._config;
  }



  getStaticMap(address: UserAddress) {
    return KngUtils.getStaticMap(address);
  }

  isSelectedAddress(address: UserAddress, idx: number) {
    return this.idx === idx;
  }

  onEmit(result: AddressEvent) {
    this.isLoading = false;
    this.updated.emit(result);
  }

  onSave(address: UserAddress) {
    if(!address) {
      this.idx = -1;
      this.address = new UserAddress({});
      return;
    }
    this.isLoading = true;
    const tosave = new User(this.user);

    // save default phone
    if (!tosave.phoneNumbers.length && address.phone) {
      tosave.phoneNumbers.push({number: address.phone, what: 'mobile'});
    }

    // save address
    if(this.idx >= 0 ) {
      tosave.addresses[this.idx] = address;
    }else {
      this.idx = (tosave.addresses.push(address)) - 1;
    }


    this.$user.save(tosave).subscribe(
      user => this.onEmit({address: tosave.addresses[this.idx]}),
      err => this.onEmit({error: new Error(err.error)})
    );

  }

  removeAddress(address: UserAddress, idx: number) {
    this.isLoading = true;
    const tosave = new User(this.user);
    if (tosave.addresses[idx].streetAdress === address.streetAdress) {
      tosave.addresses.splice(idx, 1);
      this.$user.save(tosave).subscribe(
        user => this.onEmit({address: address}),
        err => this.onEmit({error: new Error(err.error)})
      );
    }
  }

  setAddress(address: UserAddress, idx: number) {
    if(idx === this.idx) {
      this.idx = -1;
      this.address = new UserAddress({});
      return;
    }
    this.idx = idx;
    this.address = address;
  }

}


