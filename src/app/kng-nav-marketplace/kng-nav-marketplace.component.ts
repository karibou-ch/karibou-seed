import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { i18n } from '../common';
import { Config } from 'kng2-core';
import { version } from '../../../package.json';
import { Router } from '@angular/router';

@Component({
  selector: 'kng-nav-marketplace',
  templateUrl: './kng-nav-marketplace.component.html',
  styleUrls: ['./kng-nav-marketplace.component.scss']
})
export class KngNavMarketplaceComponent implements OnInit,OnDestroy {
  private _open: boolean;


  @Input() config: Config;
  @Input() currentShippingDay: Date;
  @Input() isPremium: boolean;

  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  VERSION = version;
  labelTime: string;
  noshippingMsg: string;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  showHUBs: boolean;
  lockedHUB: boolean;
  currentHub: any;

  constructor(
    private $i18n: i18n,
    private $router: Router,
  ) {

  }

  ngOnDestroy() {
  }

  ngOnInit() {

    // FIXME remove hardcoded shippingtimes[16]
    this.currentHub = this.config.shared.hub;
    if (this.currentHub && this.currentHub.slug) {
      this.labelTime = this.config.shared.hub.shippingtimes[16] || 'loading...';
      this.currentRanks = this.config.shared.currentRanks[this.currentHub.slug] || {};
      this.currentLimit = this.config.shared.hub.currentLimit || 1000;
      this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
      this.lockedHUB = this.config.shared.hub.domainOrigin;
    }

    //
    // validate shipping state
    this.noshippingMsg = this.getNoShippingMessage();

  }

  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
  }

  set open(open: boolean) {
    if(open) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }

    this._open = open;
  }

  get open() {
    return this._open;
  }
  //
  // label is 'nav_no_shipping' or 'nav_no_shipping_long'
  getNoShippingMessage() {
    // const label = long ?  'nav_no_shipping_long' : 'nav_no_shipping';
    //
    // check window delivery
    if (!this.isDayAvailable(this.currentShippingDay)) {
      return this.$i18n[this.locale]['nav_no_shipping_long'];
    }


    //
    // check manager message
    const noshipping = this.config.noShippingMessage().find(shipping => !!shipping.message);
    return noshipping && noshipping.message[this.locale];
  }

  onLang($event, lang) {
    this.$i18n.locale = lang;
  }

  toggleStore(hub) {
    //
    // this HUB is running is own domain!!
    if (this.currentHub.domainOrigin) {
      // FIXME hardcoded link there
      window.location.href = 'https://karibou.ch/store/' + hub.slug + '/home';
    } else {
      window.location.href = '/store/' + hub.slug + '/home';
    }

  }

  doSetCurrentShippingDay($event, day: Date, idx: number) {
    if (!this.isDayAvailable(day)) {
      return;
    }
    // this.dialogRef.close(day);

    this.open = false;
    this.updated.emit({day});
  }

  isDayAvailable(day: Date) {
    const maxLimit = this.isPremium ? (this.currentLimit + this.premiumLimit) : this.currentLimit;
    return (this.currentRanks[day.getDay()] <= maxLimit);
  }

  getShippingText(day: Date) {
    if (!this.isDayAvailable(day)) {
      return this.i18n.label().nav_shipping_off;
    }
    return this.labelTime;
  }

  getShippingDays() {
    return this.config.shared.shippingweek;
  }
}
