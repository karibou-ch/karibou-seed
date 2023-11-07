import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
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



@Component({
  selector: 'kng-subscription-option',
  templateUrl: './kng-subscription-option.component.html',
  styleUrls: ['./kng-subscription-option.component.scss']
})
export class KngSubscriptionOptionComponent implements OnInit {

  private _i18n = {
    fr:{
      title:'Décidez de la fréquence de livraison et du jour qui vous arrange pour les produits dans votre panier.',
      title_time_contract:'Quand souhaitez vous être livré ?',
      title_time_contract_update:'La livraison est programmée à'
    },
    en:{
      title:'Decide on the delivery frequency and day that suits you for the products in your basket.',
      title_time_contract:'When would you like delivery?',
      title_time_contract_update:'Delivery is scheduled for'
    }
  }

  @Input() checkout:boolean;
  @Input() quiet:boolean;
  @Input() contract:CartSubscription;
  @Input() hub: Hub;
  @Input() shippingDay: Date;

  iterations=[
    {label:{fr:"Semaine",en:"Week"},id:"week" },
    {label:{fr:"Mois", en:"month"},id:"month" },
  ]
  dayOfWeek=[
    {label:{fr:"Mardi",en:"Tuesday"},id:2},
    {label:{fr:"Mercredi",en:"Wednesday"},id:3},
    {label:{fr:"Vendredi",en:"Friday"},id:5}
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
    this.items = [];
    this.subscriptions = [];
    this.subscriptionParams = {
        dayOfWeek:2,
        frequency:'week',
        activeForm: false
    };
    this.selTime = 16;
    this.oneWeek = Order.fullWeekShippingDays(this.hub);
    this.selDayOfWeek = this.findDayOfWeek(this.subscriptionParams.dayOfWeek);
    this.selIteration = this.findIteration(this.subscriptionParams.frequency);
    this.shippingtimes = {};

    // const shippingDay = this.currentShippingDay();
    // const specialHours = ((shippingDay.getDay() == 6)? 12:16);

}

  get nextShippingDay() {
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

  async ngOnInit(){


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
    });
  }

  findDayOfWeek(day:number) {
    return this.dayOfWeek.find(dayOf => dayOf.id==day);
  }

  findIteration(iteration:string|CartItemFrequency) {
    return this.iterations.find(it => it.id==iteration);
  }

  onSave(){
    this.subscriptionParams.dayOfWeek = this.selDayOfWeek.id;
    this.subscriptionParams.frequency = this.selIteration.id;
    this.subscriptionParams.time = this.selTime;
    this.$cart.subscriptionSetParams(this.subscriptionParams);
    this.$cart.save({action:CartAction.CART_SUBSCRIPTION});
  }


}
