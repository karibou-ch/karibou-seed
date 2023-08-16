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
  CartAction,
  ShopService,
  CartSubscriptionContext,
  Order
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

  activeSubscription:boolean = false;
  showSubCategory:boolean;
  filterVendor: Shop;
  filterChild: string;
  childSub$;
  childMap: any;
  scrollDirection: number;
  scrollToCategory: string;

  options: {
    hub?: string;
    available: boolean;
    status?: boolean;
    when: Date|boolean;
    reload?: number;
    shopname?: string;
    subscription?: boolean;
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
    this.getNextPage.bind(this);
    this.scrollDirection = 0;
    ProductListComponent.SCROLL_CACHE = 0;
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

  get label_souscription(){
    return this.activeSubscription? 
           this.$i18n[this.locale].subscription_status_on:this.$i18n[this.locale].subscription_status_off
  }

  ngOnDestroy() {
    this.clean();
    if (this.childSub$) {
      this.childSub$.unsubscribe();
    }
  }

  ngOnInit() {
    this.isReady = true;

    this.childSub$ = this.$cart.cart$.subscribe(state => {
      if(!state.action){
        return;
      }

      const context = this.$cart.getCartSubscriptionContext();
      this.activeSubscription = context.active;
      this.cdr.markForCheck();
    });

    //
    // list product available for subscription
    if(this.$route.snapshot.data.subscription) {
      this.options.subscription  = true;
      this.category.current = this.category.categories[0];
      this.category.current.name =this.config.shared.subscription.t[this.locale];
      this.category.current.description =this.config.shared.subscription.h[this.locale];
      this.category.current.child = [];
      this.productsBySubscription();

    } 
    //
    // list product available from category
    else if(this.$route.snapshot.params['category']){
      this.category.slug = this.$route.snapshot.params['category'];
      this.category.current = this.category.categories.find(cat => cat.slug === this.category.slug);
      //
      // old google reference goes wrong
      this.category.current.child = (this.category.current.child||[]).sort((a, b) => {
        return a.weight - b.weight;
      });

      this.category.similar = this.category.categories
      .filter(cat => cat.group === this.category.current.group && cat.slug !== this.category.slug)
      .sort(cat => cat.weight);
      this.bgStyle = 'url(' + this.category.current.cover + ')';  
      this.productsByCategory();
    } 
    //
    // list product available from one shop
    else if(this.$route.snapshot.params['shop']){
      delete this.options.status;
      this.options.shopname  = this.$route.snapshot.params['shop'];
      this.category.current = this.category.categories[0];
      this.category.current.child = this.category.current.child.sort((a, b) => {
        return a.weight - b.weight;
      });

      this.productsByShop();
    } 
    //
    // this should not happends
    else {
      this.isReady = false;
    }
    
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
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
  }

  //
  // FIXME: when using cache route component
  // -> ngOnInit and ngOnDestroy are never called when app.cache.route is activated
  ngAfterViewChecked() {
    if (!this.dialog || !this.dialog.nativeElement){
      return;
    }
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
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
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
    if(this.options.subscription) {
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


  productsByShop() {
    //
    // update metrics

    this.options.hub = this.store;
    //this.options.when = this.$cart.getCurrentShippingDay() || Order.nextShippingDay(this.user,this.hub);
    //delete this.options.available;
    delete this.options.when;

    combineLatest([
      this.$shop.get(this.options.shopname),
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

    this.$product.findByDetails('subscription', this.options).subscribe((products: Product[]) => {
      this.products = products.sort(this.sortProducts);



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

  productsByCategory() {
    this.options.hub = this.store;
    this.options.when = this.$cart.getCurrentShippingDay()|| Order.nextShippingDay(this.user,this.hub);

    this.$product.findByCategory(this.category.slug, this.options).subscribe((products: Product[]) => {
      this.products = products.sort(this.sortProducts);

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
    this.cache.products = this.products;
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

  toggleSubscription() {
    const active = this.activeSubscription = !this.activeSubscription;
    const context = {active} as CartSubscriptionContext
    this.$cart.setCartSubscriptionContext(context);
  }

  onMOnbileShowMore(){
    this.showSubCategory=!this.showSubCategory;
  }

  onClose(closedialog) {
    this.clean();
    //
    // case of onboarding from ad clic
    const query = this.$route.snapshot.queryParams;
    const landing = query.source || query.fbclid;
    if(landing ||!this.$navigation.hasHistory) {
      return this.$router.navigate(['../../'], { relativeTo: this.$route });
    }
    this.$navigation.back();
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
    if (!this.config.shared || !this.config.shared.keys.pubMap) {
      return;
    }
    const pubMap = this.config.shared.keys.pubMap;
    return KngUtils.getStaticMap(address, pubMap, '400x200');
  }

  getCleanPhone(phone: string) {
    if (!phone) { return ''; }
    return  phone.replace(/[\.;-]/g, '');
  }


}