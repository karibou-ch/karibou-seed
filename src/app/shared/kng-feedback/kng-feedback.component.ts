import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Config, User, Order, OrderService, EnumFinancialStatus, CartService, Utils, ProductService, CartItem, UserService, OrderItem, OrderCustomerInvoices, CartSubscription } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../../common';
import { MdcSnackbar } from '@angular-mdc/web';

import { combineLatest, forkJoin } from 'rxjs';


@Component({
  selector: 'kng-feedback',
  templateUrl: './kng-feedback.component.html',
  styleUrls: ['./kng-feedback.component.scss'],
//  encapsulation: ViewEncapsulation.None,
// changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackComponent implements OnInit {

  i18n: any = {
    fr: {
      title_code:'Code $$',
      title_wallet:'Votre Portefeuille',
      title_favorite:'Les suggestions pour vous',
      title_favorite_p:'Un rapide coup d\'oeil de la sélection',
      title_order_prepare: 'Votre commande est en cours de préparation pour',
      title_order_pending: 'La confirmation de paiement n\' a pas été effectuée ...',
      title_order_open: 'Vous avez une commande en cours ...',
      title_order_grouped: 'complément(s)',
      title_order_shipping: 'La livraison est prévue chez',
      title_order_cancel: 'la commande a été annulée ',
      title_evaluation: 'Votre note',
      title_evaluation_quick: 'Votre sentiment en étoiles ?',
      title_evaluation_save: 'Votre note',
      title_issue_question: 'Avez-vous rencontré un problème?',
      title_issue_hub: 'Vous pouvez aussi laisser un commentaire à notre équipe',
      title_issue_title: 'N\hésitez pas d\'informer le commerçant si nécessaire',
      title_issue_subtitle: 'Aider nousà améliorer la qualité du service',
      title_issue_item:'Message à transmettre au commerçant:',
      title_issue_header: 'Sélectionnez le(s) article(s) ci-dessous pour informer le commerçant.',
      title_issue_send: 'Envoyez la note',
      title_invoice:'Vos factures',
      title_invoice_open:'Ouvrir l\'espace facture',
      title_invoice_paid:'Facture payée, en attente du virement bancaire',
      title_add_all_to_cart: 'Tout ajouter dans le panier',
      form_text_label: 'Note concernant le service?'
    },
    en: {
      title_code:'Code $$',
      title_wallet:'Your Wallet',
      title_favorite:'Suggestions mades for you',
      title_favorite_p:'A quick glance of goods',
      title_order_prepare: 'You order is being prepared for',
      title_order_grouped: 'complement(s)',
      title_order_shipping: 'Delivery is expected at',
      title_order_pending: 'Payment confirmation has not been made',
      title_order_open: 'You have a pending order',
      title_order_cancel: 'Your order has been cancelled',
      title_evaluation: 'Your feeling in stars ?',
      title_evaluation_quick: 'Rate your Satisfaction for this order',
      title_evaluation_save: 'Your rating',
      title_issue_question: 'An issue with your order ?',
      title_issue_title: 'You have an issue with a product',
      title_issue_item:'Message to send to the merchant:',
      title_issue_subtitle: 'Helps us to improve the quality',
      title_issue_header: 'Select the product(s) below to inform the vendor.',
      title_issue_hub: 'If you have a more general comment please write here',
      title_issue_send: 'Send your feedback',
      title_invoice:'Your invoices',
      title_invoice_open:'View all invoices',
      title_invoice_paid:'Invoice paid, waiting for Bank transfer',
      title_add_all_to_cart: 'Add all to cart',
      form_text_label: 'Add a comment about our service'
    }
  };

  private _user:User;
  private _orders:Order[];

  askFeedback = false;
  isReady = false;
  order: Order;
  selectedOrder: Order;
  selectedOrderPopup:Order;
  childOrder: { [key: number]: Order[]};
  selected: any = {};
  score: number;
  feedbackText: string;
  applyCode: string;
  HUBS:any = {};

  currentLimit: number;
  premiumLimit: number;

  invoices: OrderCustomerInvoices[];



  @Input() child: Order[];
  @Input() config: Config;
  @Input() boxed: boolean;
  @Input() forceload: boolean;
  @Input() set user(u:User){
    this._user = u;
    setTimeout(()=>{
      this.prepareOrders();
    },1)
  }
  @Input() set orders(orders: Order[]){
    this._orders = (orders||[]);
    this.prepareOrders();
  }

  get hubName() {
    return (this.config && this.config.shared) ? this.config.shared.hub.name : '';
  }

  get locale() {
    return this.$i18n.locale;
  }

  get childOrderLength() {
    return this.childOrder[this.order.oid].length;
  }


  get user():User {
    return this._user;
  }
  //
  //
  get time(){
    if(!this.order) {
      return '';
    }
    return ((this.order.shipping.when.getTime()-Date.now())/3600000).toFixed(0);
  }

  get label(){
    return this.$i18n.label();
  }  

  get llabel(){
    return this.i18n[this.locale];
  }  

  get orders(){
    return this._orders;
  }

  get balance(){
    return this._user.balance||0;
  }

  get hasInvoiceMethod() {
    return this.user.payments.some(payment => payment.issuer == 'invoice');
  }

  get hasInvoiceTransfer() {
    return this.invoices.some(invoice => invoice.transfers.length)
  }

  get qrbillTransfer(){
    if(!this.hasInvoiceTransfer){
      return false;
    }
    const oids = this.invoices.map(invoice => invoice.transfers.map(order => order.oid)).flat();
    return 'K-ch-QRBILL: '+oids.join('-');
  }

  get hasInvoice() {
    return this.invoices.some(invoice => invoice.invoices.length)
  }

  get qrbillInvoice() {
    if(!this.hasInvoice){
      return false;
    }
    const oids = this.invoices.map(invoice => invoice.invoices.map(order => order.oid)).flat();
    return 'K-ch-QRBILL: '+oids.join('-')
  }

  constructor(
    public $products: ProductService,
    public $cart: CartService,
    public  $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $snack: MdcSnackbar,
    private $user: UserService,
    private $order: OrderService,
    private $cdr: ChangeDetectorRef
  ) {
    this._orders = [];
    this.invoices = [];
    this.applyCode = "";
  }


    //
  // order state
  // - undefined
  // - voided(cancel)
  // - authorized
  // - paid
  // - evaluated
  get orderState() {
    if (!this.order) {
      return;
    }
    //
    // evaluated
    if (this.order.score) {
      return 'evaluated';
    }

    //
    // pedning
    if (this.order.payment.status === 'pending') {
      return 'pending';
    }


    //
    // cancel
    if (this.order.payment.status === 'voided') {
      return 'voided';
    }

    //
    // auth 
    if (['authorized','prepaid'].indexOf(this.order.payment.status)>-1) {
      return 'authorized';
    }

    //
    // auth 
    if (['partially_refunded','invoice','invoice_paid','paid'].indexOf(this.order.payment.status)>-1) {
      return 'paid';
    }
  }

  ngOnDestroy() {
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }
  ngOnChanges() {
  }

  ngOnInit() {
    this.currentLimit = this.config.shared.hub.currentLimit || 1000;
    this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;

    this.config.shared.hubs.forEach(hub => this.HUBS[hub.id]=hub.name);


  }

  displayEvaluate() {
    if (!this.order || this.order.score !== undefined) {
      return false;
    }

    return this.score >= 0 && this.score < 5;
  }

  evaluate(score) {
    if (!this.order || this.order.score !== undefined) {
      return false;
    }
    this.score = score;
  }

  getOrderHUB(order) {
    return this.HUBS[order.hub];
  }


  getDayOfWeek(idx){
    return this.label.weekdays.split('_')[idx];
  }

  isOpen(order: Order) {    
    if (!order) {
      return false;
    }
    return !!(order.oid && !order.closed);
  }


  isEvaluable(order: Order) {
    if (!order) {
      return false;
    }
    if (order.score) {
      return false;
    }
    return !this.isOpen(order);
  }

  // FIXME, scheduler should be in API
  hasPotentialShippingReductionMultipleOrder() {
    return this.$cart.hasPotentialShippingReductionMultipleOrder();
  }


  prepareOrders() {
    const localInit = async () => {

      this.prepareChildOrder();
      // FIXME order.shipping should not be Null
      const mains = this.orders.filter(order => order.shipping).filter(order => !order.shipping.parent);
      if (mains && mains.length) {
        this.order = mains[0];
        this.order.items.filter(item => item.fulfillment.request).forEach(item => this.selected[item.sku] = true);
        this.score = this.order.score;
      } 

    };

    if (!this.user.id) {
      this.order = null;
      return;
    }

    this._orders = this.orders.sort((a,b)=> b.oid-a.oid);


    //
    // only needed to display latest order in boxed way
    if(this.orders.length){
      localInit();
      this.boxed = true;
      return;
    }

    combineLatest([
      this.$order.customerInvoices(),
      this.$order.findOrdersByUser(this.user, {limit: 5})
    ]).subscribe(([invoices,orders]) => {
      this.invoices = invoices;
      this._orders = orders || [];
      
      localInit();
      this.$cdr.markForCheck();
    });


    // this.$order.findOrdersByUser(this.user, {limit: 5}).subscribe(orders => {
    // });
  }

  prepareChildOrder() {
    this.childOrder = {};
    this.orders.concat(this.child||[]).forEach(order => {
      const parentoid = order.shipping && order.shipping.parent;
      this.childOrder[order.oid] = this.childOrder[order.oid] || [];
      if(parentoid) {
        this.childOrder[parentoid] = this.childOrder[parentoid] || [];
        this.childOrder[parentoid].push(order);
      }  
    });
  }


  openIssue(score?) {
    //
    // DIALOG INIT HACK
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
    this.askFeedback = true;
    if(score>=0) {
      this.score=score;
    }
  }

  onFavorites(){
    this.$navigation.searchAction('favoris');    
  }

  onAddAllToCart() {
    let items = this.order.items;
    items.forEach(item => item.hub = this.HUBS[this.order.hub])    
    this.childOrder[this.order.oid].forEach(order => {
      order.items.forEach(item => item.hub = this.HUBS[order.hub])
      items = items.concat(order.items);
    })
    //
    // FIXME, replace load N products in N calls BY N products in one call
    forkJoin(items.map(item => this.$products.get(item.sku))).subscribe((products) => {
      const cartItems = products.map((product,i) => {
        const item = items.find(itm => itm.sku == product.sku);
        if (!item) {
          return;
        }
        const variant = (item.variant) ? item.variant.title : null;
        const quantity = item.quantity || 1;
        return CartItem.fromProduct(product, item.hub, variant, quantity);
      });
      this.$cart.addAll(cartItems);
    });

  }

  onBack() {
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    this.askFeedback = false;
  }

  onEvaluate() {
    //
    // available issues:
    //  - issue_no_issue,
    //  - issue_logistic,
    //  - issue_missing_client_id,
    //  - issue_missing_product,
    //  - issue_wrong_product_quality,
    //  - issue_wrong_packing
    // all selected sku => issue_wrong_product_quality
    // all items.fulfillment.request NOT IN (selected sku) => issue_no_issue
    const skus = Object.keys(this.selected);
    const items = [];
    const orders:Order[] = this.childOrder[this.order.oid].concat([this.order])

    //
    // clean items first
    this.order.items.filter(item => item.fulfillment.request && skus.indexOf(item.sku + '') === -1).forEach(item => {
      item.fulfillment.request = 'issue_no_issue';
      items.push(item);
    });

    //
    // add issue
    this.order.items.filter(item => skus.indexOf(item.sku + '') > -1).forEach(item => {
      item.fulfillment.request = 'issue_wrong_product_quality';
      items.push(item);
    });
    this.$order.requestIssue(this.order, items, this.score, this.feedbackText).subscribe(
      (info) => {
        // console.log('----',info)
        this.$snack.open('Message envoyé merci!');
        this.order.score = this.score;
        this.onBack();
        this.$cdr.markForCheck();
      }, http => {
        this.$snack.open(http.error);
      }
    );
  }

  onRedeem(){
    this.$user.applyCode(this.applyCode).subscribe(user => {
      this._user = user;
      this.applyCode = "";
    },err => {
      alert(err.error||err.message)
    })
  }
}
