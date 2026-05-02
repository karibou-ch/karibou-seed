import { Component, EventEmitter, HostListener, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { i18n, KngNavigationStateService, KngUtils } from '../../common';
import { CartItem,CartItemsContext, CartService,CartSubscriptionParams, CartSubscriptionProductItem, Config, Hub, Order, OrderService, ShippingAddress, User, UserAddress, UserCard, UserService, CalendarService, UserCouponCredit } from 'kng2-core';
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
export class KngCartCheckoutComponent implements OnInit, OnDestroy {


  private _open: boolean;
  private _config: Config;
  private _user: User;
  private _currentHub: Hub;
  private _items: CartItem[];
  private _updateItems:CartSubscriptionProductItem[];
  private _isReady: boolean;

  @Input() set config(cfg: Config){
    this._config = cfg;
  }

  @Input() orders: Order[];
  @Input() shippingTime: string;
  @Input() processingMessage: string;



  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  VERSION = pkgInfo.version;
  readonly i18n: any = {
    fr: {
      cart_deposit: 'Commande à collecter',
      cart_info_note:'Note:',
      cart_coupon_invalid:'Le bon de réduction n\'est pas valide',
      cart_coupon_too_high:'Le bon de réduction est plus grand que le montant de la facture',
      cart_info_help:'besoin d\'aide?',
      cart_payment_title:'Informations de la carte',
      cart_payment_not_available: 'Cette méthode de paiement n\'est plus disponible',
      cart_update_subscription_payment: 'Valider votre méthode de paiement',
      cart_update_subscription_payment_error:"Votre carte est ne fonctionne pas, utilisez une autre méthode de paiement",
      cart_address_save_error: 'Impossible de sauvegarder cette adresse',
      cart_amount_1: 'Le paiement sera effectué le jour de la livraison une fois le total connu. Nous réservons un montant supérieur ',
      cart_amount_2: 'pour permettre des modifications de commande (au moment de l\'emballage, certains articles sont pesés puis facturés selon le poids exact).',
      checkout_back: 'Retour',
      checkout_summary_title: 'Résumé de votre commande',
      checkout_reserved_title: 'Pourquoi un montant réservé ?'
    },
    en: {
      cart_deposit: 'Order to collect',
      cart_info_note:'Note:',
      cart_coupon_invalid:'The discount code is not valid',
      cart_coupon_too_high:'The discount code is greater than the invoice amount',
      cart_info_help:'Need help?',
      cart_payment_title:'Card information',
      cart_payment_not_available: 'This payment method is no longer available',
      cart_update_subscription_payment: 'Validate your payment method',
      cart_update_subscription_payment_error:"Your card is not working, use another payment method",
      cart_address_save_error: 'Unable to save this address',
      cart_amount_1: 'Payment will be made on the day of delivery once the total is known. We reserve a higher amount ',
      cart_amount_2: 'to allow order changes (at the time of packaging, some items are weighed and then billed based on the exact weight).',
      checkout_back: 'Back',
      checkout_summary_title: 'Order summary',
      checkout_reserved_title: 'Why is an amount reserved?'
    }
  };
  cgAccepted = false;
  cg18Accepted = false;
  shippingNote: string;
  billNote: string;
  couponCode: string;
  couponCredit: UserCouponCredit|null = null;
  couponError: string|null = null;
  isCouponRunning = false;
  useCartSubscriptionView: boolean;
  subscriptionPlan:string;
  contract:CartSubscription;

  //
  // ✅ GETTER DYNAMIQUE: Lit directement depuis CartService pour réactivité
  // Raison: kng-subscription-option met à jour subscriptionParams via $cart.subscriptionSetParams()
  // Sans getter, le template utiliserait une copie stale qui n'est pas mise à jour
  get subscriptionParams(): CartSubscriptionParams {
    if (!this.useCartSubscriptionView) return null;
    return this.$cart.subscriptionGetParams();
  }


  selectAddressIsDone: boolean
  selectPaymentIsDone: boolean;
  paymentTWINT: UserCard;

  // ✅ FIXED: Bug #9 - Remplacer hardcoded value par getter dynamique
  get amountReserved() {
    return this.config?.shared?.order?.reservedAmount || 1.11;
  }

  // order stuffs
  errorMessage: string|null = null;
  isRunning = false;
  showReservationInfo = false;
  walletReady = false;
  private walletType: 'apple'|'google'|null = null;
  private walletPaymentRequest: any;
  private walletPaymentButton: any;
  private walletPreparing = false;

  // ✅ FIXED: Bug #10 - Memory leak management
  private _subscriptions: any[] = [];
  private _checkoutHistoryState = false;
  private _ignoreHistorySync = false;

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

  // ✅ FIXED: Bug #10 - Proper cleanup to prevent memory leaks
  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    this._subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    this._subscriptions = [];
  }

  @HostListener('window:popstate')
  onBrowserBack() {
    if (!this._open) {
      return;
    }

    this._checkoutHistoryState = false;
    this._ignoreHistorySync = true;
    this.open = false;
    this._ignoreHistorySync = false;
  }

  // ✅ SIMPLE: Centraliser création CartItemsContext (sans cache)
  private createCartContext(): CartItemsContext {
    return {
      forSubscription: this.useCartSubscriptionView,
      hub: this.store
    };
  }

  get iOS() {
    return this.$navigation.isIOS;
  }

  get issuer() {
    return KngPaymentComponent.issuer;
  }

  get label() {
    return this.i18n[this.locale] || this.i18n.fr;
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

  get updateItems() {
    return this._updateItems;
  }

  get currentAddress() {
    return this.currentShipping();
  }

  get currentAddressIsDeposit() {
    // ✅ FIXED: Bug #2 - Missing return statement
    if(!this.config.shared.hub || !this.config.shared.hub.deposits) {
      return false;
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
    return !this.selectPaymentIsDone||!this.cgAccepted||!this.selectAddressIsDone ||this.isRunning||this.isCouponRunning;
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
      this.pushCheckoutHistoryState();
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
      if (this._checkoutHistoryState && !this._ignoreHistorySync) {
        this._checkoutHistoryState = false;
        window.history.back();
      }
    }

    this._open = open;
  }

  closeCheckout() {
    this.open = false;
  }

  closeAfterAsyncPayment() {
    this._checkoutHistoryState = false;
    this._ignoreHistorySync = true;
    this.open = false;
    this._ignoreHistorySync = false;
  }

  private pushCheckoutHistoryState() {
    if (this._checkoutHistoryState) {
      return;
    }

    window.history.pushState({ checkoutOpen: true }, document.title, window.location.href);
    this._checkoutHistoryState = true;
  }

  get currentPayment() {
    return this.currentPaymentMethod();
  }

  get subscriptionNextShippingDay() {
    // ✅ MIGRATION: Utiliser CalendarService au lieu d'Order
    const oneWeek = this.$calendar.getValidShippingDatesForHub(this.hub, { days: 7 });

    // ✅ CORRECTION BUG TIMEZONE: Utiliser toHubTime pour comparer dans timezone Hub
    // au lieu de date.getDay() qui utilise la timezone locale du navigateur
    const foundDate = oneWeek.find(date => {
      const dateHub = this.$calendar.toHubTime(date, this.hub);
      return dateHub.getDay() == this.subscriptionParams.dayOfWeek;
    });

    // ✅ CORRECTION CRITIQUE: Fallback si dayOfWeek n'existe pas dans les dates valides
    // Cela peut arriver après la correction de kng-subscription-option si l'utilisateur
    // a une ancienne sélection incompatible
    return foundDate || oneWeek[0] || this.$calendar.nextShippingDay(this.hub, this._user);
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

  get currentPaymentIcon() {
    const method = this.currentPaymentMethod();
    if(!method || !method.issuer){
      return '';
    }
    return this.issuer[method.issuer].img;
  }

  get reviewShippingDay() {
    return this.useCartSubscriptionView ? this.subscriptionNextShippingDay : this.currentShippingDay();
  }

  get reviewShippingTime() {
    if (this.useCartSubscriptionView && this.subscriptionParams?.time !== undefined) {
      return this.config.shared.hub.shippingtimes?.[this.subscriptionParams.time] || `${this.subscriptionParams.time}h`;
    }
    const selectedHours = this.$cart.getCurrentShippingTime() || this.$calendar.getDefaultTimeByDay(this.reviewShippingDay, this.hub);
    return this.config.shared.hub.shippingtimes?.[selectedHours] || `${selectedHours}h`;
  }

  get reviewIsLastMinuteShipping() {
    return !this.useCartSubscriptionView && this.$cart.isCurrentShippingLastMinute();
  }

  ngOnInit(): void {
    // ensure state
    document.body.classList.remove('mdc-dialog-scroll-lock');

    //
    // save the plan for the subscription (business, customer)
    this.subscriptionPlan = this.$route.snapshot.queryParams.plan||'customer';

    this._subscriptions.push(this.$user.user$.subscribe(user => {
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
      // ✅ FIXED: Comparaison robuste d'adresses (streetAdress + postalCode + region)
      const missingAddress = this.currentAddress && !this.userAddresses.some(address => {
        const normalize = (str: string) => (str || '').trim().toLowerCase();
        return normalize(address.streetAdress || address.streetAddress) ===
               normalize(this.currentAddress.streetAdress || this.currentAddress.streetAddress) &&
               normalize(address.postalCode) === normalize(this.currentAddress.postalCode) &&
               normalize(address.region) === normalize(this.currentAddress.region);
      });

      if(this.selectAddressIsDone && this.currentAddress && missingAddress){
        console.log('🔄 Address removed, clearing current selection:', this.currentAddress);
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
    }));

  }

  computeShippingByAddress(address: UserAddress) {
    // ✅ SIMPLE: Utiliser context centralisé avec address paramétrisée
    const ctx = { ...this.createCartContext(), address };
    return this.$cart.computeShippingFees(ctx);
  }

  shippingFeeForAddress = (address: UserAddress) => this.computeShippingByAddress(address);

  currentShippingDay() {
    return this.$cart.getCurrentShippingDay();
  }


  currentShipping() {
    return this.$cart.getCurrentShippingAddress();
  }

  currentPaymentMethod() {
    return this.$cart.getCurrentPaymentMethod();
  }



  currentServiceFees() {
    // ✅ SIMPLE: Utiliser context centralisé
    const ctx = this.createCartContext();
    return this.$cart.totalHubFees(ctx);
  }

  currentTotal() {
    // ✅ SIMPLE: Utiliser context centralisé
    const ctx = this.createCartContext();
    if(this.contract) {
      return this.$cart.subTotal(ctx);
    }
    return this.$cart.total(ctx);
  }

  currentTotalWithFees() {
    return Math.round((this.currentTotal() + this.currentServiceFees()) * 100) / 100;
  }

  onCouponChange() {
    this.couponCredit = null;
    this.couponError = null;
    this.walletReady = false;
  }

  readCoupon() {
    const code = (this.couponCode || '').trim();
    this.couponCredit = null;
    this.couponError = null;

    if(!code) {
      return;
    }

    this.isCouponRunning = true;
    this._subscriptions.push(this.$user.readCoupon(code).subscribe(coupon => {
      this.isCouponRunning = false;
      if(coupon.amount > this.currentTotalWithFees()) {
        this.couponError = this.label.cart_coupon_too_high || 'Le coupon est plus grand que le montant de la facture';
        return;
      }
      this.couponCredit = coupon;
      this.couponCode = coupon.code;
      this.prepareWalletPayment();
    }, status => {
      this.isCouponRunning = false;
      this.couponError = status.error || this.label.cart_coupon_invalid || 'Le coupon n\'est pas valide';
    }));
  }

  clearCoupon() {
    this.couponCode = '';
    this.couponCredit = null;
    this.couponError = null;
  }

  checkPaymentMethod(force?:boolean) {
    if (!this._user.isAuthenticated()) {
      this.open = false;
      return;
    }
    this._subscriptions.push(this.$user.checkPaymentMethod(this._user).subscribe(user => {
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
    }));
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
    return !!current && current['fees'] !== undefined;
  }

  isSelectedAddress(add: UserAddress) {
    const current = this.$cart.getCurrentShippingAddress();
    return current && add.streetAddress == (current.streetAddress);
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

    const phone = address.phone || this.userPhone;
    if(phone) {
      address.phone = UserAddress.normalizePhone(phone);
    }

    this.selectAddressIsDone = this.$cart.setShippingAddress(address);


    //
    // copy note
    this.shippingNote = address.note;

    this.prepareWalletPayment();

    return this.selectAddressIsDone;
  }

  setPaymentMethod(payment: UserCard) {
    this.selectPaymentIsDone = false;
    if (!payment) {
      return;
    }


    // ✅ FIXED: Don't block checkout based on isValid() - let Stripe decide
    // if (!payment.isValid()) {
    //   this.$snack.open(payment.error || this.label.cart_payment_not_available, 'OK');
    //   return;
    // }

    this.$cart.setPaymentMethod(payment);
    this.selectPaymentIsDone = true;
  }

  editAddressFromReview() {
    this.selectAddressIsDone = false;
  }

  addAddressFromReview() {
    this.$router.navigate(['./user/login-or-address'], { relativeTo: this.$route });
  }

  editPaymentFromReview() {
    this.selectPaymentIsDone = false;
  }

  addPaymentFromReview() {
    this.$router.navigate(['./user/login-or-payment'], { relativeTo: this.$route });
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

  private buildCheckoutPayload(intent?, paymentOverride?) {
    //
    // prepare shipping (simplifié)
    const shippingDay = this.currentShippingDay();
    const hours = this.$calendar.getDefaultTimeByDay(shippingDay, this.hub) || 16;
    const hoursValue = this.isCartDeposit() ? 0 : hours;
    const address = this.currentShipping();
    const shipping = new ShippingAddress(address, shippingDay, hoursValue);

    // ✅ Flag lastMinute simple
    shipping.lastMinute = this.$cart.isCurrentShippingLastMinute();

    //needed from backend
    //paymentData && paymentData.oid && paymentData.intent_id
    const payment:any = Object.assign({}, paymentOverride || intent || this.currentPayment);
    if(this.couponCredit && !payment.coupon) {
      payment.coupon = this.couponCredit.code;
    }
    const hub = this._currentHub && this._currentHub.slug || this.$navigation.store;
    const items = this.items.map(item => item.toDEPRECATED());

    //
    // update shipping note
    shipping.note = this.shippingNote || shipping.note;

    return {
      hub,
      shipping,
      items,
      payment,
      customer: this.billNote ? { billNote: this.billNote } : undefined
    };
  }

  private handleCheckoutErrors(errors: any[], hub: string) {
    this.isRunning = false;
    this.$cart.setError(errors, hub);
    this.$snack.open(
      this.$i18n.label().cart_corrected,
      this.$i18n.label().thanks,
      this.$i18n.snackOpt
    );
    this.updated.emit({ errors });
    this.$cart.broadcastState();
    this._subscriptions.push(this.$user.me().subscribe());
    this.open = false;
  }

  private prepareWalletPayment() {
    if (this.walletPreparing || this.useCartSubscriptionView || !this._user?.isAuthenticated() || !this.selectAddressIsDone) {
      return;
    }

    this.walletPreparing = true;
    this.walletReady = false;
    const walletPayment = {
      alias: 'apple',
      issuer: 'apple',
      type: 'apple'
    };
    // FIXME checkout quote: this should run when the cart opens and surface quote errors
    // immediately, not only when preparing the Apple/Google wallet button.
    const payload = this.buildCheckoutPayload(null, walletPayment);

    this._subscriptions.push(this.$order.quoteCheckout(payload).subscribe(quote => {
      if(quote.errors && quote.errors.length) {
        this.walletPreparing = false;
        return;
      }
      this._subscriptions.push(this.$user.checkPaymentMethod(this._user, undefined, undefined, quote.quoteKey).subscribe(user => {
        this._user = user;
        const walletIntent = this._user.context && this._user.context.walletIntent;
        if(!walletIntent || !walletIntent.client_secret) {
          this.walletPreparing = false;
          return;
        }

        const stripe = this.$stripe.getInstance();
        this.walletPaymentRequest = stripe.paymentRequest({
          country: 'CH',
          currency: (quote.currency || 'chf').toLowerCase(),
          total: {
            label: 'Karibou',
            amount: Math.round(quote.amount * 100)
          },
          // TODO: later use wallet payer details for automatic account creation.
          requestPayerName: true,
          requestPayerEmail: true
        });

        this.walletPaymentRequest.canMakePayment().then(result => {
          if(!result) {
            this.walletPreparing = false;
            return;
          }
          this.walletType = result.applePay ? 'apple' : 'google';
          this.walletPaymentRequest.on('paymentmethod', event => this.confirmWalletPayment(event));
          this._subscriptions.push(this.$stripe.elements().subscribe(elements => {
            setTimeout(() => {
              try {
                if(this.walletPaymentButton) {
                  this.walletPaymentButton.unmount();
                }
                this.walletPaymentButton = elements.create('paymentRequestButton', {
                  paymentRequest: this.walletPaymentRequest
                });
                this.walletPaymentButton.mount('#checkout-wallet-button');
                this.walletReady = true;
              } catch(err) {
                console.log('wallet button error', err);
              }
              this.walletPreparing = false;
            });
          }));
        });
      }, () => {
        this.walletPreparing = false;
      }));
    }, () => {
      this.walletPreparing = false;
    }));
  }

  private confirmWalletPayment(event: any) {
    const walletIntent = this._user.context && this._user.context.walletIntent;
    if(!walletIntent || !walletIntent.client_secret) {
      event.complete('fail');
      return;
    }
    this.isRunning = true;
    this._subscriptions.push(this.$stripe.confirmCardPayment(walletIntent.client_secret, {
      payment_method: event.paymentMethod.id
    }, {
      handleActions: false
    }).subscribe(result => {
      if(result.error) {
        event.complete('fail');
        this.isRunning = false;
        this.errorMessage = result.error.message;
        this.$snack.open(result.error.message, this.$i18n.label().thanks, this.$i18n.snackOpt);
        return;
      }

      event.complete('success');
      const paymentIntent = result.paymentIntent;
      const walletType = this.walletType || 'apple';
      this.doOrder({
        alias: walletType,
        issuer: walletType,
        type: walletType,
        payment_intent: paymentIntent.id
      });
    }, error => {
      event.complete('fail');
      this.isRunning = false;
      this.errorMessage = error.message || error;
    }));
  }

  private confirmPaymentActionRequired(intent: any, payment: any): boolean {
    if (!intent || !intent.client_secret) {
      return false;
    }

    if (!intent.oid) {
      this.isRunning = false;
      this.errorMessage = this.label.cart_payment_not_available;
      this.$snack.open(this.errorMessage, this.$i18n.label().thanks, this.$i18n.snackOpt);
      return true;
    }

    const isTwint = intent.source == 'twint' ||
                    (payment && (payment.type == 'twint' || payment.issuer == 'twint' || payment.alias == 'twint'));
    if (isTwint) {
      this.confirmPaymenTwintIntent(intent, { oid: intent.oid });
      return true;
    }

    this.confirmPaymenIntent(intent, { oid: intent.oid });
    return true;
  }


  confirmPaymenIntent(intent: any, target:any) {
    this.errorMessage = null;

    // ✅ FIX: Selon Stripe moderne, quand status="requires_action",
    // le payment_method est déjà attaché au PaymentIntent.
    // On passe seulement client_secret pour déclencher la 3DS.
    this._subscriptions.push(this.$stripe.confirmCardPayment(intent.client_secret).subscribe((result) => {
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

    }));
  }


  private buildTwintReturnUrl(oid: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('oid', oid);
    url.searchParams.delete('payment_intent');
    url.searchParams.delete('payment_intent_client_secret');
    url.searchParams.delete('redirect_status');
    return url.toString();
  }

  confirmPaymenTwintIntent(intent: any, target:any) {
    this.errorMessage = null;

    this.$stripe.getInstance()['confirmTwintPayment'](intent.client_secret,{
      payment_method:{
        twint:{}
      },
      return_url: this.buildTwintReturnUrl(target.oid)
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

      // TWINT is finalized by the Stripe webhook; the return page follows the
      // backend payment stream instead of posting a second order confirmation.
      this.isRunning = false;
      this.$cart.broadcastState();

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
    const payload = this.buildCheckoutPayload(intent);
    this.isRunning = true;
    //
    // clear cart error
    this.$cart.clearErrors();

    if(!intent) {
      this._subscriptions.push(this.$order.quoteCheckout(payload).subscribe(quote => {
        if(quote.errors && quote.errors.length) {
          this.handleCheckoutErrors(quote.errors, payload.hub);
          return;
        }
        this.createOrderFromPayload(payload);
      }, status => {
        this.isRunning = false;
        this.errorMessage = status.error;
        this.$snack.open(
          status.error,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
        );
      }));
      return;
    }

    this.createOrderFromPayload(payload);
  }

  private createOrderFromPayload(payload: any) {
    const { hub, shipping, items, payment, customer } = payload;
    this._subscriptions.push(this.$order.create(
      hub,
      shipping,
      items,
      payment,
      customer
    ).subscribe((order) => {
        if (this.confirmPaymentActionRequired(order, payment)) {
          return;
        }

        this.isRunning = false;

        //
        // check order errors
        if (order.errors) {
          this.handleCheckoutErrors(order.errors, hub);
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
        if (this.confirmPaymentActionRequired(status.error, payment)) {
          return;
        }

        this.isRunning = false;
        this.errorMessage = status.error;
        this.$snack.open(
          status.error,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
      );
      }
    ));
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
    // subscriptionParams est maintenant un getter dynamique
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
    this._subscriptions.push(resultAction.subscribe(
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
    ));

  }

  //
  // entry point started by cart-items
  doInitateCheckout(checkoutCtx:CheckoutCtx){
    this._currentHub = checkoutCtx.hub;
    this._items = checkoutCtx.items;
    this._updateItems = checkoutCtx.updated || [];
    this._user = checkoutCtx.user;
    this.open = true;
    this.errorMessage = null;
    this.clearCoupon();
    this.contract = null;
    //
    // should be a boolean
    // subscriptionParams est maintenant un getter dynamique basé sur useCartSubscriptionView
    this.useCartSubscriptionView = false;
    if (checkoutCtx.forSubscription){
      this.contract = checkoutCtx.contract;
      this.useCartSubscriptionView = true;
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
    // Metric ORDER
    this.$metric.event(EnumMetrics.metric_order_payment,{hub:this.store});
    this.prepareWalletPayment();

  }


  //
  // payment method is valid and saved
  onPaymentSave(payment: any) {
    this.selectPaymentIsDone = false;
    this.checkPaymentMethod(true);
  }

  //
  // address is valid and must be saved
  onAddressSave(address?: UserAddress) {
    // this.$user.addressAdd(address).subscribe(user => {
    //   this._user = user;
    //   this.selectAddressIsDone = false;
    // });
    if(!address) {
      return;
    }
    this.isRunning = true;

    const tosave = new User(this.user);
    tosave.addresses = tosave.addresses || [];
    tosave.phoneNumbers = tosave.phoneNumbers || [];
    // save default phone
    if (!tosave.phoneNumbers.length && address.phone) {
      tosave.phoneNumbers.push({number: address.phone, what: 'mobile'});
    }

    // // save address
    // if(this.idx >= 0 ) {
    //   tosave.addresses[this.idx] = address;
    // }else {
    //   this.idx = (tosave.addresses.push(address)) - 1;
    // }

    const normalize = (str: string) => (str || '').trim().toLowerCase();
    const addressIndex = tosave.addresses.findIndex(saved => {
      return normalize(saved.streetAdress || saved.streetAddress) === normalize(address.streetAdress || address.streetAddress) &&
             normalize(saved.postalCode) === normalize(address.postalCode) &&
             normalize(saved.region) === normalize(address.region);
    });

    if (addressIndex > -1) {
      tosave.addresses[addressIndex] = address;
    } else {
      tosave.addresses.push(address);
    }

    this._subscriptions.push(this.$user.save(tosave).subscribe(
      user => {
        this._user = user;
        this.setShippingAddress(address);
        this.isRunning = false;
      },
      status => {
        this.isRunning = false;
        this.errorMessage = status.error || this.label.cart_address_save_error;
        this.$snack.open(
          this.errorMessage,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
        );
      }
    ));

  }

}
