import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Config, User, Order, UserService, OrderService, EnumFinancialStatus } from 'kng2-core';
import { i18n } from '../../common';
import { MdcSnackbar } from '@angular-mdc/web';

@Component({
  selector: 'kng-feedback',
  templateUrl: './kng-feedback.component.html',
  styleUrls: ['./kng-feedback.component.scss'],
//  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackComponent implements OnInit {

  @Input() config: Config;


  i18n: any = {
    fr: {
      title_order_prepare: 'Votre commande est en cours de préparation pour',
      title_order_open: 'Vous avez une commande en cours ...',
      title_order_shipping: 'La livraison est prévue chez',
      title_order_cancel: 'la commande a été annulée ',
      title_evaluation: 'Votre évaluation:',
      title_evaluation_quick: 'Évaluation rapide:',
      title_evaluation_save: 'Enregistrer l\'évaluation:',
      title_issue_question: 'Un souci avec un article?',
      title_issue_hub: 'Si vous souhaitez faire un commentaire plus général c\'est ici',
      title_issue_title: 'Vous avez eu un problème avec un produit?',
      title_issue_header: '<br/>Nous sommes désolés! mais quand ça arrive, on vous rembourse toujours!\n<br/>Sélectionnez les articles ci-dessous et informé l\'artisan.',
      title_issue_send: 'Envoyer le Feedback !',
      form_text_label: 'Note concernant le service?'
    },
    en: {
      title_order_prepare: 'You order is being prepared for',
      title_order_shipping: 'Delivery is expected at',
      title_order_open: 'You have a pending order',
      title_order_cancel: 'Your order has been cancelled',
      title_evaluation: 'Your rating:',
      title_evaluation_quick: 'Quick rating',
      title_evaluation_save: 'Save your rating',
      title_issue_question: 'An issue with your order ?',
      title_issue_title: 'Did you have an issue with an item ?',
      title_issue_header: '<br/>We are really sorry but don\'t worry you will get your money back!\n<br/>select the issues, the maker will be informed',
      title_issue_hub: 'If you have a more general comment please write here',
      title_issue_send: 'Send your Feedback !',
      form_text_label: 'Add a comment about our service'
    }
  };

  askFeedback = false;
  isReady = false;
  order: Order;
  selected: any = {};
  score: number;
  feedbackText: string;

  @Input() boxed: boolean;
  @Input() orders: Order[] = [];
  @Input() user: User;
  @Input() forceload: boolean;

  get locale() {
    return this.$i18n.locale;
  }

  constructor(
    public  $i18n: i18n,
    private $snack: MdcSnackbar,
    private $order: OrderService,
    private $user: UserService,
    private cdr: ChangeDetectorRef
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

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }
  ngOnChanges() {

  }

  ngOnInit() {
    if (this.orders.length) {
      this.order = this.orders[0];
      this.order.items.filter(item => item.fulfillment.request).forEach(item => this.selected[item.sku] = true);
      this.score = this.order.score;
    }
    if (this.forceload) {
      this.loadOrders();
    }
  }

  loadOrders() {
    if (!this.user.id) {
      return;
    }
    this.$order.findOrdersByUser(this.user, {limit: 4}).subscribe(orders => {
      if (!orders.length) {
        return;
      }
      this.orders = orders || [];
      this.order = this.orders[0];
      this.order.items.filter(item => item.fulfillment.request).forEach(item => this.selected[item.sku] = true);
      this.score = this.order.score;
      this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      }, http => {
        this.$snack.open(http.error);
      }
    );
  }
}
