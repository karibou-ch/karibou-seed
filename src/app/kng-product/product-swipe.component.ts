import { Component, 
         OnInit, 
         ViewChild, 
         ElementRef, 
         ViewEncapsulation,
         ChangeDetectionStrategy,
         ChangeDetectorRef,
         NgZone, 
         Input} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ProductService,
  Product,
  LoaderService,
  User,
  Category,
  CategoryService,
  config,
  Shop
} from 'kng2-core';
import { timer } from 'rxjs/observable/timer';
import { map } from 'rxjs/operators';
import { baseDirectiveCreate } from '@angular/core/src/render3/instructions';
import { i18n } from '../shared';

@Component({
  selector: 'kng-product-swipe',
  templateUrl: './product-swipe.component.html',
  styleUrls: ['./product-swipe.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ProductSwipeComponent implements OnInit {

  bgStyle: string='/-/resize/200x/';

  @Input() limit:number;
  @Input() config: any;
  @Input() products:Product[];

  options = {
    home:true,
    available: true,
    status: true,
    when:true
  };

  constructor(
    private $i18n:i18n,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {

    let loader  = this.$route.snapshot.data.loader||
                  this.$route.snapshot.parent.data.loader;
    this.config = loader[0];
    this.limit  = 6;
    this.products = [];
  }

  getSelectedContent(elem:string){
    return this.config.shared.home.selection[elem][this.$i18n.locale];
  }

  ngOnDestroy() {
    // document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  ngOnInit() {
    if(!this.products||!this.products.length){
      this.load();
    }

    //
    // DIALOG INIT HACK 
    // document.body.classList.add('mdc-dialog-scroll-lock');
  }


  load() {
    this.$product.select(this.options).subscribe((products: Product[]) => {
      this.products = products.sort(this.sortByDate);
    });
  }

  sortByDate(a,b){
    return b.updated-a.updated;
  }

  

}
