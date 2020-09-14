import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { i18n } from '../common';
import { Config, User } from 'kng2-core';

@Component({
  selector: 'kng-nav-marketplace',
  templateUrl: './kng-nav-marketplace.component.html',
  styleUrls: ['./kng-nav-marketplace.component.scss']
})
export class KngNavMarketplaceComponent implements OnInit {


  @Input() config: Config;
  @Input() currentShippingDay: Date;
  @Input() isPremium: boolean;

  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  open: boolean;
  labelTime: string;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  showHUBs: boolean;
  lockedHUB: boolean;
  currentHub: any;

  constructor(
    private $i18n: i18n,
  ) {

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

  }

  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
  }

  onLang($event, lang) {
    this.$i18n.locale = lang;
  }

  toggleStore($event) {
    this.showHUBs = ($event.target.id === 'hubs');
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
    if(!this.isDayAvailable(day)) {
      return this.i18n.label().nav_shipping_off;
    }
    return this.labelTime;
  }

  getShippingDays() {
    return this.config.shared.shippingweek;
  }
}
