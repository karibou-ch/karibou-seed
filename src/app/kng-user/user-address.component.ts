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

  private _defaultUser: User = new User();

  @Output() updated: EventEmitter<AddressEvent> = new EventEmitter<AddressEvent>();

  @Input() small: boolean;
  @Input() user: User;
  @Input() address: UserAddress;
  @Input() action: boolean;
  @Input() set config(config: Config) {
    this.main(config);
  }

  i18n: any = {
    fr: {
      list_title: 'Vos adresses actives',
      list_select: 'Éditer une adresse',
      list_add: 'Ajouter ou éditer une adresse',
      address_edit: 'Modifer',
      address_street: 'Adresse*',
      address_floor: 'Étage*',
      address_postalcode_title: 'Aujourd\'hui nous livrons uniquement les code postaux proposés.',
      address_postalcode: 'Code postal',
      address_region: 'Région',
    },
    en: {
      list_title: 'Your active shipping addresses',
      list_select: 'Edit an address',
      list_add: 'Add a new shipping address',
      address_edit: 'Update',
      address_street: 'Street, number*',
      address_floor: 'Floor*',
      address_postalcode_title: 'Today we deliver only the postal codes below.',
      address_postalcode: 'Postal code',
      address_region: 'Region',
    }
  };

  $address: FormGroup;
  locations: string[];
  regions: string[];
  pubkeyMap: string;
  idx: number;
  geo: any;
  isLoading: boolean;
  collector$: Subscription;

  // utiliser l'api
  // https://tel.search.ch/api/help.fr.html
  constructor(
    public  $i18n: i18n,
    private $fb: FormBuilder,
    private $http: HttpClient,
    private $user: UserService,
    private $util: KngUtils
  ) {
    this.collector$ = new Subscription();
    this.isLoading = false;
    this.$address = this.$fb.group({
      'name':   ['', [Validators.required, Validators.minLength(3)]],
      'note':   [''],
      'floor':  ['', [Validators.required, Validators.minLength(1)]],
      'street': ['', [Validators.required, Validators.minLength(5)]],
      'region': ['', [Validators.required]],
      'postalCode': ['', [Validators.required, Validators.minLength(4)]],
      'phone':  ['', [Validators.required, Validators.minLength(10)]]
    });
    // [ngModelOptions]="{updateOn: 'blur'}"
  }

  ngOnDestroy() {
    if(this.collector$) {
      this.collector$.unsubscribe();
    }
  }

  get defaultUser() {
    return this.user || this._defaultUser;
  }


  get label() {
    return this.i18n[this.$i18n.locale];
  }  
  get locale() {
    return this.$i18n.locale;
  }

  //
  // entry poiont
  main(config: Config) {
    this.locations = config.shared.user.location.list.sort();
    this.regions = config.shared.user.region.list;
    this.pubkeyMap = config.shared.keys.pubMap || '';


    //
    // save phone
    if (this.user.phoneNumbers.length) {
      this.$address.patchValue({
        phone: this.user.phoneNumbers[0].number
      });
    }

    //
    // FIXME this line for universal app
    if (!window['google'] && config.shared.keys.pubMap) {
      const _m$ = this.$util.loadMap(config).subscribe(() => {
        // DONE!
      });
      this.collector$.add(_m$);
    }

    const _g$ = this.$util.getGeoCode().subscribe(
      (result) => {
        this.geo = (result.geo || {}).location;
        //
        // autofill region and location
        setTimeout(() => {
          (result.components || []).forEach(comp => {
            if (this.locations.indexOf(comp) > -1 && (this.$address.value.postalCode !== comp)) {
              this.$address.patchValue({postalCode: comp});
            }
            if (this.regions.indexOf(comp) > -1 && (this.$address.value.region !== comp)) {
              this.$address.patchValue({region: comp});
            }
          });
        }, 700);
       }
    );
    this.collector$.add(_g$);
  }

  getStaticMap(address: UserAddress) {
    return KngUtils.getStaticMap(address, this.pubkeyMap);
  }

  isSelectedAddress(address: UserAddress, idx: number) {
    return this.idx === idx;
  }

  onEmit(result: AddressEvent) {
    this.isLoading = false;
    this.updated.emit(result);
  }

  onGeloc(event?: { index: number, value: any }) {
    if (!this.$address.value.street) {
         return;
    }
    this.$util.updateGeoCode(this.$address.value.street,
                        this.$address.value.postalCode,
                        this.$address.value.region);
  }

  onSave() {
    this.isLoading = true;
    const tosave = new User(this.user);

    //
    // editable phone, max len == 1
    if (tosave.phoneNumbers.length) {
      tosave.phoneNumbers[0].number = this.$address.value.phone;
    }
    if (!tosave.phoneNumbers.length) {
      tosave.phoneNumbers.push({number: this.$address.value.phone, what: 'mobile'});
    }

    //
    // edit or create
    if ([0, 1, 2, 3, 4, 5, 6].indexOf(this.idx) > -1) {
      tosave.addresses[this.idx].name = this.$address.value.name,
      tosave.addresses[this.idx].streetAdress = this.$address.value.street,
      tosave.addresses[this.idx].floor = this.$address.value.floor,
      tosave.addresses[this.idx].region = this.$address.value.region,
      tosave.addresses[this.idx].postalCode = this.$address.value.postalCode,
      tosave.addresses[this.idx].note = this.$address.value.note;
    } else {
      this.idx = tosave.addresses.push(new UserAddress(
        this.$address.value.name,
        this.$address.value.street,
        this.$address.value.floor,
        this.$address.value.region,
        this.$address.value.postalCode,
        this.$address.value.note
      )) - 1;
    }

    //
    // update Geo localisation
    if (this.geo) {
      tosave.addresses[this.idx].geo = this.geo;
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
    const defaultAddress = {
      name: '',
      street: '',
      floor: '',
      region: address.region,
      postalCode: address.postalCode,
      note: ''
    };

    if (this.idx === idx) {
      this.idx = null;
      this.$address.patchValue(defaultAddress);
      return;
    }
    this.idx = idx;
    this.geo = null;
    this.$address.patchValue({
      name: address.name,
      street: address.streetAdress,
      floor: address.floor,
      region: address.region,
      postalCode: address.postalCode,
      note: address.note
    });
  }

}


