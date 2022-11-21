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

  @Input() hub: string;
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
    this.loadProducts();
  }

  hideIfEmpty: boolean;
  options:any = {    
    _home: true,
    available: true,
    status: true,
    when: true,
    limit: 6
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


  ngOnInit() {
    this.loadProducts();
  }


  loadProducts() {    
    if(this.products && this.products.length) {
      return;
    }

    if(this.hub && this.config.shared.mailchimp) {
      const mailchimp = this.config.shared.mailchimp[this.hub] || [];
      if(mailchimp.length){
        this.options.skus = mailchimp.map(media=>media.sku).filter(sku=>!!sku);    
      }
      this.options.hub=this.hub;
    } else {
      this.options.home = true;
    }

    this.$product.select(this.options).subscribe((products: Product[]) => {
      this.products = products.sort(this.sortByDate);
      this.$cdr.markForCheck();
      setTimeout(()=>{
        try {
          document.querySelector('kng-product-swipe > div > div.content').scrollLeft = 75;
        } catch (e) {}    
      },100);
    });
  }

  sortByDate(a, b) {
    return b.updated - a.updated;
  }



}
