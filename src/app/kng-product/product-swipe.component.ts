import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectorRef,
  Input,
  ElementRef,
  ViewChildren,
  ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ProductService,
  Product,
  User,
  Config,
  LoaderService,
  CartService
} from 'kng2-core';
import { i18n, KngNavigationStateService } from '../common';

@Component({
  selector: 'kng-product-swipe',
  templateUrl: './product-swipe.component.html',
  styleUrls: ['./product-swipe.component.scss'],
  encapsulation: ViewEncapsulation.None,
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSwipeComponent implements OnInit {
  @ViewChild('scrollEl') $scrollEl: ElementRef<HTMLElement>;



  bgStyle = '/-/resize/200x/';
  private _products: Product[];

  @Input() user: User;
  @Input() hub: string;
  @Input() limit: number;
  @Input() config: any;
  @Input() mailchimp: boolean;
  @Input() discount: boolean;
  @Input() pinned: boolean;
  @Input() boost: boolean;
  @Input() set products(products: Product[]) {
    const native: HTMLElement = this.$elem.nativeElement;
    this._products = products;
    //
    // hide if empty
    if (!this._products || this._products.length < 1 || this.hideIfEmpty) {
      native.classList.add('hide');
    } else {
      native.classList.remove('hide');
    }

  }
  @Input() set autoload(any) {
    this.loadProducts();
  }



  hideIfEmpty: boolean;
  options: any = {
    available: true,
    status: true,
    when: true,
    limit: 14
  };

  i18n: any = {
    fr: {
      action_favorites: 'Tous les produits populaires',
      action_discount: 'Toutes les offres du moment',
      action_pinned: 'Tous les épinglés',
      title_discount: 'Les offres du moment %',
      title_mailchimp: 'Les plus prisés `ღ´',
      title_select: 'Les plus prisés',
      title_pinned: '📌Les épinglés',
      title_boost: 'À table!'
    },
    en: {
      action_favorites: 'All most popular',
      action_discount: 'All current offers',
      action_pinned: 'All pinned',
      title_discount: 'Current offers %',
      title_mailchimp: 'Best sellers `ღ´',
      title_select: 'Best sellers',
      title_pinned: '📌 Pinned',
      title_boost: 'Let’s eat!'
    }
  }

  constructor(
    private $elem: ElementRef<HTMLElement>,
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $cdr: ChangeDetectorRef,
    private $loader: LoaderService,
    private $cart: CartService
  ) {

    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config } = this.$loader.getLatestCoreData();
    this.config = config;
    this.limit = 10;
    this.products = [];
  }

  get action() {
    if (this.mailchimp) {
      return 'favoris';
    }

    if (this.discount) {
      return 'discount';
    }
    if (this.pinned) {
      return 'pinned';
    }
    if (this.boost) {
      return 'boost';
    }

    return 'popular';
  }

  get actionLabel() {
    if (this.discount) {
      return this.i18n[this.$i18n.locale].action_discount;
    }
    if (this.pinned) {
      return this.i18n[this.$i18n.locale].action_pinned;
    }

    if (this.boost) {
      return this.i18n[this.$i18n.locale].action_boost;
    }
    return this.i18n[this.$i18n.locale].action_favorites;

  }

  get products() {
    return this._products;
  }

  get firstProduct() {
    return this._products[0];
  }

  get title() {
    if (this.mailchimp) {
      return this.i18n[this.$i18n.locale].title_mailchimp;
    }

    if (this.discount) {
      return this.i18n[this.$i18n.locale].title_discount;
    }
    if (this.pinned) {
      return this.i18n[this.$i18n.locale].title_pinned;
    }
    if (this.boost) {
      return this.i18n[this.$i18n.locale].title_boost;
    }
    return this.i18n[this.$i18n.locale].title_select;
  }

  ngOnDestroy() {
  }


  ngOnInit() {
  }

  ngOnChanges() {
    this.loadProducts();
  }

  doSearch(link) {
    this.$navigation.searchAction(link);
  }

  loadProducts(force?) {
    if (this.hub) {
      this.options.hub = this.hub;
    }

    this.options.when = this.$cart.getCurrentShippingDay().toISOString();
    this.options.swipe = true;
    //
    // mailchimp
    if (this.mailchimp && this.config.shared.mailchimp) {
      const mailchimp = this.config.shared.mailchimp[this.hub] || [];
      if (mailchimp.length) {
        this.options.skus = mailchimp.map(media => media.sku).filter(sku => !!sku);
      }
    }
    //
    // discount
    else if (this.discount) {
      this.options.discount = true;
      this.options.popular = false;
    }
    //
    // pinned
    else if (this.pinned) {
      this.options.pinned = true;
      delete this.options.popular;
    }
    //
    // boost
    else if (this.boost) {
      this.options.boost = true;
      delete this.options.popular;
    }
    // default to popular
    else {
      this.options.popular = true;
    }

    const divider = this.$navigation.isMobile() ? 8 : (
      (window.innerWidth < 1025) ? 14 : 14
    );


    this.$product.select(this.options).subscribe((products: Product[]) => {
      this.hideIfEmpty = (products.length < 4);
      this.products = products.sort(this.sortByDate).slice(0, divider);
      this.$cdr.markForCheck();
      // setTimeout(()=>{
      //   try {
      //     this.$scrollEl.nativeElement.scrollLeft = 75;
      //   } catch (e) {}
      // },100);
    });
  }

  sortByDate(a, b) {
    return b.updated - a.updated;
  }



}
