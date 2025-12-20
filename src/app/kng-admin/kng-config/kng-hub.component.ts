import { Component, OnInit, OnDestroy } from '@angular/core';

import { KngNavigationStateService, i18n, KngUtils } from '../../common';

// @deprecated MDC removed - TODO: replace with native alternatives
// import { MdcSnackbar, MdcDialogRef, MDC_DIALOG_DATA, MdcDialog } from '@angular-mdc/web';
type MdcSnackbar = any;
type MdcDialogRef<T> = any;
type MdcDialog = any;
const MDC_DIALOG_DATA = 'MDC_DIALOG_DATA';
import { FormBuilder} from '@angular/forms';

// import { CodeMirror } from 'codemirror';

import {
  LoaderService,
  Category,
  ConfigService,
  Config,
  UserAddress,
  HubService,
  Hub,
  OrderService,
  Order,
  ShopService,
  Shop
} from 'kng2-core';

import { ActivatedRoute } from '@angular/router';


/**
  name: string;
  //
  // instance of HUB based on a list of slug alias
  slug: string[];
  updated: Date;
  logo: string;

  address.streetAdress: string;
  address.postalCode: string;
  address.region: string;
  address.phone: string;
  address.geo.lat: number;
  address.geo.lng: number;

  // FIXME use i18n for mail content
  mail.address: string;
  mail.signature: string;
  mail.subject: string;

  //
  // HUB dedicated settings

  // HUB can be inactive, under construction
  status.reason.en|fr|de
  status.reason.active: boolean;

  // display message web maintenance (that mean that all shipping are off)
  maintenance.reason.en|fr|de
  maintenance.reason.active: boolean;

  header.message.en|fr|de
  header.reason.active: boolean;

  //
  // display checkout message
  checkout.title.en|fr|de
  checkout.address.en|fr|de
  checkout.payment.en|fr|de
  checkout.resume.en|fr|de
  checkout.message.en|fr|de
  checkout.active: boolean;

  //
  // list of deposit address
  deposits: DepositAddress[];

  //
  // list of closed dates
  noshipping: [{
    reason.en|fr|de
    from: Date;
    to: Date;
  }];

  siteName.en|fr|de
  siteName.image: string


  about.h.en|fr|de
  about.t.en|fr|de
  about.p.en|fr|de
  about.image: string;

  tagLine.t.en|fr|de
  tagLine.h.en|fr|de
  tagLine.p.en|fr|de
  tagLine.image: string;

  footer.t.en|fr|de
  footer.h.en|fr|de
  footer.p.en|fr|de
  footer.image: string;

  //
  // DEPRECATED remove home field
  home.shop.t.en|fr|de
  home.shop.h.en|fr|de
  home.shop.p.en|fr|de
  home.shop.image: string;

  home.selection.h.en|fr|de
  home.selection.t.en|fr|de
  home.selection.p.en|fr|de
  home.selection.image: string;

  home.howto.h.en|fr|de
  home.howto.t.en|fr|de
  home.howto.p.en|fr|de
  home.howto.image: string;

  //
  // Owner of the HUB
  manager?: string[];
  logistic?: string[];

  //
  // HUB dedicated configuration
  // limit HUB orders
  currentLimit: number;

  // additional limit for premium users. max orders = (currentLimit + premiumLimit)
  premiumLimit: number;

  // HUB fees added to the product price
  serviceFees: number;

  // order is in timeout if payment status != 'paid' and created<15m (timeoutAndNotPaid)
  timeoutAndNotPaid: number;

  // for testing 50 hours is the time limit between order and delivery
  // timelimit = monday 18:00 + timelimit = dayDest 9:00
  timelimit: number;

  //
  // stripe uncaptured charges expire in 7 days
  // https://support.stripe.com/questions/does-stripe-support-authorize-and-capture
  uncapturedTimeLimit: number;

  // order date range between day1 to day2 max 11:00. Lapse time = timelimit
  timelimitH: number;

  //
  // Dimanche(0), Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi
  weekdays: number[];

  // FIXME use i18n for times labels
  shippingtimes: {
    type: any;
    default: any;
  };


  //
  // constraint HuB to a list of categories and vendors
  categories: string[];
  vendors: string[];
 */

@Component({
  selector: 'kng-hub',
  templateUrl: './kng-hub.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHUBComponent implements OnInit, OnDestroy {

  hubs: Hub[];
  categories: Category[];
  config: Config;
  menus: any[];
  groups: string[];
  isLoading: boolean;
  isReady = false;
  currentHub: Hub;
  sixMOnth: Date;
  edit = {};




  constructor(
    public $dlg: MdcDialog,
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $hub: HubService,
    public $loader: LoaderService,
    public $shops: ShopService,
    public $route: ActivatedRoute,
    public $snack: MdcSnackbar,
    public $utils: KngUtils,
    public $navigation: KngNavigationStateService
  ) {
    // Cas normal: utilisation getLatestCoreData()
    const { config, categories } = this.$loader.getLatestCoreData();
    this.isLoading = false;
    this.isReady = true;
    this.config = config;
    this.categories = categories;
    //
    // HUB from config
    // this.currentHub = Object.assign({}, this.config.shared.hub);
    const hubSlug = (this.config.shared.hub)?this.config.shared.hub.slug:'artamis';
    //
    // create 6 month date
    this.sixMOnth = new Date(Date.now()-86400000*30*6);

    this.hubs = this.config.shared.hubs;

    //
    // HUB from DB
    this.$hub.get(hubSlug).subscribe(hub => {
      this.initHub(hub);
      Object.assign(this.currentHub, hub);
    }, (err) => this.$snack.open(err.error, 'OK'));

    this.$hub.list().subscribe(hubs => {
      hubs.forEach(hub=> hub.slug = hub.slug[0]);
      this.hubs = hubs;
    }, (err) => this.$snack.open(err.error, 'OK'));

  }


  // get codeMirror(): any {
  //   if (this._codeMirror) {
  //     return this._codeMirror;
  //   }

  //   this._codeMirror = require('codemirror');
  //   return this._codeMirror;
  // }

  addContent() {
    this.currentHub.home.content.push({
      t: { en: '', fr: '', de: ''},
      h: { en: '', fr: '', de: ''},
      p: { en: '', fr: '', de: ''}, image: null, target: ''
    });
  }


  initHub(hub) {
    this.currentHub = {} as Hub;
    this.currentHub.description = {fr: null, en: null, de: null};
    this.currentHub.logo = this.currentHub.logo || null;

    const format = (d: Date) => {
      d = new Date(d);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      // return day+'-'+month+'-'+d.getFullYear();
      return d.getFullYear() + '-' + month + '-' + day;
    };
    (hub.noshipping || []).forEach(noshipping => {
      noshipping.from = format(<Date>noshipping.from);
      noshipping.to = format(<Date>noshipping.to);
    });
  }

  ngOnInit() {
    this.$utils.getGeoCode().subscribe(result => {
      if(!result.geo) {
        return;
      }
      this.currentHub.address = result.address;
      this.currentHub.address.geo = result.geo || this.currentHub.address.geo;
    });

    //
    // Hugly way to load codeMirror
    // setTimeout(() => {
    //   document.querySelectorAll('.run-codemirror textarea').forEach(text => {
    //     this.codeMirror.fromTextArea(text, {
    //       lineNumbers: true,
    //       mode: 'htmlmixed'
    //     });
    //   })
    // }, 200);
  }

  ngOnDestroy() {

  }


  onDialogOpen(dialog) {
    if(!dialog || !dialog.done) {
      return;
    }
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.$snack.open(this.$i18n.label().img_max_sz, 'OK');
        return;
      }

      // FIXME remove timeout here
      setTimeout(()=> this.onHubSave() ,1000);
    });
  }


  onHubSave() {
    const weekdays: string|string[] = this.currentHub.weekdays as any;
    if(typeof weekdays == 'string'){
      this.currentHub.weekdays = weekdays.split(',').map(day => parseInt(day+'')) as number[];
    }
    this.isReady = false;
    this.isLoading = true;

    this.$hub.save(this.currentHub).subscribe(
      (hub) => {
        this.isReady = true;
        this.$snack.open(this.$i18n.label().save_ok, 'OK');
        Object.assign(this.config.shared.hub,hub);
        Object.assign(this.currentHub,hub);
        }, (err) => this.$snack.open(err.error, 'OK'),
      () => this.isLoading = false
    );
  }

  onHubSaveManager() {
    this.isReady = false;
    this.isLoading = true;
    this.$hub.saveManager(this.currentHub).subscribe(
      () => {
        this.isReady = true;
        this.$snack.open(this.$i18n.label().save_ok, 'OK');
        }, (err) => {
          this.isLoading = false;
          this.isReady = true;
          this.$snack.open(err.error, 'OK');
        }
    );
  }

  onAdminHubSave() {
    this.isReady = false;
    this.isLoading = true;
    this.$hub.saveAdmin(this.currentHub).subscribe(
      () => {
        this.isReady = true;
        this.$snack.open(this.$i18n.label().save_ok, 'OK');
        }, (err) => {
          this.isLoading = false;
          this.isReady = true;
          this.$snack.open(err.error, 'OK');
        }
    );
  }

  updateGeo($event) {
    const street = this.currentHub.address.streetAdress;
    const postal = this.currentHub.address.postalCode;
    const region = this.currentHub.address.region;

    //
    // detect change
    if (!street || !postal || [street, postal].indexOf($event) > -1) {
      return;
    }

    this.$utils.updateGeoCode(street, postal, region);
  }

}


@Component({
  selector: 'kng-hub',
  templateUrl: './kng-hub-manager.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHUBManagerComponent extends KngHUBComponent {

  mapVendors = {};
  mapCategories = {};
  vendors: Shop[];
  newUser: string;

  ngOnInit(){
    this.mapVendors = {};
    this.vendors = [];
    super.ngOnInit();

    this.$shops.query({ status: true }).subscribe(vendors => {
      this.vendors = vendors.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))
      this.vendors.forEach(vendor => this.mapVendors[vendor._id] = vendor.name);
      // console.log('---- DB ', this.vendors[5]);
      // console.log('---- DB ',  this.currentHub.vendors[0]);
    });

    this.categories.forEach(cat => this.mapCategories[cat._id]=cat);
  }

  addDate() {
    const day = new Date();
    this.currentHub.noshipping.push({reason: {
      en: '', fr: '', de: ''
    }, from: day, to: day});
  }


  getShopName(id) {
    return this.mapVendors[id];
  }

  getCategoryName(id) {
    return this.mapCategories[id].name;
  }


  getAvailableVendors(filter?) {
    return this.vendors.filter(vendor => {
      const a = this.currentHub.vendors.indexOf(vendor._id) === -1;
      const b = vendor.status || (vendor.created>this.sixMOnth)
      return a && b;
    });
  }

  getAvailableCategories(filter?) {
    return this.categories.sort((a,b)=> a.name.localeCompare(b.name))
  }



  //
  // vendors
  delCategory(idx: number) {
    this.currentHub.categories.splice(idx, 1);
  }

  //
  // manager
  delManager(idx: number) {
    this.currentHub.manager.splice(idx, 1);
  }

  addManager() {
    if (!this.currentHub.manager) {
      this.currentHub.manager = [];
    }

    this.currentHub.manager.push(this.newUser);
    this.newUser = null;
  }

  //
  // logistic
  addLogistic() {
    if (!this.currentHub.logistic) {
      this.currentHub.logistic = [];
    }

    this.currentHub.logistic.push(this.newUser);
    this.newUser = null;
  }

  delLogistic(idx: number) {
    this.currentHub.logistic.splice(idx, 1);
  }

  //
  // vendors
  delVendor(idx: number) {
    this.currentHub.vendors.splice(idx, 1);
  }

  onAddCategory($event) {
    this.currentHub.categories.push($event._id || $event.value);
  }

  onAddVendor($event) {
    this.currentHub.vendors.push($event._id || $event.value);
  }
}




@Component({
  selector: 'kng-information',
  templateUrl: './kng-hub-information.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngInformationCfgComponent extends KngHUBComponent {
}
