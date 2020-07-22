import { Component, OnInit, OnDestroy } from '@angular/core';
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
         CartState,
         CartAction} from 'kng2-core';

import { MdcSnackbar } from '@angular-mdc/web';
import { KngNavigationStateService, KngUtils, i18n } from '../common';
import { MetricsService, EnumMetrics } from '../common/metrics.service';

@Component({
  selector: 'kng-cart',
  templateUrl: './kng-cart.component.html',
  styleUrls: ['./kng-cart.component.scss']
})
export class KngCartComponent implements OnInit, OnDestroy {


  //
  // TODO remove this ASAP if not needed
  // if(['visa','mastercard','american express'].indexOf(gateway.label)!==-1){
  //   this.cartConfig.gateway.label=gateway.label+" (3.0% aujourd'hui offert)";
  // }

  store: string;
  shops: Shop[];
  vendorAmount: any;
  user: User = new User();
  config: Config;
  items: CartItem[];
  sign: any;
  cgAccepted = false;
  isRunning = false;
  hasOrderError = false;
  noshippingMsg: string;
  subscription;
  shippingTime;
  shippingNote: string;
  showInfoAmount: boolean;
  showInfoFees: boolean;
  amountReserved: number;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;

  //
  // generating dynamic background image url
  bgGradient = `linear-gradient(
    rgba(0, 50, 0, 0.15),
    rgba(0, 0, 0, 0.1)
  ),`;


  i18n: any = {
    fr: {
      cart_collect: 'collect',
      cart_info_total: 'Total provisoire',
      cart_info_subtotal: 'Sous total',
      cart_info_shipping: 'Livraison',
      cart_info_payment: 'Méthode de paiement',
      cart_info_discount: 'Rabais',
      cart_info_limit: `En raison de la situation actuelle, nos créneaux de livraison sont tous occupés.
       Toutefois, vous pouvez préparer votre panier et valider votre commande
       lorsque de nouvelles fenêtres de livraison seront disponibles.
       Merci beaucoup pour votre compréhension.
       <p>Nous livrons du mardi au samedi, et nous réservons les commandes pour 6 jours à l'avance uniquement.
       Chaque jour une nouvelle possibilité de livraison apparait.</p>`,
      cart_info_service_k: `La majoration des produits est de <span class=" ">4%</span>
        <a class="more small">[notre commission]</a>`,
      cart_info_service_k_plus: `Notre politique des prix est transparente. Le prix du produit est fixé par le commerçant,
       la majoration nous permet de rétribuer notre équipe. <span class="pink">🤗</span></span>`,
      cart_remove: 'enlever',
      cart_discount_info: 'Rabais commerçant',
      cart_discount: 'rabais quantité',
      cart_discount_title: 'rabais à partir de ',
      cart_signin: 'Finaliser la commande',
      cart_login: 'Pour finaliser votre commande, vous devez vous connecter',
      cart_empty: 'Votre panier est vide',
      cart_error: 'Vous devez corriger votre panier!',
      cart_amount_1: 'Le paiement sera effectué le jour de la livraison une fois le total connu. Nous réservons le montant de',
      cart_amount_2: 'pour permettre des modifications de commande (prix au poids, ou ajout de produits).',
      cart_nextshipping: 'Livraison',
      cart_payment_not_available: 'Cette méthode de paiement n\'est plus disponible',
      cart_cg: 'J\'ai lu et j\'accepte les conditions générales de vente',
      cart_order: 'Commander maintenant',
    },
    en: {
      cart_collect: 'collect',
      cart_info_total: 'Provisional total',
      cart_info_subtotal: 'Subtotal',
      cart_info_shipping: 'Shipping',
      cart_info_payment: 'Payment method',
      cart_info_discount: 'Discount',
      cart_info_limit: `Due to the current situation, our delivery slots are all full.
       However, you can prepare your basket and confirm your order when
       new delivery windows become available. Thank you very much for your understanding.
       <p>We do deliver every day from Tuesday to Saturday and we schedule orders for 6 days in advance only.
       Every morning you will see the next delivery window.</p>`,
      cart_info_service_k: 'Your contribution for our service is  <span class="gray ">4%</span> <a class="more small">[about our fees]</a>',
      cart_info_service_k_plus: `Our pricing policy is transparent. Price of the product is set by the retailer.
       A fair fee allows us to remunerate our team <span class="pink">🤗</span>`,
      cart_remove: 'remove',
      cart_discount: 'discount',
      cart_discount_info: 'Vendor delivery discount ',
      cart_discount_title: 'rabais livraison à partir de ',
      cart_signin: 'Sign In!',
      cart_login: 'Please sign in before the checkout',
      cart_empty: 'Your cart is empty',
      cart_amount_1: 'Payment will be made on the day of delivery once the total is known. We reserve the amount of',
      cart_amount_2: 'to allow order changes (price by weight, or addition of products).',
      cart_nextshipping: 'Next delivery',
      cart_error: 'Your cart has to be modified!',
      cart_cg: 'I read and I agree to the general selling conditions',
      cart_order: 'Order now !',
    }
  };

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
    public $i18n: i18n,
    public $loader: LoaderService,
    public $cart: CartService,
    private $metric: MetricsService,
    public $navigation: KngNavigationStateService,
    private $order: OrderService,
    private $route: ActivatedRoute,
    private $router: Router,
    public $snack: MdcSnackbar,
    private $user: UserService
  ) {
    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];

    //
    // FIXME currently only one shipping time!
    this.shippingTime = Object.keys(this.config.shared.hub.shippingtimes)[0];
    this.shippingTime = this.config.shared.hub.shippingtimes[this.shippingTime];

    this.user = loader[1];
    this.shops = loader[3];
    this.items = [];
    this.vendorAmount = {};

    // FIXME remove hardcoded reserved value 0.11!
    this.amountReserved = 1.11;

    // FIMXE remove repeated code limit
    const hub = this.config.shared.hub.slug;
    if (hub) {
      this.currentRanks = this.config.shared.currentRanks[hub] || {};
      this.currentLimit = this.config.shared.hub.currentLimit || 1000;
      this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
    }

  }

  get locale() {
    return this.$i18n.locale;
  }

  // FIXME remove repeated code
  getNoShippingMessage() {
    const currentShippingDay = this.$cart.getCurrentShippingDay();

    //
    // check window delivery
    if (currentShippingDay &&
      this.currentRanks[currentShippingDay.getDay()] > this.currentLimit) {
      return this.$i18n[this.locale].nav_no_shipping_long;
    }

    const noshipping = this.config.noShippingMessage().find(shipping => !!shipping.message);
    return noshipping && noshipping.message[this.locale];
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  ngOnInit() {
    this.store = this.$navigation.store;

    this.subscription = this.$loader.update().subscribe(emit => {
      if (emit.state) {
        console.log('--DEBUG load cart', CartAction[emit.state.action], emit);
      }
      // emit signal for config
      if (emit.config) {

      }
      // emit signal for user
      if (emit.user) {
        this.user = emit.user;
        this.checkPaymentMethod(true);
      }
      // emit signal for cart
      if (emit.state) {
        this.items = this.$cart.getItems();
      }
      const current = this.$cart.getCurrentShippingAddress();
      if (current.note && !this.shippingNote) {
        this.shippingNote = current.note;
      }

      //
      // compute available discount and delta to get one
      this.computeDiscount();
      this.noshippingMsg = this.getNoShippingMessage();

    }, error => {
      console.log('loader-update', error);
    });

    //
    // load cart from server to limit Cart Sync Issue
    this.$cart.load();

    //
    // on open page => force scroll to top
    setTimeout(() => {
      try {window.scroll(0, 0); } catch (e) {}
    }, 100);

    this.checkPaymentMethod();

    //
    // set default address
    if (this.user && this.user.addresses.length === 1) {
      this.setShippingAddress(this.user.addresses[0]);
    }

  }

  add(item: CartItem, variant?: string) {
    this.$cart.add(item, variant);
    this.computeDiscount();
  }


  doOrder() {

    // //
    // // prepare shipping
    // var shipping=cart.config.address;
    // shipping.when=(config.shop.shippingweek[cart.config.shipping]);
    // shipping.hours=16;//config.shop.order.shippingtimes;


    // //
    // // prepare items
    // var items=$scope.cart.items;

    // //
    // // get payment token
    // var payment={
    //   alias:cart.config.payment.alias,
    //   issuer:cart.config.payment.issuer,
    //   name:cart.config.payment.name,
    //   number:cart.config.payment.number
    // };
    // FIXME hour selection should be better
    const shipping = new OrderShipping(
      this.currentShipping(),
      this.$cart.getCurrentShippingDay(),
      (this.isCartDeposit() ? 16 : 14)
    );

    const hub = this.config.shared.hub.slug;

    //
    // update shipping note
    shipping.note = this.shippingNote || shipping.note;

    this.hasOrderError = false;
    this.isRunning = true;

    this.$order.create(
      hub,
      shipping,
      this.items.map(item => item.toDEPRECATED()),
      this.$cart.getCurrentPaymentMethod()
    ).subscribe((order) => {
        this.isRunning = false;
        //
        // check order errors
        if (order.errors) {
          this.$cart.setError(order.errors);
          this.hasOrderError = true;
          this.$snack.open(
            this.$i18n.label().cart_corrected,
            this.$i18n.label().thanks,
            this.$i18n.snackOpt
          );
          try {window.scroll(0, 0); } catch (e) {}
          return;
        }

        //
        // Metric ORDER
        this.$metric.event(EnumMetrics.metric_order_sent, {
          'shipping': order.getShippingPrice(),
          'amount': order.getSubTotal()
        });

        this.$snack.open(this.$i18n.label().cart_save_deliver + order.shipping.when.toDateString());
        this.$router.navigate(['/store', this.store, 'me', 'orders']);
        this.items = [];
        this.$cart.empty();
      },
      err => {
        this.isRunning = false;
        this.$snack.open(
          err.error,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
      );
      }
    );
  }

  computeShippingByAddress(address: UserAddress) {
    return this.$cart.computeShippingFees(address);
  }

  currentShipping() {
    return this.$cart.getCurrentShippingAddress();
  }

  currentShippingFees() {
    return this.$cart.getCurrentShippingFees();
  }

  currentGatewayLabel() {
    return (this.$cart.getCurrentGateway().label);
  }

  currentGatewayFees() {
    return (this.$cart.getCurrentGateway().fees * 100).toFixed(1);
  }

  currentGatewayAmount() {
    return this.$cart.gatewayAmount();
  }

  currentServiceFees() {
    return this.$cart.totalFees();
  }

  checkPaymentMethod(force?:boolean) {
    if (!this.user.isAuthenticated()) {
      return;
    }
    this.$user.checkPaymentMethod(this.user).subscribe(user => {
      //
      // set default payment
      const defaultPayment = this.user.payments.filter(payment => payment.isValid());
      const currentPayment = this.$cart.getCurrentPaymentMethod();
      if (!currentPayment && defaultPayment.length === 1 || force) {
        this.setPaymentMethod(defaultPayment[0]);
      }

    }, error => {
      if (error.status === 401) {
        this.$user.logout().subscribe();
      }
    });
  }


  computeDiscount() {
    // init
    Object.keys(this.vendorAmount).forEach(vendor => {
      if (!this.vendorAmount[vendor]) {
        return;
      }
      this.vendorAmount[vendor].amount = 0;
    });

    //
    // sum total by vendor
    this.$cart.getItems().forEach(item => {
      // let vendor=this.shops.find(shop=>shop.urlpath==item.vendor.urlpath).urlpath;
      const vendor = item.vendor.urlpath;
      if (!this.vendorAmount[vendor]) {
        this.vendorAmount[vendor] = {
          amount: 0, discount: {}
        };
        Object.assign(this.vendorAmount[vendor].discount, item.vendor.discount, {total: 0});
      }
      this.vendorAmount[vendor].amount += (item.price * item.quantity);
    });

    //
    // compute available discount
    Object.keys(this.vendorAmount)
          .map(vendor => this.vendorAmount[vendor])
          .filter(vendor => vendor.discount.threshold)
          .forEach(vendor => {
      const amount = vendor.amount;
      const discountMagnitude = Math.floor(amount / vendor.discount.threshold);
      vendor.discount.needed = vendor.discount.threshold - amount % (vendor.discount.threshold | 0) + amount;
      vendor.discount.total = discountMagnitude * vendor.discount.amount;

    });

    //
    // DEBUG
    // Object.keys(this.vendorAmount).forEach(vendor=>{
    //   console.log('--- vendor.discount',vendor,this.vendorAmount[vendor])
    // });
  }

  getDiscount(item: CartItem) {
    const discount = this.vendorAmount[item.vendor.urlpath].discount;

    if (discount.threshold) {
      // discount.total;
      // discount.needed;
      // discount.threshold;
      // console.log('--- vendor.discount',this.vendorAmount[item.vendor.urlpath]);
      return discount.needed;
    }
    return '';
  }

  getVendorDiscount(item: CartItem) {
    return this.vendorAmount[item.vendor.urlpath].discount;
  }

  getTotalDiscount() {
    let amount = 0;
    // tslint:disable-next-line: forin
    for (const slug in this.vendorAmount) {
      amount += this.vendorAmount[slug].discount.total;
    }
    return amount;
  }

  getStaticMap(address: UserAddress) {
    return KngUtils.getStaticMap(address, this.config.shared.keys.pubMap || '');
  }

  getDepositAddress() {
    return this.config.shared.hub.deposits;
  }


  goBack(): void {
    this.$router.navigate(['../home'], { relativeTo: this.$route });
  }


  isDayAvailable() {
    const day = this.$cart.getCurrentShippingDay();
    const maxLimit = this.user.isPremium() ? (this.currentLimit + this.premiumLimit) : this.currentLimit;

    return (this.currentRanks[day.getDay()] <= maxLimit);
  }

  isCartDeposit() {
    const current = this.$cart.getCurrentShippingAddress();
    // deposit address contains fees
    // TODO make a test for that
    return current['fees'] !== undefined;
  }

  isSelectedAddress(add: UserAddress) {
    const current = this.$cart.getCurrentShippingAddress();
    return add.isEqual(current);
  }

  isSelectedPayment(payment: UserCard) {
    const current = this.$cart.getCurrentGateway();
    return (current.label) === payment.issuer;
  }
  isPaymentMethodsValid() {
    return this.user.payments.every(payment => payment.isValid());
  }

  isOrderReady() {
    const payment = this.$cart.getCurrentGateway();
    const address = this.$cart.getCurrentShippingAddress();
    return this.user.isReady() && (payment.label !== 'Aucun') && address.name && this.items.length;
  }

  setShippingAddress(address: UserAddress) {
    this.$cart.setShippingAddress(address);

    //
    // copy note
    this.shippingNote = address.note;

    //
    // Metric ORDER
    this.$metric.event(EnumMetrics.metric_order_address, {
      'deposit': !!(address['active'])
    });

    //
    // update shipping time
    const time = (this.isCartDeposit() ? 16 : 14);
    this.shippingTime = this.config.shared.hub.shippingtimes[time];
  }

  setPaymentMethod(payment: UserCard) {
    if (!payment.isValid()) {
      this.$snack.open(payment.error || this.i18n[this.locale].cart_payment_not_available, 'OK');
      return;
    }
    this.$cart.setPaymentMethod(payment);

    //
    // Metric ORDER
    this.$metric.event(EnumMetrics.metric_order_payment);
  }

  sortedItems() {
    return this.items.sort((a,b) => {
      return a.category.slug.localeCompare(b.category.slug);
    });
  }

  remove(item: CartItem, variant?: string) {
    this.$cart.remove(item, variant);
    this.computeDiscount();
  }

  removeAll(item: CartItem, variant?: string) {
    this.$cart.removeAll(item, variant);
    this.computeDiscount();
  }

  onSelect(source, item) {
    this.items.forEach(i => {
      i['selected'] = (i.sku === item.sku && !i['selected']);
    });
  }

  onSign() {

  }


}
