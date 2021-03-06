import { Component,
         OnInit,
         ViewEncapsulation,
         ChangeDetectorRef,
         Input,
         ElementRef} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ProductService,
  Product
} from 'kng2-core';
import { i18n } from '../common';

@Component({
  selector: 'kng-product-swipe',
  templateUrl: './product-swipe.component.html',
  styleUrls: ['./product-swipe.component.scss'],
  encapsulation: ViewEncapsulation.None,
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSwipeComponent implements OnInit {
  private _products:Product[];

  bgStyle = '/-/resize/200x/';

  @Input() limit: number;
  @Input() config: any;
  @Input() set products(products: Product[]){
    const native: HTMLElement =this.$elem.nativeElement;
    this._products = products;
    //
    // hide if empty
    if (!this._products || this._products.length < 3){
      native.setAttribute('hidden', '');
    } else{
      native.removeAttribute('hidden');
    }
    
  }
  @Input() set autoload(any) {
    this.load();
  }

  hideIfEmpty: boolean;
  options = {
    discount: true,
    available: true,
    status: true,
    when: true
  };

  constructor(
    private $elem: ElementRef<HTMLElement>,
    private $i18n: i18n,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef
  ) {

    const loader  = this.$route.snapshot.data.loader ||
                  this.$route.snapshot.parent.data.loader;
    this.config = loader[0];
    this.limit  = 10;
    this.products = [];
  }

  get products() {
    return this._products;
  }

  getSelectedContent(elem: string) {
    if (!this.config || !this.config.shared.hub.home) {
      return '';
    }
    return this.config.shared.hub.home.selection[elem][this.$i18n.locale];
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
    try {
      document.querySelector('kng-product-swipe > div > div.content').scrollLeft = 70;
    } catch (e) {}
  }

  ngOnInit() {

    // if(!this.products ||
    //    !this.products.length) {
    //   this.load();
    // }
  }


  load() {
    this.$product.select(this.options).subscribe((products: Product[]) => {
      this.products = products.sort(this.sortByDate);
      this.$cdr.markForCheck();
    });
  }

  sortByDate(a, b) {
    return b.updated - a.updated;
  }



}
