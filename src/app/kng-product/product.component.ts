import { Component, 
         ChangeDetectionStrategy,
         ElementRef, 
         HostListener, 
         OnInit, 
         OnDestroy, 
         Input,          
         ViewChild, 
         ChangeDetectorRef,
         ViewEncapsulation} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
//import { MdcDialogComponent, } from '@angular-mdc/web';

import {
  Category,
  CartService,
  ProductService,
  Product,
  LoaderService,
  User,
  CartItem,
  Shop
} from 'kng2-core';
import { i18n, KngNavigationStateService } from '../shared';

import { timer } from  'rxjs/observable/timer';
import { map } from 'rxjs/operators';

//  changeDetection:ChangeDetectionStrategy.OnPush
@Component({
  selector: 'kng-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  encapsulation: ViewEncapsulation.None
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
  bgStyle: string='/-/resize/200x/';
  photosz:string;
  cartItem: CartItem;

  // FIXME store resolution
  store:string='geneva';

  isHighlighted:boolean;
  WaitText: boolean = false;
  rootProductPath: string;

  //
  // scroll 
  currentPage:number=1;
  scrollCallback;

  //
  // variant
  openVariant:boolean;


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
    private $navigation:KngNavigationStateService,
    private $loader:LoaderService,
    private $product: ProductService,
    private $route: ActivatedRoute,
    private $router: Router,
    private cdr: ChangeDetectorRef,
    private el:ElementRef
  ) {
    let loader=this.$route.parent.snapshot.data.loader;
    this.config=loader[0];      
    this.user=loader[1];    
    this.categories=loader[2];    
    this.products=[];
    this.scrollCallback=this.getNextPage.bind(this);

  }


  addToCart($event,product: Product,variant?:string) {
    $event.stopPropagation();
    if(product.variants.length&&!variant){
      this.openVariant=true;
      return;
    }

    this.openVariant=false;


    this.$cart.add(product,variant);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
  }

  removeToCart($event,product:Product){
    this.$cart.remove(product);
    this.cartItem = this.$cart.findBySku(product.sku);
    this.updateBackground();
  }

  getNextPage(){
    return timer(10).pipe(map(ctx=>this.currentPage+=4));
  }
  
  getDialog(){
    return this.dialog;
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
        this.photosz='/-/resize/600x/'
        //this.sku = this.$route.snapshot.params['sku'];
        this.$route.params.subscribe(params=>{
          this.sku = params.sku;
          this.$product.findBySku(params.sku).subscribe(this.loadProduct.bind(this));
        });
    
        //
        // DIALOG INIT HACK 
        document.body.classList.add('mdc-dialog-scroll-lock');

      }else{
        this.$product.findBySku(this.sku).subscribe(this.loadProduct.bind(this));
      }



      //
      // simple animation
      if (this.dialog) {
        this.dialog.nativeElement.classList.remove('fadeout')
      }
  }

  ngAfterViewInit() {
    // if(!this.isDialog){
    //   this.cdr.detach();
    // }
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
    //this.category=this.categories.find(c=>this.product.categories._id==c._id);

    // FIXME, should load on rx.pipe
    // load category 
    let params={
      available:true,
      when:true,
      shopname:[product.vendor.urlpath]
    };
    if(this.isDialog ){
      this.$product.select(params).subscribe((products)=>{
        this.products = products.sort(this.sortProducts);
        // this.products.forEach(prod=>{
        //   console.log(prod.belong.name, prod.stats.score)
        // })
        
      });

      setTimeout(()=>{
        if(this.dialog)this.dialog.nativeElement.scrollTo(0,0);
      },10)
    }
  }


  updateBackground() {
    this.bgStyle = 'url(' + this.product.photo.url +this.photosz+')';
  }

  ngOnDestroy() {
    if (this.isDialog) {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }

  onEdit(product: Product) {

  }

  onClose(closedialog) {
    //FIXME fadeout brakes window
    //this.dialog.nativeElement.classList.add('fadeout')
    setTimeout(() => {
      if(this.$navigation.hasHistory()){
        return this.$navigation.back();
      }
      this.$router.navigate(['../../'],{relativeTo: this.$route})
    }, 200)
  }

  getAvailability(product: Product, pos: number) {
    if (!product.vendor.available || !product.vendor.available.weekdays) {
      return 'radio_button_unchecked';
    }
    return (product.vendor.available.weekdays.indexOf(pos) == -1) ?
      'radio_button_unchecked' : 'radio_button_checked';
  }

  save(product: Product) {
    this.$product.save(product).subscribe(
      (product)=>{
      }
    );

  }

  //
  // sort products by:
  //  - belong.weight
  //  - stats.score
  sortProducts(a,b){
    // sort : HighScore => LowScore
    let score=b.stats.score-a.stats.score;
    if(!a.belong||!a.belong){
      return score;
    }

    // sort : LowWeight => HighWeight 
    let belong=a.belong.weight-b.belong.weight;
    if(belong!=0){
      return belong;
    }
    return score;
  }
}

@Component({
  selector: 'kng-product-thumbnail',
  templateUrl: './product-thumbnail.component.html',
  styleUrls: ['./product-thumbnail.component.scss']
})
export class ProductThumbnailComponent extends ProductComponent {

  hidden:boolean=true;
  @Input('visibility') set visibility(value:boolean){
    this.hidden=(!value);
  }

  bgGradient = `linear-gradient(
        rgba(50, 50, 50, 0.7),
        rgba(50, 50, 50, 0.3)
      ),`;

  updateBackground() {
    this.bgStyle = 'url(' + this.product.photo.url + '/-/resize/250x/)';
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

