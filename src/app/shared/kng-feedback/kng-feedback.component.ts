import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Config, User, Order, OrderService, EnumFinancialStatus, CartService, Utils, ProductService, CartItem } from 'kng2-core';
import { i18n } from '../../common';
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
      title_wallet:'Votre Portefeuille',
      title_order_prepare: 'Votre commande est en cours de préparation pour',
      title_order_open: 'Vous avez une commande en cours ...',
      title_order_grouped: 'complément(s)',
      title_order_shipping: 'La livraison est prévue chez',
      title_order_cancel: 'la commande a été annulée ',
      title_order_payment_done: 'Valider après le virement bancaire!',
      title_evaluation: 'Votre note',
      title_evaluation_quick: 'Evaluez votre satisfaction',
      title_evaluation_save: 'Votre note',
      title_issue_question: 'Avez-vous rencontré un problème?',
      title_issue_hub: 'Si vous souhaitez faire un commentaire plus général c\'est ici',
      title_issue_title: 'Vous avez rencontré un problème avec un produit',
      title_issue_subtitle: 'Chaque retour est précieux pour améliorer la qualité du service',
      title_issue_header: 'Sélectionnez le(s) article(s) ci-dessous pour informer le commerçant.<br/>Ne vous inquiétez pas, vous serez remboursé.',
      title_issue_send: 'Enregistrez la note',
      title_invoice_open:'Vous avez des factures ouvertes',
      title_add_all_to_cart: 'Tout ajouter dans le panier',
      form_text_label: 'Note concernant le service?'
    },
    en: {
      title_wallet:'Your Wallet',
      title_order_prepare: 'You order is being prepared for',
      title_order_grouped: 'complement(s)',
      title_order_shipping: 'Delivery is expected at',
      title_order_open: 'You have a pending order',
      title_order_cancel: 'Your order has been cancelled',
      title_order_payment_done: 'Validate after bank transfer',
      title_evaluation: 'Your rating',
      title_evaluation_quick: 'Rate your Satisfaction',
      title_evaluation_save: 'Your rating',
      title_issue_question: 'An issue with your order ?',
      title_issue_title: 'You have an issue with a product',
      title_issue_subtitle: 'Each feedback helps us to improve the quality',
      title_issue_header: 'Select the product(s) below to inform the vendor.<br/>We are really sorry but don\'t worry you will get your money back!',
      title_issue_hub: 'If you have a more general comment please write here',
      title_issue_send: 'Save your rating',
      title_invoice_open:'You have open invoices',
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
  invoices: Order[];
  HUBS:any = {};

  //
  // qrbill component
  module:any;
  printQr = false;
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

  get qrbill() {
    //      reference: "210000000003139471430009017",
    // const prefix = '10000000000';
    // const reference = prefix+this.user.id+''+Utils.mod10(prefix+this.user.id);
    const ordersTxt = 'K-ch-QRBILL: '+this.invoices.map(order => order.oid).join('-');

    const orderAmount = this.invoices.reduce((sum,order)=>{
      const amount = order.getTotalPriceForBill();
      return sum+amount;
    },0);

    let amount = -this._user.balance; 
    if(orderAmount!=amount) {
      amount = Math.max(orderAmount,amount);
    };

    if(!this.invoices.length){
      return false;
    }
    const content = {
      currency: "CHF",
      amount: orderAmount,
      message: ordersTxt,
      creditor: {
        name: "Karibou Delphine Cluzel E.",
        address: "5 ch. du 23-Aout",
        zip: 1205,
        city: "Geneve",
        account: "CH7904835110368481000",
        country: "CH"
      },
      debtor: {
        name: this.user.displayName,
        address: this.order.shipping.streetAdress,
        zip: this.order.shipping.postalCode,
        city: this.order.shipping.region,
        country: "CH"
      }
    } as any;    

    //
    // check validity of SVG component (lazy loaded) and svg element
    if (this.module && this.module.SVG && this.svg && this.svg.nativeElement) {        
      this.svg.nativeElement.innerHTML = new this.module.SVG(content, { language: 'EN' });
    }

    return true;
  }

  constructor(
    public $products: ProductService,
    public $cart: CartService,
    public  $i18n: i18n,
    private $snack: MdcSnackbar,
    private $order: OrderService,
    private $cdr: ChangeDetectorRef
  ) {
    this._orders = [];
    this.invoices = [];
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

    this.prepareOrders();

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

  prepareOrders() {
    const localInit = () => {
      this.invoices = this.orders.filter(order => order.payment&&order.payment.status=='invoice');
      this.prepareChildOrder();
      // FIXME order.shipping should not be Null
      const mains = this.orders.filter(order => order.shipping).filter(order => !order.shipping.parent);
      if (mains && mains.length) {
        this.order = mains[0];
        this.order.items.filter(item => item.fulfillment.request).forEach(item => this.selected[item.sku] = true);
        this.score = this.order.score;
      } 
      
      //
      // load qr generator if needed
      if(!this.module && this.invoices.length) {
        this.module = true; //avoid reentrency
        import('swissqrbill/lib/node/esm/node/svg.js').then((module:any) => {
          this.module = module;
        });
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

    this.$order.findOrdersByUser(this.user, {limit: 8}).subscribe(orders => {
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


  openIssue() {
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
    this.askFeedback = true;
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
}
