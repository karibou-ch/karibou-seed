import { Component, OnDestroy, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { AssistantService, Config, User, Order, OrderService, OrderCustomerInvoices } from 'kng2-core';
import { i18n, NotifyService } from '../../common';
import { combineLatest, Subscription } from 'rxjs';


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
      title_account:'Votre Compte',
      title_account_action:'Modifier vos données',
      title_wallet:'Votre Portefeuille',
      title_order_prepare: 'Votre commande est en cours de préparation pour',
      title_order_pending: 'La confirmation de paiement n\' a pas été effectuée ...',
      title_order_placed: 'Vous avez une commande en cours ...',
      title_order_open:'Voir le détail de votre commande ...',
      title_order_grouped: 'complément(s)',
      title_order_shipping: 'La livraison est prévue chez',
      title_order_cancel: 'la commande a été annulée ',
      title_evaluation: 'Votre note',
      title_evaluation_quick: 'Votre <b>évaluation</b> en étoiles ?',
      title_evaluation_save: 'Votre note',
      title_quick_send: 'Envoyer',
      title_quick_problem: 'Signaler un probleme',
      title_quick_options: 'Options',
      title_view_items: 'Voir les articles',
      title_refund: 'Remboursement',
      title_issue_question: 'Avez-vous rencontré un problème?',
      title_issue_hub: 'Vous pouvez aussi laisser un commentaire à notre équipe',
      title_issue_title: 'N\hésitez pas d\'informer le commerçant si nécessaire',
      title_issue_subtitle: 'Aider nousà améliorer la qualité du service',
      title_issue_item:'Message à transmettre au commerçant:',
      title_issue_header: 'Sélectionnez le(s) article(s) ci-dessous pour informer le commerçant.',
      title_issue_send: 'Envoyez la note',
      title_issue_analyze: 'Analyser votre feedback',
      title_issue_analyzing: 'Analyse en cours...',
      title_issue_analysis: 'Analyse de l agent',
      title_close_screen: 'Fermer la fenetre',
      title_invoice:'Vos factures',
      title_invoice_open:'Ouvrir l\'espace facture',
      title_invoice_paid:'Facture payée, en attente du virement bancaire',
      title_add_all_to_cart: 'Tout ajouter dans le panier',
      form_text_label: 'Note concernant le service?'
    },
    en: {
      title_code:'Code $$',
      title_wallet:'Your Wallet',
      title_order_prepare: 'You order is being prepared for',
      title_order_grouped: 'complement(s)',
      title_order_shipping: 'Delivery is expected at',
      title_order_pending: 'Payment confirmation has not been made',
      title_order_placed: 'You have a pending order',
      title_order_open:'See details of your order...',
      title_order_cancel: 'Your order has been cancelled',
      title_evaluation: 'Your feeling in stars ?',
      title_evaluation_quick: '<b>Rate</b> your Satisfaction for this order',
      title_evaluation_save: 'Your rating',
      title_quick_send: 'Send',
      title_quick_problem: 'Report a problem',
      title_quick_options: 'Options',
      title_view_items: 'View items',
      title_refund: 'Refund',
      title_issue_question: 'An issue with your order ?',
      title_issue_title: 'You have an issue with a product',
      title_issue_item:'Message to send to the merchant:',
      title_issue_subtitle: 'Helps us to improve the quality',
      title_issue_header: 'Select the product(s) below to inform the vendor.',
      title_issue_hub: 'If you have a more general comment please write here',
      title_issue_send: 'Send your feedback',
      title_issue_analyze: 'Analyze your feedback',
      title_issue_analyzing: 'Analyzing...',
      title_issue_analysis: 'Agent analysis',
      title_close_screen: 'Close the window',
      title_invoice:'Your invoices',
      title_invoice_open:'View all invoices',
      title_invoice_paid:'Invoice paid, waiting for Bank transfer',
      title_add_all_to_cart: 'Add all to cart',
      form_text_label: 'Add a comment about our service'
    }
  };

  private _user: User;
  private _orders: Order[];
  private _ordersSub: Subscription;
  private _hasExplicitOrders = false;

  currentOrder: Order;
  feedbackOrder: Order;
  issueOrder: Order;
  selectedOrderPopup: Order;
  expandedFeedbackOrderOid: number;
  childOrder: { [key: number]: Order[] };
  selected: { [key: string]: boolean } = {};
  score: number;
  feedbackText: string;
  analysisText: string;
  isAnalyzing = false;
  isAnalysisReady = false;
  isSubmittingQuick = false;
  HUBS: any = {};

  currentLimit: number;
  premiumLimit: number;

  invoices: OrderCustomerInvoices[];

  @Input() child: Order[];
  @Input() config: Config;
  @Input() boxed: boolean;
  @Input() forceload: boolean;
  @Input() set user(u: User) {
    this._user = u;
    this.prepareOrders();
  }
  @Input() set orders(orders: Order[]) {
    this._hasExplicitOrders = orders !== undefined;
    this._orders = (orders||[]);
    this.prepareOrders();
  }

  @Output() onUpdate = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<Order>();
  @Output() addAllToCart = new EventEmitter<Order>();

  get hubName() {
    return (this.config && this.config.shared) ? this.config.shared.hub.name : '';
  }

  get store() {
    return (this.config && this.config.shared) ? this.config.shared.hub.slug : '';
  }

  get locale() {
    return this.$i18n.locale;
  }

  get user(): User {
    return this._user;
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

  get hasInvoiceTransfer() {
    return this.invoices.some(invoice => invoice.transfers.length);
  }

  get qrbillTransfer(){
    if(!this.hasInvoiceTransfer){
      return false;
    }
    const oids = this.invoices.map(invoice => invoice.transfers.map(order => order.oid)).flat();
    return 'K-ch-QRBILL: '+oids.join('-');
  }

  get hasInvoice() {
    return this.invoices.some(invoice => invoice.invoices.length);
  }

  get qrbillInvoice() {
    if(!this.hasInvoice){
      return false;
    }
    const oids = this.invoices.map(invoice => invoice.invoices.map(order => order.oid)).flat();
    return 'Vous avez '+oids.length + ' factures ouvertes';
  }

  constructor(
    public  $i18n: i18n,
    private $snack: NotifyService,
    private $order: OrderService,
    private $assistant: AssistantService,
    private $cdr: ChangeDetectorRef,
  ) {
    this._orders = [];
    this.invoices = [];
    this.childOrder = {};
    this.feedbackText = '';
    this.analysisText = '';
  }

  ngOnDestroy() {
    this._ordersSub?.unsubscribe();
  }

  ngOnInit() {
    this.currentLimit = this.config.shared.hub.currentLimit || 1000;
    this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
    this.config.shared.hubs.forEach(hub => this.HUBS[hub.id]=hub.name);
  }

  getOrderHUB(order) {
    return this.HUBS[order.hub];
  }


  getDayOfWeek(idx){
    return this.label.weekdays.split('_')[idx];
  }

  getOrderState(order: Order) {
    if (!order) {
      return;
    }

    if (order.score !== undefined && order.score !== null) {
      return 'evaluated';
    }

    if (order.payment?.status === 'pending') {
      return 'pending';
    }

    if (order.payment?.status === 'voided') {
      return 'voided';
    }

    if (['authorized', 'prepaid'].indexOf(order.payment?.status) > -1) {
      return 'authorized';
    }

    if (['partially_refunded', 'invoice', 'invoice_paid', 'paid'].indexOf(order.payment?.status) > -1) {
      return 'paid';
    }
  }

  getChildOrders(order: Order): Order[] {
    if (!order) {
      return [];
    }
    return this.childOrder[order.oid] || [];
  }

  prepareOrders() {
    if (!this.user?.id) {
      this.currentOrder = null;
      this.feedbackOrder = null;
      this.issueOrder = null;
      return;
    }

    this._orders = [...this.orders].sort((a, b) => b.oid - a.oid);

    if (this._hasExplicitOrders && this.orders.length) {
      this.initializeOrders();
      this.boxed = true;
      return;
    }

    this._ordersSub?.unsubscribe();
    this._ordersSub = combineLatest([
      this.$order.customerInvoices(),
      // Fetch a wider window so the home widget can show both
      // the active order and the latest delivered order.
      this.$order.findOrdersByUser(this.user, {limit: 10})
    ]).subscribe(([invoices,orders]) => {
      this.invoices = invoices;
      this._orders = orders || [];
      this.initializeOrders();
      this.$cdr.markForCheck();
    });
  }

  initializeOrders() {
    this.prepareChildOrder();
    const mains = this.getMainOrders();
    this.currentOrder = this.pickCurrentOrder(mains);
    this.feedbackOrder = this.pickFeedbackOrder(mains, this.currentOrder);
  }

  getMainOrders(): Order[] {
    return this.orders
      .filter(order => order?.shipping)
      .filter(order => !order.shipping.parent)
      .sort((a, b) => b.oid - a.oid);
  }

  pickCurrentOrder(orders: Order[]): Order {
    return orders.find(order => {
      const state = this.getOrderState(order);
      return state === 'pending' || state === 'authorized';
    });
  }

  pickFeedbackOrder(orders: Order[], currentOrder?: Order): Order {
    const candidates = orders.filter(order => !currentOrder || order.oid !== currentOrder.oid);
    const actionable = candidates.find(order => this.getOrderState(order) === 'paid');
    if (actionable) {
      return actionable;
    }

    if (this._hasExplicitOrders) {
      return candidates.find(order => this.getOrderState(order) === 'evaluated');
    }

    return null;
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


  openIssue(order: Order, score?) {
    this.issueOrder = order;
    this.feedbackText = '';
    this.analysisText = '';
    this.isAnalyzing = false;
    this.isAnalysisReady = false;
    this.score = order.score;
    if (score >= 0) {
      this.score = score;
    }
  }

  openOrder(order: Order) {
    this.selectedOrderPopup = order;
  }

  setScore(score: number) {
    this.score = score;
  }

  setFeedbackText(text: string) {
    this.feedbackText = text;
    this.analysisText = '';
    this.isAnalysisReady = false;
  }

  analyzeIssue() {
    if (!this.issueOrder || !this.feedbackText?.trim() || this.isAnalyzing) {
      return;
    }

    const prompt = this.buildIssueAnalysisPrompt(this.issueOrder, this.feedbackText.trim());

    this.isAnalyzing = true;
    this.isAnalysisReady = false;
    this.analysisText = '';

    this.$assistant.chat({
      q: prompt,
      agent: 'feedback',
      hub: this.store
    }).subscribe({
      next: (chunk: string) => {
        this.analysisText = `${this.analysisText}${chunk || ''}`.replace('**traitement...**', '').trim();
        this.$cdr.markForCheck();
      },
      error: (err) => {
        this.isAnalyzing = false;
        this.analysisText = '';
        this.isAnalysisReady = false;
        this.$snack.open(err?.error || err?.message || 'Erreur pendant l analyse');
        this.$cdr.markForCheck();
      },
      complete: () => {
        this.isAnalyzing = false;
        this.analysisText = this.analysisText.trim();
        this.isAnalysisReady = !!this.analysisText;
        this.$cdr.markForCheck();
      }
    });
  }

  buildIssueAnalysisPrompt(order: Order, feedback: string): string {
    const items = this.getOrdersForIssue(order)
      .flatMap(issueOrder => issueOrder.items.map(item => [
        `- ${item.quantity}x ${item.title}`,
        item.sku ? `[SKU:${item.sku}]` : '',
        item.part ? `(${item.part})` : ''
      ].filter(Boolean).join(' ')))
      .join('\n');

    return [
      'Analyse un feedback client de commande.',
      'Determine si le probleme concerne un produit, plusieurs produits, la livraison, le service, ou un vendeur specifique.',
      'Retourne une synthese courte et operationnelle en francais.',
      '',
      `Commande: ${order.oid}`,
      `Produits:\n${items}`,
      '',
      `Feedback client:\n${feedback}`,
      '',
      'Format attendu:',
      '- Type: produit | produits | livraison | service | vendeur',
      '- Cible: SKU(s) ou vendeur si identifiable',
      '- Resume: 1 a 3 phrases',
      '- Action recommandee: phrase courte'
    ].join('\n');
  }

  onAddAllToCart(order: Order) {
    this.addAllToCart.emit(order);
    const complements = this.getChildOrders(order);
    if (complements) {
      for (const complement of complements) {
        this.addAllToCart.emit(complement);
      }
    }
    // temporary feedback
    this.$snack.open('Articles ajoutés');
  }

  onBack() {
    this.selectedOrderPopup = null;
    this.issueOrder = null;
    this.analysisText = '';
    this.isAnalyzing = false;
    this.isAnalysisReady = false;
  }

  onEvaluate() {
    if (!this.issueOrder || !this.feedbackText?.trim() || !this.isAnalysisReady) {
      return;
    }

    const effectiveScore = Number.isInteger(this.score) ? this.score : 0;
    const items = [];
    const orders = this.getOrdersForIssue(this.issueOrder);

    orders.forEach(order => {
      order.items.forEach(item => {
        item.fulfillment.request = 'issue_wrong_product_quality';
        items.push(item);
      });
    });

    const message = this.isAnalysisReady && this.analysisText
      ? [
          `Feedback client:\n${this.feedbackText?.trim() || ''}`,
          `Analyse agent:\n${this.analysisText.trim()}`
        ].join('\n\n')
      : this.feedbackText?.trim();

    this.$order.requestIssue(this.issueOrder, items, effectiveScore, message).subscribe(
      (info) => {
        this.$snack.open('Message envoyé merci!');
        this.issueOrder.score = effectiveScore;
        this.initializeOrders();
        this.onBack();
        this.$cdr.markForCheck();
      }, http => {
        this.$snack.open(http.error);
      }
    );
  }

  onQuickEvaluate(order: Order, score: number) {
    if (!order || !Number.isInteger(score) || this.isSubmittingQuick) {
      return;
    }

    const items = this.buildRequestItems(order, 'issue_no_issue');
    this.isSubmittingQuick = true;

    this.$order.requestIssue(order, items, score).subscribe(
      () => {
        order.score = score;
        this.initializeOrders();
        this.$snack.open('Feedback envoye merci!');
        this.isSubmittingQuick = false;
        this.$cdr.markForCheck();
      },
      http => {
        this.isSubmittingQuick = false;
        this.$snack.open(http.error);
        this.$cdr.markForCheck();
      }
    );
  }

  buildRequestItems(order: Order, request: string) {
    const items = [];
    this.getOrdersForIssue(order).forEach(groupedOrder => {
      groupedOrder.items.forEach(item => {
        const nextItem: any = Object.assign({}, item);
        nextItem.fulfillment = Object.assign({}, item.fulfillment || {}, { request });
        items.push(nextItem);
      });
    });
    return items;
  }

  getOrdersForIssue(order: Order): Order[] {
    return [order].concat(this.getChildOrders(order));
  }

  toggleDetails(order: Order) {
    if (!order) {
      return;
    }
    this.expandedFeedbackOrderOid = this.expandedFeedbackOrderOid === order.oid ? null : order.oid;
  }

  isPending(order: Order) {
    if (!order) {
      return false;
    }
    const status = order.fulfillments.status;
    return status === 'authorized' || status === 'pending' || status === 'placed';
  }

  onCancelOrder(order: Order) {
    this.cancel.emit(order);
  }
}
