import { Component,
         OnInit,
         ElementRef,
         ViewEncapsulation,
         ChangeDetectionStrategy,
         ChangeDetectorRef,
         Input,
         ViewChildren,
         QueryList,
         Output,
         EventEmitter} from '@angular/core';

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
  description: string;
  active?: boolean;
  child : boolean;
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
  isChildCategory: boolean;


  //
  // dislpay more details on each product
  @Input() displaySubscription: boolean|string;
  @Input() alphasort: boolean;
  @Input() offsetTop: number;
  @Input() config: any;
  @Input() user: User;
  @Input() hub: string;
  @Input() useMaxCat: boolean;

  //
  // display more button 
  @Input() showMore: boolean;
  @Input() showSection: boolean;
  @Input() contentIf: boolean;
  @Input() clazz: string;
  @Input() filterByVendor: string;
  @Input() defaultFrequency: string|CartItemFrequency; 
  @Input() scrollContainer:ElementRef; 


  @Input() set contentCategories(categories: any[]) {
    this.categories = categories.map(cat => {
      const isCategory = cat instanceof Category;
      return { 
        name: cat.name, 
        slug: (cat.slug || cat.name),
        description: cat.description||'',
        active: !isCategory || cat.active,
        child: !isCategory,
        weight: cat.weight
      } as CategoryView;
    }); 
    if(!this.categories.length){
      return;
    }

    this.isChildCategory = this.categories[0].child;
  }

  @Input() set contentProducts(prods: Product[]){
    if(!prods.length) {
      return;
    }

    this.products = prods || [];
    this.productsGroupByCategory();
  }

  @Input() set scrollToSlug(slug: string) {
    if(!slug) {
      return;
    }

    const nextSection = this.findNextSection(slug);
    this.scrollElIntoView(nextSection);
    this.direction.emit(0);
  }

  @Output() direction:EventEmitter<number> = new EventEmitter<number>();
  @Output() currentCategory:EventEmitter<string> = new EventEmitter<string>();

  cache: {
    products: Product[];
  };


  categoryMiddle:number;
  group: any;
  visibility: any;
  current: any;
  scrollPosition: number;
  scrollDirection: number;
  direction$ : ReplaySubject<number>;
  category$ : ReplaySubject<string>;

  constructor(
    private $cdr: ChangeDetectorRef,
    private $i18n: i18n,
  ) {
    this.cache = {
      products: []
    };

    this.categoryMiddle = 2;
    this.products = [];
    this.visibility = {};
    this.current = {};
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
    return this.categories.sort(this.sortByWeight);
  }



  ngOnDestroy() {
  }

  ngOnInit() {
    this.registerScrollEvent();
  }

  isInContainer(element, name) {
    const container = this.scrollContainer? this.scrollContainer.nativeElement:document.documentElement;


    const eleTop = element.offsetTop;
    const eleBottom = eleTop + element.clientHeight;

    //
    // Note, those padding 100,200 are set for desktop view
    const paddingTop = this.isMobile ? 0:100;
    const paddingBottom = this.isMobile ? 0:200;
    const containerTop = container.scrollTop + paddingTop ;
    const containerBottom = (containerTop + container.clientHeight) - paddingBottom;

    const elemLen = Math.min(eleBottom,containerBottom) - Math.max(eleTop,containerTop);
    const elemTotLen = (eleBottom - eleTop);
    const containerLen = (containerBottom - containerTop);

    // if(elemLen/containerLen>.5 || elemLen/elemTotLen>.6){
    //   console.log((elemLen/elemTotLen).toFixed(1),(elemLen/containerLen).toFixed(1),name);
    // }

    // The element is fully visible in the container
    return elemLen/containerLen>.5 || elemLen/elemTotLen>.7;
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
      if(this.current[className]) {
        this.visibility[className] = true;
      }
    });
  }

  doDirectionUp(){ 
    // this.direction.emit(this.scrollDirection);
  }

  doDirectionDown(){
    // this.direction.emit(this.scrollDirection);
  }

  getCategoryI18n(cat){
    const key = 'category_name_'+cat.slug.replace(/-/g,'_');
    return this.$i18n.label()[key] || cat.name;
  }


  productsGroupByCategory() {
    if(!this.products.length) {
      return;
    }
    // const maxcat = this.useMaxCat? (this.isMobile ? 8 : 12):100;
    // const divider = this.isMobile ? 2 : 4;
    const maxcat = this.useMaxCat? (this.isMobile ? 2 : (
      (window.innerWidth < 1025)? 12:11
    )):200;
    const divider = this.isMobile ? 2 : (
          (window.innerWidth < 1025)? 12:4
    );

    this.group = {};
    this.products.forEach((product: Product) => {

      //
      // group by category
      // FIXME Error when categories is Null 
      product.categories = product.categories || {};
      const catName = this.isChildCategory ? product.belong.name : product.categories.name;
      if (!this.group[catName]) {
        this.group[catName] = [];
      }
      this.group[catName].push(product);
    });

    

    const cats = Object.keys(this.group);
    const sortByAlphaOrScore = (!this.alphasort) ? this.sortProductsByScore:(
      (this.displaySubscription)? this.sortProductsByVendorAndTitle:this.sortProductsByTitle
    );
    cats.forEach(cat => {
      // console.log('--- DEBUG cat',cat, this.group[cat].length);
      this.group[cat] = this.group[cat].sort(sortByAlphaOrScore).slice(0, maxcat);
      if (this.group[cat].length % divider === 0 && this.showMore) {
        this.group[cat].pop();
      }

    });

    //
    // display middle message when category list is small
    if(cats.length<3){
      this.categoryMiddle = 1;
    }

    this.categories = this.categories.filter (cat => cats.indexOf(cat.name)>-1).sort(this.sortByWeight);


    // FIXME avoid this test 
    if(!this.categories || !this.categories.length) {
      return;
    }
    this.visibility[this.categories[0].slug] = true;
    if(this.categories.length>1){
      this.visibility[this.categories[1].slug] = true;
    }
  }


  private registerScrollEvent() {
    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    const elem = this.scrollContainer? this.scrollContainer.nativeElement:document;
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

    // console.log('----',slug,nextIndex,this.sections.toArray()[nextIndex])
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
  sortProductsByTitle(a, b) {
    // sort : Title
    const score = a.title.localeCompare(b.title);
    return score;
  }

  //
  // sort products by:
  //  - vendor and title
  sortProductsByVendorAndTitle(a, b) {
    // sort : Title
    const vendor = a.vendor.urlpath.localeCompare(b.vendor.urlpath);
    if(vendor!==0) return vendor;
    return a.title.localeCompare(b.title);
  }


  //
  // sort products by:
  //  - stats.score
  sortProductsByScore(a, b) {
    // sort : HighScore => LowScore
    const score = b.stats.score - a.stats.score;
    return score;
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
    if(scrollPosition == 0) {
      this.direction$.next(scrollPosition);
      return;
    }
    //
    // avoid CPU usage
    if (Math.abs(this.scrollPosition - scrollPosition) < 20) {
      return;
    }

    // console.log(window.pageYOffset,scrollPosition,'-- > sH, sT, cH: ', $event.target.scrollHeight,$event.target.scrollTop, $event.target.clientHeight);

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
    if(this.offsetTop && scrollPosition<this.offsetTop) {
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
    if(!this.scrollContainer){
      this.$cdr.markForCheck();
    }
    
  }

}
