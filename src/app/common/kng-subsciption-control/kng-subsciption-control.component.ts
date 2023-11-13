import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartSubscription, Config, Order, ProductService, User, UserService } from 'kng2-core';
import { KngNavigationStateService, i18n } from 'src/app/common';

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
      subtitle_subscription_start: 'Actif depuis',
      subtitle_subscription_pause:'Mettre en pause jusqu\'au ',
      subtitle_subscription_pause_action:'Activer la pause',
      subtitle_subscription_cancel:'Annuler votre abonnement',
      subtitle_subscription_end:'Votre abonnement est supprimé',
      subtitle_subscription_status:'Fréquence de votre abonnement :',
      subtitle_subscription_paused:'Votre abonnement reprendra le :',
      subtitle_subscription_update_method:'Votre méthode de paiement n\'est plus valable',
      subtitle_subscription_confirm_method:'Votre banque souhaite une confirmation',
      subtitle_subscription_action:'Voir ou modifier votre abonnement',
      subtitle_subscription_items:'Les articles',
      subtitle_subscription_service:'Les services',
      subtitle_subscription_options:'Les options',
      subtitle_subscription_gocart:'Modifier les articles'
    },
    en: {
      title_subscription:'Your subscriptions',
      subtitle_subscription:'Your subscription',
      subtitle_subscription_start: 'Active since',
      subtitle_subscription_pause:'Pause deliveries until',
      subtitle_subscription_pause_action:'Activate pause',
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

  contracts: CartSubscription[];
  currentContract:CartSubscription;
  until:Date;
  pauseUntil:Date;

  constructor(
    public $products: ProductService,
    public $cart: CartService,
    public $i18n: i18n,
    public $router: Router
  ) {
    this._orders = [];
    this.contracts = [];
    this.pauseUntil = this.until = new Date(Date.now()+3600000*24*6);
 
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

  ngOnDestroy(){
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }

  ngOnInit() {
    this.$cart.subscription$.subscribe(contracts => this.contracts = contracts);
  }

  getContractAction(contract){
    //
    // invoice
    if (!contract.latestPaymentIntent){
      return this.i18n[this.locale].subtitle_subscription_action;
    }

    //
    // pending requires_payment_method
    if(contract.latestPaymentIntent.status=='requires_payment_method'){
      return this.i18n[this.locale].subtitle_subscription_update_method_action;
    }

    //
    // pending requires_payment_method
    if(contract.latestPaymentIntent.status=='requires_action'){
      return this.i18n[this.locale].subtitle_subscription_confirm_method_action;
    }

    // active 
    return this.i18n[this.locale].subtitle_subscription_action;

  }

  getContractDescription(contract){

    //
    // invoice
    if (!contract.latestPaymentIntent){
      return this.i18n[this.locale].subtitle_subscription;
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

    // active 
    return this.i18n[this.locale].subtitle_subscription;

  }

  getDayOfWeek(idx){
    return this.label.weekdays.split('_')[idx];
  }

  getShippingTime(contract) {
    return this.config.shared.hub.shippingtimes[contract.shipping.hours];
  }

  onOpen(contract){
    //
    // pending requires_payment_method
    // pending requires_payment_method_confirm
    if(contract.latestPaymentIntent &&
      ['requires_payment_method','requires_action'].indexOf(contract.latestPaymentIntent.status)>-1){
      return this.$router.navigateByUrl('/store/artamis/home/cart/default?view=subscription&id='+contract.id);
    }


    document.documentElement.classList.add('mdc-dialog-scroll-lock');
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
    // if(business){
    // }else {
    //   this.$router.navigateByUrl('/store/artamis/home/subscription?id='+this.currentContract.id);
    // }
  }

  onPause(to:Date) {
    this.$cart.subscriptionPause(this.currentContract,to).subscribe(done=> {
      this.currentContract=done
    });

  }

  onDelete(){
    this.$cart.subscriptionCancel(this.currentContract).subscribe(done=> {
      this.onClose();
    });
  }
  onClose(res?){
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    this.currentContract = res||null;
  }
}
