import { Component, ElementRef, HostListener, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MdcDialogComponent } from '@angular-mdc/web';

import {
  CartService,
  ProductService,
  Product,
  LoaderService,
  User,
  UserService,
  config,
  CartItem
} from 'kng2-core';


@Component({
  selector: 'kng-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit, OnDestroy {

  @Input() sku: number;

  user: User = new User();
  isReady: boolean;
  isDialog: boolean = false;
  config: any;
  product: Product = new Product();
  thumbnail: boolean = false;
  bgStyle: string;
  cartItem: CartItem;

  WaitText: boolean = false;
  rootProductPath: string;

  @ViewChild('dialog') dialog: ElementRef;

  constructor(
    private $cart: CartService,
    private $route: ActivatedRoute,
    private $loader: LoaderService,
    private $location: Location,
    private $product: ProductService,
    private $router: Router
  ) {
    let loader=this.$route.parent.snapshot.data.loader;
    this.config=loader[0];      
    this.user=loader[1];    
  }


  addToCart(product: Product) {
    this.$cart.add(product);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
  }

  removeToCart(product:Product){
    this.$cart.remove(product);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
  }

  hasFavorite(product) {
    return this.user.hasLike(product) ? 'favorite' : 'favorite_border';
  }

  //
  // this component is shared with thumbnail, tiny, and wider product display
  // on init with should now which one is loaded
  ngOnInit() {
      this.isReady = true;
      //
      // product action belongs to a shop or a category 
      this.rootProductPath = (this.$route.snapshot.params['shop']) ?
        '/shop/' + this.$route.snapshot.params['shop'] : '';

      //
      // when display wider 
      if (!this.sku) {
        this.isDialog = true;
        this.sku = this.$route.snapshot.params['sku'];

        //
        // DIALOG INIT HACK 
        document.body.classList.add('mdc-dialog-scroll-lock');
      }

      this.$product.findBySku(this.sku).subscribe(prod => {
        this.isReady=true;
        this.product = prod;
        this.cartItem = this.$cart.findBySku(prod.sku);
        this.updateBackground();
      });

      //
      // simple animation
      if (this.dialog) {
        this.dialog.nativeElement.classList.remove('fadeout')
      }


  }

  updateBackground() {
    this.bgStyle = 'url(' + this.product.photo.url + '/-/resize/200x/)';
  }

  ngOnDestroy() {
    if (this.isDialog) {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }

  onEdit(product: Product) {

  }

  onClose(closedialog) {
    this.dialog.nativeElement.classList.add('fadeout')
    // if(closedialog){
    //     this.dialog.close();
    // }
    setTimeout(() => {
      this.$location.back()
    }, 200)
  }

  getAvailability(product: Product, pos: number) {
    if (!product.vendor.available || !product.vendor.available.weekdays) {
      return 'radio_button_unchecked';
    }
    return (product.vendor.available.weekdays.indexOf(pos) !== -1) ?
      'radio_button_unchecked' : 'radio_button_checked';
  }

  save(product: Product) {

  }
  love(product: Product) {

  }
}

@Component({
  selector: 'kng-product-thumbnail',
  templateUrl: './product-thumbnail.component.html',
  styleUrls: ['./product-thumbnail.component.scss']
})
export class ProductThumbnailComponent extends ProductComponent {
  bgGradient = `linear-gradient(
        rgba(50, 50, 50, 0.7),
        rgba(50, 50, 50, 0.3)
      ),`;

  updateBackground() {
    this.bgStyle = 'url(' + this.product.photo.url + '/-/resize/200x/)';
    if (this.cartItem) {
      this.bgStyle=this.bgGradient+this.bgStyle;
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

