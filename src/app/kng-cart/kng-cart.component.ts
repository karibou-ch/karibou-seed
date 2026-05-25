import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CartService,
         CartItem,
         CartItemsContext,
         Config,
         LoaderService,
         User,
         OrderService,
         Shop,
         Order,
         ConfigService,
         CalendarService,
         CartSubscription } from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { StripeService } from 'ngx-stripe';
import { DomSanitizer } from '@angular/platform-browser';
import { KngCartCheckoutComponent } from './kng-cart-checkout/kng-cart-checkout.component';
import { Subscription } from 'rxjs';
import { StripeCardElement, StripeElements, StripeElementsOptions } from '@stripe/stripe-js';



@Component({
  selector: 'kng-cart',
  templateUrl: './kng-cart.component.html',
  styleUrls: ['./kng-cart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngCartComponent implements OnInit, OnDestroy {

  private _sharedCart: string;
  _sharedCartName: string;


  // FIXME checkout refactor: this parent still drives the checkout drawer imperatively.
  @ViewChild('checkout') checkout: KngCartCheckoutComponent;

  store: string;
  shops: Shop[];
  orders: Order[];
  user: User = new User();
  config: Config;
  items: CartItem[];
  isValid = false;
  hasOrderError = false;
  noshippingMsg: string;
  shippingTime: number;
  currentCartView:boolean = true;

  currentShippingDay: Date;
  subscription$;
  plan:string;


  checkoutMessage: string;
  checkoutMessageError: string;
  checkoutAsyncPaymentMessage: string;
  private asyncPaymentIntentId: string;

  i18n: any = {
    fr: {
      cart_info_title:'Votre liste d\'achat',
      cart_subscription_title: 'Vérifier votre abonnement',
      cart_shared_name:'Nommez votre panier',
      cart_shared_copy: 'Vous voulez partager ce panier ? Envoyez-le à un proche pour qu’il le modifie ou le valide.',
      cart_shared_title1: 'Une liste d\'achats à été créée à votre attention',
      cart_shared_title2: 'Finalisez votre commande en un clin d\'œil : confirmez la date de livraison, identifiez-vous, sélectionnez votre adresse et le mode de paiement. Merci et savourez votre achat !',
      cart_order_pending_twint: 'Le paiement TWINT est en cours de traitement',
      cart_order_canceled_twint: 'Votre paiement TWINT a été annulé',
      cart_order_unknownerror_twint: 'Erreur inconnue lors du paiement TWINT',
      cart_order_error_twint: 'Votre paiement TWINT est refusé',
      cart_order_pending_twint_wait: 'Le paiement TWINT est en cours de traitement. Ne fermez pas cette fenêtre.',
      cart_order_placed: 'Votre commande est enregistrée et sera livrée le ',
      cart_contract_placed: 'Votre abonnement est enregistré'
    },
    en: {
      cart_info_title:'Your shopping cart',
      cart_subscription_title: 'Check your subscription',
      cart_shared_name:'Name your shopping cart',
      cart_shared_copy: 'Do you want to share this cart? Send it to someone close so they can modify or validate it.',
      cart_shared_title1: 'A shopping cart has been created for you',
      cart_shared_title2: 'Quickly finalize your order: confirm the delivery date, log in, select your address and payment method. Thank you and enjoy your purchase!',
      cart_order_placed: 'Your order is placed and will be delivered on',
      cart_order_pending_twint: 'TWINT payment is being processed',
      cart_order_canceled_twint: 'Your TWINT payment was canceled',
      cart_order_unknownerror_twint: 'Unknown error during TWINT payment',
      cart_order_error_twint: 'Your TWINT payment is declined',
      cart_order_pending_twint_wait: 'TWINT payment is being processed. Do not close this window.',
      cart_contract_placed: 'Your subscription is registered'
    }
  };


  //
  // Stripe
  elements: StripeElements;
  card: StripeCardElement;
  isLoading: boolean;

  // optional parameters
  elementsOptions: StripeElementsOptions = {
    locale: 'fr'
  };




  constructor(
    public $dom: DomSanitizer,
    public $i18n: i18n,
    public $loader: LoaderService,
    public $cart: CartService,
    public $config: ConfigService,
    public $navigation: KngNavigationStateService,
    private $order: OrderService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $stripe: StripeService,
    private $calendar: CalendarService
  ) {
    // ✅ PARENT BROADCASTER: Récupération immédiate des données cached
    const { config, user, shops, orders } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.shops = shops || [];
    this.orders = orders || [];

    this.items = [];

    this.subscription$ = new Subscription();
    this.loadOrders();

    const cart = this.$route.snapshot.paramMap.get('name');
    if(cart !== 'default') {
      this._sharedCart = cart;
    }

  }

  get locale() {
    return this.$i18n.locale;
  }
  get label() {
    return this.i18n[this.$i18n.locale] || this.i18n.fr;
  }


  get glabel() {
    return this.$i18n.label();
  }

  get hub() {
    return this.config.shared.hub;
  }

  get hubs() {
    if(this.lockedHUB || this.isSharedCart || !this.currentCartView){
      return this.config?.shared?.hub ? [this.config.shared.hub] : [];
    }
    return this.$navigation.HUBs;
  }

  get isSharedCart() {
    return !!this._sharedCart;
  }

  get cartName(){
    return this._sharedCartName ? this._sharedCartName:this.$cart.getName();
  }

  get sharedCart(){
    const uuid = this.$cart.getCID();
    if(!uuid) {
      return;
    }
    // this.$dom.bypassSecurityTrustUrl()
    return (window.location.protocol+'//'+window.location.host + '/store/' + this.store + '/home/cart/' + uuid);
  }

  get lockedHUB() {
    return this.$navigation.isLocked() || this._sharedCart;
  }


  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }


  ngOnInit() {
    this.store = this.$navigation.store;

    this.currentShippingDay = this.$cart.getCurrentShippingDay();
    this.shippingTime = this.$cart.getCurrentShippingTime()|0;
    // ✅ CORRECTION: getDefaultTimeByDay sera appelé APRÈS config chargé dans $loader

    //
    // save the plan for the subscription (business, customer)
    this.plan = this.$route.snapshot.queryParams.plan||window['subsplan']||'customer';

    this.subscription$.add(
      this.$route.queryParams.subscribe(params => {
      const view = params.view
      this.currentCartView = (view != "subscription");

      this.initItems();
      })
    );

    this.subscription$.add(
      this.$loader.update().subscribe(emit => {
        // if (emit.state) {
        //   console.log('--DEBUG load cart', CartAction[emit.state.action], emit);
        // }
        // emit signal for config
        if (emit.config) {
          //
          // set the stripe key
          if (this.config.shared && this.config.shared.keys) {
            this.$stripe.setKey(this.config.shared.keys.pubStripe);
          }
          // ✅ CORRECTION: Appeler getDefaultTimeByDay APRÈS config chargé
          if (!this.shippingTime && this.currentShippingDay) {
            this.shippingTime = this.$calendar.getDefaultTimeByDay(this.currentShippingDay, this.config.shared.hub);
          }
        }
        // emit signal for user
        if (emit.user) {
          this.user = emit.user;

          //
          // This is a big shit 💩
          this.confirmAsyncPayment();
          //this.loadOrders();
        }
        // emit signal for cart
        if (emit.state) {

          //
          // display subscription or cart
          this.isValid = true;

          // FIXME: remove this when we have a better way to handle time limit error
          // this.shippingTime = this.config.getDefaultTimeByDay(this.currentShippingDay);
          this.currentShippingDay = this.$cart.getCurrentShippingDay();
          this.shippingTime = this.$cart.getCurrentShippingTime()|0;


          this.initItems();
          //
          // if customer have only one valid payment method,
          // and payment is not set
          // ✅ FIXED: Bug #1 - Double validation inutile corrigée
          const payment = this.user.payments.find((method,idx,all) => method.isValid() && all.length==1);
          if(!this.$cart.getCurrentPaymentMethod() && payment) {
            this.$cart.setPaymentMethod(payment);
          }


        }

      }, error => {
        console.log('loader-update', error);
      })
    );

    //
    // load cart from server to limit Cart Sync Issue
    this.$cart.load(this._sharedCart);

    //
    // on open page => force scroll to top
    setTimeout(() => {
      try {window.scroll(0, 0); } catch (e) {}
    }, 100);

  }

  private cleanAsyncPaymentQueryParams() {
    this.$router.navigate([], {
      queryParams: {
        oid: null,
        redirect_status: null,
        payment_intent: null,
        payment_intent_client_secret: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private openCheckoutForAsyncPayment() {
    if (this.checkout) {
      this.checkout.open = true;
      return;
    }

    setTimeout(() => {
      if (this.checkout) {
        this.checkout.open = true;
      }
    });
  }

  confirmAsyncPayment() {
    const { payment_intent, oid, redirect_status } = this.$route.snapshot.queryParams;
    if(!payment_intent || !oid || this.asyncPaymentIntentId === payment_intent) {
      return;
    }

    if (redirect_status && redirect_status !== 'succeeded') {
      this.checkoutAsyncPaymentMessage = '';
      this.checkoutMessageError = this.label.cart_order_canceled_twint;
      this.cleanAsyncPaymentQueryParams();
      return;
    }

    const orderId = parseInt(String(oid), 10);
    if (!Number.isFinite(orderId)) {
      this.checkoutAsyncPaymentMessage = '';
      this.checkoutMessageError = this.label.cart_order_unknownerror_twint;
      this.cleanAsyncPaymentQueryParams();
      return;
    }

    this.asyncPaymentIntentId = payment_intent;
    this.checkoutMessage = '';
    this.checkoutMessageError = '';
    this.checkoutAsyncPaymentMessage = this.label.cart_order_pending_twint_wait;
    this.openCheckoutForAsyncPayment();

    this.subscription$.add(
      this.$order.waitForPaymentOrder(orderId, payment_intent).subscribe(order => {
        if(order.payment.status == 'prepaid') {
          this.cleanAsyncPaymentQueryParams();
          this.checkoutAsyncPaymentMessage = '';
          this.checkoutMessageError = '';
          this.asyncPaymentIntentId = null;
          if (this.checkout) {
            this.checkout.closeAfterAsyncPayment();
          }
          this.onCheckout({order, store: this.$navigation.store || this.store});
          return;
        }
        if(order.payment.status == 'voided') {
          this.cleanAsyncPaymentQueryParams();
          this.checkoutAsyncPaymentMessage = '';
          this.checkoutMessageError = this.label.cart_order_canceled_twint;
          this.asyncPaymentIntentId = null;
          return;
        }

        this.checkoutAsyncPaymentMessage = this.label.cart_order_pending_twint_wait;
        this.asyncPaymentIntentId = null;
      }, e => {
        this.checkoutAsyncPaymentMessage = '';
        this.checkoutMessageError = this.label.cart_order_unknownerror_twint;
        this.asyncPaymentIntentId = null;
        console.log('async error',e)
      })
    );
  }


  async initItems() {
    if(!this.isValid) {
      return;
    }

    //
    // only items for this view!
    const ctx:CartItemsContext = {
      forSubscription:!this.currentCartView,
      hub:this.$navigation.store,
      lastMinute: this.$cart.isCurrentShippingLastMinute() // ✅ Filtre lastMinute
    }
    if(this.currentCartView) {
      ctx.onSubscription = false;
    }
    this.items = this.$cart.getItems(ctx);

    // stripe
    // const elements = await this.$stripe.elements().toPromise();
    // const applePay = elements.create('applePay');
  }

  doSelectCart(viewcart:boolean) {
    this.currentCartView = viewcart;

    //
    // viewcart determine items for subscription
    const ctx:CartItemsContext = {
      forSubscription:!viewcart,
      hub:this.$navigation.store
    }
    this.items = this.$cart.getItems(ctx);


  }

  async doSharedCart(name:string){
    const cart = await this.$cart.getShared(name).toPromise();
    const uuid = cart.cid;
    if(!uuid) {
      return;
    }
    // this.$dom.bypassSecurityTrustUrl()
    // view=subscription&plan=business
    const plan = this.$route.snapshot.queryParamMap.get('plan');
    const view = this.$route.snapshot.queryParamMap.get('view');
    const params = new URLSearchParams({plan,view});

    return (window.location.protocol+'//'+window.location.host + '/store/' + this.store + '/home/cart/' + uuid +'?'+params.toString());
  }


  doInitateCheckout(ctx){
    this.checkoutMessage = '';
    this.checkoutMessageError = '';
    this.checkoutAsyncPaymentMessage = '';
    this.hasOrderError = false;
    this.checkout.doInitateCheckout(ctx);
  }

  goBack(): void {
    this.$router.navigate(['../home'], { relativeTo: this.$route });
  }

  hasPotentialShippingReductionMultipleOrder(){
    return this.$cart.hasPotentialShippingReductionMultipleOrder();
  }


  loadOrders() {
    //
    // load orders
    if(this.user.id && !this.orders.length){
      const cathError = true;
      this.$order.findOrdersByUser(this.user,{limit:4},cathError).subscribe(orders=>this.orders=orders);
    }
  }

  onCopy($event){
    $event.stopPropagation();
    //
    // get input name
    const inputName:any = document.getElementById('shared-cart-name')!;
    this.doSharedCart(inputName.value).then(sharedCart => {
      return navigator.clipboard.writeText(sharedCart);
    }).then(()=> {
      alert('Merci!');
    }).catch(status => {
      console.log(status.error)
      alert(status.error);
    });
    return false;
  }

  async onPendingPayment({payment_intent, payment_intent_client_secret, oid}) {
    // const order = await this.$order.get(oid).toPromise();
  }

  // ✅ OPTIMIZATION 2.3: Factoriser code setTimeout clearAfterOrder
  private clearAfterOrderWithDelay(order?: Order, contract?: CartSubscription, store?: string) {
    setTimeout(() => {
      this.$cart.clearAfterOrder(store || this.store, order, contract);
    }, 100);
  }

  onCheckout($event:any) {
    //
    // case of error
    if($event.errors) {
      this.hasOrderError = true;
      return;
    }

    //
    // case of final contract
    if($event.contract) {
      this.checkoutMessage = this.label.cart_contract_placed;
      this.clearAfterOrderWithDelay(undefined, $event.contract, $event.store);
      return;
    }

    //
    // case of final order
    if($event.order) {
      const day = $event.order.shipping.when.getDate();
      const month = $event.order.shipping.when.getMonth() + 1;
      this.checkoutMessage = this.label.cart_order_placed + `(${day}/${month})`;
      this.clearAfterOrderWithDelay($event.order, undefined, $event.store);
    }

    this.orders.unshift($event.order as Order);
  }

}
