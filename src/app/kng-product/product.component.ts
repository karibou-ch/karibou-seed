import { Component, ElementRef, HostListener, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
//import { MdcDialogComponent, } from '@angular-mdc/web';

import {
  Category,
  CartService,
  ProductService,
  Product,
  LoaderService,
  User,
  CartItem
} from 'kng2-core';
import { i18n } from '../shared';


@Component({
  selector: 'kng-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit, OnDestroy {

  @Input() sku: number;
  @ViewChild('dialog') dialog: ElementRef;


  static WEEK_1:number=86400*7;
  static :number=86400*14;

  user: User = new User();
  isReady: boolean;
  isDialog: boolean = false;
  config: any;
  product: Product = new Product();
  products: Product[];
  category:Category;
  categories:Category[];
  thumbnail: boolean = false;
  bgStyle: string;
  cartItem: CartItem;

  // FIXME store resolution
  store:string='geneva';

  isHighlighted:boolean;
  WaitText: boolean = false;
  rootProductPath: string;


  //
  // products for home
  // /v1/products?available=true&discount=true&home=true&maxcat=8&popular=true&status=true&when=true
  options:any={
    // discount:true,
    popular:true,
    maxcat:40,
    available:true,
    when:true,
    windowtime:200
  };

  constructor(
    private $cart: CartService,
    public  $i18n:i18n,
    private $loader:LoaderService,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $router: Router,
    private el:ElementRef
  ) {
    let loader=this.$route.parent.snapshot.data.loader;
    this.config=loader[0];      
    this.user=loader[1];    
    this.categories=loader[2];    
    this.products=[];
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
      if(!this.sku){
        this.isDialog = true;
        //this.sku = this.$route.snapshot.params['sku'];
        this.$route.params.subscribe(params=>{
          this.sku = params.sku;
          this.$product.findBySku(params.sku).subscribe(this.loadProduct.bind(this));
        });
    
        //
        // DIALOG INIT HACK 
        document.body.classList.add('mdc-dialog-scroll-lock');

      }


      this.$product.findBySku(this.sku).subscribe(this.loadProduct.bind(this));

      //
      // simple animation
      if (this.dialog) {
        this.dialog.nativeElement.classList.remove('fadeout')
      }
  }

  loadProduct(product){    
    this.isReady=true;
    this.product = product;
    //
    // get cart value
    this.cartItem = this.$cart.findBySku(product.sku);
    //
    // updated product is hilighted for 2 weeks
    this.isHighlighted=(Date.now()-product.updated.getTime())<ProductComponent.WEEK_1;
    this.updateBackground();

    // FIXME categories can contains shops
    // get category
    this.category=this.categories.find(c=>this.product.categories._id==c._id);

    // FIXME, should load on rx.pipe
    // load category 
    if(this.isDialog && this.category){
      this.$product.findByCategory(this.category.slug,this.options).subscribe((products)=>{
        this.products = products;
      });

      //this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setTimeout(()=>{
        document.querySelector('body').scrollTo(0,0)
      },10)
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
    setTimeout(() => {
      this.$router.navigate(['../'])
      //this.$location.back()
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
    this.$product.save(product).subscribe(
      (product)=>{
      }
    );

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

