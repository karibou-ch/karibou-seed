import { Component, OnInit } from '@angular/core';
import { i18n, KngNavigationStateService } from '../common';
import { ActivatedRoute } from '@angular/router';
import { CartService, Product, ProductService } from 'kng2-core';

@Component({
  selector: 'app-kng-root',
  templateUrl: './kng-root.component.html',
  styleUrls: ['./kng-root.component.scss']
})
export class KngRootComponent implements OnInit {

  config: any;
  currentShippingDay: Date;
  selected: Product[];
  lockedHUB:boolean;
  static SCROLL_CACHE = 0;

  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    public $product: ProductService,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
  ) {
    const loader = this.$route.snapshot.parent.data['loader'] || this.$route.snapshot.data['loader'];
    this.config = loader[0];

    this.currentShippingDay = new Date();
    this.selected = [];
  }


  get locale() {
    return this.$i18n.locale;
  }
  
  ngOnInit() {
    this.$route.params.subscribe(params => {
      this.$navigation.store = this.store = params['store'];
      this.lockedHUB = !!this.config.shared.hub.domainOrigin;

      //
      // Load products Selection
      this.loadProducts();
    });

    //
    // FIXME check ugly hack !!
    try {window.scroll(0, 0); } catch (e) {}

    setTimeout(() => {
      document.body.scrollTop = 0;
      //document.body.scrollTop = KngRootComponent.SCROLL_CACHE;
    }, 100);

  }  

  ngAfterViewChecked() {
  }

  isAppReady() {
    return this.$navigation.store !== undefined;
  }

  //
  // quick load of selected products
  async loadProducts() {
    if(!this.config.shared.mailchimp){
      return;
    }
    this.selected = [];
    const selected = this.config.shared.mailchimp[this.store].map(media=>media.sku);    
    const products = await (this.$product.select({skus:selected}).toPromise());
    for(const product of products.slice(0,8)){
      this.selected.push(product);
    }  
    return this.selected;
  }


  getImage(product){
    return product.photo.url + '/-/resize/300x/';
  }

  doOpenMarket(slug) {
    KngRootComponent.SCROLL_CACHE = 0;
  }

  doOpenShop(shop) {
    console.log('---- on scroll',KngRootComponent.SCROLL_CACHE)
    KngRootComponent.SCROLL_CACHE = document.body.scrollTop;
  }

  set store(name) {
    this.$navigation.store = name;
  }

  get store() {
    return this.$navigation.store;
  }

}
