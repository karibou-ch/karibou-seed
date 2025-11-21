import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ViewEncapsulation,
  NgZone
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import {
  Category,
  CartService,
  LoaderService,
  ProductService,
  Product,
  User,
  CartItem,
  CalendarService,
  ProductOrderTiming
} from 'kng2-core';
import { i18n, KngNavigationStateService, KngUtils } from '../common';

import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnumMetrics, MetricsService } from '../common/metrics.service';
import { Meta } from '@angular/platform-browser';


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
  @Input() displayVendor: boolean|string;
  @Input() displaySubscription: boolean|string;

  @ViewChild('dialog', { static: true }) dialog: ElementRef;

  public i18n = {
    fr: {
      before_order:"Encore ",
      after_order_short:"Limite de com. ",
      after_order:"Limite de commande ",
      james_product_recipe:"Quelques suggestions de recettes ?",
      james_product_variant:"Quelques associations avec le produit ?",
    },
    en:{
      before_order:"Still ",
      after_order_short:"Order limit ",
      after_order:"Order before ",
      james_product_recipe:"Some recipe suggestions?",
      james_product_variant:"Some associations with this product?",
    }
  }


  isSearching: boolean;
  isRedirect: boolean;
  isReady: boolean;
  isDialog = false;
  product: Product = new Product();
  products: Product[];
  category: Category;
  thumbnail = false;
  bgStyle: any;
  bgImage: string;
  bgGradient: string;
  photosz: string;
  cartItemNote: string;
  cartItemAudio: string;
  cartItemAudioLoading = false;
  cartItemAudioError = false;

  departement = 'home';

  productTiming: ProductOrderTiming;
  isHighlighted: boolean;
  WaitText = false;
  rootProductPath: string;

  //
  // scroll
  currentPage = 1;
  scrollCallback;
  scrollStickedToolbar: boolean;
  timestamp:number;

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
    status: true,
    windowtime: 200
  };

  private updateTimer: any;
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 30000; // Update every 30s

  constructor(
    private zone: NgZone,
    private $meta: Meta,
    private $metric: MetricsService,
    private $cart: CartService,
    private $loader: LoaderService,
    public $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $calendar: CalendarService
  ) {

    this.timestamp = Date.now();
    //
    // redirect rules
    this.isRedirect = this.$route.snapshot.data.redirect;
    if (this.isRedirect) {
      this.$router.navigate(['/store', this.store, 'home']);
    }
    // ✅ PARENT BROADCASTER: Récupération immédiate des données cached
    const { config, user, categories } = this.$loader.getLatestCoreData();

    //
    // open product from departement
    this.departement = this.$route.snapshot.data.departement || this.$route.parent.snapshot.data.departement || 'home';


    this.config = config;
    this.user = user;
    this.categories = categories;

    this.products = [];
    this.scrollCallback = this.getNextPage.bind(this);
    this.scrollStickedToolbar = false;
  }

  /**
   * Calcule la largeur effective du conteneur de dialogue produit, soustrait 2rem.
   *
   * Le toolbar étant en position fixed, les calculs CSS purs sont imprécis car :
   * - Le positionnement fixed sort l'élément du flux normal du document
   * - Les calculs de largeur ne tiennent pas compte du z-index et layering
   * - Les dimensions peuvent être affectées par les propriétés CSS du fixed positioning
   * - Le JavaScript permet un calcul précis basé sur le DOM réel
   *
   * Cette approche garantit la synchronisation parfaite entre :
   * - Le dialogue modal et ses dimensions
   * - Le toolbar fixed et son positionnement
   * - Les calculs de layout responsives
   *
   * @returns {number} Largeur en pixels du conteneur moins 2rem, 0 si non disponible
   */
  // ✅ CORRECTION : Cache la largeur pour éviter ExpressionChangedAfterItHasBeenCheckedError
  private _cachedClientWidth: number = 0;
  private _lastWidthUpdate: number = 0;
  private _resizeObserver?: ResizeObserver;

  get clientWidth() {
    // ✅ CORRECTION : Cache pendant 100ms pour éviter les recalculs constants
    const now = Date.now();
    if (now - this._lastWidthUpdate < 100 && this._cachedClientWidth > 0) {
      return this._cachedClientWidth;
    }

    if(!this.dialog || !this.dialog.nativeElement){
      return this._cachedClientWidth;
    }

    //
    // container.className == "product-dialog__surface"
    const container = this.dialog.nativeElement.children[1];
    if (!container) {
      return this._cachedClientWidth;
    }

    // FIXME rem should be on utility class
    // Calcul de la largeur réelle
    const width = container.clientWidth;

    // Soustrait 2rem (conversion dynamique des rem vers pixels)
    const remValue = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const widthMinus2rem = width - (2 * remValue);

    // ✅ CORRECTION : Cache le résultat
    this._cachedClientWidth = Math.max(0, widthMinus2rem);
    this._lastWidthUpdate = now;

    return this._cachedClientWidth;
  }

  /**
   * ✅ CORRECTION : Invalide le cache de largeur
   * Utile lors de changements de layout ou redimensionnement
   */
  private invalidateWidthCache(): void {
    this._cachedClientWidth = 0;
    this._lastWidthUpdate = 0;
  }

  get store() {
    return this.$navigation.store;
  }

  get audioFileName() {
    const name = this.user && this.user.displayName || ''
    return this.product.sku + '-' + name.toLowerCase();
  }

  get pinned(){
    return this.product.attributes.home || this.selected;
  }

  get productActiveSubscription() {
    return this.product.attributes.subscription || this.product.attributes.business;
  }

  get queryParamsSKU() {
    return (this.displaySubscription  && this.productActiveSubscription)?{view:'subscription'}:{};
  }

  get queryParamsRecipe() {
    return {recipe:this.product.details.internal};
  }

  get queryParamsVariant() {
    return {variant:this.product.details.internal};
  }

  get cartItemQuantity(){
    const isForSubscription = (this.displaySubscription && this.productActiveSubscription);
    const hub = this.config.shared.hub.slug;

    const qty= this.$cart.getItemsQtyMap(this.product.sku,hub,isForSubscription);
    return qty;
  }

  get cartSubsQuantity() {
    const qty = this.$cart.getSubsQtyMap(this.product.sku);
    return qty;
  }

  get isAvailableForOrder(){
    return !this.isReady || this.product.isAvailableForOrder();
  }
  get isInStockForOrder() {
    return !this.isReady || this.product.pricing.stock;
  }

  get isOutOfTimelimitForOrder() {
    return !this.displaySubscription && this.productTiming?.isOutOfTimeLimit;
  }

  get getTimelimitForOrder() {
    return !this.displaySubscription && this.productTiming?.shouldShowCountdown;
  }

  get hoursAndMinutesLeftBeforeOrder() {
    return this.productTiming?.formattedTimeLeft || '0 minutes';
  }

  // display hours and minutes after the timelimit
  get hoursAndMinutesAfterOrder() {
    return this.productTiming?.formattedDeadline || '00h00';
  }


  get glabel() {
    return this.$i18n.label();
  }

  get label() {
    return this.i18n[this.$i18n.locale];
  }

  get locale() {
    return this.$i18n.locale;
  }

  get urlTitle(){
    return this.product.title.toLocaleLowerCase().replace(/[^\wÀ-ÿ]/g,'-');
  }

  //
  // this component is shared with thumbnail, tiny, and wider product display
  // on init with should now which one is loaded
  ngOnInit() {
    if (this.isRedirect) {
      return;
    }


    this.isSearching = this.isReady = false;

    //
    // use URL state to force subscription action
    this.displaySubscription = this.displaySubscription || (this.$route.snapshot.queryParams['view']=='subscription');
    this.displayVendor = this.displaySubscription || this.displayVendor;
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
        if(!params.sku){
          return;
        }
        this.sku = params.sku;
        this.$product.findBySku(params.sku).subscribe(this.loadProduct.bind(this));
      });
    } else {
      this.$product.findBySku(this.sku).subscribe(this.loadProduct.bind(this));
    }

    //
    // simple animation
    // capture escape only for dialog instance
    if (this.dialog) {
      //
      // Expression has changed after it was checked
      // https://angular.io/errors/NG0100
      setTimeout(()=> this.scrollStickedToolbar = this.dialog.nativeElement.scrollTop>40,0,1000);

    }

    // Start timer to update productTiming
    const updateTime = () => {
      const now = Date.now();
      if (now - this.lastUpdate >= this.UPDATE_INTERVAL) {
        if (this.product && this.config) {
          const shippingDay = this.$cart.getCurrentShippingDay();
          // ✅ MIGRATION CRITIQUE: Utiliser CalendarService avec interface ProductOrderTiming complète
          const newTiming = this.$calendar.timeleftBeforeCollect(
            this.config.shared.hub,
            this.product.attributes.timelimit,
            shippingDay,
            { includeInterface: true }
          ) as ProductOrderTiming;

          // Only update if the value has changed significantly (more than 1 minute)
          if (!this.productTiming || Math.abs(newTiming.hoursLeft - this.productTiming.hoursLeft) > 1/60) {
            this.zone.run(() => {
              this.productTiming = newTiming;
              this.lastUpdate = now;
            });
          }
        }
      }
      this.updateTimer = this.zone.runOutsideAngular(() => requestAnimationFrame(updateTime));
    };
    this.updateTimer = this.zone.runOutsideAngular(() => requestAnimationFrame(updateTime));
  }

  ngAfterViewInit() {
    if (this.isDialog) {
      console.log('DEBUG dialog display', this.sku);
      document.body.classList.add('mdc-dialog-scroll-lock');

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

      //
      // Alerts when navigating away from a web page
      // https://stackoverflow.com/questions/1289234/alerts-when-navigating-away-from-a-web-page/1289260#1289260
      // window.onbeforeunload = function() {
      //   return false;
      // }


    }
  }

  ngOnDestroy() {
    this.scrollCallback = null;
    window.onbeforeunload = null;

    if (this.isDialog) {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }

    // Clear the update timer
    if (this.updateTimer) {
      cancelAnimationFrame(this.updateTimer);
    }

    // ✅ CORRECTION : Nettoyer le cache de largeur
    this.invalidateWidthCache();

    // ✅ CORRECTION : Nettoyer ResizeObserver si utilisé
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }
  }

  onAudioError(error) {
    console.log('---DBG audio error',error);
  }

  onAudioStopAndSave(ctx:{type: string, audioUrl: string, transcription: string, cartUrl?: string}) {
    this.cartItemAudio = ctx.audioUrl;
    this.cartItemNote = ctx.transcription;
    //
    // update note product, no qty, no variant and audio
    const item = this.$cart.findBySku(this.product.sku,this.store);
    if(!item){
      this.addToCart(0,this.product, null, true);
      return;
    }
    item.audio = this.cartItemAudio;
    item.note = this.cartItemNote;
    this.$cart.addOrUpdateNote(item);
  }

  addToCart($event, product: Product, variant?: string, audio?: boolean) {
    if($event){
      $event.stopPropagation();
    }
    //
    // FIXME Null product.variants should not be possible!
    if (!product.variants) {
      console.log('DEBUG variation hang', variant, JSON.stringify(product));

      //
      // Should reload the page
      const label_error = this.$i18n.label().action_error_reload;
      if (confirm(label_error)) {
        window.location.reload();
      }
    }

    //
    // check if item is already on cart
    // Open variant UI
    const isOnCart = this.cartItemQuantity;
    if (!isOnCart && !variant  && product.variants && product.variants.length) {
      this.openVariant = true;
      return;
    }

    this.openVariant = false;

    //
    // create item from product
    const item = CartItem.fromProduct(product,this.store, variant);


    //
    // manage subscription
    item.frequency = (this.displaySubscription && this.productActiveSubscription)



    //
    // manage audio note
    item.note = this.cartItemNote;
    item.audio = this.cartItemAudio;
    if(audio){
      this.$cart.addOrUpdateNote(item);
    }else{
      this.$cart.add(item);
    }

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
    const weekdays = product.vendor?.available?.weekdays ||[];
    return (weekdays.indexOf(pos) > -1) ?
      'radio_button_checked' : 'radio_button_unchecked';
  }


  getAvailabilityLabel(product: Product) {
    const vendor = product.vendor;
    // if(vendor && vendor.available.active) {
    //   return "sold out";
    // }
    if(vendor && !vendor.status) {
      return "discontinued";
    }
    if(!this.isAvailableForOrder) {
      return "sold out";
    }
    if(product.pricing.stock < 1) {
      return "sold out";
    }
    if(product.pricing.stock < 20) {
      return "in stock";// "LimitedAvailability";
    }
    return "in stock";
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
    this.product = product;
    const shippingDay = this.$cart.getCurrentShippingDay();

    // ✅ MIGRATION CRITIQUE: Utiliser CalendarService avec interface ProductOrderTiming complète
    this.productTiming = this.$calendar.timeleftBeforeCollect(
      this.config.shared.hub,
      this.product.attributes.timelimit,
      shippingDay,
      { includeInterface: true }
    ) as ProductOrderTiming;

    //
    // updated product is hilighted for 2 weeks
    this.isHighlighted = (Date.now() - product.updated.getTime()) < ProductComponent.WEEK_1;
    this.updateBackground();

    // ✅ CORRECTION : DIALOG INIT HACK - Appliqué après chargement du produit
    if (this.isDialog) {
      setTimeout(() => {
        document.body.classList.add('mdc-dialog-scroll-lock');
      }, 0);
    }

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
      const location = window.location.href;
      const category = product.categories && product.categories.name;

      this.$meta.addTag({property: 'og:title',content: product.title});
      this.$meta.addTag({property: 'og:url',content: location });
      this.$meta.addTag({property: 'og:image',content: (product.photo.url + "-/scale_crop/600x600/center/" + product.sku + ".jpg")});
      this.$meta.addTag({property: 'og:image:width',content: product.title});
      this.$meta.addTag({property: 'og:description',content: product.details.description});
      this.$meta.addTag({property: 'og:price:amount',content: product.getPrice().toFixed(2)});
      this.$meta.addTag({property: 'og:price:currency',content: 'CHF'});
      this.$meta.addTag({property: 'product:brand',content: product.vendor.name});
      this.$meta.addTag({property: 'product:availability',content: this.getAvailabilityLabel(product)});
      this.$meta.addTag({property: 'product:retailer_item_id',content:product.sku });
      this.$meta.addTag({property: 'product:item_group_id',content: category });
      this.$meta.addTag({property: 'product:category',content: category||'Market' });
      this.$metric.event(EnumMetrics.metric_view_page,{
        path:window.location.pathname,
        title: product.title,
        sku:[product.sku]
      });

      //
      // FIXME default url should be set in <kng-audio-note-enhanced>
      // setTimeout(()=>{
      //   //
      //   // get cart value
      //   const useFrequency = (this.displaySubscription && this.productActiveSubscription);
      //   const cartItem = this.$cart.findBySku(product.sku,this.config.shared.hub.slug, useFrequency);
      //   if(!cartItem) {
      //     return
      //   }
      //   // this.$dom.bypassSecurityTrustUrl
      //   this.cartItemAudio = (cartItem.audio);
      //   this.cartItemNote = cartItem.note;
      //   if(this.cartItemAudio){
      //     document.querySelector('#audio').setAttribute('src', this.cartItemAudio);
      //   }
      // },100)

      //
      // others products for this vendor
      this.$product.select(params).subscribe((products) => {
        this.products = products.sort(this.sortProducts);
      });

    }

    //
    // master piece of angular
    this.isReady = true
  }

  onEdit(product: Product) {

  }

  onClose(closedialog) {
    //
    // case of onboarding from ad clic
    const query = this.$route.snapshot.queryParams;
    const shouldNavigate = query.source || query.fbclid;
    if(shouldNavigate || !this.$navigation.hasHistory) {
      return this.$router.navigate(['../../'], { relativeTo: this.$route });
    }

    setTimeout(() => {
      if (!this.scrollCallback) {
        return;
      }
      this.$router.navigate(['../../'], { relativeTo: this.$route });
    }, 500);
    this.$navigation.back();
  }

  removeToCart($event, product: Product) {
    $event.stopPropagation();
    const hub = this.store;

    const isForSubscription = (this.displaySubscription && this.productActiveSubscription);


    const item = this.$cart.findBySku(product.sku,hub,isForSubscription);
    this.$cart.remove(item);
    this.timestamp = Date.now();

    console.log('----',item,this.cartItemQuantity)
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

    this.bgImage = this.product.photo.url + this.photosz;

    //
    // if colors detected
    this.bgGradient = "";
    const colors = this.product.photo.colors;
    if (colors && colors.length) {
      const conicGradient = `conic-gradient(
        from -90deg,
        rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b},0.5),        /* Top */
        rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b},0.25) 0deg,  /* Right */
        rgba(${colors[2].r}, ${colors[2].g}, ${colors[2].b},0.5) 90deg, /* Bottom */
        rgba(${colors[3].r}, ${colors[3].g}, ${colors[3].b},0.5) 270deg  /* Left */
      )`

      const shadow = `-20px 0 32px -18px rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b}),
                    -3px -13px 35px -18px rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;

      this.bgStyle['box-shadow'] = shadow;
      this.bgStyle['background-image'] = `url(${this.product.photo.url + this.photosz}),${conicGradient}`;
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
      )`;



  updateBackground() {
    this.bgImage = this.product.photo.url + '/-/resize/300x/-/enhance/50';
    // this.bgStyle = {
    //   'background-image' : 'url(' + this.product.photo.url + '/-/resize/250x/)'
    // };

    const colors = this.product.photo.colors;
    if (colors && colors.length) {
      this.bgGradient = `linear-gradient(to bottom right,
      rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b},0.5),
      rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b},0.25) 25%,
      rgba(${colors[2].r}, ${colors[2].g}, ${colors[2].b},0.5) 50%,
      rgba(${colors[3].r}, ${colors[3].g}, ${colors[3].b},0.5) 75%)`;
      this.bgStyle = {
        'background' : this.bgGradient
      };

    }


    if (this.cartItemQuantity) {
      this.bgStyle = {
        'background-color' : this.bgGradient
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

