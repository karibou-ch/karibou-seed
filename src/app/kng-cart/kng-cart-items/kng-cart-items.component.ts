import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Config, CartSubscription, CartItemsContext, CartItem, CartService, LoaderService, Hub, User, Order, CartSubscriptionParams, CartSubscriptionProductItem, ShippingAddress, CalendarService } from 'kng2-core';
import { Subscription } from 'rxjs';
import { i18n } from 'src/app/common';

export interface CheckoutCtx {
  hub:Hub;
  items:CartItem[];
  updated: CartSubscriptionProductItem[],
  contract:CartSubscription|undefined;
  totalDiscount: number;
  user:User;
  plan:string;
  forSubscription: boolean;
}



@Component({
  selector: 'kng-cart-items',
  templateUrl: './kng-cart-items.component.html',
  styleUrls: ['./kng-cart-items.component.scss']
})
export class KngCartItemsComponent implements OnInit {
  private _config: Config;
  private _subscription: Subscription;
  private _showCartItems: boolean;
  @Input() i18n: any;
  @Input() set showCartItems(value: boolean){
    this._showCartItems = value;
    if(!this.hub) {
      return;
    }

    // ✅ SIMPLE: Utiliser context centralisé
    const ctx = this.createCartContext(!this._showCartItems);
    this.items = this.$cart.getItems(ctx);
    this.itemsAmount = this.$cart.subTotal(ctx);
  }
  @Input() showFooter: boolean;
  @Input() showSeparator: boolean;
  @Input() currentHub: Hub;
  @Input() set config(cfg: Config){
    this._config = cfg;
  }

  @Output() checkoutEvent: EventEmitter<CheckoutCtx> = new EventEmitter<CheckoutCtx>();

  user: User;
  items: CartItem[];
  contractItems: CartSubscriptionProductItem[];
  itemsAmount: number;
  displaySharedSeparator:number;
  noshippingMsg: string;
  hasOrderError: boolean;
  doToggleFees: boolean;

  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  currentShippingDay: Date;
  weekdays = [];

  isReady: boolean;
  subscriptionParams:CartSubscriptionParams;
  currentSubscription:CartSubscription|null;
  contracts:CartSubscription[];
  plan: string;

  //
  // used for angular refresh
  __v:number;

  constructor(
    private $cart:CartService,
    private $i18n:i18n,
    private $loader: LoaderService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $calendar: CalendarService
  ) {
    // ✅ PARENT BROADCASTER: Récupération immédiate des données cached
    const { config, user } = this.$loader.getLatestCoreData();

    this.items = [];
    this.displaySharedSeparator = 0;
    this._subscription = new Subscription();
    this.showFooter = true;
    this.weekdays = this.$i18n.label().weekdays.split('_');
    this.contracts =[];
    this.contractItems = [];
    this._config = config;
    this.user = user;
    this.__v =0;

    //
    // save the plan for the subscription (business, customer)
    this.plan = this.$route.snapshot.queryParams.plan||'customer';

  }

  // ✅ SIMPLE: Centraliser création CartItemsContext (sans cache)
  private createCartContext(forSubscription?: boolean): CartItemsContext {
    return {
      forSubscription: forSubscription ?? !this.showCartItems,
      onSubscription: forSubscription ?? !this.showCartItems,
      hub: this.hub.slug
    };
  }

  get config() {
    return this._config;
  }

  get hub() {
    // case of non active hub with currentHub == undefined
    if(!this.currentHub) {
      const hub = (this.config.shared && this.config.shared.hub) || {shared:{},status:{}};
      hub.status.active = false;
      return hub;
    }

    return this.currentHub;
  }

  get isActiveHub() {
    const hub = this.config.shared && this.config.shared.hub;
    return this.hub.slug == hub.slug;
  }

  get hubLogo() {
    return this.hub.siteName.image;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get llabel(){
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
    const label = this.i18n[this.locale].cart_info_one_date.replace('__HUB__',this.hub.name).replace('__DAY__',this.weekdays[day]);
    return label;
  }

  get cart_info_service_k() {
    // ✅ SIMPLE: Utiliser context centralisé
    const ctx = this.createCartContext();

    //
    // adding gateway fees
    const gateway = this.$cart.getCurrentGateway();
    const fees = this.hub.serviceFees + gateway.fees;
    const label = this.i18n[this.locale].cart_info_service_k.replace('__FEES__',(fees*100).toFixed(0));
    return  label + ' ('+this.$cart.totalHubFees(ctx)+' fr)';
  }

  get cart_info_hub_not_active() {
    return this.i18n[this.locale].cart_info_hub_not_active.replace('__HUB__',this.hub.name);
  }

  get cart_info_checkout_or_subscription() {

    if(this.hasPendingSubscription) {
      return this.llabel.cart_update_subscription_payment;
    }
    if(this.hasUpdateContract) {
      return this.llabel.cart_update_subscription;
    }
    return (this.showCartItems)?this.llabel.cart_checkout:this.llabel.cart_create_subscription
  }

  get showCartItems() {
    return this._showCartItems;
  }
  get hasUpdateContract() {
    if(!this.contracts||!this.subscriptionParams){
      return null;
    }
    const contract = this.contracts.find(contract=>{
        return contract.frequency==this.subscriptionParams.frequency&&
               contract.dayOfWeek==this.subscriptionParams.dayOfWeek&&
               contract.status!='canceled'
      });



    if(!contract) {
      return;
    }
    // Fallback, contract without items AND with shipping is a valid contract to update
    // ✅ Si le contrat a un shipping, c'est un contrat valide à updater
    if(!contract.items?.length && contract.shipping) {
      return contract;
    }

    // ✅ Sinon, vérifier le hub des items
    if(contract.items?.length && contract.items[0].hub !== this.hub.slug) {
      return;
    }

    return contract;
  }

  get hasPendingSubscription() {
    if(!this.currentSubscription || !this.currentSubscription.latestPaymentIntent) {
      return false;
    }
    //
    // pending requires_payment_method
    // pending requires_payment_method_confirm
    return (['requires_payment_method','requires_action'].indexOf(this.currentSubscription.latestPaymentIntent.status)>-1);
  }

  //
  // multiple markets with one delivery
  // exception with subscription
  get isCrossMarketShippingDate(){
    const now = new Date();
    const currentDay = this.$cart.getCurrentShippingDay();
    if(this.currentSubscription||!this.isReady) {
      return true;
    }
    if(!currentDay || currentDay<now) {
      return false;
    }
    // ✅ MIGRATION: Utiliser CalendarService au lieu de config
    const week = this.$calendar.potentialShippingWeek(this.hub);
    const available =week.some(day => day.getDay() == currentDay.getDay());
    return available;
  }

  //
  // used for order limitation
  get isNotShippingLimit() {
    const ranks = Object.keys(this.currentRanks);
    if(!this.currentShippingDay || !this.hub.status || !this.hub.status.active || !ranks.length){
      return true;
    }
    const day = this.currentShippingDay;
    const maxLimit = this.user.isPremium() ? (this.currentLimit + this.premiumLimit) : this.currentLimit;

    return (this.currentRanks[day.getDay()] <= maxLimit);
  }

  get isCheckoutEnabled() {
    // user is created but not ready
    const userAlmostReady = (this.user.isReady()||!this.user.isAuthenticated())
    if(this.hasPendingSubscription) {
      return true;
    }
    if(this.contractItems.some(item=>item['updated'])) {
      return true;
    }
    return this.isCrossMarketShippingDate && userAlmostReady &&
           this.isNotShippingLimit &&
           this.items.length && !this.noshippingMsg;
  }


  //
  // update url to route subscription type
  get routerLinkQueryParamsForSKU() {
    return (!this.showCartItems)?{view:'subscription'}:{};
  }

  get routerLinkForMoreProducts() {
    //
    // case of order cart
    if(this.showCartItems) {
      return ['/store',this.hub.slug,'home'];
    }

    //
    // case of business subs
    if (this.plan=='business'){
      return  ['/store',this.hub.slug,'home','business'];
    }

    //
    // case of customer subs
    return  ['/store',this.hub.slug,'home','subscription'];
  }


  get queryParamsMenu() {
    return {menu:"miam"};
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }


  ngOnInit(): void {
    //
    //
    this._subscription.add(
      this.$route.queryParams.subscribe(params => {
        const contractId = this.$route.snapshot.queryParams.id;
        if(!contractId) {
          return
        }
        const contract = this.contracts.find(contract=> contract.id == contractId)

        //
        // when contract is specified from queryParams it must be digest
        if(contract) {
          const shipping:ShippingAddress = contract.shipping as ShippingAddress;
          this.subscriptionParams = {
            frequency: contract.frequency,
            activeForm: true,
            dayOfWeek: contract.dayOfWeek,
            time:shipping.hours
          }
          this.$cart.subscriptionSetParams(this.subscriptionParams);

          //
          // contract is selected
          this.$router.navigate([], {
            queryParams: { id: null},
            queryParamsHandling: 'merge'
          });
        }

      })
    );

    this._subscription.add(
      this.$cart.subscription$.subscribe(contracts => {
        this.contracts = contracts;

        //
        // select subs when order view is False
        if(this.showCartItems){
          return;
        }
        //
        // setup model to  update a subscription
        this.subscriptionParams = this.$cart.subscriptionGetParams();
        this.currentSubscription = this.hasUpdateContract;
        this.contractItems = this.currentSubscription?this.currentSubscription.items.slice():[];
      })
    );

    this._subscription.add(
      this.$loader.update().subscribe(emit => {
        if (emit.user) {
          this.user = emit.user;
        }

        if(emit.config){
          this.currentRanks = this.config.shared.currentRanks[this.hub.slug] || {};
          this.currentLimit = this.config.shared.hub.currentLimit || 1000;
          this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
        }

        if(!emit.state){
          return;
        }

        // WARNING
        // there is one emit by HUB (you will see more than one on console.log)
        //console.log(this.hub.slug,emit.state.action)


        // ✅ SIMPLE: Obtenir shipping day
        this.currentShippingDay = this.$cart.getCurrentShippingDay();

        if(!this.isCrossMarketShippingDate){
          // ✅ MIGRATION: Utiliser CalendarService au lieu d'Order
          this.currentShippingDay = this.$calendar.nextShippingDay(this.hub, this.user);
        }

        // ✅ SIMPLE: Utiliser context centralisé
        const ctx = this.createCartContext();
        if(this.showCartItems) {
          ctx.onSubscription = false;
        }

        this.items = this.$cart.getItems(ctx).sort((a,b)=> (a.active||b.active)?0:1);
        this.itemsAmount = this.$cart.subTotal(ctx);
        console.log('items', ctx, this.items);

        // ✅ FIXED: Bug #6 - Éviter mutation de l'array original avec reverse()
        const lastSharedItemIdx = this.items.length - [...this.items].reverse().findIndex(item => item.shared);
        this.displaySharedSeparator = lastSharedItemIdx>this.items.length? 0:lastSharedItemIdx;


        this.noshippingMsg = this.getNoShippingMessage();
        this.hasOrderError = this.$cart.hasError(this.hub.slug);


        //
        // select subs when order view is False
        this.showFooter = this.isReady = (this.items.length>0 || this.hub.slug == this.config.shared.hub.slug);
        if(this.showCartItems){
          return;
        }

        //
        // setup model to  update a subscription
        this.subscriptionParams = this.$cart.subscriptionGetParams();


        this.currentSubscription = this.hasUpdateContract;
        this.contractItems = this.currentSubscription?this.currentSubscription.items.slice():[];

      })
    );
  }


  doCheckout(){
    const contract = this.hasUpdateContract;
    const updateItems = this.contractItems.slice();

    const ctx = {
      plan:this.plan,
      hub:this.hub,
      items: this.items,
      updated:updateItems,
      contract: contract,
      totalDiscount: this.getTotalDiscount(),
      forSubscription: !this.showCartItems,
      user: this.user
    } as CheckoutCtx;
    if(!this.user.isAuthenticated()) {
      const currentUrl = this.$router.url; // URL actuelle du panier
      return this.$router.navigate(['/store/'+this.hub.slug+'/home/me/login-or-register'], {
        queryParams: { referrer: currentUrl, action: 'checkout' }
      });
    }
    this.checkoutEvent.emit(ctx);
  }

  currentServiceFees() {
    // ✅ SIMPLE: Utiliser context centralisé
    const ctx = this.createCartContext();
    return this.$cart.totalHubFees(ctx);
  }

  // ✅ MIGRATION: Utiliser CalendarService centralisé
  getNoShippingMessage() {
    if (!this.currentShippingDay || !this.hub) {
      return null;
    }

    return this.$calendar.getNoShippingMessage(
      this.hub,
      this.currentShippingDay,
      this.locale
    );
  }


  getDiscount(item: CartItem) {
    // const discount = this.$cart.getVendorDiscount(item);

    // if (discount.threshold) {
    //   return discount.needed;
    // }
    return '';
  }


  //DEPRECATED
  getTotalDiscount() {
    return this.$cart.getTotalDiscount(this.hub.slug)
  }

  //DEPRECATED
  getVendorDiscount(item: CartItem) {
    return this.$cart.getVendorDiscount(item);
  }


  subTotal() {
    // ✅ SIMPLE: Utiliser context centralisé
    const ctx = this.createCartContext();
    return this.$cart.subTotal(ctx);
  }

  sortedItems(hub?) {
    // ✅ FIXED: Bug #7 - Type error, this.hub est un objet, pas un string
    const slug = hub? hub.slug : this.hub.slug;
    return this.items.filter(item => item.hub == slug).sort((a,b) => {
      return a.category.slug.localeCompare(b.category.slug);
    });
  }

  add(item: CartItem, variant?: string) {
    this.$cart.add(item, variant);
    this.__v++;
  }

  remove(item: CartItem, variant?: string) {
    this.$cart.remove(item, variant);
    this.__v++;
  }

  removeAll(item: CartItem, variant?: string) {
    console.log('removeAll', item, variant);
    this.$cart.removeAll(item, variant);
    this.__v++;
  }

  sub_add(item: CartItem, variant?: string) {
    item.quantity++;
    item['updated']=true;
    delete (item.deleted);
    this.__v++;
  }

  sub_remove(item: CartItem, variant?: string) {
    // ✅ FIXED: Bug #8 - Validation quantity plus robuste
    if(item.quantity <= 0) {
      return;
    }
    item.quantity--;
    item['updated']=true;
    this.__v++;
  }

  sub_removeAll(item: CartItem, variant?: string) {
    item.quantity=0;
    item['updated']=true;
    item.deleted=true;
    this.__v++;
  }

  onSelect(source, item) {
    this.items.forEach(i => {
      i['selected'] = (i.sku === item.sku && !i['selected']);
    });
  }


  onSetCurrentShippingDay({day,time}) {
    if (!(day)) {
      return;
    }
    // this.dialogRef.close(day);

    // ✅ MIGRATION: Utiliser CalendarService au lieu de config (FIXME résolu)
    time = time|| this.$calendar.getDefaultTimeByDay(day, this.hub);
    this.$cart.setShippingDay(day,time);
    this.currentShippingDay = day;
  }

}
