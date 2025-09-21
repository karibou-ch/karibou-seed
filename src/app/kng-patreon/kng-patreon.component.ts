import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { i18n } from '../common/i18n.service';
import { Config, CartService, User, UserService, CartSubscription, LoaderService } from 'kng2-core';
import { KngNavigationStateService } from '../common/navigation.service';
import { EnumMetrics, MetricsService } from '../common/metrics.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from 'ngx-stripe';

@Component({
  selector: 'kng-patreon',
  templateUrl: './kng-patreon.component.html',
  styleUrls: ['./kng-patreon.component.scss']
})
export class KngPatreonComponent implements OnInit {


  isRunning = false;
  isReady = false;
  config: Config;
  user: User
  products = [];
  selectItem = null;
  payment = null;
  activeMenu = true;
  error:string;
  contract:CartSubscription;

  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    private $navigation: KngNavigationStateService,
    public $metric: MetricsService,
    public $router: Router,
    public $route: ActivatedRoute,
    public $user: UserService,
    private $stripe: StripeService,
    private $loader: LoaderService
  ) {


    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config, user } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.products =[];
    this.isRunning = false;

  }


  get store(){
    return this.hub && this.config.shared.hub.slug;
  }

  get hub(){
    return this.config && this.config.shared.hub;
  }

  get label() {
    return this.$i18n.label();
  }


  get locale() {
    return this.$i18n.locale;
  }

  get patreon() {
    return this.config.shared.patreon || {};
  }

  get contractIsActive() {
    return (this.contract && this.contract.patreon && this.contract.status!=='canceled')
  }
  get contractAmount() {
    if(!this.contract || !this.contract.patreon ) {
      return '';
    }
    return (this.contract.patreon[0].unit_amount/100).toFixed(2) +"fr / mois";
  }

  get selected_box(){
    if(!this.selectItem||!this.selectItem.default_price) {
      return "";
    }
    return (this.selectItem.default_price.unit_amount/100) +"fr / mois";
  }
  ngOnDestroy() {
    this.clean();
  }

  async ngOnInit() {
    this.$metric.event(EnumMetrics.metric_view_page,{});

    const products = await this.$cart.subscriptionGetPatreonProducts().toPromise();
    this.products = products.sort((a,b)=> a.default_price.unit_amount-b.default_price.unit_amount)
    this.isReady = true;
    this.selectItem = this.products[1];

    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contract = contracts.find(contract => contract.plan == 'patreon');
    });

    //
    // set the stripe key
    if (this.config.shared && this.config.shared.keys) {
      this.$stripe.setKey(this.config.shared.keys.pubStripe);
    }

    this.$user.user$.subscribe(user => {
      const payments = user.payments.filter(payment => payment.issuer!="invoice");
      if(!payments.length) {
        return;
      }
      this.payment = payments[0];
    })
  }

  ngAfterViewChecked() {
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');

  }

  clean() {
    this.isReady = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  confirmPaymenIntent(intent: any, contract) {
    const intentOpt: any = {
      payment_method: intent.source
    };

    this.isRunning = true;
    this.error = null;

    this.$stripe.confirmCardPayment(intent.client_secret, intentOpt).subscribe(async (result) => {
      if (result.error) {
        //
        // Show error to our customer (e.g., insufficient funds)
        this.error = result.error.message;
        this.isRunning = false;
        return;
      }
      // The payment must be confirmed for an order
      this.contract = await this.$cart.subscriptionPaymentConfirm(contract.id,result.paymentIntent).toPromise();
      this.isRunning = false;

      // if(target.subscription&& ['requires_capture', 'succeeded'].indexOf(result.paymentIntent.status) > -1) {
      //   this.doSubscriptionPaymentConfirm(target.subscription,result.paymentIntent);
      // }

    });
  }


  async onSubscribe($event){
    if(!this.payment) {
      this.$router.navigate(['../../me/login-or-patreon'],{ relativeTo: this.$route });
      return;
    }
    const options ={
      frequency:"month",
      payment:this.payment.alias,
      product:this.selectItem,
      plan:'premium',
      hub:this.store
    }
    try{
      this.error = null;
      this.isRunning = true;
      this.contract = await this.$cart.subscriptionCreatePatreon(options).toPromise();

      console.log('----',this.contract);

      //
      // confirm 3ds
      if(this.contract &&
        this.contract.latestPaymentIntent &&
        this.contract.latestPaymentIntent.status=='requires_action') {
        return await this.confirmPaymenIntent(this.contract.latestPaymentIntent, this.contract);
      }

    }catch(err) {


      this.error = err.message;
    }finally{
      this.isRunning = false;
    }

  }

  onClose(closedialog) {

    if(!this.activeMenu) {
      this.activeMenu = true;
      return
    }
    //
    // case of onboarding from ad clic
    const query = this.$route.snapshot.queryParams;
    const landing = query.source || query.fbclid;
    if(landing ||!this.$navigation.hasHistory) {
      return this.$router.navigate(['../../'], { relativeTo: this.$route });
    }
    this.$navigation.back();
  }

}
