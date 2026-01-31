import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CartItem, CartService, CartSubscription, Config, Order, ProductService, User, UserCard, UserService } from 'kng2-core';
import { StripeService } from 'ngx-stripe';
import { i18n } from '../common';
import { PaymentEvent } from '../common/kng-payment/kng-user-payment.component';
import { SUBSCRIPTION_I18N } from './kng-subscription-i18n';

@Component({
  selector: 'kng-subscription-control',
  templateUrl: './kng-subscription-control.component.html',
  styleUrls: ['./kng-subscription-control.component.scss']
})
export class KngSubscriptionControlComponent implements OnInit, OnDestroy {

  // ✅ MIGRATION: Utiliser le fichier i18n centralisé
  i18n = SUBSCRIPTION_I18N;

  private _user: User;
  private _orders: Order[];

  @Input() config: Config;
  @Input() user: User;

  contracts: CartSubscription[];
  currentContract: CartSubscription;
  payments = [];
  until: Date;
  pauseUntil: Date;
  error: string;
  isRunning: boolean;
  selPaymentAlias: string;
  paymentErrorFromUrl: { action?: string; reason?: string; message?: string };

  // ✅ Gestion moderne des erreurs de paiement
  paymentError: {
    action: string;
    reason: string;
    intent?: string;
    message: string;
    urgency: 'high' | 'medium' | 'low';
    icon: string;
    teamContact?: boolean;
    teamMessage?: string;
  } | null = null;

  constructor(
    public $products: ProductService,
    public $cart: CartService,
    public $i18n: i18n,
    public $router: Router,
    public $user: UserService,
    public $stripe: StripeService,
    private route: ActivatedRoute
  ) {
    this._orders = [];
    this.contracts = [];
    this.pauseUntil = this.until = new Date(Date.now() + 3600000 * 24 * 6);
    this.user = $user.currentUser;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.$i18n.label();
  }

  get llabel() {
    return this.i18n[this.locale];
  }

  get checkResumeDate() {
    const now = new Date();
    return now.daysDiff(this.pauseUntil) > 6;
  }

  get pauseInDays() {
    const now = new Date();
    return now.daysDiff(this.pauseUntil);
  }

  get store() {
    return this.config.shared.hub.slug;
  }

  get currentContract_frequency() {
    if (!this.currentContract) return '';
    return '';
  }

  get contract_requires_action() {
    if (!this.currentContract || !this.currentContract.latestPaymentIntent) {
      return false;
    }
    return this.currentContract.latestPaymentIntent.status == 'requires_action';
  }

  get contract_requires_method() {
    if (!this.currentContract || !this.currentContract.latestPaymentIntent) {
      return false;
    }
    return this.currentContract.latestPaymentIntent.status == 'requires_payment_method';
  }

  get userPayment() {
    const alias = this.currentContract.paymentAlias;
    return new UserCard(this.user.payments.find(payment => payment.alias == alias) || {});
  }

  get openContracts() {
    return this.contracts.filter(contract => {
      if (contract.status === 'active') {
        return true;
      }
      if (contract.status === 'incomplete' && contract.latestPaymentIntent) {
        const needsAction = ['requires_action', 'requires_payment_method'].includes(
          contract.latestPaymentIntent.status
        );
        return needsAction;
      }
      return false;
    });
  }

  get hasModernPaymentError(): boolean {
    return !!this.paymentError;
  }

  get shouldShowLegacyError(): boolean {
    return !this.hasModernPaymentError && (this.contract_requires_action || this.contract_requires_method);
  }

  get errorUrgencyClass(): string {
    if (!this.paymentError) return '';
    switch (this.paymentError.urgency) {
      case 'high': return 'error-high';
      case 'medium': return 'error-medium';
      case 'low': return 'error-low';
      default: return '';
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  ngOnInit() {
    this.$cart.subscription$.subscribe(contracts => {
      this.contracts = contracts;
      this.onOpen(this.route.snapshot.queryParams);
    });

    this.route.queryParams.subscribe(params => {
      this.onOpen(params);
    });

    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contracts = contracts;
      this.onOpen(this.route.snapshot.queryParams);
    });

    if (this.config.shared && this.config.shared.keys) {
      this.$stripe.setKey(this.config.shared.keys.pubStripe);
    }

    if (!this.user || !this.user.payments) {
      return;
    }

    this.$user.user$.subscribe(user => {
      this.payments = user.payments.filter(payment => payment.issuer != "invoice");
    });
  }

  getContractAction(contract) {
    if (!contract.latestPaymentIntent) {
      return this.llabel.subtitle_subscription_action;
    }
    return this.llabel.subtitle_subscription_action;
  }

  getContractDescription(contract) {
    return this.getDayOfWeek(contract.dayOfWeek) + ' ' + this.getFrequency(contract);
  }

  getFrequency(contract) {
    return this.$i18n.label()[contract.frequency];
  }

  getDayOfWeek(idx) {
    return this.label.weekdays.split('_')[idx];
  }

  getShippingTime(contract) {
    return this.config.shared.hub.shippingtimes[contract.shipping.hours];
  }

  getOpenParams(contractId: string) {
    return {
      contract: contractId,
      action: null,
      reason: null,
      intent: null
    };
  }

  getErrorUrgency(action: string, reason: string): 'high' | 'medium' | 'low' {
    if (action === 'authenticate' || action === 'replace' || action === 'setup') {
      return 'high';
    }
    if (action === 'update' && reason === 'declined') {
      return 'high';
    }
    return 'medium';
  }

  getErrorIcon(action: string, reason: string): string {
    switch (action) {
      case 'authenticate': return '🔐';
      case 'replace':
        return reason === 'expired' ? '💳' : '🔄';
      case 'update':
        return reason === 'declined' ? '🚫' : '⚠️';
      case 'setup': return '➕';
      case 'contact': return '📞';
      case 'retry': return '🔄';
      default: return '⚠️';
    }
  }

  getPaymentErrorMessage(action: string, reason: string): string {
    const llabel = this.llabel;
    switch (action) {
      case 'setup':
        return llabel.payment_error_setup;
      case 'authenticate':
        return llabel.payment_error_authenticate;
      case 'replace':
        if (reason === 'invalid_method') {
          return llabel.payment_error_replace_invalid_method;
        }
        if (reason === 'expired') {
          return llabel.payment_error_replace_expired;
        }
        break;
      case 'update':
        if (reason === 'declined') {
          return llabel.payment_error_update_declined;
        }
        break;
      case 'contact':
        return llabel.payment_error_contact;
      case 'retry':
        if (reason === 'canceled') {
          return llabel.payment_error_retry_canceled;
        }
        break;
    }
    return llabel.payment_error_generic;
  }

  async onConfirmPaymentIntent() {
    try {
      const intent = this.currentContract.latestPaymentIntent;
      const intentOpt: any = {
        payment_method: intent.source
      };

      this.isRunning = true;
      this.error = null;

      const result = await this.$stripe.confirmCardPayment(intent.client_secret, intentOpt).toPromise();
      if (result.error) {
        this.error = result.error.message;
        this.isRunning = false;
        return;
      }
      this.currentContract = await this.$cart.subscriptionPaymentConfirm(this.currentContract.id, result.paymentIntent).toPromise();

    } catch (err) {
      this.error = err.error || err.message;
    } finally {
      this.isRunning = false;
    }
  }

  async onUpdatePaymenMethod(payment: PaymentEvent) {
    // Contract use customer default payment method
  }

  onOpen(params) {
    const contractId = params['contract'];
    if (!contractId || this.currentContract?.id === contractId) {
      return;
    }

    const action = params['action'];
    const reason = params['reason'];
    const intent = params['intent'];

    this.paymentError = null;
    this.paymentErrorFromUrl = {};

    if (action && reason) {
      this.paymentError = {
        action,
        reason,
        intent,
        message: this.getPaymentErrorMessage(action, reason),
        urgency: this.getErrorUrgency(action, reason),
        icon: this.getErrorIcon(action, reason),
        teamContact: action === 'contact' || (action === 'setup' && reason === 'missing'),
        teamMessage: action === 'setup' && reason === 'missing' ?
          'Notre équipe va vous contacter dans les plus brefs délais pour résoudre ce problème de configuration.' : undefined
      };

      this.paymentErrorFromUrl = { action, reason, message: this.paymentError.message };
    }

    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) {
      return;
    }

    if (!this.paymentError && contract.latestPaymentIntent) {
      const status = contract.latestPaymentIntent.status;
      let autoAction: string | null = null;
      let autoReason: string | null = null;

      if (status === 'requires_action') {
        autoAction = 'authenticate';
        autoReason = '3ds';
      } else if (status === 'requires_payment_method') {
        autoAction = 'replace';
        autoReason = 'invalid_method';
      }

      if (autoAction && autoReason) {
        this.paymentError = {
          action: autoAction,
          reason: autoReason,
          intent: contract.latestPaymentIntent.id,
          message: this.getPaymentErrorMessage(autoAction, autoReason),
          urgency: this.getErrorUrgency(autoAction, autoReason),
          icon: this.getErrorIcon(autoAction, autoReason),
          teamContact: false
        };
      }
    }

    document.body.classList.add('mdc-dialog-scroll-lock');
    this.currentContract = contract;
    if (this.currentContract) {
      this.selPaymentAlias = this.currentContract.paymentAlias;
    }
  }

  onSubRemove(item: CartItem, variant?: string) {
    if (item.quantity == 0) {
      return;
    }
    item.quantity--;
    item['updated'] = true;
  }

  onSubRemoveAll(item: CartItem, variant?: string) {
    item.quantity = 0;
    item['updated'] = true;
    item.deleted = true;
  }

  onAddItemToCart() {
    if (!this.currentContract) {
      return;
    }

    const hub = this.currentContract.items?.[0]?.hub || this.config.shared.hub.slug;
    const plan = (this.currentContract.plan) ? ('&plan=' + this.currentContract.plan) : '';
    const url = `/store/${hub}/home/subscription?view=subscription&id=${this.currentContract.id}${plan}`;
    this.$router.navigateByUrl(url);
  }

  onPause(to: Date) {
    this.error = null;
    this.$cart.subscriptionPause(this.currentContract, to).subscribe(done => {
      this.currentContract = done;
    }, status => {
      this.error = status.error;
    });
  }

  onDelete() {
    this.error = null;
    this.$cart.subscriptionCancel(this.currentContract).subscribe(done => {
      this.onClose();
    }, status => {
      this.error = status.error;
    });
  }

  onClose(res?) {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    this.currentContract = res || null;
    this.paymentErrorFromUrl = null;
    this.$router.navigate([], {
      relativeTo: this.route,
      queryParams: { contract: null, action: null, reason: null, intent: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  onSubscriptionItemUpdated(updatedContract: CartSubscription) {
    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contracts = contracts;
      this.currentContract = contracts.find(c => c.id === updatedContract.id) || updatedContract;
    });
  }

  onSubscriptionItemError(error: any) {
    this.error = error.error || error.message || 'Erreur lors de la mise à jour des articles';
    console.error('Subscription item update error:', error);
  }
}
