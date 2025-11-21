import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Config, UserAddress, geoadmin, geolocation } from 'kng2-core';
import { i18n } from 'src/app/common';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
declare const google;

@Component({
  selector: 'kng-address',
  templateUrl: './kng-address.component.html',
  styleUrls: ['./kng-address.component.scss']
})
export class KngAddressComponent implements OnInit {


  i18n: any = {
    fr: {
      address_street: 'Adresse*',
      address_floor: 'Étage*',
      address_postalcode_title: 'Désolé, le code postal n\'est pas encore disponible pour la livraison',
      address_postalcode: 'Code postal',
      address_region: 'Région (automatique)',
    },
    en: {
      address_street: 'Street, number*',
      address_floor: 'Floor*',
      address_postalcode_title: 'Sorry, the postal code is not yet available for delivery.',
      address_postalcode: 'Postal code',
      address_region: 'Region (autocomplete)',
    }
  };

  addresses = [];
  isReady= false;
  location = {lat:0, lng:0 };
  locations: string[];
  regions: string[];
  $address: FormGroup;

  //
  // tracking form state
  formTouched: boolean;
  formNeedsSave: boolean;

  @ViewChild('street') street!: ElementRef;
  @ViewChild('floor') floor!: ElementRef;


  @Output() updated: EventEmitter<UserAddress|undefined> = new EventEmitter<UserAddress>();
  @Input() title:string;
  @Input() config:Config;
  @Input() phone: string;
  @Input() displayClear: boolean;
  @Input() set address(address: UserAddress){
    this.location = address.geo;
    this.$address.get('name')?.reset();
    this.$address.get('phone')?.reset();
    this.$address.setValue({
      name: address.name,
      note: address.note,
      floor: address.floor,
      street: address.streetAdress,
      region: address.region,
      postalCode: address.postalCode,
      phone: address.phone || this.phone || ''
    });
  }


  constructor(
    public  $i18n: i18n,
    private $fb: FormBuilder,
    private $http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.$address = this.$fb.group({
      'name':   ['', [Validators.required, Validators.minLength(3)]],
      'note':   [''],
      'floor':  ['', [Validators.required, Validators.minLength(1)]],
      'street': ['', [Validators.required, Validators.minLength(5)]],
      'region': ['', [Validators.required]],
      'postalCode': ['', [Validators.required, Validators.minLength(4)]],
      'phone':  ['', [Validators.required, Validators.minLength(10)]]
    });

    this.formTouched = false;
    this.formNeedsSave = false;

    // Listen to changes on the 'street' field with a debounce of 500ms
    this.$address.get('street').valueChanges
      .pipe(
        debounceTime(500),
        filter(value => value && value.length >= 5), // ✅ Ne déclenche que si la valeur a au moins 5 caractères
        distinctUntilChanged((prev, curr) => {
          // ✅ Ignore seulement si les valeurs sont identiques (case-insensitive)
          return prev?.toLowerCase() === curr?.toLowerCase();
        })
      )
      .subscribe(value => {
        this.onStreetChange(value);
      });

  }

  get isValid() {
    return this.$address.valid;
  }

  get isPostalValid() {
    const pc = this.$address.value.postalCode;
    if(!pc.length) {
      return true;
    }
    return this.locations.indexOf(pc)>-1;
  }

  get isClear() {
    return this.address.name === '' &&
           this.address.streetAdress === '' &&
           this.address.floor === '';
  }

  get address() {
    const address:UserAddress = {
      name: this.$address.value.name,
      streetAdress: this.$address.value.street,
      floor: this.$address.value.floor,
      region: this.$address.value.region,
      postalCode: this.$address.value.postalCode,
      note: this.$address.value.note,
      geo: this.location,
      type: 'customer'
    };
    const phone = this.$address.value.phone;
    if(phone)address.phone = phone;
    return address;
  }

  get glabel() {
    return this.$i18n.label();
  }

  get label() {
    return this.i18n[this.$i18n.locale];
  }
  get locale() {
    return this.$i18n.locale;
  }


  ngOnInit(): void {
    if(!this.config) throw new Error('KngAddressComponent: config is required');

    this.locations = this.config.shared.user.location.list.sort();
    this.regions = this.config.shared.user.region.list.sort();

    this.isReady = true;
    // this.loadAutocomplete().then(() => {
    // });
    if(this.phone){
      this.$address.get('phone').setValue(this.phone);
    }

    // ✅ Track changes sur tous les champs du formulaire
    this.$address.valueChanges.subscribe(() => {
      this.formTouched = true;
      this.checkFormNeedsSave();
    });

  }

  //
  // Check si le formulaire est valide mais pas sauvegardé
  checkFormNeedsSave() {
    // ✅ Utiliser setTimeout pour déférer au prochain cycle
    // Cela évite ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.formNeedsSave = this.formTouched && this.$address.valid;
      this.cdr.detectChanges();
    });
  }

  //
  // Appelé quand le formulaire perd le focus
  onFormBlur() {
    if (this.formTouched) {
      this.checkFormNeedsSave();
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.$address.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  //
  // update address with the current text or selection
  // - selection is the index of the dropdown list
  onBlurOrSelect(selection?){
    if (selection<0 || selection == undefined) {
      let street = this.$address.value.street;
      selection = this.addresses.findIndex(option => option.street.indexOf(street)>-1);
    }

    const idx = selection;
    if(idx==-1){
      return;
    }

    this.address.geo = {
      lat:this.addresses[idx].lat,
      lng:this.addresses[idx].lng
    }
    this.address.postalCode = this.addresses[idx].postal;
    this.address.region = this.addresses[idx].region;

    this.$address.patchValue({ street:this.addresses[idx].street });
    this.$address.patchValue({ postalCode: this.addresses[idx].postal });
    this.$address.patchValue({ region: this.addresses[idx].region });
    this.addresses = [];
    this.isReady = false;

    setTimeout(() => {
      this.floor.nativeElement.focus();
      this.isReady = true;
    },500);
  }

  async onStreetChange(street) {
    if(!this.isReady){
      return;
    }


    this.addresses = [];
    const context = {config:this.config,$http:this.$http};
    this.addresses = await geoadmin(street,context).toPromise();
    if(this.addresses.length==1) {
      // ✅ FIX: Mettre à jour les coordonnées GPS
      this.location = {
        lat: this.addresses[0].lat,
        lng: this.addresses[0].lng
      };

      this.$address.patchValue({ street:this.addresses[0].street.trim() });
      this.$address.patchValue({ postalCode: this.addresses[0].postal });
      this.$address.patchValue({ region: this.addresses[0].region });
      this.addresses = [];
    }
  }

  async onGeoloc() {
    if (!this.$address.value.street) {
      return;
    }

    const context = {config:this.config,$http:this.$http};
    const result = await geolocation(this.address,context).toPromise();
    return this.location = (result.geo&&result.geo.location) || this.location;
  }


  async onSave() {
    const address = this.address;
    if(!address.geo || !address.geo.lat) {
      this.address.geo = await this.onGeoloc();
    }

    // ✅ Réinitialiser les flags après succès
    this.formTouched = false;
    this.formNeedsSave = false;

    this.updated.emit(address);
  }

  onCancel() {
    this.street.nativeElement.disabled = false;
    this.$address.get('phone')?.reset();
    this.$address.get('street')?.reset();
    this.$address.get('floor')?.reset();
    this.updated.emit();
  }
}
