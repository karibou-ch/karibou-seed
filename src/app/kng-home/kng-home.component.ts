import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  HostListener,
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
  Shop,
  Order,
  Hub,
  CalendarService,
  AssistantService
} from 'kng2-core';
import { Subscription } from 'rxjs';
import { AudioNoteType, i18n, KngNavigationStateService } from '../common';

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
  isLoading: boolean = false;
  isMobile: boolean = false;


  shops: Shop[];
  pendingOrders: Order[];
  config: Config;
  categories: Category[];
  availableCategories = {};
  cached: any = {};
  products: Product[];
  user: User;
  subscription: Subscription;
  categorySlug: string;
  displaySlug: string;
  scrollDirection:number;
  scrollLocked:boolean;

  //
  // search
  availableSearch:boolean;
  autocompletes:any;

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
      maxcat: 7,
      _home: true,
      popular: true,
      showMore: true
    }
  };

  // ✅ Audio context pour messages
  audioContext: {
    type: string;
    audioUrl: string;
    transcription: string;
    cartUrl?: string;
  } | null = null;


  //
  // products for home
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
    theme?:string;
  } = {
      showMore: true,
      available: true,
      status: true,
      when: true
    };


  constructor(
    public $cart: CartService,
    public $i18n: i18n,
    private $cdr: ChangeDetectorRef,
    private $loader: LoaderService,
    private $metric: MetricsService,
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $router: Router,
    private $calendar: CalendarService,
    private $assistant: AssistantService
  ) {
    // bind infinite scroll callback function
    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config, user, categories, orders } = this.$loader.getLatestCoreData();
    this.isReady = false;
    this.config = config;
    this.user = user;
    this.categories = categories || [];
    this.subscription = new Subscription();

    this.products = [];

    //
    // default home target (home, delicacy, cellar)
    this.shops = [];

    this.availableSearch = false;

    // ✅ FIXED: Utiliser orders de getLatestCoreData
    this.pendingOrders = orders || [];
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    window.scroll(0, 0);
    // this.subscription.add(
    //   this.$route.queryParams.subscribe(query => {
    // }));


    // this.subscription.add(
    //   this.$navigation.search$().subscribe((keyword)=>{
    //     if(keyword == 'favoris'||keyword == 'discount') {
    //       return;
    //     }

    //     if(keyword == 'clear') {
    //       return;
    //     }
    //     if(keyword.indexOf('stats:')>-1) {
    //       return;
    //     }
    //     this.doSearch(keyword);
    //   })
    // );


    this.subscription.add(this.$loader.update().subscribe(emit => {
      this.isMobile = this.$navigation.isMobileOrTablet();

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

      //
      // wait cart init or new date is SAVED
      if(!emit.state) {
        return;
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
      // CART_SHIPPING   =10,
      this.productsGroupByCategory(emit);
      this.$cdr.detectChanges();

    }));

    //
    // update title based on HUB instance
    if (this.config.shared.hub && this.config.shared.hub.name) {
      const site = this.config.shared.hub.siteName[this.locale];
      const tag =  this.config.shared.hub.tagLine.t[this.locale];
      const hub = this.config.shared.hub.slug;
      document.title = site + ' - ' + tag;
      //
      // publish metrics
      const metric ={
        path:window.location.pathname,
        title: 'Home',
        action:'home',
        hub
      }
      this.$metric.event(EnumMetrics.metric_view_page,metric);
    }

    if(this.$navigation.isMobileOrTablet()) {
      this.bgGradient = this.bgGradientXS;
    }
  }


  get currentShippingDay() {
    // ✅ MIGRATION: Utiliser CalendarService au lieu d'Order
    return this.$cart.getCurrentShippingDay() || this.$calendar.nextShippingDay(this.config.shared.hub, this.user);
  }

  get store(){
    return this.$navigation.store;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.$i18n.label();
  }

  get isLockedHUB() {
    return this.$navigation.isLocked();
  }

  get isThemas() {
    return this.hub.pageOptions.themas;
  }

  get isMinimal() {
    return this.hub.pageOptions.minimal;
  }

  get isJamesAvailable() {
    if(!this.user) {
      return false
    }

    if(this.user.isAdmin() || this.user.isAuthenticated()) {
      return true;
    }
    if(!this.user.plan) {
      return false
    }

    if(['shareholder','team'].indexOf(this.user.plan.name)>-1 ){
      return true;
    }
    return false;
  }

  get isAuthencated() {
    return this.user.isAuthenticated();
  }
  get isB2BSchool() {
    return this.user.plan.name == 'b2b-school';
  }

  get hub():Hub{
    return this.config.shared.hub ||{};
  }

  get subPatreon() {
    return this.config.shared.patreon || {};
  }
  get subB2b() {
    return this.config.shared.business || {};
  }

  get subCustomer() {
    return this.config.shared.subscription || {};
  }

  get sortedGroups() {
    return this.categories.sort(this.sortByWeight).filter(c => {
      return (c.active) &&
             (c.type === 'Group');
    });
  }

  get sortedCategories() {

    if (this.cached.categories && this.cached.categories.length) {
      return this.cached.categories;
    }

    // Filter categories for group HOME
    return this.cached.categories = this.categories.sort(this.sortByWeight).filter(c => {
      return (c.active) &&
             (c.type === 'Category') &&
             this.availableCategories[c.name];
    });
  }

  get userRouterLink() {
    const target = this.user.isAuthenticated()? 'orders':'login';
    return ['/store',this.store,'home','me',target];
  }

  get theme() {
    return this.$navigation.currentTheme;
  }

  get themes() {
    if(!this.categories) {
      return [];
    }
    return this.categories.filter(c => c.type === 'theme');
  }

  //
  // FIXME: remove this and use hub.pageOptions.maxcat
  get useMaxcat() {
    return !this.availableSearch && !this.options.theme;
  }

  //
  // FIXME: remove this and use hub.pageOptions.themas


  get tagline() {
    if (!this.config || !this.config.shared.tagLine) {
      return {};
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name && shared.hub.domainOrigin) ? hub.tagLine : shared.tagLine;

  }

  add(product: Product) {
    this.$cart.add(product);
  }


  clearCategory() {
    this.categories.forEach(cat=> this.availableCategories[cat.name] = false);
    this.cached.categories = [];
  }

  doSearch(link){
    this.$navigation.searchAction(link);
  }

  doSearch_NEW(value: string) {
    const tokens = value.split(' ').map(val => (val || '').length);

    if (tokens.some(len => len <= 3)) {
      return;
    }

    //
    // on search open window
    const options = {
      when: this.currentShippingDay.toISOString(),
      hub: this.config.shared.hub && this.config.shared.hub.slug
    };
    this.availableSearch = true;
    this.isLoading = true;
    this.products = [];
    this.$product.search(value, options).subscribe(products => {
      if(products['autocompletes']) {
        this.autocompletes = products['autocompletes'];
        return;
      }
      if(products['error']) {
        return;
      }


      this.clearCategory();
      this.$navigation.searchAction('stats:'+products.length);
      this.products = products.filter(product => product.categories && product.categories.name).sort(this.sortByScore);
      products.forEach((product: Product) => {
        this.availableCategories[product.categories.name] = true;
      });
      this.isReady = true;
      this.isLoading = false;

      this.$cdr.markForCheck();
    });
  }

  doPreferred(discountOnly?:boolean) {
    const options: any = {
      discount: true,
      status: true,
      available: true,
      when : this.$cart.getCurrentShippingDay().toISOString()
    };

    if(!discountOnly) {
      options.popular=true;
    }
    //
    // case of multihub
    if (this.config && this.config.shared.hub) {
      options.hub = this.config.shared.hub.slug;
    }
    this.isLoading = true;
    //
    // filter by group of categories
    this.$product.select(options).subscribe((products: Product[]) => {
      this.clearCategory();

      this.products = products.filter(product => product.categories && product.categories.name).sort(this.sortByScore);
      products.forEach((product: Product) => {
        this.availableCategories[product.categories.name] = true;
      });
      this.isReady = true;
      this.isLoading = false;

      this.$cdr.markForCheck();

    });

  }

  getCategoryI18n(cat){
    const key = 'category_name_'+cat.slug.replace(/-/g,'_');
    return this.label[key] || cat.name;
  }

  mountOverlay(overlay) {
    if (overlay) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }


  productsGroupByCategory(emit) {

    const state = emit.state && emit.state.action;
      // ITEM_ADD       = 1,
      // ITEM_REMOVE    = 2,
      // ITEM_MAX       = 3,
      // CART_INIT      = 4,
      // CART_LOADED    = 5,
      // CART_LOAD_ERROR= 6,
      // CART_SAVE_ERROR= 7,
      // CART_ADDRESS   = 8,
      // CART_PAYMENT   = 9,
      // CART_SHIPPING   =10,

    // If there are already products loaded and no specific state is provided,
    // or if the state is in the list of states that do not require reloading products, return early
    const states = ['ITEM_ADD','ITEM_REMOVE','ITEM_MAX','CART_ADDRESS','CART_PAYMENT'];
    if(this.products.length && !state ||
       this.products.length && states.indexOf(state)>-1) {
      return;
    }
    console.log('----init load products on',state,this.products.length);

    if(this.isLoading){
      return;
    }

    this.availableSearch = false;

    //
    // update shipping day, or cart loading
    // FIXME issue 2x CART_LOADED  (using isLoading to fix it )!!
    // if ([CartAction.CART_SHIPPING,CartAction.CART_LOADED].indexOf(state)==-1 ) {
    //   return;
    // }
    this.isLoading = true;

    //
    // with new navigation, we dont need to load products on mobile/tablet
    //
    this.clearCategory();
    if(this.isMobile &&
      !this.isMinimal) {
      this.isReady = true;
      this.isLoading = false;
      // this.hub.categories.forEach(cat=> this.availableCategories[cat.name] = true);
      this.categories.forEach(cat=> this.availableCategories[cat.name] = (this.hub.categories.indexOf(cat._id)>-1||!this.hub.categories.length));
      return;
    }



    const options = Object.assign({}, this.options, this.pageOptions.home);
    options.when = this.currentShippingDay.toISOString();
    options.maxcat = this.isMobile? 5:options.maxcat;
    options.hub = this.$navigation.store;


    if(this.options.theme) {
      delete options.when;
      delete options.available;
      delete options.status;
    }

    options.popular = this.isMinimal? false :options.popular;

    this.$product.select(options).subscribe((products: Product[]) => {
      this.products = products.filter(product => product.categories && product.categories.name);
      this.products.forEach((product: Product) => {
        this.availableCategories[product.categories.name] = product.categories;
      });
      this.isReady = true;
      this.isLoading = false;
    });

  }

  onSetCurrentShippingDay({day, time}){
    if(!day){
      return;
    }
    // ✅ MIGRATION: Utiliser CalendarService au lieu de config (FIXME résolu)
    const hours = time || this.$calendar.getDefaultTimeByDay(day, this.config.shared.hub);

    this.$cart.setShippingDay(day,hours);
  }
  //
  // catch click on innerHtml and apply navigate() behavior
  @HostListener('click', ['$event'])
  onClick($event): boolean {
    const target = $event.target as HTMLElement;
    const href = target.getAttribute('href');
    //
    // verify if it's a routerLink
    if(href && href.length > 2 &&
      (href.indexOf('http') === -1&&href.indexOf('mailto:') === -1&&href.indexOf('tel:') === -1)) {
      $event.stopPropagation();
      $event.preventDefault();
      this.$router.navigateByUrl(href);
      return false;
    }
  }

  onAssistantClick($event) {
    console.log('----assistant click',$event);
  }

  onFavorites(){
    this.$navigation.searchAction('favoris');
  }


  onAudioStopAndSave(ctx: {type: string, audioUrl: string, transcription: string, cartUrl?: string}) {
    // prepare context to send message
    this.audioContext = {
      type: ctx.type,
      audioUrl: ctx.audioUrl,
      transcription: ctx.transcription,
      cartUrl: ctx.cartUrl
    }
  }

  onSendAudioNote() {
    if (!this.audioContext) return;

    // ✅ Utiliser AssistantService.message avec contexte audio intégré dans content
    const content = `${this.audioContext.transcription || 'Message audio sans transcription'}

Audio: ${this.audioContext.audioUrl}
${this.audioContext.cartUrl ? `Panier: ${this.audioContext.cartUrl}` : ''}`;

    this.$assistant.message(content, 'Message audio support').subscribe(
      (response) => {
        console.log('✅ Message audio envoyé:', response);
        // Reset context
        this.audioContext = null;
      },
      (error) => {
        console.error('❌ Erreur envoi message audio:', error);
      }
    );
  }

  onAudioError($event) {
    console.log('----audio error',$event);
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


  scrollToSlug(slug: string) {
    this.categorySlug = slug;
    this.displaySlug = slug;
    setTimeout(()=> {
      this.scrollDirection = 0;
      this.$router.navigate(['/store', this.$navigation.store,'home', 'category',slug]);
    },500);
  }

  sortByScore(a, b) {
    return b.stats.score - a.stats.score;
  }

  sortByWeight(a: Category, b: Category) {
    return a.weight - b.weight;
  }
}
