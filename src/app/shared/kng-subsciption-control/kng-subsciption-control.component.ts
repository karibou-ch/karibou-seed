import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CartService, CartSubscription, Order, ProductService, User, UserService } from 'kng2-core';
import { KngNavigationStateService, i18n } from 'src/app/common';

@Component({
  selector: 'kng-subsciption-control',
  templateUrl: './kng-subsciption-control.component.html',
  styleUrls: ['./kng-subsciption-control.component.scss']
})
export class KngSubsciptionControlComponent implements OnInit {

  i18n: any = {
    fr: {
      title_subscription:'Vos abonemments',
      subtitle_subscription:'Votre abonemment',
      subtitle_subscription_items:'Les articles',
      subtitle_subscription_service:'Les services',
      subtitle_subscription_options:'Les options'
    },
    en: {
      title_subscription:'Your subscriptions',
      subtitle_subscription:'Your subscription',
      subtitle_subscription_items:'Items',
      subtitle_subscription_service:'Services',
      subtitle_subscription_options:'Options'
    }
  };

  private _user:User;
  private _orders:Order[];

  contracts: CartSubscription[];
  currentContract:CartSubscription;
  until:Date;
  pauseUntil:Date;

  constructor(
    public $products: ProductService,
    public $cart: CartService,
    public  $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $user: UserService,
    private $cdr: ChangeDetectorRef
  ) {
    this._orders = [];
    this.contracts = [];
    this.$cart.subscriptionsGet().toPromise().then(contracts => this.contracts = contracts);
    console.log('---- DBG create contracts manager ',this.contracts);
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


  async ngOnInit() {
    this.$cart.subscription$.subscribe(contracts => this.contracts = contracts);
  }



  getDayOfWeek(idx){
    return this.label.weekdays.split('_')[idx];
  }

  onOpen(contract){
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    this.currentContract = contract;

  }

  onPause(to:Date) {
    this.$cart.subscriptionPause(this.currentContract,to).subscribe(done=> {
      this.currentContract=done
    });

  }

  onDelete(){
    this.$cart.subscriptionCancel(this.currentContract).subscribe(done=> {
      this.currentContract=null
    });
  }
  onClose(){
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    this.currentContract = null;
  }
}
