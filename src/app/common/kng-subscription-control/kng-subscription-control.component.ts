import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CartItem, CartService, CartSubscription, Config, Order, ProductService, User, UserCard, UserService } from 'kng2-core';
import { StripeService } from 'ngx-stripe';
import { i18n } from 'src/app/common';
import { PaymentEvent } from '../kng-payment/kng-user-payment.component';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'kng-subscription-control',
  templateUrl: './kng-subscription-control.component.html',
  styleUrls: ['./kng-subscription-control.component.scss']
})
export class KngSubscriptionControlComponent implements OnInit {

  i18n: any = {
    fr: {
      title_subscription:'Vos abonnements',
      subtitle_subscription:'Votre abonnement',
      subtitle_subscription_premium:'Votre abonnement Premium',
      subtitle_subscription_start: 'Actif depuis',
      subtitle_subscription_pause:'Mettre en pause jusqu\'au ',
      subtitle_subscription_pause_action:'Mettre en pause jusqu\'au',
      subtitle_subscription_cancel:'Annuler votre abonnement',
      subtitle_subscription_end:'Votre abonnement est supprimé',
      subtitle_subscription_status:'Fréquence de votre abonnement :',
      subtitle_subscription_paused:'Votre abonnement reprendra le :',
      subtitle_subscription_update_method:'Votre méthode de paiement n\'est plus valable',
      subtitle_subscription_confirm_method:'Votre banque souhaite une confirmation',
      subtitle_subscription_add:'Ajouter un article',
      subtitle_subscription_action:'Modifier et enregistrer votre abonnement',
      subtitle_subscription_items:'Vos articles',
      subtitle_subscription_service:'Vos services',
      subtitle_subscription_options:'Vos options',
      subtitle_subscription_gocart:'Modifier les articles',
      payment_error_setup: 'Aucune méthode de paiement n\'est configurée pour cet abonnement. Veuillez en ajouter une.',
      payment_error_authenticate: 'Votre banque demande une authentification supplémentaire (3D Secure).',
      payment_error_replace_invalid_method: 'Votre méthode de paiement n\'est plus valide ou a expiré. Veuillez la remplacer.',
      payment_error_replace_expired: 'Votre carte a expiré ou les informations sont incorrectes. Veuillez la remplacer.',
      payment_error_update_declined: 'Votre carte a été refusée. Vérifiez vos fonds, les informations de la carte ou contactez votre banque.',
      payment_error_contact: 'Votre banque a refusé le paiement. Veuillez la contacter pour plus d\'informations.',
      payment_error_retry_canceled: 'Le paiement a été annulé. Vous pouvez essayer de le relancer.',
      payment_error_generic: 'Un problème est survenu avec votre paiement.'
    },
    en: {
      title_subscription:'Your subscriptions',
      subtitle_subscription:'Your subscription',
      subtitle_subscription_premium:'Your Premium Subscription',
      subtitle_subscription_start: 'Active since',
      subtitle_subscription_pause:'Pause deliveries until',
      subtitle_subscription_pause_action:'Pause until',
      subtitle_subscription_cancel:'Cancel your subscription',
      subtitle_subscription_end:'Votre abonnement est supprimé',
      subtitle_subscription_status:'Subscription frequency :',
      subtitle_subscription_paused:'Your subscription will resume on :',
      subtitle_subscription_update_method:'Your payment method is no longer valid',
      subtitle_subscription_confirm_method:'For security reasons, confirm your pending payment',
      subtitle_subscription_action:'Update and save your subscription',
      subtitle_subscription_add:'Add an item',
      subtitle_subscription_items:'Items',
      subtitle_subscription_service:'Services',
      subtitle_subscription_options:'Options',
      subtitle_subscription_gocart:'Edit subsctiption items',
      payment_error_setup: 'No payment method is configured for this subscription. Please add one.',
      payment_error_authenticate: 'Your bank requires additional authentication (3D Secure).',
      payment_error_replace_invalid_method: 'Your payment method is no longer valid or has expired. Please replace it.',
      payment_error_replace_expired: 'Your card has expired or the information is incorrect. Please replace it.',
      payment_error_update_declined: 'Your card was declined. Please check your funds, card information, or contact your bank.',
      payment_error_contact: 'Your bank has declined the payment. Please contact them for more information.',
      payment_error_retry_canceled: 'The payment was canceled. You can try to run it again.',
      payment_error_generic: 'A problem occurred with your payment.'
    }
  };

  private _user:User;
  private _orders:Order[];

  @Input() config: Config;
  @Input() user: User;

  contracts: CartSubscription[];
  currentContract:CartSubscription;
  payments = [];
  until:Date;
  pauseUntil:Date;
  error:string;
  isRunning:boolean;
  selPaymentAlias: string;
  paymentErrorFromUrl: { action?: string; reason?: string; message?: string };

  // ✅ NOUVEAU : Gestion moderne des erreurs de paiement
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
    this.pauseUntil = this.until = new Date(Date.now()+3600000*24*6);
    this.user = $user.currentUser;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label(){
    return this.$i18n.label();
  }

  get llabel(){
    return this.i18n[this.locale];
  }

  get checkResumeDate(){
    const now = new Date();
    return now.daysDiff(this.pauseUntil)>6;
  }

  get pauseInDays() {
    const now = new Date();
    return now.daysDiff(this.pauseUntil);
  }

  get store() {
    return this.config.shared.hub.slug;
  }


  get currentContract_frequency() {
    if(!this.currentContract) return '';
    return
  }

  get contract_requires_action() {
    if(!this.currentContract || !this.currentContract.latestPaymentIntent) {
      return false;
    }
    return this.currentContract.latestPaymentIntent.status=='requires_action';
  }

  get contract_requires_method() {
    if(!this.currentContract || !this.currentContract.latestPaymentIntent) {
      return false;
    }
    return this.currentContract.latestPaymentIntent.status=='requires_payment_method';
  }

  get userPayment() {
    const alias = this.currentContract.paymentAlias;
    return new UserCard(this.user.payments.find(payment => payment.alias == alias) || {})
  }

  get openContracts() {
    return this.contracts.filter(contract => {
      // ✅ Contrats actifs
      if (contract.status === 'active') {
        return true;
      }

      // ✅ Contrats incomplete nécessitant une action utilisateur
      // - requires_action : 3D Secure à confirmer
      // - requires_payment_method : Carte invalide/expirée à remplacer
      if (contract.status === 'incomplete' && contract.latestPaymentIntent) {
        const needsAction = ['requires_action', 'requires_payment_method'].includes(
          contract.latestPaymentIntent.status
        );
        return needsAction;
      }

      return false;
    });
  }

  // ✅ NOUVEAU : Getters pour l'interface moderne d'erreurs
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

  ngOnDestroy(){
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
      // /store/artamis/home/me/subscription?contracts=${contract.id}&${errorInfo.urlParam}
    });

    //
    // set the stripe key
    if (this.config.shared && this.config.shared.keys) {
      this.$stripe.setKey(this.config.shared.keys.pubStripe);
    }

    if(!this.user ||!this.user.payments) {
      return;
    }

    //
    // keep user updated
    this.$user.user$.subscribe(user => {
      this.payments = user.payments.filter(payment => payment.issuer!="invoice");
    })

  }

  getContractAction(contract){
    //
    // invoice
    if (!contract.latestPaymentIntent){
      return this.i18n[this.locale].subtitle_subscription_action;
    }

    // //
    // // pending requires_payment_method
    // if(contract.latestPaymentIntent.status=='requires_payment_method'){
    //   return this.i18n[this.locale].subtitle_subscription_update_method_action;
    // }

    // //
    // // pending requires_payment_method
    // if(contract.latestPaymentIntent.status=='requires_action'){
    //   return this.i18n[this.locale].subtitle_subscription_confirm_method_action;
    // }

    // active
    return this.i18n[this.locale].subtitle_subscription_action;

  }

  getContractDescription(contract){

    return this.getDayOfWeek(contract.dayOfWeek)+ ' ' + this.getFrequency(contract);

    // //
    // // contract is active even if the latest payment failed
    // const active = contract.status=='active';
    // //
    // // without payment intent, contract is ready
    // if (active){
    //   return this.getDayOfWeek(contract.dayOfWeek)+ ' ' + this.getFrequency(contract);
    // }

    // //
    // // pending requires_payment_method
    // if(!contract.latestPaymentIntent||
    //     contract.latestPaymentIntent.status=='requires_payment_method'){
    //   return this.i18n[this.locale].subtitle_subscription_update_method;
    // }

    // //
    // // pending requires_payment_method
    // if(contract.latestPaymentIntent.status=='requires_action'){
    //   return this.i18n[this.locale].subtitle_subscription_confirm_method;
    // }

    //   //
    //   // special case of patreon
    //   if(contract.patreon && contract.patreon.length) {
    //     return this.i18n[this.locale].subtitle_subscription_premium;
    //   }

  }

  getFrequency(contract) {
    return this.$i18n.label()[contract.frequency];
  }

  getDayOfWeek(idx){
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

  /**
   * ✅ NOUVEAU : Détermine le niveau d'urgence selon l'action et la raison
   */
  getErrorUrgency(action: string, reason: string): 'high' | 'medium' | 'low' {
    if (action === 'authenticate' || action === 'replace' || action === 'setup') {
      return 'high';
    }
    if (action === 'update' && reason === 'declined') {
      return 'high';
    }
    return 'medium';
  }

  /**
   * ✅ NOUVEAU : Obtient l'icône appropriée selon le type d'erreur
   */
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
    const llabel = this.i18n[this.locale];
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

  //
  async onConfirmPaymentIntent() {
    try{
      const intent = this.currentContract.latestPaymentIntent;
      const intentOpt: any = {
        payment_method: intent.source
      };

      this.isRunning = true;
      this.error = null;

      const result = await this.$stripe.confirmCardPayment(intent.client_secret, intentOpt).toPromise();
      if (result.error) {
        //
        // Show error to our customer (e.g., insufficient funds)
        this.error = result.error.message;
        this.isRunning = false;
        return;
      }
      // The payment must be confirmed for an order
      this.currentContract = await this.$cart.subscriptionPaymentConfirm(this.currentContract.id,result.paymentIntent).toPromise();

    }catch(err) {
      this.error = err.error||err.message;
    }finally{
      this.isRunning = false;
    }

  }

  async onUpdatePaymenMethod(payment:PaymentEvent) {
    // Contract use customer default payment method
    // try {
    //   this.isRunning = true;
    //   this.error = null;
    //   const res:any = await this.$cart.subscriptionUpdatePayment(this.currentContract.id, payment.card.id, null).toPromise();
    //   Object.assign(this.currentContract,res.contract);
    // } catch(err) {
    //   this.error = err.error || err.message;
    // } finally {
    //   this.isRunning = false;
    // }
  }

  onOpen(params){
    const contractId = params['contract'];
    if(!contractId||this.currentContract?.id === contractId) {
      return;
    }

    // ✅ NOUVEAU : Parser tous les paramètres d'erreur modernes
    const action = params['action'];
    const reason = params['reason'];
    const intent = params['intent'];

    // ✅ Réinitialiser l'erreur précédente
    this.paymentError = null;
    this.paymentErrorFromUrl = {};

    // ✅ NOUVEAU : Créer l'objet d'erreur moderne si paramètres présents
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

      // ✅ Maintenir la compatibilité avec l'ancien système
      this.paymentErrorFromUrl = { action, reason, message: this.paymentError.message };
    }

    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) {
      return;
    }

    // ✅ FALLBACK : Détecter automatiquement l'erreur depuis le contrat si pas d'URL params
    if (!this.paymentError && contract.latestPaymentIntent) {
      const status = contract.latestPaymentIntent.status;
      let autoAction: string | null = null;
      let autoReason: string | null = null;

      // Mapper les status PaymentIntent vers action/reason
      if (status === 'requires_action') {
        autoAction = 'authenticate';
        autoReason = '3ds';
      } else if (status === 'requires_payment_method') {
        autoAction = 'replace';
        autoReason = 'invalid_method';
      }

      // Créer l'erreur auto-détectée
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
    this.currentContract=contract;
    if (this.currentContract) {
      this.selPaymentAlias = this.currentContract.paymentAlias;
    }
  }

  // onSubAdd(item: CartItem, variant?: string) {
  //   this.$cart.subscriptionUpdate(item, this.currentContract.id);
  // }

  onSubRemove(item: CartItem, variant?: string) {
    if(item.quantity == 0) {
      return;
    }
    item.quantity--;
    item['updated']=true;
  }

  onSubRemoveAll(item: CartItem, variant?: string) {
    item.quantity=0;
    item['updated']=true;
    item.deleted=true;
  }

  onAddItemToCart() {
    if(!this.currentContract) {
      return;
    }

    // ✅ Fallback vers config.shared.hub.slug si items est vide (contrat shipping-only)
    const hub = this.currentContract.items?.[0]?.hub || this.config.shared.hub.slug;
    const plan = (this.currentContract.plan)?('&plan='+this.currentContract.plan):'';
    const url = `/store/${hub}/home/subscription?view=subscription&id=${this.currentContract.id}${plan}`;
    this.$router.navigateByUrl(url);
  }

  onPause(to:Date) {
    this.error =null;
    this.$cart.subscriptionPause(this.currentContract,to).subscribe(done=> {
      this.currentContract=done
    },status => {
      this.error=status.error;
    });

  }

  onDelete(){
    this.error =null;
    this.$cart.subscriptionCancel(this.currentContract).subscribe(done=> {
      this.onClose();
    },status => {
      this.error=status.error;
    });
  }
  onClose(res?){
    document.body.classList.remove('mdc-dialog-scroll-lock');
    this.currentContract = res||null;
    this.paymentErrorFromUrl = null;
    this.$router.navigate([], {
      relativeTo: this.route,
      queryParams: { contract: null, action: null, reason: null, intent: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  /**
   * ✅ NOUVEAU : Callback après mise à jour réussie des items de souscription
   */
  onSubscriptionItemUpdated(updatedContract: CartSubscription) {
    // Rafraîchir la liste complète des contrats
    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contracts = contracts;
      // Mettre à jour le contrat courant
      this.currentContract = contracts.find(c => c.id === updatedContract.id) || updatedContract;
    });
  }

  /**
   * ✅ NOUVEAU : Callback en cas d'erreur de mise à jour des items
   */
  onSubscriptionItemError(error: any) {
    this.error = error.error || error.message || 'Erreur lors de la mise à jour des articles';
    console.error('Subscription item update error:', error);
  }
}
