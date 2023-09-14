import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { i18n, KngUtils } from '../../common';
import { CartItem,CartItemsContext, CartService,CartSubscriptionParams, Config, Hub, Order, OrderService, OrderShipping, User, UserAddress, UserCard, UserService } from 'kng2-core';
import { EnumMetrics, MetricsService } from 'src/app/common/metrics.service';
import { StripeService } from 'ngx-stripe';
import { MdcSnackbar } from '@angular-mdc/web';
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
  private _isReady: boolean;

  @Input() set config(cfg: Config){
    this._config = cfg;
  }

  @Input() i18n: any;
  @Input() orders: Order[];


  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  VERSION = pkgInfo.version;
  cgAccepted = false;
  cg18Accepted = false;
  shipping;
  shippingTime;
  shippingNote: string;
  shippingDiscount: string;
  showInfoAmount: boolean;
  showInfoFees: boolean;
  requestIntent: string;
  currentCart:any;
  itemsAmount:number;
  doToggleFees: boolean;
  userAddressSelection:boolean;
  userPaymentSelection:boolean;
  useCartSubscriptionView:boolean;
  subscriptionParams:CartSubscriptionParams


  selectPaymentIsDone: boolean;

  // FIXME remove hardcoded reserved value 0.11!
  amountReserved = 1.11;

  // order stuffs
  errorMessage: string|null = null;
  isRunning = false;  

  issuer = {
    cash: {
      img: '/assets/img/payment/wallet.jpg',
      label: 'Votre portefeuille'
    },
    invoice: {
      img: '/assets/img/payment/invoice.jpg',
      label: 'Facture en ligne'
    },
    mastercard: {
      img: '/assets/img/payment/mc.jpg',
      label: 'Mastercard'
    },
    visa: {
      img: '/assets/img/payment/visa.jpg',
      label: 'VISA'
    },
    'amex': {
      img: '/assets/img/payment/ae.jpg',
      label: 'American Express'
    },
    'american express': {
      img: '/assets/img/payment/ae.jpg',
      label: 'American Express'
    },
    btc: {
      img: '/assets/img/payment/btc.jpg',
      label: 'Bitcoin'
    },
    bch: {
      img: '/assets/img/payment/bch.jpg',
      label: 'Bitcoin Cash'
    },
    lumen: {
      img: '/assets/img/payment/xlm.jpg',
      label: 'Lumen'
    }
  };


  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $metric: MetricsService,
    private $order: OrderService,
    private $stripe: StripeService,
    private $snack: MdcSnackbar,
    private $user: UserService
  ) {
    this._open = false;
    this.i18n = {};
    this.orders = [];
  }

  get label() {
    return this.i18n[this.locale];
  }

  get label_cart_info_subtotal_fees(){
    return this.i18n[this.locale].cart_info_subtotal_fees.replace('__FEES__',this.currentFeesName);
  }

  get labell() {
    return this.$i18n.label();
  }


  get locale() {
    return this.$i18n.locale;
  }

  get items() {
    return this._items;
  }

  get selectAddressIsDone(){
    return !!(this.currentAddress && this.currentAddress.streetAdress)
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

  get userAddresses() {
    const addresses = [... this.user.addresses];
    if(!this.currentAddress || !this.currentAddress.name) {
      return addresses;
    }

    return addresses; 
  }

  get currentPayment() {
    return this.currentPaymentMethod();
  }  

  get userPayments() {
    const payments = [... this.user.payments];
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

  get isReady() :boolean {
    return this._isReady;
  }

  get store() :string{
    return this._currentHub.slug;
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


  get currentTotalUserBalance() {
    const userBalance = this._user.balance>0? this._user.balance:0;
    return Math.min(this.currentTotal(),userBalance);
  }

  get currentTotalMinusBalance(){
    const userBalance = this._user.balance>0? this._user.balance:0;
    return Math.max(this.currentTotal()-userBalance,0);
  }

  get subscriptionNextShippingDay() {
    const oneWeek = Order.fullWeekShippingDays(this.hub);
    return oneWeek.find(date => date.getDay() == this.subscriptionParams.dayOfWeek);
  }

  get currentTotalSubscription(){
    return this.currentTotal();
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


  ngOnInit(): void {

    this.$user.user$.subscribe(user => {      
      this._user = user;
      if(!this._isReady){
        this.selectPaymentIsDone = false;
        this.$cart.setPaymentMethod(null);
        return;
      }
      //
      // if user i
      this.checkPaymentMethod();
    });
  }



  doOrder(intent?) {
    //
    // prepare shipping
    // FIXME hour selection should be better
    const shippingDay = this.currentShippingDay();
    const specialHours = ((shippingDay.getDay() == 6)? 12:16);
    const shippingHours = (this.isCartDeposit() ? '0' : specialHours);
    const shipping = new OrderShipping(
      this.currentShipping(),
      shippingDay,
      shippingHours
    );

    const payment = intent||this.currentPayment;
    const hub = this._currentHub.slug;
    const items = this.items.map(item => item.toDEPRECATED());

    //
    // update shipping note
    shipping.note = this.shippingNote || shipping.note;

    this.isRunning = true;

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
          hub:hub
        });

        //
        // validate
        this.createPaymentConfirmation(order);
      },
      status => {

        //
        // SCA request payment confirmation
        if (status.error.client_secret) {
          return this.confirmPaymenIntent(status.error, {oid:status.error.oid});
        }
        this.errorMessage = status.error;
        this.isRunning = false;
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

  doSubscriptionPaymentConfirm(sid,intent) {

  }



  doSubscription() {
    this.subscriptionParams = this.$cart.subscriptionGetParams();

    const shippingDay = this.subscriptionNextShippingDay;
    const specialHours = ((shippingDay.getDay() == 6)? 12:16);
    const shippingHours = (this.isCartDeposit() ? '0' : specialHours);
    const shipping = new OrderShipping(
      this.currentShipping(),
      shippingDay,
      shippingHours
    );
    const payment = this.currentPayment;
    const items = this.items.map(item => item.toDEPRECATED());
    const hub = this._currentHub.slug;
    this.isRunning = true;
    this.$cart.subscriptionCreate(hub,shipping, items, payment.alias,this.subscriptionParams.frequency, this.subscriptionParams.dayOfWeek).subscribe(
      subscription=> {
        this.isRunning = false;
        console.log('----- subscription running',subscription);

        //
        // check order errors
        if (subscription.errors) {
          this.$cart.setError(subscription.errors, hub);
          this.$snack.open(
            this.$i18n.label().cart_corrected,
            this.$i18n.label().thanks,
            this.$i18n.snackOpt
          );
          this.updated.emit({ errors: subscription.errors });
          this.open = false;          
        }

        //
        // confirm payment intent (3ds)
        if(subscription.latestPaymentIntent && 
           subscription.latestPaymentIntent.status=='requires_action') {

            return this.confirmPaymenIntent(subscription.latestPaymentIntent, {subscription:subscription.id});

        }

        //
        // update payment method (invalid card)
        if(subscription.latestPaymentIntent && 
          subscription.latestPaymentIntent.status=='requires_payment_method') {
          this.errorMessage = "La carte est ne fonctionne pas";

        }
    
      },status =>{
        //
        // SCA request payment confirmation
        if (status.error && status.error.client_secret) {
          return this.confirmPaymenIntent(status.error, {oid: status.error.oid});
        }
        console.log('----- payment error',status.error);
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
  // entry point
  doInitateCheckout(user: User,hub: Hub,items: CartItem[], totalDiscount: number, useCartSubscriptionView:boolean ){
    this._currentHub = hub;
    this._items = items;
    this._totalDiscount = totalDiscount;
    this.errorMessage = null;
    this._user = user;
    this.open = true;
    this.useCartSubscriptionView = useCartSubscriptionView;
    this.checkPaymentMethod();
    this.subscriptionParams = useCartSubscriptionView? this.$cart.subscriptionGetParams():{
      dayOfWeek: 0,
      frequency: undefined,
      activeForm:false
    }

    const address = this.$cart.getCurrentShippingAddress();
    this.setShippingAddress(address);

    //
    // check if address is already set
    if(!this.selectAddressIsDone){
      if(this.orders.length) {
        //content.name,content.streetAdress,content.floor,content.region,content.postalCode,content.note,false,geo
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
      hub:hub.slug
    }    

    this.itemsAmount = this.$cart.subTotal(ctx);

    this.buildDiscountLabel();

    //
    // Metric ORDER
    this.$metric.event(EnumMetrics.metric_order_payment,{hub:this.store});
  }


  buildDiscountLabel() {
    const ctx:CartItemsContext = {
      address:this.currentShipping(),
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }
    const address = this.currentShipping();    
    const {price, status} = this.$cart.estimateShippingFeesWithoutReduction(address);
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

  currentShippingFees() {
    const ctx:CartItemsContext = {
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }    
    return this.$cart.computeShippingFees(ctx);

  }

  currentPaymentMethod() {
    return this.$cart.getCurrentPaymentMethod();
  }

  currentPaymentMethodLabel() {
    const method = this.currentPaymentMethod();
    if(!method || !method.issuer){
      return '';
    }
    return this.issuer[method.issuer].label;
  }

  currentGatewayLabel() {
    return (this.$cart.getCurrentGateway().label);
  }

  currentGatewayFees() {
    return (this.$cart.getCurrentGateway().fees * 100).toFixed(1);
  }

  //
  // (total + shipping - totalDiscount) * fees
  currentGatewayAmount() {
    const ctx:CartItemsContext = {
      forSubscription: this.useCartSubscriptionView,
      hub:this.store
    }    
    
    const fees = this.$cart.getCurrentGateway().fees;
    return (this.$cart.total(ctx)*fees).toFixed(2);
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
      // FIXME me this.orders[0].payment.issue is crashing 
      this._user = user;
      const lastAlias = (this.orders.length && this.orders[0].payment) ? this.orders[0].payment.alias:null;
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
    return KngUtils.getStaticMap(address, this.config.shared.keys.pubMap || '');
  }

  getDepositAddress() {
    return this.hub.deposits;
  }



  //
  // FIXME refactor, use shipping reduction enum as 'multiple,deposit,discountA,discountB'
  hasShippingReductionMultipleOrder(){
    const address = this.currentShipping();
    return this.$cart.hasShippingReductionMultipleOrder(address);
  }



  // available day for order,
  isOpen() {
    const next = Order.nextShippingDay(this._user);

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
      return false;
    }

    this.userAddressSelection = false;
    const isDone = this.$cart.setShippingAddress(address);


    //
    // copy note
    this.shippingNote = address.note;

    //
    // update shipping time
    const shippingDay = this.currentShippingDay();
    const specialHours = ((shippingDay.getDay() == 6)? 12:16);
    const shippingHours = (this.isCartDeposit() ? '0' : specialHours);

    this.shippingTime = this.config.shared.hub.shippingtimes[shippingHours];


    return isDone;
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
    this.updated.emit({ order });
    this.open = false;
  }

  //
  // subscription stuffs 
  createSubscriptionConfirmation(shipping) {
    this.$snack.open(this.$i18n.label().cart_save_deliver + shipping.when.toDateString());
    this._items = [];
    this.open = false;
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
        result.paymentIntent['oid'] = target.oid;

        this.doOrder(result.paymentIntent);
      }
      if(target.subscription&& ['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
        this.doSubscriptionPaymentConfirm(target.subscription,result.paymentIntent);
      }

    });
  }


}
