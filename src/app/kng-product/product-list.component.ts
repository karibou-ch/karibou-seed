import { Component,
         OnInit,
         ViewChild,
         ElementRef,
         ViewEncapsulation,
         ChangeDetectionStrategy,
         ChangeDetectorRef,
         HostListener} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ProductService,
  Product,
  User,
  Category,
  Shop,
  CartService,
  CartSubscriptionParams,
  CartItemsContext,
  ShopService,
  Order,
  CartSubscription
} from 'kng2-core';

import { combineLatest, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { i18n, KngNavigationStateService, KngUtils } from '../common';
import { EnumMetrics, MetricsService } from '../common/metrics.service';

@Component({
  selector: 'kng-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  static SCROLL_CACHE = 0;

  @ViewChild('dialog', { static: true }) dialog: ElementRef;
  currentPage = 10;
  bgStyle = '/-/resize/200x/';

  isReady = false;
  config: any;
  products: Product[] = [];
  cache: {
    products: Product[];
  };

  password: string;
  user: User;
  category: {
    slug: string;
    categories: Category[];
    current: Category;
    similar: Category[];
  };
  vendor: Shop;
  vendors: Shop[];

  subcriptionParams:CartSubscriptionParams;
  showSubCategory:boolean;
  contracts:CartSubscription[];
  activeMenu: boolean;
  filterVendor: Shop;
  filterChild: string;
  childSub$;
  childMap: any;
  scrollDirection: number;
  scrollToCategory: string;
  scrollStickedToolbar: boolean;

  options: {
    hub?: string;
    available: boolean;
    status?: boolean;
    when: string|boolean;
    reload?: number;
    shopname?: string;
    subscription?: boolean;
    business?: boolean;
  };

  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    public $navigation: KngNavigationStateService,
    public $metric: MetricsService,
    public $shop: ShopService,
    public $product: ProductService,
    public $router: Router,
    public $route: ActivatedRoute,
    public cdr: ChangeDetectorRef
  ) {
    this.cache = {
      products: []
    };

    this.category = {
      slug: null,
      categories: [],
      current: null,
      similar: []
    };
    this.vendors = [];
    this.childMap = {};
    this.options = {
      available: true,
      status: true,
      when: true
    };

    const loader = this.$route.snapshot.parent.data.loader;
    this.config = loader[0];
    this.user = loader[1];
    this.category.categories = loader[2];
    this.activeMenu = true;
    this.getNextPage.bind(this);
    this.scrollDirection = 0;
    this.contracts = [];
    this.subcriptionParams = {
      activeForm:true,
      dayOfWeek:0,
      frequency:'week'
    }
    ProductListComponent.SCROLL_CACHE = 0;
  }

  get clientWidth() {
    if(!this.dialog || !this.dialog.nativeElement){
      return 0;
    }
    return this.dialog.nativeElement.children[1].clientWidth    
  }

  get store(){
    return this.hub && this.config.shared.hub.slug;
  }

  get hub(){
    return this.config && this.config.shared.hub;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.$i18n.label();
  }
  get label_souscription(){
    return this.subcriptionParams.activeForm? 
           this.$i18n[this.locale].subscription_status_on:this.$i18n[this.locale].subscription_status_off
  }


  get label_subscriptionInformations() {
    const type = this.isForSubscriptionCustomer?'subscription':(this.isForSubscriptionBusiness?'business':'');

    if(!type || !this.config.shared[type] ||!this.config.shared[type].article) {
      return '';
    }
    const article = this.config.shared[type].article[this.locale];
    return article;
  }  

  get isForSubscriptionList(){
    return this.$route.snapshot.data.subscription || this.$route.snapshot.data.business;
  }

  get isForSubscriptionCustomer(){
    return this.$route.snapshot.data.subscription;
  }

  get isForSubscriptionBusiness(){
    return this.$route.snapshot.data.business;
  }

  get subscriptionQueryParams() {
    const contractId = this.subscriptionId;
    const params:any = {view:'subscription'};
    if(this.isForSubscriptionBusiness) {
      params.plan='business'
    }
    if(contractId) {
      params.id=contractId;
    }    
    return params;
  }

  get activeSubscription(){
    if(!this.isForSubscriptionList || !this.subcriptionParams.activeForm) {
      return false;
    }
    return this.subcriptionParams.frequency;
  }

  set activeSubscription(value) {
    this.subcriptionParams.activeForm = !this.subcriptionParams.activeForm;
    this.$cart.subscriptionSetParams(this.subcriptionParams);
  }

  get subscriptionId() {
    return this.$route.snapshot.queryParams.id;
  }

  get subscriptionContract() {
    const id = this.subscriptionId;
    return this.contracts.find(contract=> contract.id == id);
  }


  get subscriptionAmount() {
    const ctx:CartItemsContext = {
      forSubscription:true,
      hub:this.store
    }    
    return this.$cart.subTotal(ctx).toFixed(2)
  }

  get cartAmount() {
    const ctx:CartItemsContext = {
      forSubscription:false,
      hub:this.store
    }    
    return this.$cart.subTotal(ctx).toFixed(2)
  }

  ngOnDestroy() {
    this.clean();
    if (this.childSub$) {
      this.childSub$.unsubscribe();
    }
  }

  async ngOnInit() {
    const category = this.$route.snapshot.params['category'];
    const shopname = this.$route.snapshot.params['shop'];



    //
    // list product available for subscription
    if(this.isForSubscriptionList) {
      this.isForSubscriptionCustomer && (this.options.subscription=true);
      this.isForSubscriptionBusiness && (this.options.business=true);
      this.category.current = this.category.categories[0];
      this.category.current.name =this.config.shared.subscription.t[this.locale];
      this.category.current.description =this.config.shared.subscription.h[this.locale];
      if(this.isForSubscriptionBusiness) {
        this.options.business = true;
        this.category.current.name =this.config.shared.business.t[this.locale];
        this.category.current.description =this.config.shared.business.h[this.locale];
      }
      this.category.current.child = [];

      //
      // FIXME UGLY STORAGE OF SUBS_PLAN (FOR SHARING WITH CART)
      window['subsplan'] = this.isForSubscriptionBusiness?'business':'customer';

      this.productsBySubscription();
    } 
    
    //
    // list product available from category
    else if(category){
      this.category.slug = category;
      this.category.current = this.category.categories.find(cat => cat.slug == category);
      //
      // old google reference goes wrong
      this.category.current.child = (this.category.current.child||[]).sort((a, b) => {
        return a.weight - b.weight;
      });

      this.category.similar = this.category.categories
      .filter(cat => cat.group === this.category.current.group && cat.slug !== category)
      .sort(cat => cat.weight);
      this.bgStyle = 'url(' + this.category.current.cover + ')';  
      this.productsByCategory(category);
    } 
    //
    // list product available from one shop
    else if(shopname){
      delete this.options.status;
      this.category.current = this.category.categories[0];
      this.category.current.child = this.category.current.child.sort((a, b) => {
        return a.weight - b.weight;
      });

      this.productsByShop(shopname);
    } 
    //
  
    //
    // publish metrics
    const metric ={
      path:window.location.pathname,
      hub:this.store,
      action:'home',
      title:document.title
    }
    this.$metric.event(EnumMetrics.metric_view_page,metric);

    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');
    this.isReady = true;
  }

  //
  // FIXME: when using cache route component
  // -> ngOnInit and ngOnDestroy are never called when app.cache.route is activated
  ngAfterViewChecked() {
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');

    if (!this.dialog || !this.dialog.nativeElement){
      return;
    }
    this.scrollStickedToolbar = this.dialog.nativeElement.scrollTop>40;
    const diff = Math.abs(this.dialog.nativeElement.scrollTop - ProductListComponent.SCROLL_CACHE);
    if(diff < 100) {
      return;
    }
    setTimeout(()=>{
      this.dialog.nativeElement.scrollTop = ProductListComponent.SCROLL_CACHE;
    },40);    
  }

  clean() {
    this.isReady = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }


  @HostListener('document:keyup.escape', ['$event'])
  keyEvent(event: KeyboardEvent) {
    this.onClose(this.dialog);
  }

  getDialog() {
    return this.dialog;
  }

  //
  // return a child category IFF a product is refers to it
  getChildCategory(category: Category) {
    if(this.isForSubscriptionList) {
      return (this.products.length)? (this.category.categories as Category[]):[];
    }
    const child = category.child || [];
    return child.filter(child => this.childMap[child.name]).sort((a,b) => a.weight - b.weight);
  }


  getNextPage() {
    this.currentPage += 10;
    this.cdr.markForCheck();
    return timer(1).pipe(map(ctx => this.currentPage));
  }

  getProducts() {
    return this.cache.products;
  }

  getVendorsClosed() {
    const available = this.getProducts().map(product => product.vendor.urlpath);
    return this.vendors.filter(vendor => available.indexOf(vendor.urlpath) === -1);
  }
  getVendors() {
    const available = this.getProducts().map(product => product.vendor.urlpath);
    return this.vendors.filter(vendor => available.indexOf(vendor.urlpath) !== -1);
  }
  getVisibility(j) {
    return (this.currentPage > j);
  }


  productsByShop(shopname) {
    //
    // update metrics

    this.options.hub = this.store;
    this.options.shopname = shopname;
    //this.options.when = this.$cart.getCurrentShippingDay() || Order.nextShippingDay(this.user,this.hub);
    //delete this.options.available;
    delete this.options.when;

    combineLatest([
      this.$shop.get(shopname),
      this.$product.select(this.options)
    ]).subscribe(([vendor, products]: [Shop, Product[]]) => {
      document.title = vendor.name;
      this.vendor = vendor;

      if (vendor.photo && vendor.photo.fg) {
        // this.ngStyleBck = {
        //   'background-image': this.bgGradient + 'url(' + vendor.photo.fg + '/-/resize/900x/fb.jpg)'
        // };
      }

      this.cache.products = this.products = products.sort(this.sortProducts);

      //
      // count child categories
      this.products.forEach(product => {
        if (!this.childMap[product.belong.name]) {
          this.childMap[product.belong.name] = 0;
        }
        this.childMap[product.belong.name]++;
      });
      
      this.cdr.markForCheck();
    });
  }


  productsBySubscription() {
    this.options.hub = this.store;
    delete this.options.when;
    this.$cart.subscriptionsGet().subscribe(contracts => this.contracts=contracts);
    this.subcriptionParams = this.$cart.subscriptionGetParams();

    this.$product.findByDetails('subscription', this.options).subscribe((products: Product[]) => {
      this.cache.products = this.products = products.sort(this.sortProducts);
      
      //
      // makes categories
      const categories = this.products.map(product => product.categories)
                                    .filter((item,pos,arr)=>   arr.findIndex(idx => idx.slug == item.slug)== pos);

      this.category.categories = this.category.categories.filter(cat => categories.find(c => c.slug==cat.slug));


      this.products.forEach(product => {
        if (!this.childMap[product.belong.name]) {
          this.childMap[product.belong.name] = 0;
        }
        this.childMap[product.belong.name]++;
      });
      //
      // set vendors after toggle of child category
      this.setVendors();
      this.cdr.markForCheck();
    });
  }

  productsByCategory(category) {
    const when = (this.$cart.getCurrentShippingDay()|| Order.nextShippingDay(this.user,this.hub)) as Date;
    this.options.hub = this.store;
    this.options.when = when.toISOString()

    this.$product.findByCategory(category, this.options).subscribe((products: Product[]) => {
      this.cache.products = this.products = products.sort(this.sortProducts);

      //
      // count child categories
      this.products.forEach(product => {
        if (!this.childMap[product.belong.name]) {
          this.childMap[product.belong.name] = 0;
        }
        this.childMap[product.belong.name]++;
      });

      //
      // set vendors after toggle of child category
      this.setVendors();
      this.cdr.markForCheck();
    });
  }


  setVendors() {
    this.products.forEach(product => map[product.vendor.urlpath] = product.vendor);
    this.vendors = Object.keys(map).map(key => map[key]);
  }

  toggleVendor(vendor: Shop) {
    if (this.filterVendor &&
        this.filterVendor.urlpath === vendor.urlpath) {
      return this.filterVendor = null;
    }
    this.filterVendor = vendor;
  }

  toggleChild(child: string) {
    this.filterChild = child;
  }

  onMOnbileShowMore(){
    this.showSubCategory=!this.showSubCategory;
  }

  onClose(closedialog) {
    // //
    // // case of onboarding from ad clic
    // const query = this.$route.snapshot.queryParams;
    // const landing = query.source || query.fbclid;
    // if(landing ||!this.$navigation.hasHistory) {
    //   return this.$router.navigate(['..'], { relativeTo: this.$route });
    // }
    // this.$navigation.back();
    if(!this.activeMenu) {
      this.activeMenu = true;
      return
    }
    this.clean();
    return this.$router.navigate(['..'], { relativeTo: this.$route });

  }

  //
  // detect scrall motion and hide component
  onScroll($event) {
    ProductListComponent.SCROLL_CACHE = this.dialog.nativeElement.scrollTop;
  }


  scrollTo($event, name) {
    this.scrollToCategory = name;
    this.filterChild = name;
    this.scrollDirection = 0;
    this.showSubCategory = false;    
    $event.stopPropagation();
    $event.preventDefault();    
  }

  //
  // sort products by:
  //  - belong.weight
  //  - stats.score
  //  - title
  sortProducts(a, b) {
    // sort : HighScore => LowScore
    // const score = b.stats.score - a.stats.score;
    // sort : Title
    const score = a.title.localeCompare(b.title);
    if (!a.belong || !a.belong) {
      return score;
    }

    // sort : LowWeight => HighWeight
    const belong = a.belong.weight - b.belong.weight;
    if (belong !== 0) {
      return belong;
    }

    return score;
  }


  trackerCategories(index, category: Category) {
    return category.slug;
  }

  trackerProducts(index, product: Product) {
    return product.sku;
  }

}


@Component({
  selector: 'kng-product-list-shop',
  templateUrl: './product-list-shop.component.html',
  styleUrls: ['./product-list-shop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngProductListByShopComponent extends ProductListComponent{
  @ViewChild('dialog', { static: true }) dialog: ElementRef;
  i18n: any = {
    fr: {
      map_title: 'Infos pratiques',
      faq: 'Retrouvez la liste des questions fréquentes (FAQ)',
      products_title: 'Nos produits',
      products_subtitle: ''
    },
    en: {
      map_title: 'Infos pratiques',
      faq: 'Frequently asked questions (FAQ)',
      products_title: 'Our products',
      products_subtitle: ''
    }
  };

  getStaticMap(address) {
    return KngUtils.getStaticMap(address, '400x200');
  }

  getCleanPhone(phone: string) {
    if (!phone) { return ''; }
    return  phone.replace(/[\.;-]/g, '');
  }


}