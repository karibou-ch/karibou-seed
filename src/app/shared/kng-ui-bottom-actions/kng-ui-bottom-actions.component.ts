// tslint:disable-next-line: import-spacing
import { Component, OnInit, ViewEncapsulation, HostBinding, Input, ElementRef, ViewChild, EventEmitter, Output, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef }
from '@angular/core';
import { Category, ProductService, Product, CartService } from 'kng2-core';
import { i18n } from '../../common';

@Component({
  selector: 'kng-ui-bottom-actions',
  templateUrl: './kng-ui-bottom-actions.component.html',
  styleUrls: ['./kng-ui-bottom-actions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngUiBottomActionsComponent implements OnInit, OnDestroy {

  @Input() categories: Category[];
  @Input() exited: boolean;
  store = 'geneva';
  show: boolean;
  findGetNull: boolean;
  products: Product[] = [];

  i18n: any = {
    fr: {
      search_placeholder: 'Recherche',
    },
    en: {
      search_placeholder: 'Search',
    }
  };

  @HostBinding('class.show') get classShow(): boolean {
    return this.show;
  }

  @HostBinding('class.exited') get classExited(): boolean {
    return this.exited;
  }

  @Output() selected: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('search', { static: false }) search: ElementRef;
  @ViewChild('stats', { static: false }) stats: ElementRef;
  
  constructor(
    public  $i18n: i18n,
    private $cart: CartService,
    private $products: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.categories = this.categories.sort(this.sortByWeight).filter((c, i) => {
      return c.active && (c.type === 'Category');
    });
  }

  ngAfterContentChecked() {
  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }

  get locale() {
    return this.$i18n.locale;
  }


  addToCard(product) {
    this.$cart.add(new Product(product));
  }

  hasSearch() {
    return this.search.nativeElement.value;
  }

  doClear() {
    this.products = [];
    this.search.nativeElement.value = null;
    this.stats.nativeElement.innerText = '';
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
    this.cdr.markForCheck();
  }

  doGoCategory(slug) {
    this.selected.emit(slug);
    this.doClear();
    this.show = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }

  doInput(value?: string) {
    const blur = !value;
    let margin = 8; // display stats result
    value = value || this.search.nativeElement.value;
    const tokens = value.split(' ').map(val => (val || '').length);
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');

    this.stats.nativeElement.innerText = '';

    //
    // on search open window
    if (tokens.some(len => len >= 3)) {
      this.show = true;
      this.findGetNull = false;
      margin = (this.search.nativeElement.value || '').length * margin;

      this.$products.search(value).subscribe(products => {
        //
        // async clear?
        this.stats.nativeElement.style.marginLeft = 35 + margin + 'px';
        if (!this.search.nativeElement.value) {
          this.stats.nativeElement.innerText = '';
          return;
        }
        this.stats.nativeElement.innerText = '(' + products.length + ')';

        this.findGetNull = !products.length;
        this.products = products.sort(this.sortByScore);
        blur && this.search.nativeElement.blur();
        this.cdr.markForCheck();
      });
    }
  }

  doToggle() {
    this.show = !this.show;
    if (this.show) {
      this.products = [];
      document.body.classList.add('mdc-dialog-scroll-lock');
      document.documentElement.classList.add('mdc-dialog-scroll-lock');
      // this.search.nativeElement.focus();
    } else {
      this.doClear();
      document.body.classList.remove('mdc-dialog-scroll-lock');
      document.documentElement.classList.remove('mdc-dialog-scroll-lock');
    }

  }
  onFocus() {
    try {
      this.search.nativeElement.select();

    } catch (e) {}

  }

  sortByScore(a, b) {
    return b.stats.score - a.stats.score;
  }

  sortByWeight(a: Category, b: Category) {
    return a.weight - b.weight;
  }

}
