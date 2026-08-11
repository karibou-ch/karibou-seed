import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Config, UserAddress, geoadmin, geolocation } from 'kng2-core';
import { i18n } from 'src/app/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
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

  addresses: any[] = [];
  isReady= false;
  location = {lat:0, lng:0 };
  locations: string[];
  regions: string[];
  $address: FormGroup;
  activeAddressIndex = -1;
  private addressSuggestionsClosed = new Subject<void>();

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
      phone: address.phone || ''
    }, { emitEvent: false });
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
      'phone':  ['', [Validators.minLength(10)]]
    });

    this.formTouched = false;
    this.formNeedsSave = false;

    // Suggestions are optional: stale requests are cancelled and failures never block free input.
    this.$address.get('street')!.valueChanges
      .pipe(
        tap(() => {
          this.location = {lat:0, lng:0};
          this.closeAddressSuggestions();
        }),
        debounceTime(500),
        distinctUntilChanged((prev, curr) => {
          return prev?.toLowerCase() === curr?.toLowerCase();
        }),
        switchMap(value => {
          if (!this.isReady || !value || value.length < 5) {
            return of([]);
          }
          const context = {config:this.config,$http:this.$http};
          return (geoadmin(value, context) as Observable<any[]>).pipe(
            takeUntil(this.addressSuggestionsClosed),
            catchError(() => of([]))
          );
        })
      )
      .subscribe((addresses: any[]) => {
        this.addresses = addresses || [];
        this.activeAddressIndex = -1;
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
    if(phone)address.phone = UserAddress.normalizePhone(phone);
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
    // if(this.phone){
    //   this.$address.get('phone').setValue(this.phone);
    // }

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

  onPhoneBlur() {
    const phone = this.$address.get('phone');
    const value = phone?.value;
    if (value) {
      phone.setValue(UserAddress.normalizePhone(value));
    }
    this.onFormBlur();
  }

  isInvalid(controlName: string): boolean {
    const control = this.$address.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSelectAddress(index: number) {
    const selected = this.addresses[index];
    if (!selected) {
      return;
    }

    this.location = {
      lat: selected.lat,
      lng: selected.lng
    };
    this.$address.patchValue({
      street: selected.street,
      postalCode: selected.postal,
      region: selected.region
    }, { emitEvent: false });
    this.closeAddressSuggestions();
    this.floor.nativeElement.focus();
  }

  onStreetKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeAddressSuggestions();
      event.stopPropagation();
      return;
    }

    if (!this.addresses.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      this.activeAddressIndex = (this.activeAddressIndex + 1) % this.addresses.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.activeAddressIndex = this.activeAddressIndex <= 0
        ? this.addresses.length - 1
        : this.activeAddressIndex - 1;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.activeAddressIndex >= 0) {
      event.preventDefault();
      this.onSelectAddress(this.activeAddressIndex);
    }
  }

  closeAddressSuggestions() {
    this.addressSuggestionsClosed.next();
    this.addresses = [];
    this.activeAddressIndex = -1;
  }

  async onGeoloc() {
    if (!this.$address.value.street) {
      return this.location;
    }

    const context = {config:this.config,$http:this.$http};
    try {
      const result = await geolocation(this.address,context).toPromise();
      this.location = (result.geo&&result.geo.location) || this.location;
    } catch (err) {
      // Geocoding enriches a free-form address but must not prevent saving it.
    }
    return this.location;
  }


  async onSave() {
    let address = this.address;
    if(!address.geo || !address.geo.lat) {
      await this.onGeoloc();
      address = this.address;
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
