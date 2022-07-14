import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CartService,
  Category,
  Config,
  ProductService,
  Product,
  LoaderService,
  User,
  CartAction,
  PhotoService,
  Shop,
  Order
} from 'kng2-core';
import { i18n, KngNavigationStateService } from '../common';

import { EnumMetrics, MetricsService } from '../common/metrics.service';


@Component({
  selector: 'kng-home',
  templateUrl: './kng-home.component.html',
  styleUrls: ['./kng-home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // changeDetection:ChangeDetectionStrategy.OnPush
})
export class KngHomeComponent implements OnInit, OnDestroy {
  isReady: boolean = false;

  shops: Shop[];
  pendingOrders: Order[];
  config: Config;
  categories: Category[];
  cached: any = {};
  group: any = {};
  home: Product[] = [];
  products: Product[];
  target: string; // home, selection, wellness, cellar
  user: User;
  subscription;
  categorySlug: string;
  displaySlug: string;
  scrollDirection:number;

  //
  // gradient of background image
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.01),
    rgba(50, 50, 50, 0.1)
  ),`;

  bgGradientXS = `linear-gradient(
    rgba(250, 250, 250, 0.2),
    rgba(250, 250, 250, 0.8)
  ),`;

  //
  // page content by target
  pageOptions: any = {
    home: {
      maxcat: 8,
      home: true,
      popular: true,
      showMore: true
    },
    grocery: {
      maxcat: 8,
      home: true,
      popular: true,
      showMore: true
    },
    cellar: {
      maxcat: 8,
      home: true,
      popular: true,
      showMore: true
    },
    selection: {
      home: true,
      showMore: false
    },
    wellness: {
      maxcat: 8,
      popular: true,
      showMore: true
    }
  };

  //
  // products for home
  // /v1/products?available=true&discount=true&home=true&maxcat=8&popular=true&status=true&when=true
  options: {
    discount?: boolean;
    home?: boolean;
    popular?: boolean;
    maxcat?: number;
    available: boolean;
    status: boolean;
    when: Date | boolean;
    reload?: number;
    showMore: boolean;
  } = {
      showMore: true,
      available: true,
      status: true,
      when: true
    };


  constructor(
    public $cart: CartService,
    public $i18n: i18n,
    //private $routeCache:RouteReuseStrategy,
    //private $cdr: ChangeDetectorRef,
    private $loader: LoaderService,
    private $metric: MetricsService,
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $router: Router
  ) {
    // bind infinite scroll callback function
    const loader = this.$route.snapshot.parent.data['loader'] || this.$route.snapshot.data['loader'];
    this.isReady = false;
    this.config = loader[0];
    this.user = loader[1];
    this.categories = loader[2] || [];

    this.products = [];

    //
    // default home target (home, delicacy, cellar)
    this.target = this.$route.snapshot.url.length && this.$route.snapshot.url[0].path || 'home';
    this.shops = [];

    this.pendingOrders = [];
    if(loader.length>3) {
      this.pendingOrders = <Order[]>loader[4];
    }    
    // this.$photo.shops({ active: true, random: 1 }).subscribe((shops: any) => {
    //   //
    //   // deploy random shop picture for outside javascript
    //   this.homePhoto = shops[0].photo.fg;
    // });
  }

  ngOnDestroy() {
    if(this.subscription) {
      this.subscription.unsubscribe();  
    }
  }

  ngOnInit() {
    window.scroll(0, 0);

    this.subscription = this.$loader.update().subscribe(emit => {

      // emit signal for order
      if(emit.orders) {
        this.pendingOrders = emit.orders;
      }

      // emit signal for config
      if (emit.config) {
      }

      // emit signal for user
      if (emit.user) {
        // force reload product list (avoid cache between anonymous and user transition)
        this.options.reload = emit.user.isAuthenticated() ? 1 : 0;
        this.user = Object.assign(this.user,emit.user);
        // (<CacheRouteReuseStrategy>this.$routeCache).clearCache();
        // console.log('---- clear cache',this.user.id)
        // this.$cdr.markForCheck();
      }

      // emit signal for CartAction[state]
      // ITEM_ADD       = 1,
      // ITEM_REMOVE    = 2,
      // ITEM_MAX       = 3,
      // CART_INIT      = 4,
      // CART_LOADED    = 5,
      // CART_LOAD_ERROR= 6,
      // CART_SAVE_ERROR= 7,
      // CART_ADDRESS   = 8,
      // CART_PAYMENT   = 9,
      // CART_SHPPING   =10,
      if (!emit.state) {
        return;
      }
      //console.log('---DBG',emit.state.action==CartAction.CART_LOADED,emit);

      //
      // update shipping day
      if (CartAction.CART_SHPPING === emit.state.action) {
        // this.options.when = this.$cart.getCurrentShippingDay();
        this.productsGroupByCategory();
      }

      //
      // FIXME issue 2x CART_LOADED !!
      if (([CartAction.CART_LOADED].indexOf(emit.state.action) > -1 || !Object.keys(this.group).length)) {
        // this.options.when = this.$cart.getCurrentShippingDay();
        this.productsGroupByCategory();
      }
    });

    //
    // update title based on HUB instance
    if (this.config.shared.hub && this.config.shared.hub.name) {
      const site = this.config.shared.hub.siteName[this.locale];
      const tag =  this.config.shared.hub.tagLine.t[this.locale];
      const hub = this.config.shared.hub.slug;
      const source = this.$route.snapshot.queryParamMap.get('target')||
                     this.$route.snapshot.queryParamMap.get('ad') ||
                     this.$route.snapshot.queryParamMap.get('umt_source')
      document.title = site + ' - ' + tag;
      //
      // publish metrics
      const metric ={
        path:window.location.pathname,
        title: 'Home',
        action:'home',
        hub,
        source
      }
      this.$metric.event(EnumMetrics.metric_view_page,metric);
    }

    if(this.$navigation.isMobileOrTablet()) {
      this.bgGradient = this.bgGradientXS;
    }
  }

  get store(){
    return this.$navigation.store;
  }

  get locale() {
    return this.$i18n.locale;
  }

  add(product: Product) {
    this.$cart.add(product);
  }

  searchAction(link){
    this.$navigation.searchAction(link);    
  }

  getCategories() {
    if (this.cached.categories) {
      return this.cached.categories;
    }

    if (!this.isReady) {
      return [];
    }

    return this.cached.categories = this.categories.sort(this.sortByWeight).filter(c => {
      return (c.active) && 
             (c.type === 'Category') &&
             (c.group.toLocaleLowerCase() === this.target) &&
             (this.group[c.name]);
    });
  }



  //
  // HUB information
  getContentStyle(target: string) {
    target = (target || this.target).toLowerCase();
    const content = this.config.shared.hub.home.content.find(c => c.target === target);
    // {'background-image': 'url(' + getStaticMap(edit.address) + ')'}
    if (!content || !content.image) {
      return {};
    }

    const bgStyle = 'url(' + content.image + ')';
    return { 'background-image': this.bgGradient + bgStyle };
  }


  //
  // HUB information
  getContent(elem: string, target: string) {
    target = (target || this.target).toLowerCase();
    try {
      const content = this.config.shared.hub.home.content.find(c => c.target === target);
      return content[elem][this.$i18n.locale];
    } catch (err) {
      return '';
    }
  }

  hasBackgroundContent(target: string) {
    target = (target || this.target).toLowerCase();
    const content = this.config.shared.hub.home.content.find(c => c.target === target);
    return (content && !!content.image);
  }

  hasContent(elem: string, target: string) {
    target = (target || this.target).toLowerCase();
    try {
      const content = this.config.shared.hub.home.content.find(c => c.target === target);
      const value = content[elem][this.$i18n.locale];
      return value !== '' && (!!value);
    } catch (err) {
      return false;
    }

  }

  mountOverlay(overlay) {
    if (overlay) {
      document.body.classList.add('mdc-dialog-scroll-lock');
      document.documentElement.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
      document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    }
  }



  //
  // detect child overlay 
  @HostListener('window:popstate', ['$event'])
  onPopState($event) {
    setTimeout(() => {
      const overlay = document.querySelector('.product-dialog');
      this.mountOverlay(!!overlay);
    }, 400);
  }


  productsGroupByCategory() {
    const options = Object.assign({}, this.options, this.pageOptions[this.target], {group: this.target});
    this.options.showMore = options.showMore;
    this.options.when = this.$cart.getCurrentShippingDay();
    this.options.maxcat = this.$navigation.isMobile()? 3:8;

    // FIXME remove hardcoded constraint
    // if(this.target === 'selection') {
    //   delete options.group;
    // }

    const hub = this.$navigation.store;
    if (hub) {
      options.hub = hub;
    }


    const shops = {};
    this.$product.select(options).subscribe((products: Product[]) => {
      this.products = products;
      products.forEach((product: Product) => {        
        shops[product.vendor.urlpath] = product.vendor;
        this.group[product.categories.name] = true;
        if (product.attributes.home && !this.home.some(p => p.sku == product.sku)) {          
          this.home.push(product);
        }
      });
      this.shops = Object.keys(shops).map(slug => shops[slug]);
      this.home = this.home.slice(0, 20);
      this.isReady = true;
    });

  }

  scrollToSlug(slug: string) {
    this.categorySlug = slug;
    this.displaySlug = slug;
    this.$router.navigate(['/store', this.$navigation.store,(this.target || 'home'), 'category',slug]);
  }

  sortByWeight(a: Category, b: Category) {
    return a.weight - b.weight;
  }
}