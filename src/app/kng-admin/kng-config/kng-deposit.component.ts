import { Component, Inject} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Config, UserAddress, User, Hub, HubService, DepositAddress } from 'kng2-core';
import { i18n, KngUtils } from 'src/app/common';
import { HttpClient } from '@angular/common/http';
import { MDC_DIALOG_DATA, MdcDialogRef, MdcSnackbar } from '@angular-mdc/web';
import { KngHUBComponent } from './kng-hub.component';

@Component({
  templateUrl: './kng-deposit-dlg.component.html',
  styleUrls: ['./kng-config-dlg.component.scss'],

})
export class KngDepositDlgComponent {

  error: string;
  pubMap: string;
  STATIC_MAP = 'https://maps.googleapis.com/maps/api/staticmap?';

  constructor(
    public $http: HttpClient,
    public $dlgRef: MdcDialogRef<KngDepositDlgComponent>,
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $util: KngUtils,
    private $snackbar: MdcSnackbar,
    @Inject(MDC_DIALOG_DATA) public data: any
  ) {

      this.address = data.edit ? data.edit.address : {};
      this.idx = data.edit ? data.edit.idx : null;
      this.pubMap = data.pubMap;
  }

  address: any;
  idx: any;

  //
  // init formBuilder
  // init formBuilder
  form = this.$fb.group({
    'weight': ['', [Validators.required, Validators.min(0)]],
    'active': ['', []],
    'name': ['', [Validators.required]],
    'streetAddress': ['', [Validators.required, Validators.minLength(4)]],
    'floor': ['', [Validators.required, Validators.minLength(1)]],
    'postalCode': ['', [Validators.required, Validators.minLength(4)]],
    'region': ['', [Validators.required]],
    'note': ['', [Validators.required]],
    'fees': ['', [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.updateMap();

    this.$util.getGeoCode().subscribe((result) => {
      if (!result.geo.location ) {return; }
      this.address.geo = {
        lat: result.geo.location.lat,
        lng: result.geo.location.lng
      };
    },status => {
      this.$snackbar.open(status.message || status, undefined, {
        dismiss: true
      });
    });
  }

  askSave() {
    if (this.form.invalid) {
      return;
    }

    this.$dlgRef.close(this.form.value);

  }
  addAddress() {
    
  }

  askDelete() {
    this.$dlgRef.close('delete');
  }

  askDecline() {
    this.$dlgRef.close('decline');
  }

  getStaticMap(address: UserAddress) {
    return KngUtils.getStaticMap(address, this.pubMap);
  }


  updateMap() {
    let lastlen = 0, newlen;

     this.form.valueChanges.subscribe(value => {
      newlen = [value.streetAddress, value.postalCode, value.region].join(',').length;
      if (Math.abs(lastlen - newlen) < 2 ||
        !value.name ||
        !value.streetAddress || (value.streetAddress === '') ||
        !value.postalCode || (value.postalCode === '') ||
        !value.region) {
        return;
      }
      lastlen = newlen;
      // get geo only if last value changed more than 3 chars
      this.$util.updateGeoCode(value.streetAddress, value.postalCode, value.region)
    });

  }

}



@Component({
  selector: 'kng-deposit',
  templateUrl: './kng-deposit.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngDepositComponent extends KngHUBComponent {

  currentHub: Hub;
  pubMap: string;
  //
  // edit content
  edit: {
    idx: number;
    address: any;
    form: any;
  };


  assign(value) {
    const lang = this.$i18n.locale;
    this.edit.address.fees = value.fees;
    this.edit.address.weight = value.weight;
    this.edit.address.name = value.name;
    // FIXME streetAddress vs streetAdress !
    this.edit.address.streetAdress = value.streetAddress;
    this.edit.address.floor = value.floor;
    this.edit.address.postalCode = value.postalCode;
    this.edit.address.region = value.region;
    this.edit.address.note = value.note;
    this.edit.address.active = value.active;
  }

  ngConstruct() {
    //
    // HUB from config
    const hubSlug = this.config.shared.hub? this.config.shared.hub.slug:'artamis';
    //
    // HUB from DB
    this.$hub.get(hubSlug).subscribe(hub => {
      this.initHub(hub);
      Object.assign(this.currentHub, hub);
    }, (err) => this.$snack.open(err.error, 'OK'));


    //
    // init edit struct
    this.edit = {
      idx: null,
      form: null,
      address: null
    };
  }

  ngOnInit() {
    super.ngOnInit();
    this.pubMap = this.config.shared.keys.pubMap;
  }

  getStaticMap(address: UserAddress) {
    return KngUtils.getStaticMap(address, this.pubMap);
  }

  onDelete($event) {
    if (this.edit.idx == null) {
      // FIXME place the string in our i18n service
      return window.alert('Impossible de supprimer cet élément');
    }
    this.currentHub.deposits.splice(this.edit.idx, 1);
    this.$hub.saveManager(this.currentHub).subscribe(() => {
      this.edit.address = null;
      this.$snack.open(this.$i18n.label().save_ok, 'OK');
    },
    (err) => this.$snack.open(err.error, 'OK'));
    return false;
  }

  onDecline() {
    this.edit.idx = null;
    this.edit.address = null;
  }


  //
  // save specific address
  onSave(value) {
    this.isReady = false;    
    this.assign(value);
    if (this.edit.idx == null) {
      this.currentHub.deposits = this.currentHub.deposits || [];
      this.edit.idx = this.currentHub.deposits.push(<DepositAddress>{}) - 1;
    }
    Object.assign(this.currentHub.deposits[this.edit.idx], this.edit.address);

    this.$hub.saveManager(this.currentHub).subscribe(() => {
      this.edit.address = null;
      this.isReady = true;
      this.$snack.open(this.$i18n.label().save_ok, 'OK');
    },
    (err) => this.$snack.open(err.error, 'OK'));
    return false;
  }
  onAddressCreate() {
    this.edit.idx = null;
    this.edit.address = {};
    this.edit.address.fees = 0;
    const dialogRef = this.$dlg.open(KngDepositDlgComponent, {
      data: this.edit
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'close') {
        this.onDecline();
      } else if (typeof result === 'object') {
            this.onSave(result);
      }
    });
}

  onAddressSelect($event, address, i) {
    this.edit.idx = i;
    this.edit.address = address;
    this.edit.address = address;
    const dialogRef = this.$dlg.open(KngDepositDlgComponent, {
      data: {
        pubMap: this.pubMap,
        edit: this.edit
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      // on delete
      if (result === 'delete') {
        return this.onDelete($event);
      }
      // on Save
      if (typeof result === 'object') {
        return this.onSave(result);
      }
      // on close
      this.onDecline();
    });
}
}
