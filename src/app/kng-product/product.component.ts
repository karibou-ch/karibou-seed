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
  CartItem
} from 'kng2-core';
import { i18n, KngNavigationStateService } from '../common';

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
  @Input() user: User = new User();

  @ViewChild('dialog') dialog: ElementRef;
  static: number = 86400 * 14;

  isReady: boolean;
  isDialog = false;
  product: Product = new Product();
  products: Product[];
  category: Category;
  thumbnail = false;
  bgStyle = '/-/resize/200x/';
  photosz: string;
  cartItem: CartItem;

  // FIXME store resolution
  store = 'geneva';
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
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $router: Router
  ) {

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


  addToCart($event, product: Product, variant?: string) {
    $event.stopPropagation();
    //
    // FIXME should not be possible
    if (!product.variants) {
      console.log('DEBUG variation hang', variant, product);
    }

    if (product.variants.length && !variant) {
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

  removeToCart($event, product: Product) {
    $event.stopPropagation();
    this.$cart.remove(product);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
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

  hasFavorite(product) {
    return this.user.hasLike(product) ? 'favorite' : 'favorite_border';
  }

  ngOnDestroy() {
    if (this.isDialog) {
      document.body.classList.remove('mdc-dialog-scroll-lock');
      document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    }
  }

  //
  // this component is shared with thumbnail, tiny, and wider product display
  // on init with should now which one is loaded
  ngOnInit() {
    this.isReady = true;


    //
    // product action belongs to a shop or a category
    this.rootProductPath = (this.$route.snapshot.params['shop']) ?
      '/shop/' + this.$route.snapshot.params['shop'] : '';

    //
    // when display wider
    if (!this.sku) {

      this.isDialog = true;
      this.photosz = '/-/resize/600x/';
      // this.sku = this.$route.snapshot.params['sku'];
      this.$route.params.subscribe(params => {
        this.sku = params.sku;
        this.$product.findBySku(params.sku).subscribe(this.loadProduct.bind(this));

        //
        // spec: scrollTop; when open nested product we should scrollTop
        try {this.dialog.nativeElement.scrollTop = 0; } catch (e) {}

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
    if (this.isDialog) {
      this.$product.select(params).subscribe((products) => {
        this.products = products.sort(this.sortProducts);
      });
    }
  }


  updateBackground() {
    this.bgStyle = 'url(' + this.product.photo.url + this.photosz + ')';
  }


  onEdit(product: Product) {

  }

  onClose(closedialog) {
    // FIXME fadeout brakes window
    // this.dialog.nativeElement.classList.add('fadeout')
    setTimeout(() => {
      if (this.$navigation.hasHistory()) {
        return this.$navigation.back();
      }
      this.$router.navigate(['../../'], { relativeTo: this.$route });
    }, 200);
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
    this.bgStyle = 'url(' + this.product.photo.url + '/-/resize/250x/)';
    if (this.cartItem) {
      this.bgStyle = this.bgGradient + this.bgStyle;
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

