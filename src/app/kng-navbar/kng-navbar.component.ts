import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  CartService,
  CartAction,
  Config,
  ConfigMenu,
  ConfigService,
  LoaderService,
  User,
  UserService,
  Category,
  Shop
} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { MdcSnackbar, MdcMenu, MdcTopAppBarSection, MdcDialogRef, MDC_DIALOG_DATA, MdcDialog } from '@angular-mdc/web';

import { merge, timer } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { formatDate } from '@angular/common';

//
// Popup available shipping dates
@Component({
  templateUrl: 'kng-navbar.calendar.component.html',
  styleUrls: ['./kng-navbar.calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngCalendarForm {

  i18n: any = {};
  config: Config;
  currentShippingDay: Date;
  labelTime: string;
  isPremium: boolean;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  noshippingMsg: string;

  constructor(public dialogRef: MdcDialogRef<KngCalendarForm>,
    @Inject(MDC_DIALOG_DATA) public data: any) {
      this.i18n = data.i18n;
      this.config = data.config;
      this.noshippingMsg = data.noshippingMsg;
      this.currentShippingDay = data.currentShippingDay;
      this.isPremium = data.isPremium;
      // FIXME remove hardcoded shippingtimes[16]
      this.labelTime = this.config.shared.order.shippingtimes[16] || 'loading...';
      this.currentRanks = this.config.shared.order.currentRanks || {};
      this.currentLimit = this.config.shared.order.currentLimit || 1000;
      this.premiumLimit =  this.config.shared.order.premiumLimit || 0;
  }
  get locale() {
    return this.i18n.locale;
  }

  doSetCurrentShippingDay($event, day: Date, idx: number) {
    if (!this.isDayAvailable(day)) {
      return;
    }
    this.dialogRef.close(day);
  }

  isDayAvailable(day: Date) {
    const maxLimit = this.isPremium ? (this.currentLimit + this.premiumLimit) : this.currentLimit;
    return (this.currentRanks[day.getDay()] <= maxLimit);
  }

  getShippingText(day: Date) {
    if(!this.isDayAvailable(day)) {
      return this.i18n.label().nav_shipping_off;
    }
    return this.labelTime;
  }

  getShippingDays() {
    return this.config.getShippingDays();
  }

}


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
  image: string;
  title: string;
  subtitle: string;
  content: any;
  cgAccepted: boolean;
  noshippingMsg: string;
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
    private $user: UserService,
    public $navigation: KngNavigationStateService,
    private $dialog: MdcDialog,
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
    this.currentRanks = this.config.shared.order.currentRanks || {};
    this.currentLimit = this.config.shared.order.currentLimit || 1000;
    this.premiumLimit = this.config.shared.order.premiumLimit || 0;
    this.noshippingMsg = this.getNoShippingMessage();

  }


  ngOnDestroy() {
    // this.route$.unsubscribe();
    // this.$cart.unsubscribe();
    // this.$user.unsubscribe();
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    
    //
    // karibou.ch context is ready
    // this.$i18n.init(this.config.shared.i18n);
    this.$navigation.updateUser(this.user);
    this.$navigation.updateConfig(this.config);
    this.$navigation.updateCategory(this.categories);

    //
    // home.about|footer|shop|siteName|tagLine
    //  - p,h,image
    //    - fr,en
    this.image = this.config.shared.home.tagLine.image;
    this.title = this.config.shared.home.siteName[this.locale];
    this.primary = this.config.shared.menu.filter(menu => menu.group === 'primary' && menu.active).sort((a, b) => a.weight - b.weight);
    this.topmenu = this.config.shared.menu.filter(menu => menu.group === 'topmenu' && menu.active).sort((a, b) => a.weight - b.weight);
    this.store = this.$navigation.store;
    this.content = this.$navigation.dispatch(this.$route.snapshot.url, this.$route.snapshot.params);

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
        this.$navigation.updateUser(this.user);
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
    if (!this.config || !this.config.shared.home.tagLine[key]) {
      return '';
    }
    return this.config.shared.home.tagLine[key][this.locale];
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
    return formatDate(this.currentShippingDay, 'EEEE d ', this.locale);
  }

  getNoShippingMessage(label?: string) {
    label = label || 'nav_no_shipping';
    //
    // check window delivery
    if (!this.isDayAvailable(this.currentShippingDay)) {
      return this.$i18n[this.locale][label];
    }


    //
    // check manager message
    const noshipping = this.config.noShippingMessage().find(shipping => !!shipping.message);
    return noshipping && noshipping.message[this.locale];
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



  onLang($event, lang) {
    this.$i18n.locale = lang;
    // console.log('---- changed locale')
  }

  openCalendar(){
    const dialogRef = this.$dialog.open(KngCalendarForm,{
      data: {
        i18n: this.$i18n,
        config: this.config,
        isPremium: this.user.isPremium(),
        currentShippingDay: this.currentShippingDay,
        noshippingMsg: this.getNoShippingMessage('nav_no_shipping_long')
      }
    });

    dialogRef.afterClosed().subscribe((current: any) => {
      if (current === 'close') {
        return;
      }
      this.$cart.setShippingDay(current);
      this.currentShippingDay = this.$cart.getCurrentShippingDay();
      //
      // FIXME when using dropdown for shipping
      this.$cdr.markForCheck();
    });
  }
}
