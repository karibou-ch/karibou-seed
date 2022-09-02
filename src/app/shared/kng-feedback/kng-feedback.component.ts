import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Config, User, Order, UserService, OrderService, EnumFinancialStatus, CartService } from 'kng2-core';
import { i18n } from '../../common';
import { MdcSnackbar } from '@angular-mdc/web';

@Component({
  selector: 'kng-feedback',
  templateUrl: './kng-feedback.component.html',
  styleUrls: ['./kng-feedback.component.scss'],
//  encapsulation: ViewEncapsulation.None,
// changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackComponent implements OnInit {

  private _user:User;

  i18n: any = {
    fr: {
      title_order_prepare: 'Votre commande est en cours de préparation pour',
      title_order_open: 'Vous avez une commande en cours ...',
      title_order_grouped: 'complément(s)',
      title_order_shipping: 'La livraison est prévue chez',
      title_order_cancel: 'la commande a été annulée ',
      title_evaluation: 'Votre note',
      title_evaluation_quick: 'Evaluez votre satisfaction',
      title_evaluation_save: 'Votre note',
      title_issue_question: 'Avez-vous rencontré un problème?',
      title_issue_hub: 'Si vous souhaitez faire un commentaire plus général c\'est ici',
      title_issue_title: 'Vous avez rencontré un problème avec un produit',
      title_issue_subtitle: 'Chaque retour est précieux pour améliorer la qualité du service',
      title_issue_header: 'Sélectionnez le(s) article(s) ci-dessous pour informer le commerçant.<br/>Ne vous inquiétez pas, vous serez remboursé.',
      title_issue_send: 'Enregistrez la note',
      title_invoice_open:'(Vous avez une facture ouverte)',
      form_text_label: 'Note concernant le service?'
    },
    en: {
      title_order_prepare: 'You order is being prepared for',
      title_order_grouped: 'complement(s)',
      title_order_shipping: 'Delivery is expected at',
      title_order_open: 'You have a pending order',
      title_order_cancel: 'Your order has been cancelled',
      title_evaluation: 'Your rating',
      title_evaluation_quick: 'Rate your Satisfaction',
      title_evaluation_save: 'Your rating',
      title_issue_question: 'An issue with your order ?',
      title_issue_title: 'You have an issue with a product',
      title_issue_subtitle: 'Each feedback helps us to improve the quality',
      title_issue_header: 'Select the product(s) below to inform the vendor.<br/>We are really sorry but don\'t worry you will get your money back!',
      title_issue_hub: 'If you have a more general comment please write here',
      title_issue_send: 'Save your rating',
      title_invoice_open:'(You have an open invoice)',
      form_text_label: 'Add a comment about our service'
    }
  };

  askFeedback = false;
  isReady = false;
  order: Order;
  selected: any = {};
  score: number;
  feedbackText: string;

  currentLimit: number;
  premiumLimit: number;

  @Input() config: Config;
  @Input() boxed: boolean;
  @Input() orders: Order[] = [];
  @Input() child: Order[] = [];
  @Input() forceload: boolean;
  @Input() set user(u:User){
    this._user = u;
    setTimeout(()=>{
      this.loadOrders();
    },1)
  }

  get hubName() {
    return (this.config && this.config.shared) ? this.config.shared.hub.name : '';
  }

  get locale() {
    return this.$i18n.locale;
  }

  get childOrders() {
    return this.child||[];
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


  constructor(
    public $cart: CartService,
    public  $i18n: i18n,
    private $snack: MdcSnackbar,
    private $order: OrderService,
    private $cdr: ChangeDetectorRef
  ) {
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

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }
  ngOnChanges() {

  }

  ngOnInit() {

    this.currentLimit = this.config.shared.hub.currentLimit || 1000;
    this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;

    if (this.orders && this.orders.length) {
      this.order = this.orders[0];
      this.order.items.filter(item => item.fulfillment.request).forEach(item => this.selected[item.sku] = true);
      this.score = this.order.score;
    }
    if (this.forceload) {
      //this.loadOrders();
    }


  }

  loadOrders() {
    if (!this.user.id) {
      this.orders = [];
      this.order = null;
      return;
    }

    if(this.orders.length){
      return;
    }

    const hub = this.config ? this.config.shared.hub.slug : '';
    this.$order.findOrdersByUser(this.user, {limit: 4}).subscribe(orders => {
      if (!orders.length) {
        return;
      }
      this.orders = orders || [];
      this.order = this.orders[0];
      this.order.items.filter(item => item.fulfillment.request).forEach(item => this.selected[item.sku] = true);
      this.score = this.order.score;
      this.$cdr.markForCheck();
    });
  }

  openIssue() {
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
    this.askFeedback = true;
  }

  onBack() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    this.askFeedback = false;
  }

  saveEvaluate() {
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
    const skus = Object.keys(this.selected),
        items = [];

    //
    // remove issue
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
