import { Component,
         OnInit,
         ViewChild,
         ElementRef,
         ViewEncapsulation,
         ChangeDetectionStrategy,
         ChangeDetectorRef,
         NgZone,
         HostListener} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ProductService,
  Product,
  User,
  Category,
  Shop,
  CartService
} from 'kng2-core';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { MdcChipSet, MdcChip } from '@angular-mdc/web';

@Component({
  selector: 'kng-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  static SCROLL_CACHE = 0;

  @ViewChild('subcategory', { static: false }) subcategory: MdcChipSet;
  @ViewChild('dialog', { static: false }) dialog: ElementRef;
  scrollCallback;
  currentPage = 10;
  bgStyle = '/-/resize/200x/';

  isReady = false;
  config: any;
  products: Product[] = [];
  cache: {
    products: Product[];
  };

  password: string;
  user: User;
  category: {
    slug: string;
    categories: Category[];
    current: Category;
    similar: Category[];
  };
  vendors: Shop[];

  filterVendor: string;
  filterChild: string;
  childSub;
  relative = './';

  options: {
    available: boolean;
    status: boolean;
    when: Date|boolean;
    reload?: number;
  } = {
    available: true,
    status: true,
    when: true
  };

  constructor(
    private $cart: CartService,
    private $product: ProductService,
    private $router: Router,
    private $route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.cache = {
      products: []
    };

    this.category = {
      slug: null,
      categories: [],
      current: null,
      similar: []
    };
    this.vendors = [];

    const loader = this.$route.snapshot.parent.data.loader;
    this.config = loader[0];
    this.user = loader[1];
    this.category.categories = loader[2];
    this.scrollCallback = this.getNextPage.bind(this);
    ProductListComponent.SCROLL_CACHE = 0;
  }

  ngOnDestroy() {
    this.clean();
    if (this.childSub) {
      this.childSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.isReady = true;
    this.category.slug = this.$route.snapshot.params['category'];


    //
    // this should not happends
    if (!this.category.slug) {
      return;
    }
    this.category.current = this.category.categories.find(cat => cat.slug === this.category.slug);
    this.category.current.child = this.category.current.child.sort((a, b) => {
      return a.weight - b.weight;
    });


    this.category.similar = this.category.categories
      .filter(cat => cat.group === this.category.current.group && cat.slug !== this.category.slug)
      .sort(cat => cat.weight);

    this.bgStyle = 'url(' + this.category.current.cover + ')';

    this.loadProducts();
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
    this.dialog.nativeElement.classList.remove('fadeout');

  }

  //
  // FIXME: when using cache route component
  // -> ngOnInit and ngOnDestroy are never called when app.cache.route is activated
  ngAfterViewChecked() {
    const diff = Math.abs(this.dialog.nativeElement.scrollTop - ProductListComponent.SCROLL_CACHE);
    if(diff < 100) {
      return;
    }
    this.dialog.nativeElement.scrollTop = ProductListComponent.SCROLL_CACHE;
  }

  clean() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }


  @HostListener('document:keyup.escape', ['$event'])
  keyEvent(event: KeyboardEvent) {
    this.onClose(this.dialog);
  }

  getChildCategory(category: Category) {
    return category.child;
  }

  getDialog() {
    return this.dialog;
  }


  getNextPage() {
    this.currentPage += 10;
    this.cdr.markForCheck();
    return timer(1).pipe(map(ctx => this.currentPage));
  }

  getProducts() {
    return this.cache.products;
  }

  getVendorsClosed() {
    const available = this.getProducts().map(product => product.vendor.urlpath);
    return this.vendors.filter(vendor => available.indexOf(vendor.urlpath) === -1);
  }
  getVendors() {
    const available = this.getProducts().map(product => product.vendor.urlpath);
    return this.vendors.filter(vendor => available.indexOf(vendor.urlpath) !== -1);
  }
  getVisibility(j) {
    return (this.currentPage > j);
  }


  loadProducts() {

    this.options.when = this.$cart.getCurrentShippingDay();

    this.$product.findByCategory(this.category.slug, this.options).subscribe((products: Product[]) => {
      this.products = products.sort(this.sortProducts);
      //
      // select first child category
      // this.subcategory.chips.filter(elem=>true)[0].selected=true;

      //
      // update child only after products
      // TODO     .pipe(takeWhile(() => !this.destroyed))

      this.childSub = this.$route.params.subscribe(param => {
        if (param['child']) {
          this.relative = '../';
          this.toggleChild(param['child']);
        } else if (this.category.current.child[0]) {
          this.relative = './';
          this.toggleChild(this.category.current.child[0].name);
        }
      });


      //
      // set vendors after toggle of child category
      this.setVendors(this.products);
      this.cdr.markForCheck();
      // this.restoreScroll();
    });
  }

  setProducts() {
    return this.cache.products = this.products.filter(product => {
      const vendor = !this.filterVendor || product.vendor.urlpath === this.filterVendor;
      const cat = !this.filterChild || product.belong.name === this.filterChild;
      return cat && vendor;
    });
  }

  setVendors(products: Product[]) {
    products.forEach(product => map[product.vendor.urlpath] = product.vendor);
    this.vendors = Object.keys(map).map(key => map[key]);
    this.setProducts();
  }

  toggleVendor(vendor: Shop) {
    if (this.filterVendor === vendor.urlpath) {
      return this.filterVendor = null;
    }
    this.filterVendor = vendor.urlpath;
    this.setProducts();
  }

  toggleChild(child: string) {
    if (this.filterChild === child) {
      this.subcategory.chips.forEach((elem: MdcChip) => elem.selected = false);
      this.filterChild = null;
      this.setProducts();
      return;
    }

    this.subcategory.chips.forEach((elem: MdcChip) => elem.selected = (elem.value === child));
    this.filterChild = child;
    this.setProducts();
  }


  onClose(closedialog) {
    this.dialog.nativeElement.classList.add('fadeout');
    setTimeout(() => {
      this.clean();
      this.$router.navigate(['../../'], {relativeTo: this.$route});
    }, 200);
  }

  //
  // detect scrall motion and hide component
  onScroll($event) {
    ProductListComponent.SCROLL_CACHE = this.dialog.nativeElement.scrollTop;
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
