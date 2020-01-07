import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService,
         CartAction,
         Config,
         ConfigMenu,
         ConfigService,
         LoaderService,
         User,
         UserService,
         Category,
         Shop } from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { MdcSnackbar, MdcMenu, MdcTopAppBarSection } from '@angular-mdc/web';

import { merge } from 'rxjs';
import { map } from 'rxjs/operators';



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
  beforeinstallprompt: any;
  subscription;
  @ViewChild('section', { static: true }) section: MdcTopAppBarSection;
  @ViewChild('shipping', { static: false }) shipping: MdcMenu;
  constructor(
    public  $cart: CartService,
    private $config: ConfigService,
    public  $i18n: i18n,
    private $loader: LoaderService,
    private $route: ActivatedRoute,
    private $user: UserService,
    public  $navigation: KngNavigationStateService,
    private $snack: MdcSnackbar,
    private cdr: ChangeDetectorRef,
  ) {

    let loader = this.$route.snapshot.data.loader;
    if (loader[0].length) {
      loader = loader[0];
    }

    this.config = <Config>loader[0];
    this.user = <User>loader[1];
    this.noshippingMsg = this.getNoShippingMessage();

    //
    // not mandatory
    this.categories = <Category[]>loader[2] || [];
    this.shops = <Shop[]>loader[3] || [];

    // console.log('')
    this.primary = [];
    this.topmenu = [];

    //
    // PWA Adding an Install button
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.beforeinstallprompt = event;
    });
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
    this.primary = this.config.shared.menu.filter(menu => menu.group === 'primary' && menu.active);
    this.topmenu = this.config.shared.menu.filter(menu => menu.group === 'topmenu' && menu.active);
    this.store = this.$navigation.store;
    this.content = this.$navigation.dispatch(this.$route.snapshot.url, this.$route.snapshot.params);
    //
    // init cart here because navbar is loaded on all pages
    this.$cart.setContext(this.config, this.user, this.shops);

    this.currentShippingDay = this.$cart.getCurrentShippingDay();


    this.subscription = merge(
      this.$user.user$.pipe(map(user => ({user: user}))),
      this.$config.config$.pipe(map(config => ({config: config}))),
      this.$cart.cart$.pipe(map(state => ({state: state})))
    ).subscribe((emit: any) => {

      //
      // update user
      if (emit.user) {
        Object.assign(this.user, emit.user);
        this.$navigation.updateUser(this.user);
        this.$cart.setContext(this.config, this.user);
        this.cdr.markForCheck();
      }
      //
      // update config
      if (emit.config) {
        Object.assign(this.config, emit.config);
        this.$navigation.updateConfig(this.config);
      }
      //
      // update cart
      if (emit.state) {
        // this.cardItemsSz=this.$cart.getItems().reduce((sum,item)=>{
        //   return sum+item.quantity;
        // },0);
        this.cardItemsSz = this.$cart.subTotal();
        //
        // FIXME hugly DOM manipulation for : CART ITEMS COUNT
        // Panier <span class="cart-items-count" [hidden]="!cardItemsSz">{{cardItemsSz}}</span>
        setTimeout(() => {
          //
          // top bar
          (<Element>(document.querySelector('.cart-items-count') || {})).innerHTML = '(' + this.cardItemsSz + ' fr)';
          //
          // tab bar
          this.cartItemCountElem = this.cartItemCountElem || this.section.elementRef.nativeElement.querySelector('.cart-items-count');
          if (this.cartItemCountElem) {
            this.cartItemCountElem.style.visibility = (this.cardItemsSz > 0) ? 'visible' : 'hidden';
            this.cartItemCountElem.innerHTML = '(' + this.cardItemsSz + ' fr)';
          }
        }, 100);

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

  doSetCurrentShippingDay($event: any, current: Date, idx: number) {
    this.$cart.setShippingDay(current);
    this.currentShippingDay = this.$cart.getCurrentShippingDay();

    //
    // FIXME when using dropdown for shipping
    // this.shipping.setSelectedIndex(idx);
    this.cdr.markForCheck();
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

  getShippingWeek() {
    return this.config.getShippingWeek();
  }

  getShippingDays() {
    // return this.config.potentialShippingWeek();
    return this.config.getShippingDays();
  }
  getNoShippingMessage() {
    const noshipping = this.config.noShippingMessage().find(shipping => !!shipping.message);
    return noshipping && noshipping.message;
  }

  // Install PWA app if available!
  installApp() {
    this.beforeinstallprompt.prompt();
  }

  isAppReady() {
    return this.$navigation.store !== undefined;
  }


  onLang($event, lang) {
    this.$i18n.locale = lang;
    // console.log('---- changed locale')
  }
}
