import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { i18n } from '../i18n.service';
import {
  Config,
  CartSubscription,
  CartSubscriptionParams,
  CartItemFrequency,
  CartItem,
  CartService,
  LoaderService,
  Order,
  Hub,
  CartAction
} from 'kng2-core';
import { Subscription } from 'rxjs';



@Component({
  selector: 'kng-subscription-option',
  templateUrl: './kng-subscription-option.component.html',
  styleUrls: ['./kng-subscription-option.component.scss']
})
export class KngSubscriptionOptionComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private _i18n = {
    fr:{
      title:'Fréquence et jour de livraison.',
      title_time_contract:'Quand souhaitez vous être livré ?',
      title_time_contract_update:'La livraison est programmée à'
    },
    en:{
      title:'Frequency and delivery day',
      title_time_contract:'When would you like delivery?',
      title_time_contract_update:'Delivery is scheduled for'
    }
  }

  @Input() checkout:boolean;
  @Input() quiet:boolean;
  @Input() contract:CartSubscription;
  @Input() contractId:string;
  @Input() hub: Hub;
  @Input() shippingDay: Date;

  iterations=[
    {label:{fr:"Semaine",en:"Week"},id:"week" },
    {label:{fr:"14 jours",en:"Biweekly"},id:"2weeks" },
    {label:{fr:"Mois", en:"month"},id:"month" },
  ]

  config:Config;
  selIteration:any;
  selDayOfWeek:any;
  selTime:number;
  items:CartItem[];
  subscriptions:CartSubscription[];
  subscriptionParams:CartSubscriptionParams;
  shippingtimes:any;
  //
  // default shipping time for the week and saturday (12)
  defaultTime = [12,16];

  oneWeek: Date[];

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService,
    private $cdr: ChangeDetectorRef
  ) {
    this._subscription = new Subscription();
    this.items = [];
    this.subscriptions = [];
    this.subscriptionParams = {
        dayOfWeek:2,
        frequency:'week',
        activeForm: false
    };
    this.selTime = 16;
    const aweek = Order.fullWeekShippingDays(this.hub);
    this.oneWeek = Array.from({length: 30}).map((id,idx) => (new Date(aweek[0])).plusDays(idx));
    // this.oneWeek = Order.fullWeekShippingDays(this.hub);
    this.selDayOfWeek = this.findDayOfWeek(this.subscriptionParams.dayOfWeek);
    this.selIteration = this.findIteration(this.subscriptionParams.frequency);
    this.shippingtimes = {};

    // const shippingDay = this.currentShippingDay();
    // const specialHours = ((shippingDay.getDay() == 6)? 12:16);
  }

  get dayOfWeek() {
    const weekdays = (this.hub && this.hub.weekdays)? this.hub.weekdays:[2,3,5];
    const weekLabels = this.label.weekdays.split('_');
    const label:any = {};
    // label[this.locale]
    const result = weekdays.map( day => ({label:weekLabels[day],id:day}));
    return result;
  }

  get nextShippingDay() {
    if(!this.selDayOfWeek) {
      return this.oneWeek[0];
    }
    const day = this.selDayOfWeek.id;
    return this.oneWeek.find(date => date.getDay() == day);
  }

  get label() {
    return this.$i18n.label();
  }

  get i18n() {
    return this._i18n[this.locale];
  }

  get locale() {
    return this.$i18n.locale;
  }

  get update() {
    if(!this.contract){
      return false;
    }
    return this.contract.frequency == (this.selIteration&&this.selIteration.id);
  }

  get timeprice() {
    if(!this.selTime||!this.config.shared.shipping) {
      return 0;
    }
    return this.config.shared.shipping.pricetime[this.selTime];

  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  async ngOnInit(){
    this._subscription.add(
      this.$loader.update().subscribe(emit => {

        // ITEM_ADD       = 1,
        // ITEM_REMOVE    = 2,
        // ITEM_MAX       = 3,
        // CART_INIT      = 4,
        // CART_LOADED    = 5,
        // CART_LOAD_ERROR= 6,
        // CART_SAVE_ERROR= 7,
        // CART_ADDRESS   = 8,
        // CART_PAYMENT   = 9,
        // CART_SHIPPING   =10,
        if(emit.state && emit.state.action) {
          //this.currentShippingDay = this.$cart.getCurrentShippingDay();
          this.subscriptionParams = this.$cart.subscriptionGetParams();
          this.selDayOfWeek = this.findDayOfWeek(this.subscriptionParams.dayOfWeek);
          this.selIteration = this.findIteration(this.subscriptionParams.frequency);
          this.$cdr.markForCheck();
        }
        if(!emit.config) {
          return;
        }
        this.config = emit.config;
        const times = Object.keys(this.config.shared.shipping.pricetime || {});
        this.shippingtimes = times.reduce((shippingtimes,time)=> {
          shippingtimes[time]=emit.config.shared.hub.shippingtimes[time];
          return shippingtimes;
        },{});
      })
    );
  }

  findDayOfWeek(day:number) {
    const find = this.dayOfWeek.find(dayOf => dayOf.id==day);
    if(find) return find;
    // FIXME this should be done in the change hub service
    this.selDayOfWeek = this.dayOfWeek[0];
    this.subscriptionParams.dayOfWeek = this.selDayOfWeek.id;
    this.$cart.subscriptionSetParams(this.subscriptionParams, true);
    return this.selDayOfWeek;
  }

  findIteration(iteration:string|CartItemFrequency) {
    return this.iterations.find(it => it.id==iteration);
  }

  onSave(){
    this.subscriptionParams.dayOfWeek = this.selDayOfWeek.id;
    this.subscriptionParams.frequency = this.selIteration.id;
    this.subscriptionParams.time = this.selTime;
    this.$cart.subscriptionSetParams(this.subscriptionParams);

  }


}
