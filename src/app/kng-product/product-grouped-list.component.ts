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
import { ActivatedRoute, Router } from '@angular/router';

import {
  ProductService,
  Product,
  User,
  Category,
  CartService
} from 'kng2-core';
import { fromEvent, ReplaySubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

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
  // replace default score sort
  @Input() alphasort: boolean;
  @Input() config: any;
  @Input() user: User;
  @Input() hub: string;
  @Input() showMore: boolean;
  @Input() useMaxCat: boolean;

  @Input() contentIf: boolean;
  @Input() clazz: string;
  @Input() filterByVendor: string;
  @Input() scrollContainer; 

  @Input() set contentCategories(categories: any[]) {
    this.categories = categories.map(cat => {
      const isCategory = cat instanceof Category;
      return { 
        name: cat.name, 
        slug: (cat.slug || cat.name),
        description: cat.description,
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
    this.scrollPosition = 0;
  }

  @Output() direction:EventEmitter<number> = new EventEmitter<number>();
  @Output() currentCategory:EventEmitter<string> = new EventEmitter<string>();

  cache: {
    products: Product[];
  };



  group: any;
  visibility: any;
  current: any;
  scrollPosition: number;
  scrollDirection: number;
  direction$ : ReplaySubject<number>;
  category$ : ReplaySubject<string>;

  constructor(
    private $cart: CartService,
    private $product: ProductService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef,
    private $elm: ElementRef
  ) {
    this.cache = {
      products: []
    };

    this.products = [];
    this.visibility = {};
    this.current = {};
    this.scrollPosition = 0;
    // FIXME memory leaks !
    this.direction$ = new ReplaySubject<number>();
    this.category$ = new ReplaySubject<string>();
    this.direction$.pipe(distinctUntilChanged()).subscribe(direction => {
      // console.log('---',direction)
      this.direction.emit(direction)
    })
    this.category$.pipe(distinctUntilChanged()).subscribe(name => {
      this.currentCategory.emit(name)
    })

  }

  ngOnDestroy() {
  }

  ngOnInit() {
    this.registerScrollEvent();
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
    //
    // already visible
    // const visibilityKeys = Object.keys(this.visibility);
    // if(this.sections.length === visibilityKeys.length){
    //   return;
    // }


    this.sections.forEach(container => {
      const scrollTop = container.nativeElement.offsetTop;
      const height = container.nativeElement.clientHeight;
      const className = container.nativeElement.getAttribute('name');

      // console.log('----',scrollTop,height, '----',scrollPosition, '---',window.innerHeight);
      //
      // container.nativeElement.className visible! el.offsetParent
      this.current[className] = false;
      if (scrollPosition >= scrollTop &&
        scrollPosition < (scrollTop + height)) {
          this.current[className] = true;
          this.visibility[className] = true;
      }
      if ((scrollPosition + window.innerHeight) >= scrollTop &&
        (scrollPosition + window.innerHeight) < (scrollTop + height)) {
        //this.current[className] = true;
        this.visibility[className] = true;
      }
      if ((scrollPosition + window.innerHeight) >= scrollTop &&
        (scrollPosition + window.innerHeight) > (scrollTop + height)) {
        //this.current[className] = true;
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

  getCategories() {
    return this.categories.sort(this.sortByWeight);
  }

  productsGroupByCategory() {
    if(!this.products.length) {
      return;
    }
    const maxcat = this.useMaxCat? ((window.innerWidth < 426) ? 8 : 12):100;
    const divider = (window.innerWidth < 426) ? 2 : 4;

    this.group = {};
    this.products.forEach((product: Product) => {
      if (product.attributes.discount) {
        //
        // when discount display randomly product on category
        if (Math.random() > .7) {
          return;
        }
      }

      //
      // group by category
      const catName = this.isChildCategory ? product.belong.name : product.categories.name;
      if (!this.group[catName]) {
        this.group[catName] = [];
      }
      this.group[catName].push(product);
    });


    const cats = Object.keys(this.group);
    const sortBy = (!this.alphasort) ? this.sortProductsByScore:this.sortProductsByTitle;
    cats.forEach(cat => {
      // console.log('--- DEBUG cat',cat, this.group[cat].length);
      this.group[cat] = this.group[cat].sort(sortBy).slice(0, maxcat);
      if (this.group[cat].length % divider === 0 && this.showMore) {
        this.group[cat].pop();
      }

    });

    this.categories = this.categories.filter (cat => cats.indexOf(cat.name)>-1).sort(this.sortByWeight);
    // FIXME avoid this test 
    if(!this.categories || !this.categories.length) {
      return;
    }
    this.visibility[this.categories[0].slug] = true;
    // setTimeout(() => {
    //   this.detectVisibility(1);
    //   if(!this.scrollContainer){
    //     this.$cdr.markForCheck();
    //   }
  
    // }, 100);

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
  //  - stats.score
  sortProductsByScore(a, b) {
    // sort : HighScore => LowScore
    const score = b.stats.score - a.stats.score;
    return score;
  }


  private registerScrollEvent() {
    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    let elem = document;
    if (this.scrollContainer) {
      if (this.scrollContainer instanceof ElementRef) {
        elem = this.scrollContainer.nativeElement;
      } else {
        elem = document.querySelector(this.scrollContainer);
      }
      // elem = elem || window;
    }
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
    el.scrollIntoView(<any>{ behavior: 'instant', block: 'start' });
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

    if (this.scrollDirection > 20) {
      this.doDirectionUp();
    }
    if (this.scrollDirection < -20) {
      this.doDirectionDown();
    }
    this.scrollPosition = scrollPosition;

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
