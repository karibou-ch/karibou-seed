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
         ConfigService } from 'kng2-core';

import { KngNavigationStateService, KngUtils, i18n } from '../common';
import { StripeService } from 'ngx-stripe';
import { DomSanitizer } from '@angular/platform-browser';
import { KngCartCheckoutComponent } from './kng-cart-checkout/kng-cart-checkout.component';



@Component({
  selector: 'kng-cart',
  templateUrl: './kng-cart.component.html',
  styleUrls: ['./kng-cart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngCartComponent implements OnInit, OnDestroy {

  private _sharedCart: string;


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
  currentCartView:boolean = true;

  currentShippingDay: Date;
  subscription$;


  i18n: any = {
    fr: {
      cart_deposit: 'Commande à collecter',
      cart_info_title:'Paniers de',
      cart_info_note:'Note:',
      cart_info_help:'besoin d\'aide?',
      cart_info_wallet:'Débit de votre portefeuille',
      cart_info_total: 'Estimation total à facturer',
      cart_info_total_subscription: 'Total de votre abonnement',
      cart_info_total_subscription_update: 'Total ajouté à votre abo',
      cart_info_reserved: 'Montant réservé',
      cart_info_contract_total: 'Montant de votre abo en cours',
      cart_info_subtotal: 'Sous total (service inclus)',
      cart_info_subtotal_fees: '__FEES__ de Service ',
      cart_info_shipping: 'Livraison 100% cycliste',
      cart_info_shipping_title: 'Adresse de livraison ',
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
      cart_info_service_k: `Service <span class=" ">__FEES__%</span> inclus`,
      cart_info_service_k_plus: `C'est ce que vous payez pour permettre aux marchés d'être en ligne avec un service client 5🌟.`,
      cart_remove: 'enlever',
      cart_modify_add: 'Choisir une autre adresse de livraison',
      cart_modify_payment: 'Choisir un autre mode de paiement',
      cart_discount_info: 'Rabais commerçant',
      cart_discount: 'rabais quantité',
      cart_discount_title: 'rabais de ',
      cart_checkout: 'Finaliser la commande',
      cart_subscription: 'Activer votre abonnement',
      cart_subscription_title: 'Votre abonnement',
      cart_create_subscription: 'Créer votre abonnement',
      cart_update_subscription: 'Modifier votre abonnement',
      cart_update_subscription_payment: 'Valider votre méthode de paiement',
      cart_update_subscription_payment_error:"Votre carte est ne fonctionne pas, utilisez une autre méthode de paiement",
      cart_login: 'Pour finaliser votre commande, vous devez vous connecter',
      cart_empty: 'Vos paniers sont vides',
      cart_error: 'Vous devez corriger votre panier!',
      cart_amount_1: 'Le paiement sera effectué le jour de la livraison une fois le total connu. Nous réservons un montant supérieur ',
      cart_amount_2: 'pour permettre des modifications de commande (au moment de l\'emballage, certains articles sont pesés puis facturés selon le poids exact).',
      cart_nextshipping: 'Livraison',
      cart_shared_copy: 'Vous pouvez partager vos paniers avec quelqu\'un avant de valider la commande',
      cart_shared_title1: 'Vous décourez un panier partagé',
      cart_shared_title2: 'Identifiez-vous pour partager vos modifications!',
      cart_payment_not_available: 'Cette méthode de paiement n\'est plus disponible',
      cart_cg: 'J\'ai lu et j\'accepte les conditions générales de vente',
      cart_cg_18: 'J\'ai l\'âge légal pour l\'achat d\'alcool',
      cart_order: 'Commander pour'
    },
    en: {
      cart_deposit: 'Order to collect',
      cart_info_title:'Carts for ',
      cart_info_help:'Need help?',
      cart_info_note:'Note:',
      cart_info_total: 'Total estimate to be billed',
      cart_info_total_subscription: 'Total for your subscription',
      cart_info_total_subscription_update: 'Total add to your subscription',
      cart_info_reserved: 'Amount reserved',
      cart_info_wallet:'Debit from your wallet',
      cart_info_contract_total: 'Amount of your running subscription',
      cart_info_subtotal: 'Subtotal (service fee included)',
      cart_info_subtotal_fees:'Service fee  __FEES__ ',
      cart_info_shipping: 'Delivery 100% ecological ',
      cart_info_shipping_title: 'Shipping between',
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
      cart_info_service_k: 'Service fee <span class="gray ">__FEES__%</span> included',
      cart_info_service_k_plus: `This is what you're paying for - to keep the markets up and running, and to provide you a 5🌟 customer support`,
      cart_remove: 'remove',
      cart_modify: 'Modify',
      cart_modify_add: 'Select another shipping address',
      cart_modify_payment: 'Select another payment methods',
      cart_discount: 'discount',
      cart_discount_info: 'Vendor delivery discount ',
      cart_discount_title: 'delivery discout ',
      cart_checkout: 'Go to checkout',
      cart_subscription: 'Activate your subscription',
      cart_subscription_title: 'Your subscription',
      cart_create_subscription: 'Create your subscription',
      cart_update_subscription: 'Modify your subscription',
      cart_update_subscription_payment: 'Validate your payment method',
      cart_update_subscription_payment_error:"Your card is not working, use another payment method",
      cart_login: 'Please sign in before the checkout',
      cart_empty: 'Your carts are empty',
      cart_amount_1: 'Payment will be made on the day of delivery once the total is known. We reserve a higher amount ',
      cart_amount_2: 'to allow order changes (at the time of packaging, some items are weighed and then billed based on the exact weight).',
      cart_nextshipping: 'Next delivery',
      cart_shared_copy: 'You can share this cart with someone before to checkout',
      cart_shared_title1: 'You are using a shared basket',
      cart_shared_title2: 'You must be logged to share your changes.',
      cart_error: 'Your cart has to be modified!',
      cart_cg: 'I read and I agree to the general selling conditions',
      cart_cg_18: 'I am of legal age to purchase alcohol',
      cart_order: 'Order now  for '
    }
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
    private $stripe: StripeService
  ) {
    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];

    this.items = [];

    this.user = loader[1];
    this.shops = loader[3];
    this.orders = [];

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
    const defaultHub = this.$navigation.landingHubSlug || this.currentHub;
    const _current = this.config.shared.hubs.find(hub => hub.slug == defaultHub);
    if(this.lockedHUB){
      return [_current];
    }
    const _hubs = this.config.shared.hubs.filter(hub => hub.slug != defaultHub);
    _hubs.unshift(_current)
    return _hubs;
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
    return this.$navigation.isLocked();
  }


  ngOnDestroy() {
    if(this.subscription$) {
      this.subscription$.unsubscribe();
    }
  }


  ngOnInit() {
    this.store = this.$navigation.store;
    this.currentHub = this.config.shared.hub;
    const view = this.$route.snapshot.queryParams.view
    this.currentCartView = (view != "subscription");
    this.subscription$ = this.$loader.update().subscribe(emit => {
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

      }
      // emit signal for user
      if (emit.user) {
        this.user = emit.user;       
        //this.$cart.setContext(this.config,this.user);
        //this.loadOrders(); 
      }
      // emit signal for cart
      if (emit.state) {

        //
        // display subscription or cart 
        this.isValid = true;

        //
        // only items for order!
        const ctx:CartItemsContext = {
          forSubscription:!this.currentCartView,
          hub:this.currentHub
        }    
        this.items = this.$cart.getItems(ctx);  
        this.currentShippingDay = this.$cart.getCurrentShippingDay();


        //
        // if customer have only one valid payment method, 
        // and payment is not set
        const payment = this.user.payments.find((method,idx,all) => method.isValid && all.length==1 && method.isValid());
        if(!this.$cart.getCurrentPaymentMethod() && payment) {
          this.$cart.setPaymentMethod(payment);
        }
      }

    }, error => {
      console.log('loader-update', error);
    });

    //
    // load cart from server to limit Cart Sync Issue
    this.$cart.load(this._sharedCart);

    //
    // on open page => force scroll to top
    setTimeout(() => {
      try {window.scroll(0, 0); } catch (e) {}
    }, 100);
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

  doInitateCheckout(ctx){
    this.hasOrderError = false;
    this.checkout.doInitateCheckout(ctx);
  }  

  goBack(): void {
    this.$router.navigate(['../home'], { relativeTo: this.$route });
  }

  hasPotentialShippingReductionMultipleOrder(){
    return this.$cart.hasPotentialShippingReductionMultipleOrder();
  }


  isSharedCart() {
    return !!this._sharedCart;
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
    navigator.clipboard.writeText(this.sharedCart).then(()=>{
      //alert('DONE')
    })
    return false;
  }


  onCheckout($event:any) {
    if($event.errors) {
      this.hasOrderError = true;
      return;
    }   
    this.orders.unshift($event as Order); 
  }

}
