import {
  Component,
  OnInit,
  ElementRef,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  ViewChildren,
  QueryList,
  Output,
  EventEmitter
} from '@angular/core';

import {
  Product,
  User,
  Category,
  CartItemFrequency
} from 'kng2-core';

import { fromEvent, ReplaySubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { i18n } from '../common';

export interface CategoryView {
  name: string;
  slug: string;
  group: string;
  description: string;
  active?: boolean;
  child: boolean;
  weight: number;
}

@Component({
  selector: 'kng-product-grouped-list',
  templateUrl: './product-grouped-list.component.html',
  styleUrls: ['./product-grouped-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGroupedListComponent implements OnInit {
  private _scrollEvent$;

  @ViewChildren('section') sections: QueryList<ElementRef>;

  bgStyle = '/-/resize/200x/';
  products: Product[];
  categories: CategoryView[];
  belongs:any[];
  isChildCategory: boolean;


  //
  // dislpay more details on each product
  @Input() displaySubscription: boolean | string;
  @Input() displayVendor: boolean | string;
  @Input() alphasort: boolean;
  @Input() offsetTop: number;
  @Input() config: any;
  @Input() user: User;
  @Input() hub: string;
  @Input() useMaxCat: boolean;
  @Input() useGroupedCategory: boolean;

  //
  // display more button 
  @Input() showMore: boolean;
  @Input() showSection: boolean;
  @Input() contentIf: boolean;
  @Input() clazz: string;
  @Input() filterByVendor: string;
  @Input() defaultFrequency: string | CartItemFrequency;
  @Input() scrollContainer: ElementRef;


  @Input() set contentCategories(categories: any[]) {
    this.categories = categories.map(cat => {
      const isCategory = cat instanceof Category;
      const slug = (cat.slug || cat.name);
      return {
        name: cat.name,
        slug,
        description: cat.description || '',
        active: !isCategory || cat.active,
        group: cat.group || 'default',
        child: !isCategory,
        weight: cat.weight
      } as CategoryView;
    });

    // this.belongs = categories.map(cat => cat.child||[]).flat();

    if (!this.categories.length) {
      return;
    }

    //
    // FIXME HUGLY HACK for b2b2
    // prepare groups of category if needed 
    this.categories.forEach(cat => {
      this.groupedCategory[cat.slug]=cat.group||'none';
    })


    

    this.isChildCategory = this.categories[0].child;
  }

  @Input() set contentProducts(prods: Product[]) {
    if (!prods.length) {
      return;
    }

    this.products = prods || [];
    this.productsGroupByCategory();
  }

  @Input() set scrollToSlug(slug: string) {
    if (!slug) {
      return;
    }

    const nextSection = this.findNextSection(slug);
    this.scrollElIntoView(nextSection);
    this.direction.emit(0);
  }

  @Output() direction: EventEmitter<number> = new EventEmitter<number>();
  @Output() currentCategory: EventEmitter<string> = new EventEmitter<string>();

  cache: {
    products: Product[];
  };


  categoryMiddle: number;
  group: any;
  groupedCategory:any;
  groupedCategoryKeys:any;
  defaultVisibleCat:string;
  visibility: any;
  current: any;
  scrollPosition: number;
  scrollDirection: number;
  direction$: ReplaySubject<number>;
  category$: ReplaySubject<string>;

  constructor(
    private $cdr: ChangeDetectorRef,
    private $i18n: i18n,
  ) {
    this.cache = {
      products: []
    };

    this.showSection = true;
    this.categoryMiddle = 2;
    this.products = [];
    this.belongs = [];
    this.categories = [];
    this.visibility = {};
    this.current = {};
    this.group = {};
    this.groupedCategory = {};
    this.groupedCategoryKeys = {};

    //
    // FIXME HARDCODED CAT.WEIGHT FOR SUBS
    this.defaultVisibleCat = 'fruits-legumes';
    this.groupedCategoryKeys['fleurs'] = 2; // plaisir
    this.groupedCategoryKeys['fruits-legumes'] = 1; // plaisir
    this.groupedCategoryKeys['douceurs-chocolats'] = 3; // plaisir
    this.groupedCategoryKeys['traiteur-maison'] = 5; // apero
    this.groupedCategoryKeys['charcuterie-pates'] = 6; // apero
    this.groupedCategoryKeys['boulangerie-artisanale'] = 7; // apero
    this.groupedCategoryKeys['fromages-produits-frais'] = 8; // apero
    this.groupedCategoryKeys['boissons'] = 10; // boisson
    this.groupedCategoryKeys['bieres-artisanales'] = 11; // boisson
    this.groupedCategoryKeys['vins-rouges'] = 12; // boisson
    this.groupedCategoryKeys['vins-blancs-roses'] = 13; // boisson
    this.groupedCategoryKeys['champagnes'] = 14; // boisson

    this.scrollPosition = 0;
    // FIXME memory leaks !
    this.direction$ = new ReplaySubject<number>();
    this.category$ = new ReplaySubject<string>();
    this.direction$.pipe(distinctUntilChanged()).subscribe(direction => {
      this.direction.emit(direction)
    })
    this.category$.pipe(distinctUntilChanged()).subscribe(name => {
      this.currentCategory.emit(name)
    })

  }

  get isMobile() {
    return (window.innerWidth < 600);
  }

  get sortedCategories() {
    const customSort = this.useGroupedCategory? this.sortByGroup: this.sortByWeight;
    return this.categories.sort(customSort.bind(this));
  }



  ngOnDestroy() {
  }

  ngOnInit() {
    this.registerScrollEvent();
  }

  isInContainer(element, name) {
    const container = this.scrollContainer ? this.scrollContainer.nativeElement : document.documentElement;

    //
    // use getBoundingClientRect to be relative to viewport for both elements
    const cRect = this.scrollContainer ? container.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const eRect = element.getBoundingClientRect();

    const eleTop = eRect.top | 0;
    const eleBottom = eleTop + eRect.height | 0;

    //
    // Note, those padding 100,200 are set for desktop view
    const paddingTop = this.isMobile ? 0 : (100);
    const paddingBottom = this.isMobile ? 0 : 50;
    const containerTop = (cRect.top + paddingTop) | 0;
    const containerBottom = (cRect.bottom - paddingBottom) | 0;


    //
    // give the portion inside the window
    const elemLen = Math.max(0, Math.min(eleBottom, containerBottom) - Math.max(eleTop, containerTop)) | 0;
    const elemTotLen = (eleBottom - eleTop) | 0;
    const containerLen = (containerBottom - containerTop);

    // if(name=='pates-sauces') {
    //   console.log('---',name,eleTop,containerTop);
    //   //console.log('---name',name,elemLen,elemTotLen,containerLen,'L',(elemLen/containerLen).toFixed(2),(elemLen/elemTotLen).toFixed(2));
    // }

    // if(elemLen/containerLen>.5 || elemLen/elemTotLen>.6){
    // console.log((elemLen/elemTotLen).toFixed(1),(elemLen/containerLen).toFixed(1),name);
    // }

    // The element is fully visible in the container
    return elemLen / containerLen > .5 || elemLen / elemTotLen > .7;
  }

  updateCurrentCategory() {
    const names = Object.keys(this.current);
    const name = names.find(name => this.current[name]);
    this.category$.next(name);
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
      const className = container.nativeElement.getAttribute('name');
      this.current[className] = this.isInContainer(container.nativeElement, className);
      if (!this.visibility[className] && this.current[className]) {
        this.visibility[className] = true;
        this.$cdr.markForCheck();
      }
    });
  }

  doDirectionUp() {
    // this.direction.emit(this.scrollDirection);
  }

  doDirectionDown() {
    // this.direction.emit(this.scrollDirection);
  }

  getCategoryI18n(cat) {
    const name = cat.slug.replace(/-/g, '_');
    const key = 'category_name_' + name;
    return this.$i18n.label()[key] || cat.name;
  }


  productsGroupByCategory() {
    if (!this.products.length) {
      return;
    }
    // const maxcat = this.useMaxCat? (this.isMobile ? 8 : 12):100;
    // const divider = this.isMobile ? 2 : 4;
    const maxcat = this.useMaxCat ? (this.isMobile ? 2 : (
      (window.innerWidth < 1025) ? 6 : 5
    )) : 200;

    const divider = this.isMobile ? 2 : (
      (window.innerWidth < 1025) ? 6 : 4
    );

    const inferedCategories = [];
    this.group = {};
    this.products.forEach((product: Product) => {
      //
      // FIXME, which is the case of tiny products list ?
      // if(!this.showSection && this.products.length<8) {
      //   product.categories.slug = product.categories.name = 'none';
      // }
      // 
      // grouped category is not available for Child 
      const categoryOrGroupName = this.isChildCategory ? product.belong.name : product.categories.name; 
      if (!this.group[categoryOrGroupName]) {
        this.group[categoryOrGroupName] = [];
        inferedCategories.push({
          name: categoryOrGroupName,
          slug: product.categories.slug,
          active: true,
          weight: product.categories.weight || 1
        })
      }
      this.group[categoryOrGroupName].push(product);
    });


    if (!this.categories.length && inferedCategories.length) {
      this.categories = [].concat(inferedCategories);
    }

    const cats = Object.keys(this.group);
    const sortByAlphaOrScore = (!this.alphasort) ? this.sortProductsByScore : (
      (this.displayVendor && !this.displaySubscription) ? this.sortProductsByVendorCategoryAndTitle : this.sortProductsByTitle
    );
    cats.forEach(cat => {
      this.group[cat] = this.group[cat].sort(sortByAlphaOrScore).slice(0, maxcat);
      if (this.group[cat].length % divider === 0 && this.showMore) {
        this.group[cat].pop();
      }
    });

    //
    // display middle message when category list is small
    if (cats.length < 3) {
      this.categoryMiddle = 1;
    }

    this.categories = this.categories.filter(cat => cats.indexOf(cat.name) > -1).sort(this.sortByWeight);


    // FIXME avoid this test 
    if (!this.categories || !this.categories.length) {
      return;
    }

    //
    // HARDCODED for Subs
    if(this.useGroupedCategory) {
      this.visibility[this.defaultVisibleCat] = true;
    }else {
      this.visibility[this.categories[0].slug] = true;      
    }
  }


  private registerScrollEvent() {
    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    const elem = this.scrollContainer ? this.scrollContainer.nativeElement : document;
    this._scrollEvent$ = fromEvent(elem, 'scroll').subscribe(this.windowScroll.bind(this));
  }

  scrollHasNextSection(currentIndex: number) {
    return true; // currentIndex < this.images.length - 1;
  }

  trackerCategories(index, category: Category) {
    return category.slug;
  }

  trackerProducts(index, product: Product) {
    return product.sku;
  }


  private findNextSection(slug: string): HTMLElement {
    const sectionNativeEls = this.getSectionsNativeElements();
    const nextIndex = sectionNativeEls.findIndex(el => el.getAttribute('name') === slug);
    return sectionNativeEls[nextIndex];
  }

  private getSectionsNativeElements() {
    return this.sections.toArray().map(el => el.nativeElement);
  }




  scrollElIntoView(el: HTMLElement) {
    if (!el) {
      return;
    }

    const offset = el.offsetTop;

    //
    // type ScrollLogicalPosition = "start" | "center" | "end" | "nearest"
    el.scrollIntoView(<any>{ behavior: 'smooth', block: 'start' });
  }


  //
  // sort products by:
  //  - title
  sortProductsByName(a, b) {
    return a.name.localeCompare(b.name);
  }

  sortProductsByTitle(a, b) {
    const category = a.belong.weight-b.belong.weight;
    if (category !== 0) return category;
    return (a.belong.weight+a.title).localeCompare(b.belong.weight+b.title);
  }

  //
  // sort products by:
  //  - vendor and title
  sortProductsByVendorCategoryAndTitle(a, b) {
    // sort : Vendor
    const vendor = a.vendor.urlpath.localeCompare(b.vendor.urlpath);
    if (vendor !== 0) return vendor;
    // sort : Cat
    const category = a.belong.weight-b.belong.weight;
    if (category !== 0) return category;
    // sort : Title
    return (a.title).localeCompare(b.title);
  }


  //
  // sort products by:
  //  - stats.score
  sortProductsByScore(a, b) {
    // sort : HighScore => LowScore
    const score = b.stats.score - a.stats.score;
    return score;
  }

  sortByGroup(a: CategoryView, b: CategoryView) {
    return (this.groupedCategoryKeys[a.slug]||20) - (this.groupedCategoryKeys[b.slug]||20);
  }

  sortByWeight(a: CategoryView, b: CategoryView) {
    return a.weight - b.weight;
  }

  //
  // detect scrall motion and hide component
  // @HostListener('window:scroll', ['$event'])
  windowScroll($event?) {
    const scrollPosition = $event && $event.target.scrollTop || window.pageYOffset;
    //
    // initial position, event reset value
    if (scrollPosition == 0) {
      this.direction$.next(scrollPosition);
      return;
    }
    //
    // avoid CPU usage
    if (Math.abs(this.scrollPosition - scrollPosition) < 20) {
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
    this.scrollPosition = scrollPosition;

    //
    // @input() case
    if (this.offsetTop && scrollPosition < this.offsetTop) {
      this.scrollDirection = 0;
    }

    if (this.scrollDirection > 20) {
      this.doDirectionUp();
    }
    if (this.scrollDirection < -20) {
      this.doDirectionDown();
    }


    // FIXME make it better (<-5 && !exited) = event.exit 
    //this.direction$.next(5*(Math.round( this.scrollDirection / 5)));
    this.direction$.next(this.scrollDirection);
    this.updateCurrentCategory();
    //
    // force repaint when parent changeDetection is onPush
    if (!this.scrollContainer) {
      this.$cdr.markForCheck();
    }

  }

}
