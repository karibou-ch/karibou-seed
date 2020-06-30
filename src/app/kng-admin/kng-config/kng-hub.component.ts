import { Component, OnInit, OnDestroy } from '@angular/core';

import { KngNavigationStateService, i18n, KngUtils } from '../../common';

import { MdcSnackbar, MdcDialogRef, MDC_DIALOG_DATA, MdcDialog } from '@angular-mdc/web';
import { FormBuilder} from '@angular/forms';

import {
  LoaderService,
  ConfigService,
  Config,
  UserAddress,
  HubService,
  Hub
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

  config: Config;
  menus: any[];
  groups: string[];
  isLoading: boolean;
  isReady = false;
  currentHub: Hub;



  constructor(
    public $dlg: MdcDialog,
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $hub: HubService,
    public $loader: LoaderService,
    public $route: ActivatedRoute,
    public $snack: MdcSnackbar,
    public $utils: KngUtils,
    public $navigation: KngNavigationStateService
  ) {
    this.isLoading = false;
    this.isReady = true;
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
    //
    // HUB from config
    this.currentHub = Object.assign({}, this.config.shared.hub);


    //
    // HUB from DB
    this.$hub.get(this.currentHub.slug).subscribe(hub => {
      this.currentHub = hub;
    }, (err) => this.$snack.open(err.error, 'OK'));
    // this.currentHub.maintenance.reason = this.currentHub.maintenance.reason || {};
    // this.currentHub.header.message = this.currentHub.header.message || {};
    // this.currentHub.checkout.address = this.currentHub.checkout.address || {};
    // this.currentHub.checkout.payment = this.currentHub.checkout.payment || {};
    // this.currentHub.checkout.message = this.currentHub.checkout.message || {};

  }


  ngOnInit() {
  }

  ngOnDestroy() {

  }


  onDialogOpen(dialog) {
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.$snack.open(this.$i18n.label().img_max_sz, 'OK');
        return;
      }
      this.onHubSave();
    });
  }


  onHubSave() {
    this.isReady = false;
    this.isLoading = true;
    this.$hub.save(this.currentHub).subscribe(
      () => {
        this.isReady = true;
        this.$snack.open(this.$i18n.label().save_ok, 'OK');
        }, (err) => this.$snack.open(err.error, 'OK'),
      () => this.isLoading = false
    );
  }

  updateGeo($event) {
    const street = this.currentHub.address.streetAdress;
    const postal = this.currentHub.address.postalCode;
    const region = this.currentHub.address.region;
    const hub = this.config.shared.hub;

    //
    // detect change
    if (!street || !postal || [hub.address.streetAdress, hub.address.postalCode].indexOf($event) > -1) {
      return;
    }

    this.$utils.getGeoCode(street, postal, region).subscribe(result => {
      if(!result.geo) {
        return;
      }
      this.currentHub.address = result.address;
      this.currentHub.address.geo = result.geo || this.currentHub.address.geo;
    },error => {
      console.log('---- error',error);
    })
  }

}


