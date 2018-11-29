import { Component, 
         OnInit, 
         ViewChild, 
         ElementRef, 
         ViewEncapsulation,
         ChangeDetectionStrategy,
         ChangeDetectorRef,
         NgZone } from '@angular/core';
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
import { MdcChipSet } from '@angular-mdc/web';

@Component({
  selector: 'kng-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {

  @ViewChild('subcategory') subcategory:MdcChipSet;
  @ViewChild('dialog') dialog: ElementRef;
  scrollCallback;
  currentPage:number=10;
  bgStyle: string='/-/resize/200x/';

  isReady: boolean = false;
  config: any;
  products: Product[] = [];
  password: string;
  user: User;
  category: {
    slug: string;
    categories: Category[];
    current: Category;
    similar: Category[];
  };
  vendors:Shop[];

  filterVendor:string;
  filterChild:string;

  options = {
    available: true,
    status: true,
    when:true
  };

  constructor(
    private $loader: LoaderService,
    private $product: ProductService,
    private $category: CategoryService,
    private $router: Router,
    private $route: ActivatedRoute,
    private zone:NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.category = {
      slug: null,
      categories: [],
      current: null,
      similar: []
    }
    this.vendors=[];

    let loader = this.$route.snapshot.parent.data.loader;
    this.config = loader[0];
    this.user = loader[1];
    this.category.categories = loader[2];
    this.scrollCallback=this.getNextPage.bind(this);

  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  ngOnInit() {
    this.isReady = true;
    this.category.slug = this.$route.snapshot.params['category'];

    //
    // this should not happends
    if (!this.category.slug) {
      return;
    }
    this.category.current = this.category.categories.find(cat => cat.slug === this.category.slug);
    this.category.current.child = this.category.current.child.sort((a,b)=>{
      return a.weight-b.weight; 
    });


    this.category.similar = this.category.categories
      .filter(cat => cat.group === this.category.current.group && cat.slug !== this.category.slug)
      .sort(cat => cat.weight);

    this.bgStyle = 'url(' + this.category.current.cover+')';

    this.loadProducts();
    //
    // DIALOG INIT HACK 
    document.body.classList.add('mdc-dialog-scroll-lock');
    this.dialog.nativeElement.classList.remove('fadeout')

  }

  getChildCategory(category:Category){
    return category.child;
  }

  getDialog(){
    return this.dialog;
  }


  getNextPage(){
    this.currentPage+=10;
    this.cdr.markForCheck();
    // console.log('--', this.currentPage)
    return timer(1).pipe(map(ctx=>this.currentPage));
  }  

  getProducts(){
    //[hidden]="filterChild&&filterChild!=product.belong.name"

    return this.products.filter(product=>{
      let vendor=!this.filterVendor||product.vendor.urlpath==this.filterVendor;
      let cat=!this.filterChild||product.belong.name==this.filterChild;
      return cat&&vendor;
    })
  }

  getVisibility(j){
    return (this.currentPage>j);
  }


  loadProducts() {
    this.$product.findByCategory(this.category.slug, this.options).subscribe((products: Product[]) => {
      this.zone.run(() => {
        this.products = products.sort(this.sortProducts);
        this.setVendors(this.products);  
        //
        // select first child category
        //this.subcategory.chips.filter(elem=>true)[0].selected=true;
        if(this.category.current.child[0]){
          this.toggleChild(this.category.current.child[0].name)
        }
        this.cdr.markForCheck();
      });
    });
  }

  setVendors(products:Product[]){
    let map={};
    products.forEach(product=>map[product.vendor.urlpath]=product.vendor);
    this.vendors=Object.keys(map).map(key=>map[key]);
  }

  toggleVendor(vendor:Shop){
    if(this.filterVendor==vendor.urlpath){
      return this.filterVendor=null;
    }
    this.filterVendor=vendor.urlpath;
  }

  toggleChild(child:string){
    if(this.filterChild==child){
      this.subcategory.chips.forEach((elem:any)=>elem.selected=false);
      return this.filterChild=null;
    }
    this.subcategory.chips.forEach((elem:any)=>elem.selected=(elem.chipText.elementRef.nativeElement.innerText==child));    
    this.filterChild=child;
  }


  onClose(closedialog) {
    this.dialog.nativeElement.classList.add('fadeout')
    setTimeout(() => {
      this.$router.navigate(['../../'],{relativeTo: this.$route})
      //this.$location.back()
    }, 200)
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
