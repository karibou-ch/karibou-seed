import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { i18n, KngNavigationStateService, KngUtils } from '../../common';
import { CartItem,CartItemsContext, CartService,CartSubscriptionParams, CartSubscriptionProductItem, Config, Hub, Order, OrderService, ShippingAddress, User, UserAddress, UserCard, UserService, CalendarService } from 'kng2-core';
import { EnumMetrics, MetricsService } from 'src/app/common/metrics.service';
import { StripeService } from 'ngx-stripe';
import { MdcSnackbar } from '@angular-mdc/web';
import { CheckoutCtx } from '../kng-cart-items/kng-cart-items.component';
import { CartSubscription } from 'kng2-core';
import { Router, ActivatedRoute } from '@angular/router';
import { KngPaymentComponent } from 'src/app/common/kng-payment/kng-user-payment.component';

import pkgInfo from '../../../../package.json';

@Component({
  selector: 'kng-cart-checkout',
  templateUrl: './kng-cart-checkout.component.html',
  styleUrls: ['./kng-cart-checkout.component.scss']
})
export class KngCartCheckoutComponent implements OnInit {


  private _open: boolean;
  private _config: Config;
  private _user: User;
  private _currentHub: Hub;
  private _totalDiscount : number;
  private _items: CartItem[];
  private _updateItems:CartSubscriptionProductItem[];
  private _isReady: boolean;

  @Input() set config(cfg: Config){
    this._config = cfg;
  }

  @Input() i18n: any;
  @Input() orders: Order[];
  @Input() shippingTime: string;



  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  VERSION = pkgInfo.version;
  cgAccepted = false;
  cg18Accepted = false;
  shipping;
  shippingNote: string;
  shippingDiscount: string;
  showInfoAmount: boolean;
  showInfoFees: boolean;
  requestIntent: string;
  currentCart:any;
  itemsAmount:number;
  doToggleFees: boolean;
  useCartSubscriptionView:boolean;
  subscriptionParams:CartSubscriptionParams
  subscriptionPlan:string;
  contract:CartSubscription;


  selectAddressIsDone: boolean
  selectPaymentIsDone: boolean;
  paymentTWINT: UserCard;

  // FIXME remove hardcoded reserved value 0.11! and implement it on shared.order.reservedAmount
  amountReserved = 1.11;

  // order stuffs
  errorMessage: string|null = null;
  isRunning = false;

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $navigation: KngNavigationStateService,
    private $metric: MetricsService,
    private $order: OrderService,
    private $stripe: StripeService,
    private $snack: MdcSnackbar,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $calendar: CalendarService
  ) {
    this._open = false;
    this.i18n = {};
    this.orders = [];
    this._updateItems = [];
    this.paymentTWINT = new UserCard({
      name:'TWINT',
      alias:'twint',
      issuer:'twint',
      id:'twint',
      type:'twint',
      expiry: '12/2050',
      provider:'stripe',
    });
  }

  get iOS() {
    return this.$navigation.isIOS;
  }

  get issuer() {
    return KngPaymentComponent.issuer;
  }

  get label() {
    return this.i18n[this.locale];
  }

  get label_cart_info_subtotal_fees(){
    return this.i18n[this.locale].cart_info_subtotal_fees.replace('__FEES__',this.currentFeesName);
  }
  get label_cart_info_subtotal(){
    return this.i18n[this.locale].cart_info_subtotal.replace('__FEES__',this.currentFeesName);
  }

  get label_payment_method() {
    return this.currentPayment?.issuer;
  }

  get glabel() {
    return this.$i18n.label();
  }


  get locale() {
    return this.$i18n.locale;
  }

  get items() {
    return this._items;
  }

  get contractTotal() {
    if(!this.contract) {
      return 0;
    }
    if(this._updateItems.length) {
      return this._updateItems.reduce((sum,item)=>(item.fees*item.quantity)+sum,0);
    }
    return this.contract.items.reduce((sum,item)=>(item.fees*item.quantity)+sum,0);
  }

  get currentAddress() {
    return this.currentShipping();
  }

  get currentAddressIsDeposit() {
    if(!this.config.shared.hub || !this.config.shared.hub.deposits) {
      false;
    }
    const address = this.currentAddress;
    return this.config.shared.hub.deposits.some(add => {
      return UserAddress.isEqual(address,add) && add.fees >= 0;
    });

  }

  get userPhone() {
    return this.user.phoneNumbers.length? this.user.phoneNumbers[0].number:'';
  }

  get userAddresses() {
    const addresses = [... this.user.addresses];
    if(!this.currentAddress || !this.currentAddress.name) {
      return addresses;
    }

    return addresses;
  }

  get userPayments() {
    const payments = [... this.user.payments, this.paymentTWINT];
    if(!this.currentPayment || !this.currentPayment.alias) {
      return payments;
    }
    return payments;
  }

// issuer:
//  paypal
//	invoice
//	cash
//	balance
//	bitcoin
//	twint
// FIXME payment payment.type must be normalized and must use karibou-wallet
  get userPaymentsCard() {
    const payments = [... this.user.payments.filter(payment => ['invoice','twint','xch'].indexOf(payment.issuer)==-1)];
    if(!this.currentPayment || !this.currentPayment.alias) {
      return payments;
    }
    return payments;
  }

  get user() {
    return this._user;
  }

  get open() {
    return this._open;
  }

  get config(): Config{
    return this._config;
  }

  get hub(){
    return this._currentHub;
  }

  get isSelectionState() {
    return !this.selectPaymentIsDone &&!this.selectAddressIsDone;
  }

  get isFinalizeDisabled() {
    // cg18Accepted
    return !this.selectPaymentIsDone||!this.cgAccepted||!this.selectAddressIsDone ||this.isRunning;
  }

  get isReady() :boolean {
    return this._isReady;
  }

  get store() :string{
    return (this._currentHub && this._currentHub.slug)||this.$navigation.store;
  }

  set open(open: boolean) {
    if(open == this._open ){
      return;
    }
    if(open) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }

    this._open = open;
  }

  get currentPayment() {
    return this.currentPaymentMethod();
  }

  get currentTotalUserBalance() {
    const userBalance = this._user.balance>0? this._user.balance:0;
    return Math.min(this.currentTotal(),userBalance);
  }

  get currentTotalMinusBalance(){
    const userBalance = this._user.balance>0? this._user.balance:0;
    return Math.max(this.currentTotal()-userBalance,0);
  }

  get subscriptionNextShippingDay() {
    // ✅ MIGRATION: Utiliser CalendarService au lieu d'Order
    const oneWeek = this.$calendar.getValidShippingDatesForHub(this.hub, { days: 7 });
    const foundDate = oneWeek.find(date => date.getDay() == this.subscriptionParams.dayOfWeek);

    // ✅ CORRECTION CRITIQUE: Fallback si dayOfWeek n'existe pas dans les dates valides
    // Cela peut arriver après la correction de kng-subscription-option si l'utilisateur
    // a une ancienne sélection incompatible
    return foundDate || oneWeek[0] || this.$calendar.nextShippingDay(this.hub, this._user);
  }

  get currentTotalSubscription(){
    return this.currentTotal();
  }

  get hasUpdateContract() {
    if (this.contract &&
        this.contract.frequency==this.subscriptionParams.frequency&&
        this.contract.dayOfWeek==this.subscriptionParams.dayOfWeek&&
        this.contract.status!='canceled'){
      return this.contract;
    }

    return null;
  }

  get hasPendingSubscription() {
    //
    // in this case dont look for subtilities,
    // use pending contract to finalize
    if(!this.contract) {
      return false;
    }
    //
    // invoice
    if (!this.contract.latestPaymentIntent){
      return false;
    }

    //
    // pending requires_payment_method
    // pending requires_payment_method_confirm
    return (['requires_payment_method','requires_action'].indexOf(this.contract.latestPaymentIntent.status)>-1);
  }

  get currentFeesName() {
    if(!this._currentHub){
      return '0%'
    }
    //
    // adding gateway fees
    const gateway = this.$cart.getCurrentGateway();
    const fees = this._currentHub.serviceFees + gateway.fees;
    return Math.round(fees*100) + '%';
  }

  get currentPaymentIcon() {
    const method = this.currentPaymentMethod();
    if(!method || !method.issuer){
      return '';
    }
    return this.issuer[method.issuer].img;
  }


  get currentFeesAmount() {
    if(!this._currentHub){
      return 0;
    }
    const ctx:CartItemsContext = {
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }

    return this.$cart.totalHubFees(ctx);
  }


  get currentShippingFees() {
    if(!this._currentHub){
      return 0;
    }

    const address = this.currentShipping();
    const ctx:CartItemsContext = {
      address,
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }
    return this.$cart.computeShippingFees(ctx);
  }

  get displayShippingDay() {
    // ✅ FIXED: Use subscription date for contracts, currentShippingDay for normal orders
    return this.useCartSubscriptionView
      ? this.subscriptionNextShippingDay
      : this.currentShippingDay();
  }

  get currentShippingTime() {
    //
    // ✅ FIXED: Use subscription date for contracts, currentShippingDay for normal orders
    const shippingDay = this.useCartSubscriptionView
      ? this.subscriptionNextShippingDay
      : this.currentShippingDay();

    //
    // ✅ FIXED: Use CalendarService for time logic instead of hardcoded values
    const specialHours = this.$calendar.getDefaultTimeByDay(shippingDay, this.hub) || parseInt(this.shippingTime);
    const shippingHours = (this.isCartDeposit() ? '0' : specialHours.toString());

    return this.config.shared.hub.shippingtimes[shippingHours];

  }



  ngOnInit(): void {
    // ensure state
    document.body.classList.remove('mdc-dialog-scroll-lock');

    //
    // save the plan for the subscription (business, customer)
    this.subscriptionPlan = this.$route.snapshot.queryParams.plan||'customer';

    this.$user.user$.subscribe(user => {
      this._user = user;
      //
      // after user is updated verify if payment is still valid
      const payment = this.currentPayment;
      const isAvailable = this.userPayments.some(method => payment && payment.alias == method.alias);
      if(!this._isReady || !isAvailable){
        this.selectPaymentIsDone = false;
        this.$cart.setPaymentMethod(null);
        return;
      }

      //
      // we should sync with deleted address,
      const missingAddress = !this.userAddresses.some(address => address.streetAdress == this.currentAddress?.streetAdress);
      if(this.selectAddressIsDone && this.currentAddress && missingAddress){
        this.setShippingAddress(null);
      }
      //
      // if user add one, we should select by default
      else if(this.userAddresses.length && !this.selectAddressIsDone){
        this.setShippingAddress(this.userAddresses[0]);
      }

      //
      // we should sync with payment methods,
      if(this.userPaymentsCard.length == 1 || !this.selectPaymentIsDone && this.userPaymentsCard.length) {
        this.setPaymentMethod(this.userPaymentsCard[0]);
      }


      this.checkPaymentMethod();
    });

  }

  buildDiscountLabel() {
    const ctx:CartItemsContext = {
      address:this.currentShipping(),
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }
    const {price, status} = this.$cart.estimateShippingFeesWithoutReduction(ctx);
    const {multiple, discountA,discountB, deposit} = this.$cart.hasShippingReduction(ctx);

    const label = this.i18n[this.locale]['cart_info_shipping_discount'];

    //
    // grouped discount or deposit
    if(multiple || deposit){
      return  this.shippingDiscount = '';
    }

    //
    // Maximum discount
    if(discountB) {
      return this.shippingDiscount = this.i18n[this.locale]['cart_info_shipping_applied'];
    //
    // Minimum discount
    } else if (discountA) {
      return this.shippingDiscount = label.replace('_AMOUNT_',this.shipping.discountB).replace('_DISCOUNT_',Math.max(price - this.shipping.priceB,0).toFixed(2));
    //
    // Missing amount
    } else {
      return  this.shippingDiscount = label.replace('_AMOUNT_',this.shipping.discountA).replace('_DISCOUNT_',Math.max(price - this.shipping.priceA,0).toFixed(2));
    }
  }


  computeShippingByAddress(address: UserAddress) {
    const ctx:CartItemsContext = {
      address,
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }

    return this.$cart.computeShippingFees(ctx);
  }

  currentShippingDay() {
    return this.$cart.getCurrentShippingDay();
  }


  currentShipping() {
    const address = this.$cart.getCurrentShippingAddress();

    return address;
  }

  currentPaymentMethod() {
    return this.$cart.getCurrentPaymentMethod();
  }



  currentServiceFees() {
    const ctx:CartItemsContext = {
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }

    return this.$cart.totalHubFees(ctx);
  }

  currentTotal() {
    const ctx:CartItemsContext = {
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }

    if(this.contract) {
      return this.$cart.subTotal(ctx);
    }

    return this.$cart.total(ctx);
  }

  checkPaymentMethod(force?:boolean) {
    if (!this._user.isAuthenticated()) {
      this.open = false;
      return;
    }
    const total = this.currentTotal() + this.currentServiceFees();
    this.$user.checkPaymentMethod(this._user, undefined,(total)).subscribe(user => {
      //
      // set default payment
      // ✅ FIXED: Robust payment alias extraction with null checks
      this._user = user;
      const lastAlias = (this.orders.length && this.orders[0]?.payment?.alias) ? this.orders[0].payment.alias : null;
      const payments = this._user.payments.filter(payment => !payment.error);
      const currentPayment = this.$cart.getCurrentPaymentMethod();
      const previousPayment = payments.find(payment => payment.alias == lastAlias);


      //
      // use last order as default
      if(previousPayment) {
        payments.unshift(previousPayment);
      }

      //
      // use last selected as default
      if(currentPayment && !currentPayment.error) {
        payments.unshift(currentPayment);
      }

      //
      // update default payment
      if(payments.length){
        this.setPaymentMethod(payments[0]);
      }
      this._isReady = true;
    }, error => {
      if (error.status === 401) {
        this.open = false;
      }
    });
  }

  getTotalDiscount() {
    return this._totalDiscount;
  }

  getStaticMap(address: UserAddress) {
    return KngUtils.getStaticMap(address);
  }

  getDepositAddress() {
    return this.hub.deposits;
  }



  //
  // FIXME refactor, use shipping reduction enum as 'multiple,deposit,discountA,discountB'
  // contract has no reduction
  hasShippingReductionMultipleOrder(){
    if(this.contract) {
      return false;
    }
    const address = this.currentShipping();
    return this.$cart.hasShippingReductionMultipleOrder(address);
  }



  // available day for order,
  isOpen() {
    // ✅ MIGRATION: Utiliser CalendarService au lieu d'Order
    const next = this.$calendar.nextShippingDay(this.hub, this._user);

    return !!next;
  }

  isCartDeposit() {
    const current = this.$cart.getCurrentShippingAddress();
    // deposit address contains fees
    // TODO make a test for that
    return current['fees'] !== undefined;
  }

  isSelectedAddress(add: UserAddress) {
    const current = this.$cart.getCurrentShippingAddress();
    return add.name == (current.name);
  }

  isSelectedPayment(payment: UserCard) {
    const current = this.$cart.getCurrentGateway();
    return (current.label) === payment.issuer;
  }

  isPaymentMethodsValid() {
    return this._user.payments.every(payment => payment.isValid());
  }

  setShippingAddress(address: UserAddress) :boolean {
    if(!address || !address.streetAdress) {
      this.$cart.setShippingAddress(null);
      return this.selectAddressIsDone = false;
    }

    this.selectAddressIsDone = this.$cart.setShippingAddress(address);


    //
    // copy note
    this.shippingNote = address.note;


    return this.selectAddressIsDone;
  }

  setPaymentMethod(payment: UserCard) {
    this.selectPaymentIsDone = false;
    if (!payment) {
      return;
    }


    if (!payment.isValid()) {
      this.$snack.open(payment.error || this.i18n[this.locale].cart_payment_not_available, 'OK');
      return;
    }
    this.$cart.setPaymentMethod(payment);
    this.selectPaymentIsDone = true;
  }

  //
  // payment stuffs
  createPaymentConfirmation(order: Order) {
    this.$snack.open(this.$i18n.label().cart_save_deliver + order.shipping.when.toDateString());
    this._items = [];
    this.$cart.clearAfterOrder(this.store,order);
    this.updated.emit({ order,store:this.store });
    this.open = false;
  }

  //
  // subscription stuffs
  createSubscriptionConfirmation(contract) {
    this.$snack.open(this.$i18n.label().cart_save_subscription);
    this.$cart.clearAfterOrder(this.store,null,contract);
    this._items = [];
    this.open = false;
    this.updated.emit({ contract });
  }


  confirmPaymenIntent(intent: any, target:any) {
    const intentOpt: any = {
      payment_method: intent.source
    };

    this.errorMessage = null;

    this.$stripe.confirmCardPayment(intent.client_secret, intentOpt).subscribe((result) => {
      if (result.error) {
        //
        // Show error to our customer (e.g., insufficient funds)
        this.errorMessage = result.error.message;
        this.$snack.open(
          result.error.message,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
        );
        this.isRunning = false;
        this.$cart.broadcastState();
        return;
      }
      // The payment must be confirmed for an order
      if (target.oid && ['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
        const payment = this.$cart.getCurrentPaymentMethod();
        //
        // include oid reference as payment DATA
        //({...this.currentPayment,oid:intent.oid,intent_id:intent.intent_id})
        const intent = {
          oid:target.oid,
          intent_id:result.paymentIntent.id,
          ...payment
        }

        this.doOrder(intent);
      }
      if(target.subscription&& ['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
        this.doSubscriptionPaymentConfirm(target.subscription,result.paymentIntent);
      }

    });
  }


  confirmPaymenTwintIntent(intent: any, target:any) {
    const intentOpt: any = {
    };

    this.errorMessage = null;

    this.$stripe.getInstance()['confirmTwintPayment'](intent.client_secret,{
      payment_method:{
        twint:{}
      },
      return_url: window.location.href+'?oid='+target.oid
    }).then((result) => {
      console.log('--- TWINT ',result);
      if (result.error) {
        //
        // Show error to our customer (e.g., insufficient funds)
        this.errorMessage = result.error.message;
        this.$snack.open(
          result.error.message,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
        );
        this.isRunning = false;
        this.$cart.broadcastState();
        return;
      }

      // ✅ FIXED: Uncomment and fix TWINT payment confirmation logic
      // The payment must be confirmed for an order
      if (target.oid && ['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
        const payment = this.$cart.getCurrentPaymentMethod();
        //
        // include oid reference as payment DATA
        const intentData = {
          oid:target.oid,
          intent_id:result.paymentIntent.id,
          ...payment
        }

        this.doOrder(intentData);
      }

      // ✅ FIXED: Handle subscription TWINT payments
      if(target.subscription && ['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
        this.doSubscriptionPaymentConfirm(target.subscription, result.paymentIntent);
      }

    }).catch((error) => {
      // ✅ ADDED: Handle TWINT promise rejection
      console.error('TWINT payment error:', error);
      this.errorMessage = error.message || 'Erreur de paiement TWINT';
      this.$snack.open(
        this.errorMessage,
        this.$i18n.label().thanks,
        this.$i18n.snackOpt
      );
      this.isRunning = false;
      this.$cart.broadcastState();
    });
  }



  doOrderRouting(){
    this.doOrder();
  }

  doOrder(intent?) {
    //
    // prepare shipping
    // ✅ FIXED: Use CalendarService for hour selection instead of hardcoded values
    const defaultHours = this.$cart.getCurrentShippingTime();
    const shippingDay = this.currentShippingDay();
    const specialHours = this.$calendar.getDefaultTimeByDay(shippingDay, this.hub) || 16;
    const shippingHours = (this.isCartDeposit() ? '0' : specialHours.toString());
    const address = this.currentShipping();
    const shipping = new ShippingAddress(address, shippingDay, shippingHours);

    //needed from backend
    //paymentData && paymentData.oid && paymentData.intent_id
    const payment = intent||this.currentPayment;
    const hub = this._currentHub && this._currentHub.slug || this.$navigation.store;
    const items = this.items.map(item => item.toDEPRECATED());

    //
    // update shipping note
    shipping.note = this.shippingNote || shipping.note;

    this.isRunning = true;

    //
    // clear cart error
    this.$cart.clearErrors();
    this.$order.create(
      hub,
      shipping,
      items,
      payment
    ).subscribe((order) => {
        this.isRunning = false;

        //
        // check order errors
        if (order.errors) {
          this.$cart.setError(order.errors, hub);
          this.$snack.open(
            this.$i18n.label().cart_corrected,
            this.$i18n.label().thanks,
            this.$i18n.snackOpt
          );
          this.updated.emit({ errors: order.errors });
          this.$cart.broadcastState();
          this.$user.me().subscribe();
          this.open = false;

          return;
        }

        //
        // Metric ORDER
        this.$metric.event(EnumMetrics.metric_order_sent, {
          shipping: order.getShippingPrice(),
          amount: order.getSubTotal(),
          hub:hub,
          sku:order.items.map(item => item.sku)
        });

        //
        // validate
        this.createPaymentConfirmation(order);
      },
      status => {


        //
        // TWINT
        if (payment.type=='twint' && status.error.client_secret) {
          return this.confirmPaymenTwintIntent(status.error, {oid:status.error.oid});
        }


        //
        // SCA request payment confirmation
        if (status.error.client_secret) {
          return this.confirmPaymenIntent(status.error, {oid:status.error.oid});
        }
        this.isRunning = false;
        this.errorMessage = status.error;
        this.$snack.open(
          status.error,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
      );
      }
    );
  }

  doSubscriptionPaymentUpdate(sid,intent) {

  }

  async doSubscriptionPaymentConfirm(subscription,intent) {
    this.contract = await this.$cart.subscriptionPaymentConfirm(subscription.id,intent).toPromise();
    //
    // validate
    this.createSubscriptionConfirmation(this.contract);

  }



  doSubscription() {
    this.subscriptionParams = this.$cart.subscriptionGetParams();
    const shippingDay = this.subscriptionNextShippingDay;
    const specialHours = this.$cart.getCurrentShippingTime();
    const shippingHours = (this.isCartDeposit() ? '0' : specialHours);
    const shipping = new ShippingAddress(
      this.currentShipping(),
      shippingDay,
      shippingHours
    );
    const payment = this.currentPayment;
    const hub = this._currentHub.slug;
    this.isRunning = true;

    //
    // confirm 3ds
    if(this.contract &&
      this.contract.latestPaymentIntent &&
      this.contract.latestPaymentIntent.status=='requires_action') {
      return this.confirmPaymenIntent(this.contract.latestPaymentIntent, {subscription:this.contract});
    }

    const items = this.items.map(item => {
      const deprecatedItem = item.toDEPRECATED();
      // ✅ FIXED: Set frequency properly during mapping instead of after
      if (this.subscriptionParams?.frequency) {
        deprecatedItem.frequency = this.subscriptionParams.frequency;
      }
      return deprecatedItem;
    });
    const updated = (this._updateItems ||[]).filter(item=> item['updated']);
    const subParams = {
      hub,
      shipping,
      items,
      updated,
      payment:payment.alias,
      frequency:this.subscriptionParams.frequency,
      dayOfWeek:this.subscriptionParams.dayOfWeek,
      plan:this.subscriptionPlan
    }



    //
    // clear error before the validation
    this.$cart.clearErrors();

    //
    // run an update or create action for this Subs
    let resultAction;
    if(this.hasUpdateContract) {
      resultAction = this.$cart.subscriptionUpdate(this.contract.id,subParams);
    }else{
      resultAction = this.$cart.subscriptionCreate(subParams);
    }
    resultAction.subscribe(
      subscription=> {
        this.isRunning = false;
        console.log('----- subscription running',subscription);

        //
        // check order errors
        if (subscription.errors) {
          this.$cart.setError(subscription.errors, hub);
          this._updateItems.forEach(item => {
            item.error = subscription.errors[item.sku];
          })
          this.$snack.open(
            this.$i18n.label().cart_corrected,
            this.$i18n.label().thanks,
            this.$i18n.snackOpt
          );
          this.updated.emit({ errors: subscription.errors });
          this.open = false;
          return;
        }

        //
        // confirm payment intent (3ds)
        if(subscription.latestPaymentIntent &&
           subscription.latestPaymentIntent.status=='requires_action') {
          return this.confirmPaymenIntent(subscription.latestPaymentIntent, {subscription:subscription});
        }

        //
        // update payment method (invalid card)
        if(subscription.latestPaymentIntent &&
          subscription.latestPaymentIntent.status=='requires_payment_method') {
          this.errorMessage = this.label.cart_update_subscription_payment_error;
          return;
        }

        //
        // perfectly done
        this.createSubscriptionConfirmation(subscription)

      },status =>{
        console.log('----- payment error',status);
        this.errorMessage = status.error;
        this.isRunning = false;
        this.$snack.open(
          status.error,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
      );

      }
    )

  }

  //
  // entry point started by cart-items
  doInitateCheckout(checkoutCtx:CheckoutCtx){
    this._currentHub = checkoutCtx.hub;
    this._items = checkoutCtx.items;
    this._updateItems = checkoutCtx.updated || [];
    this._totalDiscount = checkoutCtx.totalDiscount;
    this._user = checkoutCtx.user;
    this.open = true;
    this.errorMessage = null;
    this.subscriptionParams = this.contract = null;
    //
    // should be a boolean
    this.useCartSubscriptionView = false;
    if (checkoutCtx.forSubscription){
      this.contract = checkoutCtx.contract;
      this.useCartSubscriptionView = true;
      this.subscriptionParams =  this.$cart.subscriptionGetParams();
    }


    //
    // confirm payment method is always a priority
    if(this.contract &&
      this.contract.latestPaymentIntent &&
      this.contract.latestPaymentIntent.status=='requires_payment_method') {
        this.errorMessage = this.label.cart_update_subscription_payment_error;
    }

    this.checkPaymentMethod();

    const address = this.$cart.getCurrentShippingAddress();
    this.setShippingAddress(address);

    //
    // check if address is already set
    if(!this.selectAddressIsDone){
      if(this.orders.length && !this.orders[0].shipping.deposit) {
        // prevent deposit address as it can be from various hub locations
        const address = UserAddress.from(this.orders[0].shipping);
        this.setShippingAddress(address);
      }

      if(!this.selectAddressIsDone){
        const address = UserAddress.from(this._user.addresses[0]);
        this.setShippingAddress(address);
      }
    }

    //
    // FIXME we provide only one shipping time!
    this.shipping = this.config.shared.shipping;

    const ctx:CartItemsContext = {
      forSubscription: this.useCartSubscriptionView,
      hub:checkoutCtx.hub.slug
    }

    this.itemsAmount = this.$cart.subTotal(ctx);

    this.buildDiscountLabel();

    //
    // Metric ORDER
    this.$metric.event(EnumMetrics.metric_order_payment,{hub:this.store});

  }


  //
  // payment method is valid and saved
  onPaymentSave(payment: UserCard) {
    // set payment method is done by user.update$.subscribe()
  }

  //
  // address is valid and must be saved
  onAddressSave(address: UserAddress) {
    // this.$user.addressAdd(address).subscribe(user => {
    //   this._user = user;
    //   this.selectAddressIsDone = false;
    // });
    if(!address) {
      return;
    }
    this.isRunning = true;

    const tosave = new User(this.user);
    // save default phone
    if (!tosave.phoneNumbers.length) {
      tosave.phoneNumbers.push({number: address.phone, what: 'mobile'});
    }

    // // save address
    // if(this.idx >= 0 ) {
    //   tosave.addresses[this.idx] = address;
    // }else {
    //   this.idx = (tosave.addresses.push(address)) - 1;
    // }

    tosave.addresses.push(address);
    this.$user.save(tosave).subscribe(
      user => {
        this.isRunning = false;
      }
    );

  }

}
