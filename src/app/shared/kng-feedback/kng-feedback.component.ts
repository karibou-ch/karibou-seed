import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Config, User, Order, OrderService, EnumFinancialStatus, CartService, Utils, ProductService, CartItem, UserService, OrderItem } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../../common';
import { MdcSnackbar } from '@angular-mdc/web';

import { forkJoin } from 'rxjs';


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
      title_subscription:'Vos abonemments',
      title_order_prepare: 'Votre commande est en cours de préparation pour',
      title_order_open: 'Vous avez une commande en cours ...',
      title_order_grouped: 'complément(s)',
      title_order_shipping: 'La livraison est prévue chez',
      title_order_cancel: 'la commande a été annulée ',
      title_order_payment_done: 'Valider après le virement bancaire!',
      title_evaluation: 'Votre note',
      title_evaluation_quick: 'Votre sentiment en étoiles ?',
      title_evaluation_save: 'Votre note',
      title_issue_question: 'Avez-vous rencontré un problème?',
      title_issue_hub: 'Vous pouvez aussi laisser un commentaire à notre équipe',
      title_issue_title: 'N\hésitez pas d\'informer le commerçant si nécessaire',
      title_issue_subtitle: 'Aider nousà améliorer la qualité du service',
      title_issue_item:'Message à transmettre au commerçant:',
      title_issue_header: 'Sélectionnez le(s) article(s) ci-dessous pour informer le commerçant.',
      title_issue_send: 'Enregistrez la note',
      title_invoice_open:'Vous avez une facture ouverte',
      title_invoice_paid:'Facture payée, en attente du virement bancaire',
      title_add_all_to_cart: 'Tout ajouter dans le panier',
      form_text_label: 'Note concernant le service?'
    },
    en: {
      title_code:'Code $$',
      title_wallet:'Your Wallet',
      title_favorite:'Suggestions mades for you',
      title_favorite_p:'A quick glance of goods',
      title_subscription:'Your subscriptions',
      title_order_prepare: 'You order is being prepared for',
      title_order_grouped: 'complement(s)',
      title_order_shipping: 'Delivery is expected at',
      title_order_open: 'You have a pending order',
      title_order_cancel: 'Your order has been cancelled',
      title_order_payment_done: 'Validate after bank transfer',
      title_evaluation: 'Your feeling in stars ?',
      title_evaluation_quick: 'Rate your Satisfaction for this order',
      title_evaluation_save: 'Your rating',
      title_issue_question: 'An issue with your order ?',
      title_issue_title: 'You have an issue with a product',
      title_issue_item:'Message to send to the merchant:',
      title_issue_subtitle: 'Helps us to improve the quality',
      title_issue_header: 'Select the product(s) below to inform the vendor.',
      title_issue_hub: 'If you have a more general comment please write here',
      title_issue_send: 'Save your rating',
      title_invoice_open:'You have open invoices',
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
  childOrder: { [key: number]: Order[]};
  selected: any = {};
  score: number;
  feedbackText: string;
  applyCode: string;
  invoices: Order[];
  invoicesPaid: Order[];
  HUBS:any = {};

  headerImg = '/assets/img/k-puce-v.png';

  creditor = {
    name: "Karibou Delphine Cluzel E.",
    address: "5 ch. du 23-Aout",
    zip: 1205,
    city: "Geneve",
    account: "CH7904835110368481000",
    country: "CH"
  };

  invoice:{
    from:Date;
    to:Date;
    items:OrderItem[];
    name:string;
    address: string;
    postalCode: string;
    amount:number;
    invoices:Order[];
  }

  //
  // qrbill component
  module:any;
  printQr = false;
  contentSVG = "";
  currentLimit: number;
  premiumLimit: number;

  @ViewChild('qrbill') svg: ElementRef;


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
    return this.invoicesPaid.length;
  }

  get qrbillTransfer(){
    if(!this.invoicesPaid.length){
      return false;
    }
    return 'K-ch-QRBILL: '+this.invoicesPaid.map(order => order.oid).join('-')
  }

  get qrbillContent() {
    if(!this.invoices.length){
      return false;
    }
    return 'K-ch-QRBILL: '+this.invoices.map(order => order.oid).join('-')
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
    this.invoicesPaid = [];
    this.applyCode = "";
    this.invoice = { from: new Date(),items:[],name:"",invoices:[]} as any;
  }


  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
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

  //
  // order state
  // - undefined
  // - voided(cancel)
  // - authorized
  // - paid
  // - evaluated
  getOrderState() {
    if (!this.order) {
      return;
    }

    if (this.order.payment.status === EnumFinancialStatus[EnumFinancialStatus.voided]) {
      return EnumFinancialStatus[EnumFinancialStatus.voided];
    }

    if (this.order.payment.status === EnumFinancialStatus[EnumFinancialStatus.authorized]) {
      return EnumFinancialStatus[EnumFinancialStatus.authorized];
    }

    if (this.order.score) {
      return 'evaluated';
    }

    if (this.order.payment.status === EnumFinancialStatus[EnumFinancialStatus.paid]) {
      return EnumFinancialStatus[EnumFinancialStatus.paid];
    }

    if (this.order.payment.status === EnumFinancialStatus[EnumFinancialStatus.partially_refunded]) {
      return EnumFinancialStatus[EnumFinancialStatus.paid];
    }

    if (this.order.payment.status === EnumFinancialStatus[EnumFinancialStatus.invoice]) {
      return EnumFinancialStatus[EnumFinancialStatus.paid];
    }

    if (this.order.payment.status === 'invoice_paid') {
      return EnumFinancialStatus[EnumFinancialStatus.paid];
    }

  }

  isOpen(order: Order) {    
    if (!order) {
      return false;
    }
    return !!(order.oid && !order.closed);
  }

  isInvoiceOpen(order: Order) {
    return order.payment.status == 'invoice';
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

  async prepareInvoice(pending:boolean) {
    const invoices = (pending)? this.invoicesPaid:this.invoices;
    if(!invoices.length) {
      return;
    }
    invoices.forEach((order:any) => {
      order.amount = order.getTotalPrice();
    });

    const last =  invoices[invoices.length-1];
    const order = invoices[0];
    const items = invoices.map(order => order.items).flat()
    const amount = invoices.reduce((sum,order:any)=>{
      const amount = order.amount;      
      return sum+amount;
    },0);

    const ordersTxt = 'K-ch-QRBILL: '+invoices.map(order => order.oid).join('-');
    
    this.invoice = {
      from:order.shipping.when,
      to: last.shipping.when,
      name: this.user.displayName,
      address: order.shipping.streetAdress,
      postalCode: order.shipping.postalCode,
      items,
      amount,
      invoices,
    }

    this.contentSVG = {
      currency: "CHF",
      amount: this.invoice.amount,
      message: ordersTxt,
      creditor: {...this.creditor},
      debtor: {
        name: this.user.displayName,
        address: this.order.shipping.streetAdress,
        zip: this.order.shipping.postalCode,
        city: this.order.shipping.region,
        country: "CH"
      }
    } as any;    

    //
    // load qr generator if needed
    if(!this.module) {
      this.module = await import('swissqrbill/lib/node/esm/node/svg.js');
    }

    if (this.svg && this.svg.nativeElement && this.module && this.module.SVG) {     
      this.svg.nativeElement.innerHTML = new this.module.SVG(this.contentSVG, { language: 'EN' });
    }          

    this.printQr = true;
  }

  prepareOrders() {
    const localInit = async () => {
      this.invoices = this.orders.filter(order => order.payment&&order.payment.status=='invoice').sort((a,b)=>{
        return a.oid-b.oid;
      });
      this.invoicesPaid = this.orders.filter(order => order.payment&&order.payment.status=='invoice_paid');
      // console.log('---- invoices',this.invoices)
      // console.log('---- invoices paid',this.invoicesPaid)
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


    if(this.orders.length){
      localInit();
      return;
    }

    this.$order.findOrdersByUser(this.user, {limit: 10}).subscribe(orders => {
      this._orders = orders || [];
      
      localInit();
      this.$cdr.markForCheck();
    });
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
    document.body.classList.add('mdc-dialog-scroll-lock');
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
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    this.askFeedback = false;
  }

  onUpdateInvoices() {
    const oids = this.invoices.map(order => order.oid);
    const amount = this.invoices.reduce((sum,order)=>sum+order.getTotalPrice(),0);

    this.$order.updateInvoices(oids, amount).subscribe((result)=>{
      this.$snack.open('Merci pour votre paiement!');
      this.invoices = [];
    })
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
