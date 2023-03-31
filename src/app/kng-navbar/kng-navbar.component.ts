import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CartService,
  CartAction,
  Config,
  ConfigMenu,
  User,
  Category,
  Shop,
  Order,
  LoaderService
} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { MdcSnackbar, MdcTopAppBarSection } from '@angular-mdc/web';

import { Subscription, timer } from 'rxjs';
import { formatDate } from '@angular/common';


@Component({
  selector: 'kng-navbar',
  templateUrl: './kng-navbar.component.html',
  styleUrls: ['./kng-navbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngNavbarComponent implements OnInit, OnDestroy {


  //
  // howto
  // 1. https://stackoverflow.com/questions/38209713/how-to-make-a-responsive-nav-bar-using-angular-material-2

  config: Config;
  user: User;
  categories: Category[];
  shops: Shop[];
  orders: Order[];
  private route$: any;

  //
  // content
  currentTab: number;
  store: string;
  primary: ConfigMenu[];
  topmenu: ConfigMenu[];
  Kimage: string;
  hubTitle: string;
  hubImage: string;
  hubPhone: string;
  content: any;
  cgAccepted: boolean;
  cardItemsSz = 0;
  cartItemCountElem = 0;
  currentShippingDay: Date;
  isFixed = true;
  displayIosInstall: boolean;
  subscription : Subscription;
  scrollDirection = 0;
  //
  // FIXME remove code repeat
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  isReady: boolean;




  constructor(
    public $cart: CartService,
    public $i18n: i18n,
    private $route: ActivatedRoute,
    private $router: Router,
    private $loader: LoaderService,
    public $navigation: KngNavigationStateService,
    private $snack: MdcSnackbar,
    private $cdr: ChangeDetectorRef,
  ) {

    let loader = this.$route.snapshot.data.loader;
    if (loader[0].length) {
      loader = loader[0];
    }

    this.config = <Config>loader[0];
    this.user = <User>loader[1];


    //
    // not mandatory
    this.categories = <Category[]>loader[2] || [];
    this.shops = <Shop[]>loader[3] || [];

    this.orders = [];

    //
    // use latest orders
    if(loader.length>3) {
      this.orders = <Order[]>loader[4];
    }

    // console.log('')
    this.primary = [];
    this.topmenu = [];

    // K. image
    this.Kimage = '/assets/img/k-puce-light.png';

    this.subscription = new Subscription();
    this.isReady = false;
  }


  ngOnDestroy() {
    // FIXME, better to use declarative pipe(takeUntil(destroyed$))
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.subscription.add(
      this.$navigation.registerScrollEvent().subscribe(scrollDirection => {
        this.scrollDirection = scrollDirection;
        this.$cdr.markForCheck();
      })  
    )

    this.detectIOS();

    // FIXME mdc-tab activation is BUGGY, this is an alternate version
    // TODO needs dynamic DEPARTEMENT feature
    if (this.$route.snapshot.children.length &&
        this.$route.snapshot.children[0].url.length) {
      const departement = this.$route.snapshot.children[0].url[0].path;
      this.currentTab = this.primary.findIndex(el => el.url.indexOf(departement) > -1);
      //if (this.currentTab == -1) this.currentTab = this.primary.length;
    }

    this.subscription.add(
      this.$loader.update().subscribe(emit=> {

        //
        // update config
        if (emit.config) {
          this.store = this.$navigation.store;

          Object.assign(this.config, emit.config);
          // HUB title
          this.hubTitle = this.config.shared.hub.siteName[this.locale];
          this.hubPhone = this.config.shared.hub.address.phone;
  
          this.primary = this.config.shared.menu.filter(menu => menu.group === 'primary' && menu.active).sort((a, b) => a.weight - b.weight);
          this.topmenu = this.config.shared.menu.filter(menu => menu.group === 'topmenu' && menu.active).sort((a, b) => a.weight - b.weight);
      
          this.currentRanks = this.config.shared.currentRanks[this.store] || {};
          this.currentLimit = this.config.shared.hub.currentLimit || 1000;
          this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
          this.hubImage = this.config.shared.hub.logo;
    
          this.$cart.setContext(this.config, this.user,this.shops,this.orders);
          this.$cdr.markForCheck();
        }

        //
        // update user
        if (emit.user) {
          this.user = this.user || {} as User;
          Object.assign(this.user, emit.user);
          window['sentry.id'] = this.user.email.address;
          //
          // FIXME avoid multiple update of same value 
          this.$cart.setContext(this.config, this.user,this.shops,this.orders);
          this.$cdr.markForCheck();
          this.currentShippingDay = this.$cart.getCurrentShippingDay();
        }
  
        // FIXME use appropriate place to setup $cart
        if(emit.orders && !this.orders.length) {
          this.orders = emit.orders;
          this.$cart.setContext(this.config, this.user,this.shops,this.orders);        
        }
  
        //
        // update cart
        if (emit.state) {
          this.cardItemsSz = 0;
          this.cartItemCountElem = 0;
          this.currentShippingDay = this.$cart.getCurrentShippingDay();
          //
          // update cart for all market (hub)
          (this.config.shared||[]).hubs.forEach(hub => {
            this.cardItemsSz = parseFloat ((this.cardItemsSz + this.$cart.subTotal(hub.slug)).toFixed(2));
            this.cartItemCountElem += this.$cart.getItems().filter(item=> item.hub == hub.slug).length;
          });
  

          this.updateDomPrice();
  
          //
          // update shipping date
          if (!emit.state.item) {
            this.isReady = true;
            return;
          }
  
          if(this.isReady){
            if (emit.state.action === CartAction.ITEM_MAX) {
              this.$snack.open(
                this.$i18n.label()[CartAction[emit.state.action]],
                this.$i18n.label().thanks,
                this.$i18n.snackOpt
              );
            }else{
              this.$snack.open(
                // tslint:disable-next-line: max-line-length
                this.$i18n.label()[CartAction[emit.state.action]] + emit.state.item.quantity + 'x ' + emit.state.item.title + ' (' + emit.state.item.part + ')',
                this.$i18n.label().thanks,
                this.$i18n.snackOpt
              );  
            }
  
          }
          this.isReady = true;
        }
      })  
    );
  }

  detectIOS() {
    window.addEventListener('beforeinstallprompt', (deferredPrompt) => {
      // (<any>deferredPrompt).prompt();
      console.log('PWA browser prompt', deferredPrompt);
    });

    // Detects if device is on iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test( userAgent ) ;
    };

    // Detects if device is in standalone mode
    const isInStandaloneMode = () => ('standalone' in (window as any).navigator) && ((window as any).navigator.standalone);
    if (isIos() && !isInStandaloneMode() && Math.random() > .85) {
      this.displayIosInstall =  true;
      timer(5000).subscribe(() => {
        this.displayIosInstall =  false;
        this.$cdr.markForCheck();
      });
      this.$cdr.markForCheck();

    }
  }

  getMenuItems(group: string) {
    return this.$navigation.getMenuItems(group);
  }


  getTagline(key) {
    if (!this.config || !this.config.shared.tagLine[key]) {
      return '';
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name) ? hub.tagLine[key][this.$i18n.locale] : shared.tagLine[key][this.$i18n.locale];

  }

  getRouterLink(url) {
    return ['/store', this.store].concat(url.split('/').filter(item => item !== ''));
  }

  get locale() {
    return this.$i18n.locale;
  }

  gtShippingDateFormat() {
    //
    // check window delivery
    if (!this.isDayAvailable(this.currentShippingDay)) {
      return this.$i18n[this.locale].nav_no_shipping;
    }
    if(!this.isOpen()) {
      return this.$i18n[this.locale].nav_closed;
    }
    const title = formatDate(this.currentShippingDay, 'EEEE d ', this.locale);
    return title.charAt(0).toUpperCase() + title.slice(1);
  }


  isLockedHUB() {
    return this.$navigation.isLocked();
  }

  isAppReady() {
    return this.$navigation.store !== undefined;
  }

  // FIXME, scheduler should be in API
  isDayAvailable(day: Date) {
    if(!day){
      return false;
    }

    const maxLimit = this.user.isPremium() ? (this.currentLimit + this.premiumLimit) : this.currentLimit;
    return (this.currentRanks[day.getDay()] <= maxLimit);
  }

  isOpen() {
    const next = Order.nextShippingDay(this.user);

    return !!next;
  }


  onLang($event, lang) {
    this.$i18n.locale = lang;
    console.log('---- changed locale',lang)
  }

  updateDomPrice(){
    timer(100).subscribe(() => {
      //
      // top & bottom bar
      (<Element>(document.querySelector('.cart-items-count') || {})).innerHTML = '' + this.cardItemsSz + ' fr';
      (<Element>(document.querySelector('.cart-items-count-mobile') || {})).innerHTML = '' + this.cartItemCountElem;
    });

  }

  setShippingDay(value: any) {
    this.$cart.setShippingDay(value.day);
    this.currentShippingDay = this.$cart.getCurrentShippingDay();
    this.$cdr.markForCheck();
  }

  openCalendar(marketplace: any, check?: boolean) {
    // if not mobile then route to HOME
    if (check) {
      if (!this.$navigation.isMobile() ) {
        return this.$router.navigate(['/store',this.store,'home']);
      }
    }

    marketplace.open = true;

  }
}
