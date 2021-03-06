import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import {
  Category,
  CartService,
  ProductService,
  Product,
  User,
  CartItem,
} from 'kng2-core';
import { i18n, KngNavigationStateService, KngUtils } from '../common';

import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

//  changeDetection:ChangeDetectionStrategy.OnPush
@Component({
  selector: 'kng-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductComponent implements OnInit, OnDestroy {
  static WEEK_1: number = 86400 * 7;

  @Input() sku: number;
  @Input() config: any;
  @Input() categories: Category[];
  @Input() selected: boolean;
  @Input() user: User = new User();

  @ViewChild('dialog', { static: true }) dialog: ElementRef;

  isRedirect: boolean;
  isReady: boolean;
  isDialog = false;
  product: Product = new Product();
  products: Product[];
  category: Category;
  thumbnail = false;
  bgStyle: any;
  photosz: string;
  cartItem: CartItem;

  departement = 'home';

  isHighlighted: boolean;
  WaitText = false;
  rootProductPath: string;

  //
  // scroll
  currentPage = 1;
  scrollCallback;

  //
  // variant
  openVariant: boolean;


  //
  // products for home
  // /v1/products?available=true&discount=true&home=true&maxcat=8&popular=true&status=true&when=true
  options: any = {
    // discount:true,
    popular: true,
    maxcat: 40,
    available: true,
    when: true,
    windowtime: 200
  };

  constructor(
    private $cart: CartService,
    public $i18n: i18n,
    private $util: KngUtils,
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $router: Router
  ) {

    //
    // redirect rules
    this.isRedirect = this.$route.snapshot.data.redirect;
    if (this.isRedirect) {
      this.$router.navigate(['/store', this.store, 'home']);
    }

    //
    // open product from departement
    this.departement = this.$route.snapshot.data.departement || this.$route.parent.snapshot.data.departement || 'home';

    const loader = this.$route.snapshot.data.loader || this.$route.parent.snapshot.data.loader;
    if (loader && loader.length) {
      this.config = loader[0];
      this.user = loader[1];
      this.categories = loader[2];
    }

    this.products = [];
    this.scrollCallback = this.getNextPage.bind(this);

  }

  //
  // this component is shared with thumbnail, tiny, and wider product display
  // on init with should now which one is loaded
  ngOnInit() {
    if (this.isRedirect) {
      return;
    }

    this.isReady = true;


    //
    // product action belongs to a shop or a category
    this.rootProductPath = (this.$route.snapshot.params['shop']) ?
      '/shop/' + this.$route.snapshot.params['shop'] : '';

    //
    // dialog display
    if (!this.sku) {

      this.isDialog = true;
      this.photosz = '/-/resize/600x/';
      // this.sku = this.$route.snapshot.params['sku'];
      this.$route.params.subscribe(params => {
        this.sku = params.sku;
        this.$product.findBySku(params.sku).subscribe(this.loadProduct.bind(this));

        //
        // spec: scrollTop; when open nested product we should scrollTop
        //try {this.dialog.nativeElement.scrollTop = 0; } catch (e) {}

      });

      //
      // DIALOG INIT HACK
      document.body.classList.add('mdc-dialog-scroll-lock');
      document.documentElement.classList.add('mdc-dialog-scroll-lock');

    } else {
      this.$product.findBySku(this.sku).subscribe(this.loadProduct.bind(this));
    }



    //
    // simple animation
    // capture escape only for dialog instance
    if (this.dialog) {
      this.dialog.nativeElement.classList.remove('fadeout');
      //
      // capture event escape
      const escape = (e) => {
        if (e.key === 'Escape') {
          this.onClose(this.dialog);
          document.removeEventListener('keyup', escape);
        }
      };
      document.addEventListener('keyup', escape);


    }
  }

  ngOnDestroy() {
    this.scrollCallback = null;
    if (this.isDialog) {
      document.body.classList.remove('mdc-dialog-scroll-lock');
      document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    }
  }


  get store() {
    return this.$navigation.store;
  }

  addToCart($event, product: Product, variant?: string) {
    $event.stopPropagation();
    //
    // FIXME should not be possible
    if (!product.variants) {
      console.log('DEBUG variation hang', variant, JSON.stringify(product));
      this.$util.trackError('Error variation not available: ' + variant);

      //
      // Should reload the page
      const label_error = this.$i18n.label().action_error_reload;
      if (confirm(label_error)) {
        window.location.reload(true);
      }
    }

    //
    // check if item is already on cart
    // Open variant UI
    const isOnCart = this.$cart.getItems().find(it => it.sku === product.sku);
    if (!isOnCart &&
        product.variants.length
        && !variant) {
      this.openVariant = true;
      return;
    }

    this.openVariant = false;


    this.$cart.add(product, variant);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
  }

  hasLabel(product: Product, label: string) {
    switch (label) {
      case 'grta':
      case 'bioconversion':
      case 'biodynamics':
        return product.details[label];
      case 'bio':
        return product.details.bio &&
          !product.details.bioconvertion &&
          !product.details.biodynamics;
      case 'natural':
        return product.details.natural &&
          !product.details.bio &&
          !product.details.bioconvertion &&
          !product.details.biodynamics;

      default:
        return false;
    }
  }

  hasFavorite(product) {
    return this.user.hasLike(product) ? 'favorite' : 'favorite_border';
  }

  hasVariation(product) {
    return (product.pricing &&
            product.pricing.part &&
            product.pricing.part[0] === '~');
  }

  getAvailability(product: Product, pos: number) {
    if (!product.vendor.available || !product.vendor.available.weekdays) {
      return 'radio_button_unchecked';
    }
    return (product.vendor.available.weekdays.indexOf(pos) === -1) ?
      'radio_button_unchecked' : 'radio_button_checked';
  }

  getNextPage() {
    return timer(10).pipe(map(ctx => this.currentPage += 4));
  }

  getDialog() {
    return this.dialog;
  }

  getProducts() {
    if (!this.product ||
      !this.product.belong ||
      !this.product.belong.name) {
      return this.products;
    }
    return this.products.filter(p => p.belong.name === this.product.belong.name);
  }

  loadProduct(product) {
    this.isReady = true;
    this.product = product;

    //
    // get cart value
    this.cartItem = this.$cart.findBySku(product.sku);
    //
    // updated product is hilighted for 2 weeks
    this.isHighlighted = (Date.now() - product.updated.getTime()) < ProductComponent.WEEK_1;
    this.updateBackground();

    // FIXME categories can contains shops
    // get category
    // this.category=this.categories.find(c=>this.product.categories._id==c._id);
    const params = {
      available: true,
      when: true,
      shopname: [product.vendor.urlpath]
    };

    //
    // specifics actions
    if (this.isDialog) {
      //
      // update window title
      document.title = product.title;

      //
      // others products for this vendor
      this.$product.select(params).subscribe((products) => {
        this.products = products.sort(this.sortProducts);
      });
    }
  }

  onEdit(product: Product) {

  }

  onClose(closedialog) {
    this.$navigation.back();
    setTimeout(() => {
      if (!this.scrollCallback) {
        return;
      }
      this.$router.navigate(['../../'], { relativeTo: this.$route });
    }, 200);
  }

  removeToCart($event, product: Product) {
    $event.stopPropagation();
    this.$cart.remove(product);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
  }

  save(product: Product) {
    this.$product.save(product).subscribe(
      (product) => {
      }
    );

  }

  //
  // sort products by:
  //  - belong.weight
  //  - stats.score
  sortProducts(a, b) {
    // sort : HighScore => LowScore
    const score = b.stats.score - a.stats.score;
    if (!a.belong || !a.belong) {
      return score;
    }

    // sort : LowWeight => HighWeight
    const belong = a.belong.weight - b.belong.weight;
    if (belong !== 0) {
      return belong;
    }
    return score;
  }

  updateBackground() {
    // const gradient = `radial-gradient(circle at 50% 0,rgba(255,0,0,.5),rgba(255,0,0,0) 70.71%),
    //                   radial-gradient(circle at 6.7% 75%,rgba(0,0,255,.5),rgba(0,0,255,0) 70.71%),
    //                   radial-gradient(circle at 93.3% 75%,rgba(0,255,0,.5), rgba(0,255,0,0) 70.71%)`;
    this.bgStyle = {
      'background-image' : 'url(' + this.product.photo.url + this.photosz + ')',
    };

    //
    // if colors detected
    const colors = this.product.photo.colors;
    if (colors && colors.length) {
      const shadow = `-20px 0 32px -18px rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b}),
                    -3px -13px 35px -18px rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;

      this.bgStyle['box-shadow'] = shadow;
    }
  }
}

@Component({
  selector: 'kng-product-thumbnail',
  templateUrl: './product-thumbnail.component.html',
  styleUrls: ['./product-thumbnail.component.scss']
})
export class ProductThumbnailComponent extends ProductComponent {

  hidden = true;
  @Input() large: boolean;
  @Input('visibility') set visibility(value: boolean) {
    this.hidden = (!value);
  }

  bgGradient = `linear-gradient(
        rgba(50, 50, 50, 0.7),
        rgba(50, 50, 50, 0.3)
      ),`;

  updateBackground() {
    this.bgStyle = {
      'background-image' : 'url(' + this.product.photo.url + '/-/resize/250x/)'
    };
    if (this.cartItem) {
      this.bgStyle = {
        'background-image' : this.bgGradient + this.bgStyle['background-image']
      };
    }
  }

}

@Component({
  selector: 'kng-product-tiny',
  templateUrl: './product-tiny.component.html',
  styleUrls: ['./product-tiny.component.scss']
})
export class ProductTinyComponent extends ProductComponent {
}

