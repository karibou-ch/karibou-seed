import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { i18n, KngNavigationStateService } from '../common';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService, Order, Product, ProductService, User } from 'kng2-core';
import { LoaderService } from 'kng2-core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kng-root',
  templateUrl: './kng-root.component.html',
  styleUrls: ['./kng-root.component.scss']
})
export class KngRootComponent implements OnInit, OnDestroy {

  config: any;
  currentShippingDay: Date;
  selected: Product[];
  subscription:Subscription;
  orders: Order[];
  user: User;

  static SCROLL_CACHE = 0;

  i18n: any = {
    fr: {
      title_account_sign:'Identifiez-vous avec une session',
      title_account_mail:'Votre adresse mail',
      title_account_shipping:'Vos addresses de livraison',
      title_account_subscriptions:'Vos abonnements',
      title_orders:'Vos commandes',
      title_invoices_open:'Vos factures',
      title_invoice_paid:'Facture payée, en attente du virement bancaire',
    },
    en: {
      title_account_sign:'Sign in with a session',
      title_account_mail:'Your email address',
      title_account_shipping:'Your delivery addresses',
      title_account_subscriptions:'Your subscriptions',
      title_orders:'Your orders',
      title_invoices_open:'Your invoices',
      title_invoice_paid:'Invoice paid, waiting for Bank transfer',
    }
  };


  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    public $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
    private $router: Router,
  ) {
    const { config, user, orders } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.orders = orders || [];
    this.currentShippingDay = new Date();
    this.selected = [];
    this.subscription = new Subscription();
  }


  get locale() {
    return this.$i18n.locale;
  }

  set locale(value) {
    this.$i18n.locale = value;
  }
  get llabel() {
    return this.i18n[this.locale];
  }

  get label() {
    return this.$i18n.label();
  }

  get lockedHUB() {
    return this.$navigation.isLocked();
  }


  get store() {
    return this.$navigation.store;
  }


  get tagline() {
    if (!this.config || !this.config.shared.tagLine) {
      return {};
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name) ? hub.tagLine : shared.tagLine;
  }


  ngOnInit() {
    console.log('ngOnInit --> kng-root');
    this.subscription.add(
      this.$loader.update().subscribe(emit => {
      if (emit.state && emit.state.order){
        this.orders.unshift(emit.state.order);
      }

      // ✅ CORRECTION CRITIQUE: Écouter emit.user pour mise à jour après login
      if (emit.user) {
        this.user = emit.user;
      }

      if (!emit.config) {
        return
      }
      this.config = emit.config;
    }));


    setTimeout(() => {
      document.body.scrollTop = 0;
      //document.body.scrollTop = KngRootComponent.SCROLL_CACHE;
    }, 100);

  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewChecked() {
  }

  isAppReady() {
    return this.$navigation.store !== undefined;
  }

  //
  // quick load of selected products
  // DEPRECATED
  // async loadProducts() {
  //   if(!this.config.shared.mailchimp){
  //     return;
  //   }
  //   this.selected = [];
  //   const selected = this.config.shared.mailchimp[this.store].map(media=>media.sku);
  //   const products = await (this.$product.select({skus:selected}).toPromise());
  //   for(const product of products.slice(0,8)){
  //     this.selected.push(product);
  //   }
  //   return this.selected;
  // }


  getImage(product){
    return product.photo.url + '/-/resize/300x/';
  }

  doLocaleSwitch(){
    console.log('doLocaleSwitch');
    this.$i18n.localeSwitch();
  }


  doOpenMarket(hub) {
    KngRootComponent.SCROLL_CACHE = 0;
    this.$router.navigate(['/store',hub.slug,'home']);
  }

  doOpenShop(shop) {
    KngRootComponent.SCROLL_CACHE = document.body.scrollTop;
  }

}
