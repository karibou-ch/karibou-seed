// tslint:disable-next-line: import-spacing
import { Component, OnInit, ViewEncapsulation, HostBinding, Input, ElementRef, ViewChild, EventEmitter, Output, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener }
from '@angular/core';
import { Category, ProductService, Product, CartService, Config, ConfigMenu, CartItem } from 'kng2-core';
import { i18n, KngNavigationStateService } from '../../common';
import { EnumMetrics, MetricsService } from 'src/app/common/metrics.service';
import { User } from 'kng2-core';

@Component({
  selector: 'kng-ui-bottom-actions',
  templateUrl: './kng-ui-bottom-actions.component.html',
  styleUrls: ['./kng-ui-bottom-actions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngUiBottomActionsComponent implements OnInit, OnDestroy {

  @Input() user: User;
  @Input() config: Config;
  @Input() categories: Category[];
  @Input() exited: boolean;
  @Input() group: string;
  @Input() defaultMenu: string;
  
  themes: Category[];
  primary: ConfigMenu[];

  show: boolean;
  findGetNull: boolean;
  products: Product[] = [];
  autocompletes:any[];
  lastSearch: string;
  lastTheme: Category;


  @HostBinding('class.show') get classShow(): boolean {
    return this.show;
  }

  @HostBinding('class.exited') get classExited(): boolean {
    return this.exited;
  }

  @Output() selected: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('search', { static: true }) search: ElementRef;
  @ViewChild('stats', { static: true }) stats: ElementRef;
  @ViewChild('results', { static: true }) results: ElementRef;

  constructor(
    public  $i18n: i18n,
    private $cart: CartService,
    private $navigation: KngNavigationStateService,
    private $metric: MetricsService,
    private $products: ProductService,
    private $cdr: ChangeDetectorRef
  ) { 
    this.exited = false;
    this.autocompletes = [];
  }

  ngOnInit() {
    // FIXME release subscribe
    this.$navigation.search$().subscribe((keyword)=>{
      if(keyword == 'favoris'||keyword == 'discount') {
        this.doClear();
        this.doPreferred((keyword == 'discount'));
        this.show = true;
        return;
      }

      if(keyword == 'clear') {
        this.doClear();
        return;
      }
      if(keyword.indexOf('stats:')>-1) {
        return;
      }
      this.show = true;
      this.doSearch(keyword);
    });

    this.primary = this.config.shared.menu.filter(menu => menu.group === 'primary' && menu.active).sort((a, b) => a.weight - b.weight);
    this.themes = this.categories.filter(c => c.type === 'theme');
    this.categories = (this.categories||[]).sort(this.sortByWeight).filter((c, i) => {
      return c.active && (c.type === 'Category');
    });
  }

  ngAfterContentChecked() {
  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  get isAdminAndTheme() {
    return this.user && this.user.isAdmin() && this.lastTheme;
  }

  get store() {
    return this.$navigation.store;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label(){
    return this.$i18n.label();
  }

  get i18n() {
    return this.$i18n;
  }

  addToCard(product) {
    const item = CartItem.fromProduct(product,this.store);    
    this.$cart.add(item);
  }

  //
  // FIXME this is quick implementation of remove product from theme
  async removeToTheme(product) {
    try{
      const theme = this.themes.find(c => c.name == this.lastSearch);
      product.themeDel = theme.name;
      await this.$products.save(product).toPromise();
  
      const idx = this.products.findIndex(p => p.sku === product.sku);
      this.products.splice(idx, 1);  
      this.$cdr.markForCheck();

    }catch(e) {
      alert(e.message);
    }

  }

  hasSearch() {
    return this.search.nativeElement.value;
  }

  doClearScroll() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  doClear() {
    this.products = [];
    this.lastTheme = this.lastSearch = null;

    this.$cdr.markForCheck();
  }

  doGoCategory(slug) {
    this.selected.emit(slug);
    this.doClear();
    this.show = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  doSearch(value: string) {
    const blur = !value;
    const tokens = value.split(' ').map(val => (val || '').length);
    document.body.classList.add('mdc-dialog-scroll-lock');
    this.lastTheme = this.themes.find(c => c.name == value);
    //
    // on search open window
    if (tokens.some(len => len >= 3)) {
      const options = {
        when: this.$cart.getCurrentShippingDay(),
        hub: this.config.shared.hub && this.config.shared.hub.slug
      };
      this.show = true;
      this.findGetNull = false;
      this.$products.search(value, options).subscribe(products => {
        if(products['autocompletes']) {
          this.autocompletes = products['autocompletes'];
          return;
        }
        if(products['error']) {
          return;
        }

        this.lastSearch = value;

        this.$navigation.searchAction('stats:'+products.length);

        //
        // use metrics for search or themes
        const name = (this.lastTheme||value == 'popular'||value == 'discount')? 'kng_action_theme':'kng_action_search';
        const params = {name,value:{value}};
        this.$metric.event(EnumMetrics.metric_custom,params);
        console.log('---DBG custom',params.name,params.value);


        this.findGetNull = !products.length;
        // FIXME products.sort is not a function
        // const sort = this.lastTheme ? this.sortByCatAndScore : this.sortByScore;
        this.products = products.sort(this.sortByScore);
        this.$cdr.markForCheck();
        setTimeout(() => {
          this.results.nativeElement.scrollTop = 0;
        }, 0);        
      });
    }
  }

  doPreferred(discountOnly?:boolean) {
    const options: any = {
      discount: true,
      status: true,
      available: true,
      when : this.$cart.getCurrentShippingDay()
    };

    if(!discountOnly) {
      options.popular=true;
    }
    //
    // case of multihub
    if (this.config && this.config.shared.hub) {
      options.hub = this.config.shared.hub.slug;
    }
    //
    // filter by group of categories
    if (this.group) {
      options.group = this.group;
    }
    this.lastTheme = this.lastSearch = null;
    
    this.$products.select(options).subscribe((products: Product[]) => {
      this.findGetNull = !products.length;
      this.products = products.sort(this.sortByScore);
      this.show = true;
      this.$cdr.markForCheck();
    });

  }

  doToggle() {
    this.show = !this.show;
    if (this.show) {
      this.products = [];
      document.body.classList.add('mdc-dialog-scroll-lock');
      // this.search.nativeElement.focus();
    } else {
      this.doClear();
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState($event) {
    console.log('---DBG popstate', $event);
    if(this.show){
      this.show = false;
      this.$cdr.markForCheck();
      $event.preventDefault();
    }
  }

  onPrimaryMenu(menu) {

  }

  sortByCatAndScore(a: Product, b) {
    const cat = (b.categories.weight - a.categories.weight);
    if ( cat !== 0 ) {
      return cat;
    }

    return b.stats.score - a.stats.score;
  }

  sortByScore(a, b) {
    return b.stats.score - a.stats.score;
  }

  sortByWeight(a: Category, b: Category) {
    return a.weight - b.weight;
  }

}
