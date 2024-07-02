import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartSubscription, Config, Order, ProductService, User, UserCard, UserService } from 'kng2-core';
import { StripeService } from 'ngx-stripe';
import { i18n } from 'src/app/common';
import { PaymentEvent } from '../kng-payment/kng-user-payment.component';

@Component({
  selector: 'kng-subsciption-control',
  templateUrl: './kng-subsciption-control.component.html',
  styleUrls: ['./kng-subsciption-control.component.scss']
})
export class KngSubsciptionControlComponent implements OnInit {

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
      subtitle_subscription_action:'Voir ou modifier votre abonnement',
      subtitle_subscription_items:'Vos articles',
      subtitle_subscription_service:'Vos services',
      subtitle_subscription_options:'Vos options',
      subtitle_subscription_gocart:'Modifier les articles'
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
      subtitle_subscription_action:'Voir ou modifier votre abonnement',
      subtitle_subscription_items:'Items',
      subtitle_subscription_service:'Services',
      subtitle_subscription_options:'Options',
      subtitle_subscription_gocart:'Edit subsctiption items'
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

  constructor(
    public $products: ProductService,
    public $cart: CartService,
    public $i18n: i18n,
    public $router: Router,
    public $user: UserService,
    public $stripe: StripeService
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

  ngOnDestroy(){
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  ngOnInit() {
    this.$cart.subscription$.subscribe(contracts => {
      this.contracts = contracts;
    });

    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contracts = contracts;
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

    //
    // without payment intent, contract is ready
    if (!contract.latestPaymentIntent){      
      return this.getDayOfWeek(contract.dayOfWeek)+ ' ' + this.getFrequency(contract);
    } 

    //
    // pending requires_payment_method
    if(contract.latestPaymentIntent.status=='requires_payment_method'){
      return this.i18n[this.locale].subtitle_subscription_update_method;
    }

    //
    // pending requires_payment_method
    if(contract.latestPaymentIntent.status=='requires_action'){
      return this.i18n[this.locale].subtitle_subscription_confirm_method;
    }

      //
      // special case of patreon
      if(contract.patreon && contract.patreon.length) {
        return this.i18n[this.locale].subtitle_subscription_premium;
      }

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
    try{      
      // on error
      if(payment.error) {
        this.error = payment.error;      
        return
      }
      const card = payment.card;
      const hub = this.currentContract.items[0].hub;
      this.isRunning = true;
      this.currentContract = await this.$cart.subscriptionUpdatePayment(hub,this.currentContract.id,card.id).toPromise();
    }catch(err) {
      this.error = err.error||err.message;
    }finally{
      this.isRunning = false;
    }

  }

  onOpen(contract){

    document.body.classList.add('mdc-dialog-scroll-lock');
    this.currentContract = contract;
  }

  onUpdateCart() {
    if(!this.currentContract) {
      return;
    }

    const hub = this.currentContract.items[0].hub;
    const plan = (this.currentContract.plan)?('&plan='+this.currentContract.plan):'';
    const url = `/store/${hub}/home/cart/default?view=subscription&id=${this.currentContract.id}${plan}`;
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
  }
}
