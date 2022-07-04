import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CartService, Config, LoaderService, Order } from 'kng2-core';
import { i18n } from '../i18n.service';

@Component({
  selector: 'kng-calendar',
  templateUrl: './kng-calendar.component.html',
  styleUrls: ['./kng-calendar.component.scss']
})
export class KngCalendarComponent implements OnInit {
  private _hideTitle = false;
  @Input() config: Config;
  @Input() set hideTitle(value){
    this._hideTitle = true;
  }
  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  labelTime: string;
  noshippingMsg: string;
  currentWeek:Date[];
  currentHub: any;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  isPremium:boolean;

  currentShippingDay: Date;
  availableDays:Date[];


  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService
  ) { 
    this.currentWeek = [];
    this.availableDays = [];
  }

  ngOnInit(): void {
    this.$loader.update().subscribe(emit => {
      if(emit.state) {
        this.currentShippingDay = this.$cart.getCurrentShippingDay();
        this.updated.emit(this.currentShippingDay);
      }
      if(!emit.config) {
        return;
      }
      this.config = emit.config;
      this.currentHub = this.config.shared.hub; 
      this.labelTime = this.config.shared.hub.shippingtimes[16]
      this.currentRanks = this.config.shared.currentRanks[this.currentHub.slug] || {};
      this.currentLimit = this.config.shared.hub.currentLimit || 1000;
      this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;

      //
      // validate shipping state
      this.noshippingMsg = this.getNoShippingMessage();
      this.currentWeek = Array.from({length: 7}).map((id,idx) => (new Date()).plusDays(idx));      
      this.availableDays = Order.fullWeekShippingDays();
      if(!this.isDayAvailable(this.currentWeek[0])){
        this.currentWeek.shift();
      }
    })
  }

  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
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

  doSetCurrentShippingDay($event, day: Date, idx: number) {
    if (!this.isDayAvailable(day)) {
      return;
    }
    // this.dialogRef.close(day);

    this.$cart.setShippingDay(day);
    this.updated.emit(day);
  }

  isDayAvailable(day: Date) {
    if(!day){
      return false;
    }
    if(!this.availableDays.some(date => date.equalsDate(day))){
      return false;
    }
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
