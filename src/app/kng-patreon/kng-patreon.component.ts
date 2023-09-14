import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { i18n } from '../common/i18n.service';
import { Config, CartService, User, UserService } from 'kng2-core';
import { KngNavigationStateService } from '../common/navigation.service';
import { EnumMetrics, MetricsService } from '../common/metrics.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'kng-patreon',
  templateUrl: './kng-patreon.component.html',
  styleUrls: ['./kng-patreon.component.scss']
})
export class KngPatreonComponent implements OnInit {


  isReady = false;
  config: Config;
  user: User
  products = [];
  selectItem = null;
  payment = null;
  activeMenu = true;

  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    public $user: UserService,
    private $navigation: KngNavigationStateService,
    public $metric: MetricsService,
    public $router: Router,
    public $route: ActivatedRoute,
    public cdr: ChangeDetectorRef
  ) {


    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
    this.user = loader[1];
    this.products =[];
  }


  get store(){
    return this.hub && this.config.shared.hub.slug;
  }

  get hub(){
    return this.config && this.config.shared.hub;
  }

  get labell() {
    return this.$i18n.label();
  }


  get locale() {
    return this.$i18n.locale;
  }

  get patreon() {
    return this.config.shared.patreon || {};
  }

  get selected_box(){
    if(!this.selectItem||!this.selectItem.default_price) {
      return "";
    }
    return (this.selectItem.default_price.unit_amount/100) +"fr / mois";
  }

  async ngOnInit() {
    this.$metric.event(EnumMetrics.metric_view_page,{});
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');

    const products = await this.$cart.subscriptionGetPatreonProducts().toPromise();
    this.products = products.sort((a,b)=> a.default_price.unit_amount-b.default_price.unit_amount)
    this.isReady = true;

    this.$user.user$.subscribe(user => {
      const payments = user.payments.filter(payment => payment.issuer!="invoice");
      if(!payments.length) {
        return;
      }
      console.log('--- update user',user.id, payments);
      this.payment = payments[0];
    })
  }


  clean() {
    this.isReady = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }  
  async onSubscribe($event){
    const subscribe = this.$cart.subscriptionCreatePatreon("month",this.payment,this.selectItem).toPromise();
    console.log('----',subscribe);

  }

  onClose(closedialog) {
    this.clean();
    //
    // case of onboarding from ad clic
    const query = this.$route.snapshot.queryParams;
    const landing = query.source || query.fbclid;
    if(landing ||!this.$navigation.hasHistory) {
      return this.$router.navigate(['../'], { relativeTo: this.$route });
    }
    this.$navigation.back();
  }

}
