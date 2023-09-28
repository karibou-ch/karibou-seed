import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CartSubscription, CartSubscriptionParams, CartItemFrequency, CartItem, CartService, LoaderService, Order, Hub } from 'kng2-core';
import { i18n } from '../common';


export interface SubscriptionFrequency {
  interval:'day' | 'month' | 'week' | 'year';
  dayOfWeek:2|3|4|5;
}

@Component({
  selector: 'kng-subscription-option',
  templateUrl: './kng-subscription-option.component.html',
  styleUrls: ['./kng-subscription-option.component.scss']
})
export class KngSubscriptionOptionComponent implements OnInit {

  private _iteration;
  private _dayOfWeek;

  @Input() checkout:boolean;
  @Input() quiet:boolean;
  @Input() hub: Hub;

  iterations=[
    {label:"Semaine",id:"week" },
    {label:"Mois",id:"month" },
  ]
  dayOfWeek=[
    {label:"Mardi",id:2},
    {label:"Mercredi",id:3},
    {label:"Vendredi",id:5}
  ]
  items:CartItem[];
  subscriptions:CartSubscription[];
  subscriptionParams:CartSubscriptionParams;

  oneWeek: Date[];

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService,
    private $cdr: ChangeDetectorRef
  ) { 
    this.items = [];
    this.subscriptions = [];
    this.subscriptionParams = {
        dayOfWeek:2,
        frequency:'week',
        activeForm: false
    };
    this.oneWeek = Order.fullWeekShippingDays(this.hub);
  }

  get nextShippingDay() {
    const day = this.selectedDayOfWeekLabel.id;
    return this.oneWeek.find(date => date.getDay() == day);
  }

  get selectedIteration() {
    return this._iteration || 0;
  }

  get selectedIterationLabel() {
    return this.iterations[this._iteration||0];
  }


  get selectedDayOfWeek() {
    return this._dayOfWeek || 0;
  }

  get selectedDayOfWeekLabel() {
    return this.dayOfWeek[this._dayOfWeek||0];
  }


  set selectedIteration(idx) {
    this._iteration = idx;
    this.subscriptionParams.frequency = this.iterations[idx].id ;
  }

  set selectedDayOfWeek(idx) {
    this._dayOfWeek = idx;
    this.subscriptionParams.dayOfWeek = this.dayOfWeek[idx].id;
  }

  get label() {
    return this.$i18n.label();
  }

  get locale() {
    return this.$i18n.locale;
  }


  async ngOnInit(){

    //this.subscriptions = await this.$cart.subscriptionsGet().toPromise();
    this.updateContext();

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
        this.updateContext();
        this.$cdr.markForCheck();

      }
      if(!emit.config) {
        return;
      }
    });
  }

  updateContext() {
    switch(this.subscriptionParams.dayOfWeek) {
      case 3:
      this._dayOfWeek = 1;break;
      case 5:
      this._dayOfWeek = 2;break;
      default:
      this._dayOfWeek = 0;break;
    }

    switch(this.subscriptionParams.frequency) {
      case "month":
      this._iteration = "week";break;
      default:
      this._iteration = 0;break;
    }
  }

}
