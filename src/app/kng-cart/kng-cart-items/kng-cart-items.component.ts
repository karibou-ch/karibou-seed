import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from 'kng2-core';
import { CartAction } from 'kng2-core';
import { Config, CartItem, CartService, LoaderService, Hub, User } from 'kng2-core';
import { Subscription } from 'rxjs';
import { i18n } from 'src/app/common';

@Component({
  selector: 'kng-cart-items',
  templateUrl: './kng-cart-items.component.html',
  styleUrls: ['./kng-cart-items.component.scss']
})
export class KngCartItemsComponent implements OnInit {
  private _config: Config;
  private _subscription: Subscription;

  @Input() i18n: any;
  @Input() showFooter: boolean;
  @Input() showSeparator: boolean;
  @Input() currentHub: Hub;
  @Input() set config(cfg: Config){
    this._config = cfg;
  }

  @Output() checkout: EventEmitter<any> = new EventEmitter<any>();

  user: User;
  items: CartItem[];
  itemsAmount: number;
  noshippingMsg: string;
  hasOrderError: boolean;
  doToggleFees: boolean;

  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  currentShippingDay: Date;
  weekdays = [];

  isReady: boolean

  constructor(
    private $cart:CartService,
    private $i18n:i18n,
    private $loader: LoaderService,
    private $route: ActivatedRoute,
    private $router: Router
  ) { 
    this.items = [];
    this._subscription = new Subscription();
    this.showFooter = true;
    this.weekdays = this.$i18n.label().weekdays.split('_');
  }


  get config() {
    return this._config;
  }

  get hub() {
    return this.currentHub;
  }

  get hubLogo() {
    return this.hub.siteName.image;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get labell(){
    return this.i18n[this.locale];
  }  


  get label(){
    return this.$i18n.label();
  }  
  get cart_info_one_date() {
    const when = this.$cart.getCurrentShippingDay();
    if(!this.currentShippingDay || !when){
      return '';
    }
    const day = when.getDay();
    const label = this.i18n[this.locale].cart_info_one_date.replace('__HUB__',this.currentHub.name).replace('__DAY__',this.weekdays[day]);
    return label;
  }

  get cart_info_service_k() {
    const label = this.i18n[this.locale].cart_info_service_k.replace('__FEES__',(this.currentHub.serviceFees*100).toFixed(0));
    return  label + ' ('+this.$cart.totalHubFees(this.currentHub.slug)+' fr)';
  }

  get cart_info_hub_not_active() {
    return this.i18n[this.locale].cart_info_hub_not_active.replace('__HUB__',this.currentHub.name);
  }


  ngOnDestroy() {
    this._subscription.unsubscribe();
  }


  ngOnInit(): void {
    // case of non active hub with currentHub == undefined
    if(!this.currentHub) {
      this.currentHub = this.config.shared.hub;
      this.currentHub.status.active = false;
    }

    this._subscription.add(
    this.$loader.update().subscribe(emit => {
      if (emit.user) {
        this.user = emit.user;
      }

      if(emit.config){
        this.currentRanks = this.config.shared.currentRanks[this.currentHub.slug] || {};
        this.currentLimit = this.config.shared.hub.currentLimit || 1000;
        this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;      
      }

      if(!emit.state){
        return;
      }


      this.currentShippingDay = this.$cart.getCurrentShippingDay();

      if(!this.isCrossMarketShippingDate()){
        this.currentShippingDay = Order.nextShippingDay(this.user,this.currentHub);
      }

      this.items = this.$cart.getItems().filter(item=> item.hub == this.currentHub.slug);
      this.itemsAmount = this.$cart.subTotal(this.currentHub.slug);
      this.noshippingMsg = this.getNoShippingMessage();
      this.hasOrderError = this.$cart.hasError(this.currentHub.slug);
      this.isReady = true;
      //console.log('---- DBG cart-items', CartAction[emit.state.action],this.currentHub.slug, 'items',this.items.length);
    }));
  }

  doCheckout(){
    const token = this.$route.snapshot.queryParams['token'];
    const ctx = {
      hub:this.currentHub,
      items: this.items,
      totalDiscount: this.getTotalDiscount(),
    };
    if(!this.user.isAuthenticated()) {
      return this.$router.navigate(['/store/'+this.currentHub.slug+'/home/me/login-or-register'],{queryParams:{token}});
    }
    this.checkout.emit(ctx);
  }

  add(item: CartItem, variant?: string) {
    this.$cart.add(item, variant);
  }


  currentServiceFees() {
    return this.$cart.totalHubFees(this.currentHub.slug);
  }

  // FIXME remove repeated code
  getNoShippingMessage() {
    //
    // check window delivery
    if (this.currentShippingDay &&
      this.currentRanks[this.currentShippingDay.getDay()] > this.currentLimit) {
      return this.$i18n[this.locale].nav_no_shipping_long;
    }

    const noshipping = this.config.noShippingMessage(this.currentHub).find(shipping => {
      return shipping.equalsDate(this.currentShippingDay) && shipping.message;
    });
    return noshipping && noshipping.message[this.locale];
  }


  getDiscount(item: CartItem) {
    const discount = this.$cart.getVendorDiscount(item);

    if (discount.threshold) {
      return discount.needed;
    }
    return '';
  }


  //DEPRECATED
  getTotalDiscount() {
    return this.$cart.getTotalDiscount(this.currentHub.slug)
  }  

  //DEPRECATED
  getVendorDiscount(item: CartItem) {
    return this.$cart.getVendorDiscount(item);
  }

  //
  // multiple markets with one delivery
  isCrossMarketShippingDate(){
    const now = new Date();
    const currentDay = this.$cart.getCurrentShippingDay();
    if(!currentDay || currentDay<now) { return 0; }
    const week = this.config.potentialShippingWeek(this.currentHub);
    const available =week.some(day => day.getDay() == currentDay.getDay());
    return available;
  }

  //
  // used for order limitation
  isNotShippingLimit() {
    const ranks = Object.keys(this.currentRanks);
    if(!this.currentShippingDay || !this.currentHub.status || !this.currentHub.status.active || !ranks.length){
      return true;
    }
    const day = this.currentShippingDay;
    const maxLimit = this.user.isPremium() ? (this.currentLimit + this.premiumLimit) : this.currentLimit;

    return (this.currentRanks[day.getDay()] <= maxLimit);
  }

  isCheckoutEnabled() {
    return this.isCrossMarketShippingDate() && 
           this.isNotShippingLimit() && 
           this.items.length && !this.noshippingMsg;
  }

  subTotal() {
    return this.$cart.subTotal(this.currentHub.slug);
  }

  sortedItems(hub?) {
    const slug = hub? hub.slug:this.currentHub;
    return this.items.filter(item => item.hub == slug).sort((a,b) => {
      return a.category.slug.localeCompare(b.category.slug);
    });
  }

  remove(item: CartItem, variant?: string) {
    this.$cart.remove(item, variant);
  }

  removeAll(item: CartItem, variant?: string) {
    this.$cart.removeAll(item, variant);
  }

  onSelect(source, item) {
    this.items.forEach(i => {
      i['selected'] = (i.sku === item.sku && !i['selected']);
    });
  }

}
