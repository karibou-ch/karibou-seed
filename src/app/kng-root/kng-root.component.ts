import { Component, Input, OnInit } from '@angular/core';
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
export class KngRootComponent implements OnInit {

  config: any;
  currentShippingDay: Date;
  selected: Product[];
  subscription:Subscription;
  orders: Order[];
  user: User;

  static SCROLL_CACHE = 0;

  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    public $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
    private $router: Router,
  ) {
    const loader = this.$route.snapshot.parent.data['loader'] || this.$route.snapshot.data['loader'];
    this.config = loader[0];
    this.user = loader[1];
    this.orders = loader[4] || [];
    this.currentShippingDay = new Date();
    this.selected = [];
    this.subscription = new Subscription();
  }


  get locale() {
    return this.$i18n.locale;
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

  set store(name) {
    this.$navigation.store = name;
  }


  
  ngOnInit() {
    this.subscription.add(
      this.$route.params.subscribe(params => {
      this.store = params['store'];
    }));

    this.subscription.add(
      this.$loader.update().subscribe(emit => {
      if (!emit.config) {
        return
      }
      this.config = emit.config;
      this.store = this.config.shared.hub.slug;
    }));

    //
    // FIXME check ugly hack !!
    try {window.scroll(0, 0); } catch (e) {}

    setTimeout(() => {
      document.body.scrollTop = 0;
      //document.body.scrollTop = KngRootComponent.SCROLL_CACHE;
    }, 100);

  }  
  ngDestroy() {
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

  doOpenMarket(hub) {
    KngRootComponent.SCROLL_CACHE = 0;
    this.$router.navigate(['/store',hub.slug,'home']);
  }

  doOpenShop(shop) {
    KngRootComponent.SCROLL_CACHE = document.body.scrollTop;
  }
 
}
