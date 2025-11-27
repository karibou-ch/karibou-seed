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
         CalendarService } from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { StripeService } from 'ngx-stripe';
import { DomSanitizer } from '@angular/platform-browser';
import { KngCartCheckoutComponent } from './kng-cart-checkout/kng-cart-checkout.component';
import { Subscription } from 'rxjs';
import { PaymentIntent, StripeCardElement, StripeElements, StripeElementsOptions } from '@stripe/stripe-js';



@Component({
  selector: 'kng-cart',
  templateUrl: './kng-cart.component.html',
  styleUrls: ['./kng-cart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngCartComponent implements OnInit, OnDestroy {

  private _sharedCart: string;
  _sharedCartName: string;


  @ViewChild('checkout') checkout: KngCartCheckoutComponent;

  store: string;
  shops: Shop[];
  orders: Order[];
  user: User = new User();
  config: Config;
  currentHub: string;
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

  i18n: any = {
    fr: {
      cart_deposit: 'Commande à collecter',
      cart_info_title:'Votre liste d\'achat',
      cart_info_note:'Note:',
      cart_info_help:'besoin d\'aide?',
      cart_info_wallet:'Débit de votre portefeuille',
      cart_info_total: 'Estimation total à facturer',
      cart_info_total_subscription: 'Total de votre abonnement',
      cart_info_total_subscription_update: 'Total ajouté à votre abo',
      cart_info_reserved: 'Montant réservé',
      cart_info_contract_total: 'Montant de votre abo en cours',
      cart_info_subtotal: 'Sous total (__FEES__ service inclus)',
      cart_info_subtotal_fees: '__FEES__ de Service',
      cart_info_shipping_when: 'Date de livraison',
      cart_info_shipping: 'Livraison 100% cycliste',
      cart_info_shipping_lastminute: '⚡ Livraison aujourd\'hui',
      cart_info_shipping_group: 'Vous complétez une commande en cours',
      cart_info_shipping_discount: 'dès <b>_AMOUNT_</b> fr la livraison passe à <b>_DISCOUNT_</b> fr',
      cart_info_shipping_applied: 'Vous bénéficiez d\'un rabais livraison !',
      cart_info_payment: 'Méthode de paiement',
      cart_info_discount: 'Rabais',
      cart_info_hub_not_active:'<b>__HUB__</b> est en maintenance les commandes seront disponibles dès que possible',
      cart_info_one_date: 'Pas de livraison le __DAY__ pour ce marché.',
      cart_info_one_date_more: 'Changer de date pour tout recevoir en une livraison.',
      cart_info_limit: `Nos créneaux de livraison sont tous occupés. Toutefois, vous pouvez préparer votre panier et valider votre commande
      lorsque de nouvelles fenêtres de livraison seront disponibles.
       Merci beaucoup pour votre compréhension.`,
      cart_info_service_k: `Service <span> __FEES__%</span> inclus`,
      cart_info_service_k_plus: `Nos prix restent inchangés grâce à notre vente directe ; les frais de service transparents assurent une qualité 5🌟.`,
      cart_remove: 'enlever',
      cart_modify_add: 'Choisir une autre adresse de livraison',
      cart_payment_title:'Informations de la carte',
      cart_modify_payment: 'Choisir un autre mode de paiement',
      cart_discount_info: 'Rabais commerçant',
      cart_discount: 'rabais quantité',
      cart_discount_title: 'rabais de ',
      cart_checkout: 'Finaliser pour',
      cart_subscription: 'Confirmer l\'abonnement',
      cart_subscription_title: 'Vérifier votre abonnement',
      cart_create_subscription: 'Créer votre abonnement',
      cart_update_subscription: 'Modifier votre abonnement',
      cart_update_subscription_payment: 'Valider votre méthode de paiement',
      cart_update_subscription_payment_error:"Votre carte est ne fonctionne pas, utilisez une autre méthode de paiement",
      cart_login: 'Pour finaliser votre commande, vous devez vous connecter',
      cart_empty: 'Vos paniers sont vides',
      cart_error: 'Vous devez corriger votre panier!',
      cart_error_timelimit: 'Commandez avant ',
      cart_amount_1: 'Le paiement sera effectué le jour de la livraison une fois le total connu. Nous réservons un montant supérieur ',
      cart_amount_2: 'pour permettre des modifications de commande (au moment de l\'emballage, certains articles sont pesés puis facturés selon le poids exact).',
      cart_nextshipping: 'Livraison',
      cart_shared_name:'Nommez votre panier',
      cart_shared_copy: 'Vous voulez partager ce panier ? Envoyez-le à un proche pour qu’il le modifie ou le valide.',
      cart_shared_title1: 'Une liste d\'achats à été créée à votre attention',
      cart_shared_title2: 'Finalisez votre commande en un clin d\'œil : confirmez la date de livraison, identifiez-vous, sélectionnez votre adresse et le mode de paiement. Merci et savourez votre achat !',
      cart_payment_not_available: 'Cette méthode de paiement n\'est plus disponible',
      cart_cg: 'J\'accepte les conditions générales de vente',
      cart_cg_middle:' et je confirme que ',
      cart_cg_18: 'j\'ai l\'âge légal pour l\'achat d\'alcool',
      cart_order: 'Enregistrer la commande',
      cart_order_pending_twint: 'Le paiement TWINT est en cours de traitement',
      cart_order_unknownerror_twint: 'Erreur inconnue lors du paiement TWINT',
      cart_order_error_twint: 'Votre paiement TWINT est refusé',
      cart_order_placed: 'Votre commande est enregistrée et sera livrée le ',
      cart_contract_placed: 'Votre abonnement est enregistré',

    },
    en: {
      cart_deposit: 'Order to collect',
      cart_info_title:'Your shopping cart',
      cart_info_help:'Need help?',
      cart_info_note:'Note:',
      cart_info_total: 'Total estimate to be billed',
      cart_info_total_subscription: 'Total for your subscription',
      cart_info_total_subscription_update: 'Total add to your subscription',
      cart_info_reserved: 'Amount reserved',
      cart_info_wallet:'Debit from your wallet',
      cart_info_contract_total: 'Amount of your running subscription',
      cart_info_subtotal: 'Subtotal (__FEES__ service fee included)',
      cart_info_subtotal_fees:'Service fee  __FEES__ ',
      cart_info_shipping_when: 'Shipping date',
      cart_info_shipping: 'Delivery 100% ecological ',
      cart_info_shipping_lastminute: '⚡ Delivery today',
      cart_info_shipping_group: 'You are close to complete an order in progress',
      cart_info_shipping_discount: 'From <b>_AMOUNT_</b> chf of purchase, you get delivery to your door for <b>_DISCOUNT_</b> !',
      cart_info_shipping_applied: 'You get a delivery discount!',
      cart_info_payment: 'Payment method',
      cart_info_discount: 'Discount',
      cart_info_hub_not_active:'The <b>__HUB__</b> market is in maintenance and he is not available for checkout',
      cart_info_one_date: 'Shipping is not available on __DAY__ for this marker.',
      cart_info_one_date_more: 'Change the date to receive everything in one delivery',
      cart_info_limit: `Our delivery slots are all full. However, you can prepare your basket and confirm your order when
       new delivery windows become available. Thank you very much for your understanding.`,
      cart_info_service_k: 'Service fee <span class="">__FEES__</span> included',
      cart_info_service_k_plus: `Our prices remain unchanged thanks to our direct sales; transparent service fees ensure 5🌟 quality.`,
      cart_remove: 'remove',
      cart_modify: 'Modify',
      cart_payment_title:'Card information',
      cart_modify_add: 'Select another shipping address',
      cart_modify_payment: 'Select another payment method',
      cart_discount: 'discount',
      cart_discount_info: 'Vendor delivery discount ',
      cart_discount_title: 'delivery discount ',
      cart_checkout: 'Checkout for',
      cart_subscription: 'Confirm Subscription',
      cart_subscription_title: 'Check your subscription',
      cart_create_subscription: 'Create your subscription',
      cart_update_subscription: 'Modify your subscription',
      cart_update_subscription_payment: 'Validate your payment method',
      cart_update_subscription_payment_error:"Your card is not working, use another payment method",
      cart_login: 'Please sign in before the checkout',
      cart_empty: 'Your carts are empty',
      cart_amount_1: 'Payment will be made on the day of delivery once the total is known. We reserve a higher amount ',
      cart_amount_2: 'to allow order changes (at the time of packaging, some items are weighed and then billed based on the exact weight).',
      cart_nextshipping: 'Next delivery',
      cart_shared_name:'Name your shopping cart',
      cart_shared_copy: 'Do you want to share this cart? Send it to someone close so they can modify or validate it.',
      cart_shared_title1: 'A shopping cart has been created for you',
      cart_shared_title2: 'Quickly finalize your order: confirm the delivery date, log in, select your address and payment method. Thank you and enjoy your purchase!',
      cart_error: 'Your cart has to be modified!',
      cart_error_timelimit: 'Order before ',
      cart_cg: 'I agree to the general selling conditions',
      cart_cg_middle:' and I confirm that ',
      cart_cg_18: 'I am of legal age to purchase alcohol',
      cart_order: 'Order now ',
      cart_order_placed: 'Your order is placed and will be delivered on',
      cart_order_pending_twint: 'TWINT payment is being processed',
      cart_order_unknownerror_twint: 'Unknown error during TWINT payment',
      cart_order_error_twint: 'Your TWINT payment is declined',
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
  get llabel() {
    return this.i18n[this.$i18n.locale];
  }


  get label() {
    return this.$i18n.label();
  }

  get hub() {
    return this.config.shared.hub;
  }

  get hubs() {
    //return this.config.shared.hubs.filter(hub => hub.slug != this.currentHub);
    const defaultHub =  this.currentHub;//this.$navigation.landingHubSlug ||

    const _current = this.config.shared.hubs.find(hub => hub.slug == defaultHub);
    if(this.lockedHUB || this.isSharedCart || !this.currentCartView){
      return [_current];
    }
    const _hubs = this.config.shared.hubs.filter(hub => hub.slug != defaultHub);
    _hubs.unshift(_current)
    return _hubs;
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
    this.currentHub = this.config.shared.hub;

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
          //
          // update local config
          this.currentHub = this.config.shared.hub.slug;

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

  async confirmAsyncPayment() {
    // payment_intent=pi_3PYUfWBTMLb4og7P1An0LY7h
    // payment_intent_client_secret=pi_3PYUfWBTMLb4og7P1An0LY7h_secret_mCEud6EZW9oFjI8BUWWeKlkSM
    // redirect_status=succeeded
    const { payment_intent, payment_intent_client_secret, redirect_status, oid} = this.$route.snapshot.queryParams;
    if(!payment_intent) {
      return;
    }

    try{
      const result = await this.$stripe.stripe.retrievePaymentIntent(payment_intent_client_secret).toPromise();
      const paymentIntent:PaymentIntent = result.paymentIntent;

      //
      // pending, wait for payment
      // | 'canceled'
      // | 'processing'
      // | 'requires_action'
      // | 'requires_capture'
      // | 'requires_confirmation'
      // | 'requires_payment_method'
      // | 'succeeded';
      if(paymentIntent.status=='succeeded') {
        const order = await this.$order.get(oid).toPromise();
        // order.payment.status == 'authorized'
        this.onCheckout({order});
        return;
      }

      //
      // pending, wait for payment (requires_confirmation or requires_action)
      if(redirect_status=='pending') {
        const order = await this.$order.get(oid).toPromise();
        if(order.payment.status=='prepaid') {
          this.onCheckout({order});
          return;
        }
        if(order.payment.status=='voided') {
          this.checkoutMessageError = this.llabel.cart_order_canceled_twint;
          return;
        }

        this.checkoutMessageError = this.llabel.cart_order_pending_twint;
        setTimeout(()=> window.location.reload(),1000);
    }

      //
      // list all kind of errors
      if(paymentIntent.status=='canceled') {
        this.checkoutMessageError = this.llabel.cart_order_canceled_twint;
        return;
      }




      if(paymentIntent.status=='processing') {
        this.checkoutMessageError = this.llabel.cart_order_pending_twint;
        setTimeout(()=> window.location.reload(),1000);
        return;
      }


      setTimeout(()=>{

        // clean url
        this.$router.navigate([], {
          queryParams: {
            'oid':null,
            'redirect_status':null,
            'payment_intent': null,
            'payment_intent_client_secret': null,
          },
          queryParamsHandling: 'merge'
        })
        throw new Error('ERROR:confirmAsyncPayment:'+this.checkoutMessageError);
      })


      if(result.error){
        this.checkoutMessageError = result.error.message;
        return;
      }


      if(paymentIntent.status=='requires_payment_method') {
        this.checkoutMessageError = this.llabel.cart_order_error_twint;
        return;
      }

      this.checkoutMessageError = this.llabel.cart_order_unknownerror_twint;

    }catch(e){
      this.checkoutMessageError = this.llabel.cart_order_unknownerror_twint;
      console.log('async error',e)
    }finally{

    }


  }


  async initItems() {
    if(!this.isValid) {
      return;
    }

    //
    // only items for this view!
    const ctx:CartItemsContext = {
      forSubscription:!this.currentCartView,
      hub:this.currentHub,
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
      hub:this.currentHub
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
  private clearAfterOrderWithDelay(order: Order) {
    setTimeout(() => {
      this.$cart.clearAfterOrder(this.store, order);
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
      this.checkoutMessage = this.llabel.cart_contract_placed;
      this.clearAfterOrderWithDelay($event.order);
      return;
    }

    //
    // case of final order
    if($event.order) {
      const day = $event.order.shipping.when.getDate();
      const month = $event.order.shipping.when.getMonth() + 1;
      this.checkoutMessage = this.llabel.cart_order_placed + `(${day}/${month})`;
      this.clearAfterOrderWithDelay($event.order);
    }

    this.orders.unshift($event.order as Order);
  }

}
