import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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

  @Output() open: EventEmitter<string> = new EventEmitter<string>();

  user: User;
  config: Config;
  categories: Category[];

  photos = [];
  urlpath: string;
  error: string;
  vendor: Shop = new Shop();
  products: Product[];
  selections: Product[];

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
    this.selections = [];

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

      Object.assign(this.vendor, vendor);

      if (vendor.photo && vendor.photo.fg) {
        this.ngStyleBck = {
          'background-image': this.bgGradient
        };
      }

      this.products = products.sort((a, b) => {
        return b.stats.score - a.stats.score;
      }).slice(0, this.LIMITED_PRODUCTS);
      this.selections = this.products.filter(product => product.attributes.home);

    }, error => {
      this.error = error.error;
    });


    //
    // FIXME remove ugly hack
    setTimeout(() => {
      try {window.scroll(0, 0); } catch (e) {}
    }, 100);
  }


  doOpen(shop){
    this.open.emit(shop);
  }

  //
  // Ensure the URL is clean and always has a protocol (https://) for links
  getValidUrl(url: string): string {
    if (!url) { return ''; }
    if(/^https?:\/\//i.test(url)) {
      return url;
    }
    return 'https://' + url;
  }

  //
  // Ensure the URL is clean and always without protocol for display
  getDisplayUrl(url: string): string {
    if (!url) { return ''; }
    return url.replace(/^https?:\/\//i, '');
  }

  getCleanPhone(phone: string) {
    if (!phone) { return ''; }
    return  phone.replace(/[\.;-]/g, '');
  }

  getStaticMap(address) {
    return KngUtils.getStaticMap(address, '400x200');
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
  group={};

  ngOnInit(){
    this.ngStyleBck = {};
    this.shops = [];
    super.ngOnInit();
    if(this.urlpath) {
      return;
    }

    document.title = this.config.shared.hub.name;
    try {window.scroll(0, 0); } catch (e) {}

    this.$shop.query({active:true,hub:this.$navigation.store}).subscribe(shops=>{
      this.shops = shops.filter(shop => shop.status).sort(this.sortByName.bind(this));
      this.shops.forEach(shop => {
        let letter = shop.name.toLowerCase().replace(/[èéëê]/gi,'E').toUpperCase()[0];
        letter = letter.replace(/[CDEFG]/, 'C...G').replace(/[PQRSTUVXYZ]/, 'P...Z').replace(/[HIJKLMNO]/, 'H...O').replace(/[1-9]/, '1..9');
        this.group[letter]=this.group[letter]||[];
        this.group[letter].push(shop);

        shop['ngStyleBck'] = {
          'background-image': 'url(' + shop.photo.fg + '/-/resize/64x/fb.jpg)',
          'background-repeat': 'no-repeat',
          'background-size': 'cover'
        }

        shop['img'] = shop.photo.fg + '/-/resize/400x/fb.jpg';

      });
    });
  }

  get groupByName() {
    return Object.keys(this.group).sort();
  }

  sortByName(a,b) {
    return a.name.localeCompare(b.name);
  }

  loadOneShop(){
  }
}
