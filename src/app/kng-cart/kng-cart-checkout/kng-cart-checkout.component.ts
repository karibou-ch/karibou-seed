import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { i18n, KngUtils } from '../../common';
import { CartItem, CartService, Config, Hub, Order, OrderService, OrderShipping, User, UserAddress, UserCard, UserService } from 'kng2-core';
import pkgInfo from '../../../../package.json';
import { EnumMetrics, MetricsService } from 'src/app/common/metrics.service';
import { StripeService } from 'ngx-stripe';
import { MdcSnackbar } from '@angular-mdc/web';

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


  selectPaymentIsDone: boolean;
  selectAddressIsDone: boolean;

  // FIXME remove hardcoded reserved value 0.11!
  amountReserved = 1.11;

  // order stuffs
  errorMessage: string|null = null;
  isRunning = false;  

  issuer = {
    wallet: {
      img: '/assets/img/payment/wallet.jpg',
      label: 'Votre compte privé'
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

  get labell() {
    return this.$i18n.label();
  }


  get locale() {
    return this.$i18n.locale;
  }

  get items() {
    return this._items;
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


  ngOnInit(): void {
  }

  //
  // entry point
  doInitateCheckout(user: User,hub: Hub,items: CartItem[], totalDiscount: number ){
    this._currentHub = hub;
    this._items = items;
    this._totalDiscount = totalDiscount;
    this.errorMessage = null;
    this._isReady = true;
    this._user = user;
    this.open = true;
    this.checkPaymentMethod();

    const address = this.$cart.getCurrentShippingAddress();
    this.selectAddressIsDone = this.setShippingAddress(address);

    //
    // check if address is already set
    if(!this.selectAddressIsDone){
      if(this.orders.length) {
        //content.name,content.streetAdress,content.floor,content.region,content.postalCode,content.note,false,geo
        const address = UserAddress.from(this.orders[0].shipping);
        this.selectAddressIsDone = this.setShippingAddress(address);
      }

      if(!this.selectAddressIsDone){
        const address = this._user.addresses[0];
        this.selectAddressIsDone = this.setShippingAddress(address);  
      }  
    }

    //
    // FIXME currently only one shipping time!
    this.shipping = this.config.shared.shipping;

    this.itemsAmount = this.$cart.subTotal(hub.slug);

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
    return this.$cart.getCurrentShippingAddress();
  }

  currentShippingFees() {
    return this.$cart.getCurrentShippingFees(this.store);
  }

  currentPaymentMethod() {
    return this.$cart.getCurrentPaymentMethod();
  }

  currentPaymentMethodLabel() {
    const method = this.currentPaymentMethod();
    if(!method){
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
    //console.log(' --- DBG checkPaymentMethod',this._user.payments.map(p=>p.alias))
    this.$user.checkPaymentMethod(this._user).subscribe(user => {
      //
      // set default payment
      // FIXME me this.orders[0].payment.issue is crashing 
      const lastAlias = (this.orders.length && this.orders[0].payment) ? this.orders[0].payment.alias:null;
      const payments = this._user.payments.filter(payment => !payment.error);
      const currentPayment = this.$cart.getCurrentPaymentMethod();
      const previousPayment = payments.find(payment => payment.alias == lastAlias);
      if(previousPayment) {
        payments.unshift(currentPayment);
      }

      if(currentPayment && !currentPayment.error) {
        payments.unshift(currentPayment);
      }

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
    const isDone = this.selectAddressIsDone = this.$cart.setShippingAddress(address);

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
    console.log('---DBG payment',payment.alias);
  }

  subTotal() {
    return this.$cart.subTotal(this._currentHub.slug);
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
