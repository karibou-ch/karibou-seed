import { Component,
         OnInit,
         ViewEncapsulation,
         ChangeDetectorRef,
         Input,
         ElementRef,
         ViewChildren,
         ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ProductService,
  Product,
  User
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
  private _products:Product[];

  bgStyle = '/-/resize/200x/';

  @Input() user: User;
  @Input() hub: string;
  @Input() limit: number;
  @Input() config: any;
  @Input() mailchimp: boolean;
  @Input() discount: boolean;
  @Input() set products(products: Product[]){
    const native: HTMLElement =this.$elem.nativeElement;
    this._products = products;
    //
    // hide if empty
    if (!this._products || this._products.length < 1|| this.hideIfEmpty){
      native.classList.add('hide');
    } else{
      native.classList.remove('hide');
    }
    
  }
  @Input() set autoload(any) {
    this.loadProducts();
  }

  @ViewChild('scrollEl') $scrollEl:ElementRef<HTMLElement>;


  hideIfEmpty: boolean;
  options:any = {    
    available: true,
    status: true,
    when: true,
    limit: 8
  };

  i18n: any = {
    fr: {
      action_favorites:'Tous les produits populaires',
      action_discount:'Toutes les offres du moment',  
      title_discount: 'Les offres du moment %',
      title_mailchimp:'Les plus prisés `ღ´',
      title_select:'Les plus prisés'
    },
    en: {
      action_favorites:'All most popular',
      action_discount:'All current offers',
      title_discount: 'Current offers %',
      title_mailchimp: 'Best sellers `ღ´',
      title_select:'Best sellers'
    }
  }

  constructor(
    private $elem: ElementRef<HTMLElement>,
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
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

  get action() {
    if(this.mailchimp) {
      return 'favoris';
    }

    return 'discount';
  }

  get actionLabel() {
    if(this.mailchimp) {
      return this.i18n[this.$i18n.locale].action_favorites;
    }

    if(this.discount){
      return this.i18n[this.$i18n.locale].action_discount;
    }

    return 'click';
  }

  get products() {
    return this._products;
  }

  get firstProduct() {
    return this._products[0];
  }

  get title() {
    if(this.mailchimp) {
      return this.i18n[this.$i18n.locale].title_mailchimp;
    }

    if(this.discount){
      return this.i18n[this.$i18n.locale].title_discount;
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

  doSearch(link){
    this.$navigation.searchAction(link);    
  }  

  loadProducts(force?) {    
    if(this.hub) {
      this.options.hub=this.hub;
    }

    if(this.mailchimp && this.config.shared.mailchimp) {
      const mailchimp = this.config.shared.mailchimp[this.hub] || [];
      if(mailchimp.length){
        this.options.skus = mailchimp.map(media=>media.sku).filter(sku=>!!sku);    
      }
    } else if(this.discount) {
      this.options.discount = true;
    } else {
      this.options.home = true;
    }

    const divider = this.$navigation.isMobile() ? 1 : (
      (window.innerWidth < 1025)? 4:5
    );


    this.$product.select(this.options).subscribe((products: Product[]) => {
      this.hideIfEmpty = (products.length<4);
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
