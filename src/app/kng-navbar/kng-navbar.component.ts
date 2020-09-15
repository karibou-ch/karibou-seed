import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CartService,
  CartAction,
  Config,
  ConfigMenu,
  ConfigService,
  User,
  UserService,
  Category,
  Shop,
  Order
} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { MdcSnackbar, MdcMenu, MdcTopAppBarSection, MdcDialogRef, MDC_DIALOG_DATA, MdcDialog } from '@angular-mdc/web';

import { merge, timer } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
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
  content: any;
  cgAccepted: boolean;
  cardItemsSz = 0;
  cartItemCountElem: any;
  currentShippingDay: Date;
  isFixed = true;
  displayIosInstall: boolean;
  subscription;

  //
  // FIXME remove code repeat
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;

  @ViewChild('section', { static: true }) section: MdcTopAppBarSection;
  constructor(
    public $cart: CartService,
    private $config: ConfigService,
    public $i18n: i18n,
    private $route: ActivatedRoute,
    private $router: Router,
    private $user: UserService,
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

    // console.log('')
    this.primary = [];
    this.topmenu = [];

    // FIXME remove code repeat
    const hub = this.config.shared.hub.slug;
    if (hub) {
      this.currentRanks = this.config.shared.currentRanks[hub] || {};
      this.currentLimit = this.config.shared.hub.currentLimit || 1000;
      this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
    }


  }


  ngOnDestroy() {
    // this.route$.unsubscribe();
    // this.$cart.unsubscribe();
    // this.$user.unsubscribe();
    this.subscription.unsubscribe();
  }

  ngOnInit() {

    // K. image
    this.Kimage = this.config.shared.tagLine.image;

    // HUB title
    this.hubTitle = this.config.shared.hub.siteName[this.locale];
    this.hubImage = this.config.shared.hub.siteName.image;

    this.primary = this.config.shared.menu.filter(menu => menu.group === 'primary' && menu.active).sort((a, b) => a.weight - b.weight);
    this.topmenu = this.config.shared.menu.filter(menu => menu.group === 'topmenu' && menu.active).sort((a, b) => a.weight - b.weight);

    this.store = this.$navigation.store;

    // FIXME mdc-tab activation is BUGGY, this is an alternate version
    // TODO needs dynamic DEPARTEMENT feature
    if (this.$route.snapshot.children.length &&
        this.$route.snapshot.children[0].url.length) {
      const departement = this.$route.snapshot.children[0].url[0].path;
      this.currentTab = this.primary.findIndex(el => el.url.indexOf(departement) > -1);
      //if (this.currentTab == -1) this.currentTab = this.primary.length;
    }

    //
    // init cart here because navbar is loaded on all pages
    this.$cart.setContext(this.config, this.user, this.shops);

    this.currentShippingDay = this.$cart.getCurrentShippingDay();


    this.subscription = merge(
      this.$user.user$.pipe(map(user => ({ user: user }))),
      this.$config.config$.pipe(map(config => ({ config: config }))),
      this.$cart.cart$.pipe(debounceTime(100), map(state => ({ state: state })))
    ).subscribe((emit: any) => {

      //
      // update user
      if (emit.user && this.user.id !== emit.user.id) {
        Object.assign(this.user, emit.user);
        this.$cart.setContext(this.config, this.user);
        this.$cdr.markForCheck();
        this.currentShippingDay = this.$cart.getCurrentShippingDay();
      }
      //
      // update config
      if (emit.config) {
        this.detectIOS();
        Object.assign(this.config, emit.config);
        this.$navigation.updateConfig(this.config);
      }
      //
      // update cart
      if (emit.state) {
        this.cardItemsSz = this.$cart.subTotal();
        timer(100).subscribe(() => {
          //
          // top bar
          (<Element>(document.querySelector('.cart-items-count') || {})).innerHTML = '' + this.cardItemsSz + ' fr';
          //
          // tab bar
          this.cartItemCountElem = this.cartItemCountElem || this.section.elementRef.nativeElement.querySelector('.cart-items-count');
          if (this.cartItemCountElem) {
            this.cartItemCountElem.innerHTML = '' + this.cardItemsSz + ' fr';
          }
        });

        //
        // update shipping date
        if (!emit.state.item) {
          return;
        }

        if (emit.state.action === CartAction.ITEM_MAX) {
          return this.$snack.open(
            this.$i18n.label()[CartAction[emit.state.action]],
            this.$i18n.label().thanks,
            this.$i18n.snackOpt
          );
        }

        this.$snack.open(
          // tslint:disable-next-line: max-line-length
          this.$i18n.label()[CartAction[emit.state.action]] + emit.state.item.quantity + 'x ' + emit.state.item.title + ' (' + emit.state.item.part + ')',
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
        );
      }
    });


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
    if (isIos() && !isInStandaloneMode() && Math.random() > .8) {
      this.displayIosInstall =  true;
      timer(10000).subscribe(() => {
        this.displayIosInstall =  false;
        this.$cdr.markForCheck();
      });
      this.$cdr.markForCheck();

    }
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

  isAppReady() {
    return this.$navigation.store !== undefined;
  }

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
    // console.log('---- changed locale')
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
        return this.$router.navigate(['/']);
      }
    }

    marketplace.open = true;

  }
}
