import { Component,
         OnInit,
         OnDestroy,
         ViewEncapsulation,
         HostListener,
         ViewChildren,
         ElementRef,
         QueryList,
         ChangeDetectionStrategy
        } from '@angular/core';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CartService,
  Category,
  Config,
  ProductService,
  Product,
  LoaderService,
  User,
  CartAction
} from 'kng2-core';
import { ActivatedRoute } from '@angular/router';
import { i18n } from '../common';
import { MetricsService, EnumMetrics } from '../common/metrics.service';


@Component({
  selector: 'kng-home',
  templateUrl: './kng-home.component.html',
  styleUrls: ['./kng-home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // changeDetection:ChangeDetectionStrategy.OnPush
})
export class KngHomeComponent implements OnInit, OnDestroy {

  @ViewChildren('section') sections: QueryList<ElementRef>;

  isReady = false;
  config: Config;
  categories: Category[];
  cached: any = {};
  group: any = {};
  home: Product[] = [];
  user: User;
  subscription;

  //
  // infinite scroll callback
  scrollCallback;
  scrollPosition: number;
  scrollDirection: number;
  currentPage = 3;
  visibility: any = {};

  //
  // gradient of background image
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.1),
    rgba(50, 50, 50, 0.7)
  ),`;

  //
  // products for home
  // /v1/products?available=true&discount=true&home=true&maxcat=8&popular=true&status=true&when=true
  options: {
    discount: boolean;
    home: boolean;
    maxcat: number;
    popular: boolean;
    available: boolean;
    status: boolean;
    when: Date|boolean;
    reload?: number;
  } = {
    discount: true,
    home: true,
    maxcat: 14,
    popular: true,
    available: true,
    status: true,
    when: true
  };


  constructor(
    public $cart: CartService,
    public $i18n: i18n,
    private $loader: LoaderService,
    private $metric: MetricsService,
    private $product: ProductService,
    private $route: ActivatedRoute
  ) {
    // bind infinite scroll callback function
    this.scrollCallback = this.getNextPage.bind(this);
    const loader = this.$route.snapshot.parent.data['loader'] || this.$route.snapshot.data['loader'];
    this.isReady = false;
    this.config = loader[0];
    this.user = loader[1];
    this.categories = loader[2] || [];
    this.currentPage = 1000;
    // this.options.maxcat=(window.innerWidth<426)?6:12

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    setTimeout(() => {
      this.detectVisibility(0);
    }, 800);

    //
    // FIXME avoid double home load
    let loaded = false;

    this.subscription = this.$loader.update().subscribe(emit => {

      // emit signal for config
      if (emit.config) {
      }

      // emit signal for user
      if (emit.user) {
        // force reload product list (avoid cache between anonymous and user transition)
        this.options.reload = emit.user.isAuthenticated() ? 1 : 0;
      }

      // emit signal for CartAction[state]
      // ITEM_ADD       = 1,
      // ITEM_REMOVE    = 2,
      // ITEM_MAX       = 3,
      // CART_INIT      = 4,
      // CART_LOADED    = 5,
      // CART_LOAD_ERROR= 6,
      // CART_SAVE_ERROR= 7,
      // CART_ADDRESS   = 8,
      // CART_PAYMENT   = 9,
      // CART_SHPPING   =10,
      if (emit.state) {
        if (CartAction.CART_SHPPING === emit.state.action) {
          this.options.when = this.$cart.getCurrentShippingDay();
          this.productsGroupByCategory();
        }
        //
        // FIXME issue 2x CART_LOADED !!
        if (([CartAction.CART_LOADED].indexOf(emit.state.action) > -1 || !Object.keys(this.group).length)
          && !loaded) {
          this.productsGroupByCategory();
          loaded = true;
        }
      }
      console.log(this.constructor.name, '------------', emit, this.sections);
    });
  }

  get locale() {
    return this.$i18n.locale;
  }

  add(product: Product) {
    this.$cart.add(product);
  }

  doDirectionUp() {

  }

  doDirectionDown() {

  }

  getNextPage() {
    //
    // next page must be async loaded
    return timer(10).pipe(map(ctx => this.currentPage++));
  }

  getCategories() {
    if (this.cached.categories && this.currentPage === this.cached.currentPage) {
      return this.cached.categories;
    }
    if (!this.isReady) {
      return [];
    }
    this.cached.categories = this.categories.sort(this.sortByWeight).filter((c, i) => {
      return c.active && (c.type === 'Category');
    }).slice(0, this.currentPage);
    this.cached.currentPage = this.currentPage;
    this.cached.categories.forEach(cat => this.visibility[cat.slug] = false);

    return this.cached.categories;
  }

  getHeaderStyle() {
    // {'background-image': 'url(' + getStaticMap(edit.address) + ')'}
    if (!this.hasBackgroundCover()) {
      return {};
    }

    const bgStyle = 'url(' + this.config.shared.home.about.image + ')';
    return {'background-image': this.bgGradient + bgStyle};
  }


  getAboutContent(elem: string) {
    return this.config.shared.home.about[elem][this.$i18n.locale];
  }

  hasBackgroundCover() {
    return (!!this.config.shared.home.about.image);
  }

  hasAboutContent(elem: string) {
    const content = this.getAboutContent(elem);
    return content !== '' && content != null && content !== undefined;
  }

  mountOverlay(overlay) {
    if(overlay) {
      document.body.classList.add('mdc-dialog-scroll-lock');
      document.documentElement.classList.add('mdc-dialog-scroll-lock');  
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
      document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    }
  }


  productsGroupByCategory() {
    // FIXME inner size
    const maxcat = (window.innerWidth < 426) ? 6 : 8;
    const divider = (window.innerWidth < 426) ? 2 : 4;
    this.group = {};

    this.$product.select(this.options).subscribe((products: Product[]) => {
      products.forEach((product: Product) => {
        if (product.attributes.home) {
          this.home.push(product);
          return;
        }

        if (!product.categories) {
          return console.log('DEBUG----', product.sku, product.title);
        }
        if (!this.group[product.categories.name]) {
          this.group[product.categories.name] = [];
        }
        this.group[product.categories.name].push(product);
      });
      this.home = this.home.slice(0, 10);
      Object.keys(this.group).forEach(cat => {
        this.group[cat] = this.group[cat].sort((a, b) => {
          return b.stats.score - a.stats.score;
        }).slice(0, maxcat);
        if (this.group[cat].length % divider === 0) {
          this.group[cat].pop();
        }
      });
      this.isReady = true;
    });

  }


  scrollNextSectionIntoView(slug: string) {
    const nextSection = this.findNextSection(slug);
    this.scrollElIntoView(nextSection);
  }

  scrollHasNextSection(currentIndex: number) {
    return true; // currentIndex < this.images.length - 1;
  }

  private findNextSection(slug: string): HTMLElement {
    const sectionNativeEls = this.getSectionsNativeElements();
    const nextIndex = sectionNativeEls.findIndex(el => el.className === slug);

    // console.log('----',slug,nextIndex,this.sections.toArray()[nextIndex])
    return sectionNativeEls[nextIndex];
  }

  private getSectionsNativeElements() {
    return this.sections.toArray().map(el => el.nativeElement);
  }

  //
  // detect if current container is visible
  // on the screen (based on scroll position)
  detectVisibility(scrollPosition: number) {
    // safe test
    if (!this.sections) {
      return;
    }
    this.sections.forEach(container => {
      const scrollTop = container.nativeElement.offsetTop;
      const height = container.nativeElement.clientHeight;

      //
      // container.nativeElement.className visible!
      if (scrollPosition >= scrollTop &&
         scrollPosition < (scrollTop + height)) {
          this.visibility[container.nativeElement.className] = true;
      }
      if ((scrollPosition + window.innerHeight) >= scrollTop &&
         (scrollPosition + window.innerHeight) < (scrollTop + height)) {
          this.visibility[container.nativeElement.className] = true;
      }
      if ((scrollPosition + window.innerHeight) >= scrollTop &&
         (scrollPosition + window.innerHeight) > (scrollTop + height)) {
          this.visibility[container.nativeElement.className] = true;
      }
    });

  }

  //
  // detect child overlay 
  @HostListener('window:popstate', ['$event'])
  onPopState($event) {
    setTimeout(() => {
      const overlay = document.querySelector('.product-dialog');
      this.mountOverlay(!!overlay);
    }, 400);
  }

  scrollElIntoView(el: HTMLElement) {
    if (!el) {
      return;
    }

    //
    // type ScrollLogicalPosition = "start" | "center" | "end" | "nearest"
    el.scrollIntoView(<any>{ behavior: 'instant', block: 'start' });
  }

  sortByWeight(a: Category, b: Category) {
    return a.weight - b.weight;
  }

  //
  // detect scrall motion and hide component
  @HostListener('window:scroll', ['$event'])
  windowScroll() {
    const scrollPosition = window.pageYOffset;
    //
    // avoid CPU usage
    if (Math.abs(this.scrollPosition - scrollPosition) < 6) {
      return;
    }

    this.detectVisibility(scrollPosition);

    if (scrollPosition > this.scrollPosition) {
      if (this.scrollDirection < 0) {
        this.scrollDirection--;
      } else {
        this.scrollDirection = -6;
      }
    } else {
      if (this.scrollDirection > 0) {
        this.scrollDirection++;
      } else {
        this.scrollDirection = 1;
      }
    }

    if (this.scrollDirection > 20) {
      this.doDirectionUp();
    }
    if (this.scrollDirection < -20) {
      this.doDirectionDown();
    }
    this.scrollPosition = scrollPosition;
  }
}
