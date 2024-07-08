import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Config, UserAddress, geolocation } from 'kng2-core';
import { KngUtils, i18n } from 'src/app/common';
import { Loader } from "@googlemaps/js-api-loader"
import { HttpClient } from '@angular/common/http';
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
      address_postalcode_title: 'Aujourd\'hui nous livrons uniquement les code postaux proposés.',
      address_postalcode: 'Code postal',
      address_region: 'Région',
    },
    en: {
      address_street: 'Street, number*',
      address_floor: 'Floor*',
      address_postalcode_title: 'Today we deliver only the postal codes below.',
      address_postalcode: 'Postal code',
      address_region: 'Region',
    }
  };

  location = {lat:0, lng:0 };
  locations: string[];
  regions: string[];
  $address: FormGroup;

  @ViewChild('street') street: ElementRef;

  @Output() updated: EventEmitter<UserAddress|undefined> = new EventEmitter<UserAddress>();
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
    private $http: HttpClient
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
  }

  get isValid() {
    return this.$address.valid;
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
      geo: this.location
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

    this.loadAutocomplete().then(() => {
    });

  }

  async loadAutocomplete() {
    // const dev ='AIzaSyAOlRpmLYUNtJxGx-h6Dc_452aVB3AmLYQ';
    try {
      const apiKey = this.config.shared.keys.pubMap;
      const loader = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["places"]
      });
  
      await loader.load();

          // Vérifiez si l'objet google.maps est défini après le chargement
      if (!google || !google.maps) {
        return;
      }

      const findComponent = (place, type) => {
        const elem = place.address_components.find((comp) => comp.types.indexOf(type) > -1);
        return elem ? elem.short_name : '';
      }    

      
      const autocomplete = new google.maps.places.Autocomplete(this.street.nativeElement, { types: ['geocode'] });
      autocomplete.addListener('place_changed', () => {      
        const place = autocomplete.getPlace();
        this.street.nativeElement.disabled = false;
        console.log('KngAddressComponent: place_changed',place);
        if(!place||!place.address_components) {
          return;
        }
        const postalCode = findComponent(place, 'postal_code');
        const region = findComponent(place, "administrative_area_level_2");
        Object.assign(this.location,place.geometry.location.toJSON());
  
        this.$address.patchValue({street: place.name});
  
        if(postalCode) {
          this.$address.patchValue({postalCode: postalCode});
        }
        if(region) {
          this.$address.patchValue({region: region});
        }      
      });

  
    }catch(e) {
      console.log('KngAddressComponent: loadAutocomplete',e);
      
    }
    // get place service


  }

  isInvalid(controlName: string): boolean {
    const control = this.$address.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  async onGeoloc() {
    if (!this.$address.value.street) {
      return;
    }

    const context = {config:this.config,$http:this.$http};
    const result = await geolocation(this.address,context).toPromise();
    this.location = (result.geo&&result.geo.location) || this.location;

  }


  async onSave() {
    const address = this.address;
    if(!address.geo || !address.geo.lat) {
      const context = {config:this.config,$http:this.$http};
      const result = await geolocation(this.address,context).toPromise();
      address.geo = (result.geo&&result.geo.location) || this.location;
    }

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
