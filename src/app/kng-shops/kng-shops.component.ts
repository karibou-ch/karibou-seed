import { Component, OnInit } from '@angular/core';
import { i18n, KngNavigationStateService, KngUtils } from '../common';
import { Config, User, Shop, PhotoService, Product, ProductService, Category } from 'kng2-core';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from 'kng2-core';
import { combineLatest } from 'rxjs';


//
// layout example
// https://www.instacart.com/whole-foods/aisles/594-bread

@Component({
  selector: 'kng-shop',
  templateUrl: './kng-shop.component.html',
  styleUrls: ['./kng-shop.component.scss']
})
export class KngShopComponent implements OnInit {

  user: User;
  config: Config;
  categories: Category[];

  photos = [];
  urlpath: string;
  error: string;
  vendor: Shop = new Shop();
  products: Product[];
  LIMITED_PRODUCTS = 70;
  ngStyleBck: any;

//
  // generating dynamic background image url
  bgGradient = `linear-gradient(
    rgba(100, 100, 100, 0.05),
    rgba(0, 0, 0, 0.2)
  ),`;


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

  constructor(
    public $i18n: i18n,
    public $navigation: KngNavigationStateService,
    public $photo: PhotoService,
    public $shop: ShopService,
    public $product: ProductService,
    public $route: ActivatedRoute
  ) {
    const loader = this.$route.snapshot.data.loader;
    this.config = <Config>loader[0];
    this.user = <User>loader[1];
    this.categories = loader[2];

    this.urlpath = this.$route.snapshot.params.urlpath;
    this.products = [];
    this.ngStyleBck = {};
  }

  get store() {
    return this.$navigation.store;
  }

  ngOnDestroy() {
  }

  ngOnInit() {
    // this.$photo.shops({active:true,random:40}).subscribe((photos:any)=>{
    //   this.photos=photos.map(shop=>shop.photo.fg);
    // })
    if(!this.urlpath) {
      return;
    }

    const options = {
      available: true,
      shopname: this.urlpath
    };

    // TOCHECK
    // combineLatest is deprecated: Pass arguments in a single array instead `combineLatest([a, b, c])` (deprecation)tslint(1)
    combineLatest([
      this.$shop.get(this.urlpath),
      this.$product.select(options)
    ]).subscribe(([vendor, products]: [Shop, Product[]]) => {
      document.title = vendor.name;

      Object.assign(this.vendor, vendor);

      if (vendor.photo && vendor.photo.fg) {
        this.ngStyleBck = {
          'background-image': this.bgGradient + 'url(' + vendor.photo.fg + '/-/resize/900x/fb.jpg)'
        };
      }

      this.products = products.sort((a, b) => {
        return b.stats.score - a.stats.score;
      }).slice(0, this.LIMITED_PRODUCTS);
    }, error => {
      this.error = error.error;
    });    


    //
    // FIXME remove ugly hack
    setTimeout(() => {
      try {window.scroll(0, 0); } catch (e) {}
    }, 100);

  }

  getCleanPhone(phone: string) {
    if (!phone) { return ''; }
    return  phone.replace(/[\.;-]/g, '');
  }

  getStaticMap(address) {
    if (!this.config.shared || !this.config.shared.keys.pubMap) {
      return;
    }
    const pubMap = this.config.shared.keys.pubMap;
    return KngUtils.getStaticMap(address, pubMap, '400x200');
  }

  get locale() {
    return this.$i18n.locale;
  }
}


@Component({
  selector: 'kng-shops',
  templateUrl: './kng-shops.component.html',
  styleUrls: ['./kng-shops.component.scss']
})
export class KngShopsComponent extends KngShopComponent{

  ngStyleBck: any;
  shops: Shop[];

  ngOnInit(){
    this.ngStyleBck = {};
    this.shops = [];
    super.ngOnInit();
    if(this.urlpath) {
      return;
    }

    document.title = this.config.shared.hub.name;

    this.$shop.shops$.subscribe(shops => {
      this.shops = shops.filter(shop => shop.status).sort(this.sortByName.bind(this));
      this.shops.forEach(shop => {        
        shop['ngStyleBck'] = {
          'background-image': this.bgGradient + 'url(' + shop.photo.fg + '/-/resize/64x/fb.jpg)'
        }

        shop['img'] = shop.photo.fg + '/-/resize/400x/fb.jpg';

      });

    });
  }

  sortByName(a,b) {
    return a.name.localeCompare(b.name);
  }

  loadOneShop(){
  }
}