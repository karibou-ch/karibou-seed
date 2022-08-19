import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CartService,
         CartItem,
         Config,
         LoaderService,
         OrderShipping,
         User,
         UserAddress,
         UserCard,
         UserService,
         OrderService,
         Shop,
         Order,
         ConfigService} from 'kng2-core';

import { MdcSnackbar } from '@angular-mdc/web';
import { KngNavigationStateService, KngUtils, i18n } from '../common';
import { MetricsService, EnumMetrics } from '../common/metrics.service';
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
  isRunning = false;
  hasOrderError = false;
  noshippingMsg: string;
  currentShippingDay: Date;
  subscription;


  i18n: any = {
    fr: {
      cart_deposit: '«à emporter»',
      cart_info_total: 'Total provisoire',
      cart_info_subtotal: 'Sous total (service karibou inclus)',
      cart_info_shipping: 'Livraison 100% cycliste',
      cart_info_shipping_title: 'Livraison/Collecte ',
      cart_info_shipping_group: 'Vous complétez une commande en cours',
      cart_info_shipping_discount: 'dès <b>_AMOUNT_</b> fr la livraison passe à <b>_DISCOUNT_</b> fr',
      cart_info_shipping_applied: 'Vous bénéficiez d\'un rabais livraison !',
      cart_info_payment: 'Méthode de paiement',
      cart_info_discount: 'Rabais',
      cart_info_one_date: 'Le marché __HUB__ est fermé le __DAY__. Changer de date si vous souhaitez tout recevoir en une livraison!',
      cart_info_limit: `En raison de la situation actuelle, nos créneaux de livraison sont tous occupés.
       Toutefois, vous pouvez préparer votre panier et valider votre commande
       lorsque de nouvelles fenêtres de livraison seront disponibles.
       Merci beaucoup pour votre compréhension.
       <p>Nous livrons du mardi au vendredi, et nous réservons les commandes pour 6 jours à l'avance uniquement.
       Chaque jour une nouvelle possibilité de livraison apparait.</p>`,
      cart_info_service_k: `Service karibou <span class=" ">6%</span>`,
      cart_info_service_k_plus: `Sur karibou.ch, le prix de chaque produit = le prix pratiqué en boutique/sur le marché!<br/> Ce coût finance la collecte, la préparation et la vérification de votre commande ainsi que notre service au client 5🌟.`,
      cart_remove: 'enlever',
      cart_modify_add: 'Choisir une autre adresse de livraison',
      cart_modify_payment: 'Choisir un autre mode de paiement',
      cart_discount_info: 'Rabais commerçant',
      cart_discount: 'rabais quantité',
      cart_discount_title: 'rabais à partir de ',
      cart_signin: 'Finaliser la commande',
      cart_login: 'Pour finaliser votre commande, vous devez vous connecter',
      cart_empty: 'Vos paniers sont vides',
      cart_error: 'Vous devez corriger votre panier!',
      cart_amount_1: 'Le paiement sera effectué le jour de la livraison une fois le total connu. Nous réservons le montant maximum de',
      cart_amount_2: 'pour permettre des modifications de commande (prix au poids, ou ajout de produits en dernière minute).',
      cart_nextshipping: 'Livraison',
      cart_shared_title1: 'Vous utilisez un panier partagé',
      cart_shared_title2: 'Identifiez-vous pour partager vos modifications!',
      cart_payment_not_available: 'Cette méthode de paiement n\'est plus disponible',
      cart_cg: 'J\'ai lu et j\'accepte les conditions générales de vente',
      cart_order: 'Commander pour',
    },
    en: {
      cart_deposit: '«to take away»',
      cart_info_total: 'Provisional total',
      cart_info_subtotal: 'Subtotal (service fee included)',
      cart_info_shipping: 'shipping guaranteed <span class="bold">200%</span> ecological ',
      cart_info_shipping_title: 'Shipping between',
      cart_info_shipping_group: 'You are close to complete an order in progress',
      cart_info_shipping_discount: 'From <b>_AMOUNT_</b> chf of purchase, you get delivery to your door for <b>_DISCOUNT_</b> !',
      cart_info_shipping_applied: 'You get a delivery discount!',
      cart_info_payment: 'Payment method',
      cart_info_discount: 'Discount',
      cart_info_one_date: 'The __HUB__ market is closed on __DAY__. If you wish to receive all in a single delivery choose another date!',
      cart_info_limit: `Due to the current situation, our delivery slots are all full.
       However, you can prepare your basket and confirm your order when
       new delivery windows become available. Thank you very much for your understanding.
       <p>We do deliver every day from Tuesday to Friday and we schedule orders for 6 days in advance only.
       Every morning you will see the next delivery window.</p>`,
      cart_info_service_k: 'Service fee <span class="gray ">6%</span>',
      cart_info_service_k_plus: `On Karibou.ch, the price of each product = the price charged in the store/market!<br/> This fee covers a broad range of operating costs including pickup, packaging, background checks of your order and our 5🌟 customer support`,
      cart_remove: 'remove',
      cart_modify: 'Modify',
      cart_modify_add: 'Select another shipping address',
      cart_modify_payment: 'Select another payment methods',

      cart_discount: 'discount',
      cart_discount_info: 'Vendor delivery discount ',
      cart_discount_title: 'rabais livraison à partir de ',
      cart_signin: 'Go to checkout',
      cart_login: 'Please sign in before the checkout',
      cart_empty: 'Your carts are empty',
      cart_amount_1: 'Payment will be made on the day of delivery once the total is known. We reserve the max amount of',
      cart_amount_2: 'to allow order changes (price by weight, or a last minute addition of products).',
      cart_nextshipping: 'Next delivery',
      cart_shared_title1: 'You are using a shared basket',
      cart_shared_title2: 'You must be logged to share your changes.',
      cart_error: 'Your cart has to be modified!',
      cart_cg: 'I read and I agree to the general selling conditions',
      cart_order: 'Order now  for ',
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
    private $stripe: StripeService,
    public $snack: MdcSnackbar,
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

  get label() {
    return this.$i18n.label();
  }

  get hub() {
    return this.config.shared.hub;
  }

  get hubs() {
    //return this.config.shared.hubs.filter(hub => hub.slug != this.currentHub);
    const _current = this.config.shared.hubs.find(hub => hub.slug == this.currentHub);
    const _hubs = this.config.shared.hubs.filter(hub => hub.slug != this.currentHub);
    _hubs.unshift(_current)
    return _hubs;
  }

  get sharedCart(){
    const uuid = this.$cart.getCID();    
    return this.$dom.bypassSecurityTrustUrl(window.location.protocol+'//'+window.location.host + '/store/' + this.store + '/cart/' + uuid);
  }

  get lockedHUB() {
    return this.$navigation.isLocked();
  }


  ngOnDestroy() {
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  ngOnInit() {
    this.store = this.$navigation.store;

    this.subscription = this.$loader.update().subscribe(emit => {
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
        //this.loadOrders(); 
      }
      // emit signal for cart
      if (emit.state) {
        this.items = this.$cart.getItems();      
        this.currentShippingDay = this.$cart.getCurrentShippingDay();
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

  doInitateCheckout(ctx){
    this.hasOrderError = false;
    this.checkout.doInitateCheckout(this.user,ctx.hub,ctx.items,ctx.totalDiscount);
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


  onCheckout($event:any) {
    if($event.errors) {
      this.hasOrderError = true;
      return;
    }   
    this.orders.unshift($event as Order); 
  }

}
