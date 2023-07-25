import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { i18n, KngUtils } from '../../common';
import { CartItem, CartService, Config, Hub, Order, OrderService, OrderShipping, User, UserAddress, UserCard, UserService } from 'kng2-core';
import pkgInfo from '../../../../package.json';
import { EnumMetrics, MetricsService } from 'src/app/common/metrics.service';
import { StripeService } from 'ngx-stripe';
import { MdcSnackbar } from '@angular-mdc/web';
import { StripeAddressElementOptions, StripeCardElementOptions, StripeElementsOptions } from '@stripe/stripe-js';

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
  useCartView:boolean;


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

  get userBalance() {
    return this._user.balance>0? this._user.balance:0;
  }

  get userAddresses() {
    const addresses = [... this.user.addresses];
    if(!this.currentAddress || !this.currentAddress.name) {
      return addresses;
    }

    // const idx = addresses.findIndex(add => this.currentAddress.isEqual(add));
    // if(idx>-1){
    //   addresses.splice(idx,1);
    // }
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

    // const idx = payments.findIndex(payment => payment.isEqual(this.currentPayment));
    // if(idx>-1){
    //   payments.splice(idx,1);  
    // }

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


  get currentTotalMinusBalance(){
    return Math.max(this.currentTotal()-this.userBalance,0);
  }
  get currentFeesName() {
    if(!this._currentHub){
      return '0%'
    }
    const fees = this._currentHub.serviceFees;
    return Math.floor(fees*100) + '%';
  }

  get currentFeesAmount() {
    if(!this._currentHub){
      return 0;
    }

    const hub = this._currentHub.slug;
    const amount = this.$cart.getItems().filter(item => (!hub || hub == item.hub)).reduce((total,item) =>{
      return total += (item.price * item.quantity);
    },0);
    const fees = this._currentHub.serviceFees;
    return Math.floor(amount*fees*100)/100;
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

  //
  // entry point
  doInitateCheckout(user: User,hub: Hub,items: CartItem[], totalDiscount: number, useCartView:boolean ){
    this._currentHub = hub;
    this._items = items;
    this._totalDiscount = totalDiscount;
    this.errorMessage = null;
    this._isReady = true;
    this._user = user;
    this.open = true;
    this.useCartView = useCartView;
    this.checkPaymentMethod();

    console.log('---DBG doInitateCheckout',user)
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
    // FIXME currently only one shipping time!
    this.shipping = this.config.shared.shipping;

    this.itemsAmount = this.$cart.subTotal(hub.slug,!useCartView);

    this.buildDiscountLabel();

    //
    // Metric ORDER
    this.$metric.event(EnumMetrics.metric_order_payment,{hub:this.store});

  }


  buildDiscountLabel() {
    const address = this.currentShipping();
    const price = this.$cart.estimateShippingFees(address, this.store);
    const dA = this.$cart.hasShippingReduction();
    const dB = this.$cart.hasShippingReductionB();
    const dC = this.$cart.hasShippingReductionMultipleOrder(address);
    const label = this.i18n[this.locale]['cart_info_shipping_discount'];

    //
    // grouped discount
    if(dC || address['fees'] >= 0){ 
      return  this.shippingDiscount = '';
    } 

    //
    // Maximum discount
    if(dB) {
      return this.shippingDiscount = this.i18n[this.locale]['cart_info_shipping_applied'];
    //
    // Minimum discount
    } else if (dA) {
      return this.shippingDiscount = label.replace('_AMOUNT_',this.shipping.discountB).replace('_DISCOUNT_',Math.max(price - this.shipping.priceB,0).toFixed(2));
    //
    // Missing amount
    } else {
      return  this.shippingDiscount = label.replace('_AMOUNT_',this.shipping.discountA).replace('_DISCOUNT_',Math.max(price - this.shipping.priceA,0).toFixed(2));
    }    
  }


  computeShippingByAddress(address: UserAddress) {
    return this.$cart.computeShippingFees(address,this.store);
  }

  currentShippingDay() {
    return this.$cart.getCurrentShippingDay();
  }

  currentShipping() {
    const address = this.$cart.getCurrentShippingAddress();

    return address;
  }

  currentShippingFees() {
    return this.$cart.getCurrentShippingFees(this.store);
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

  currentGatewayAmount() {
    return this.$cart.gatewayAmount(this.store);
  }

  currentServiceFees() {
    return this.$cart.totalHubFees(this.store);
  }

  currentTotal() {
    return this.$cart.total(this.store);
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




  hasShippingReductionMultipleOrder(){
    const address = this.currentShipping();
    return this.$cart.hasShippingReductionMultipleOrder(address);
  }

  hasShippingDiscount() {
    return this.$cart.hasShippingReduction();
  }

  hasShippingDiscountB() {
    return this.$cart.hasShippingReductionB();
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
    this.$cart.clear(this.store,order);
    this.updated.emit({ order });
    this.open = false;
  }

  confirmPaymenIntent(intent: any) {
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
      // The payment has been processed!
      if (['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
        const payment = this.$cart.getCurrentPaymentMethod();
        payment.intent_id = result.paymentIntent.id;
        this.$cart.setPaymentMethod(payment);

        this.doOrder();
        //setTimeout(() => this.doOrder(), 10);
        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
      }
    });
  }


  doOrder() {
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

    const hub = this._currentHub.slug;
    const items = this.items;

    //
    // update shipping note
    shipping.note = this.shippingNote || shipping.note;

    this.isRunning = true;

    this.$order.create(
      hub,
      shipping,
      items.map(item => item.toDEPRECATED()),
      this.$cart.getCurrentPaymentMethod()
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
          return this.confirmPaymenIntent(status.error);
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


}
