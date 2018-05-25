import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { timer } from  'rxjs/observable/timer';
import { map } from 'rxjs/operators';

import {
  CartService,
  Category,
  Config,
  ProductService,
  Product,
  LoaderService,
  User,
  CartState,
  CartAction
}  from 'kng2-core';
import { ActionSequence } from 'protractor';
import { ActivatedRoute } from '@angular/router';
import { i18n } from '../shared';


@Component({
  selector: 'kng-home',
  templateUrl: './kng-home.component.html',
  styleUrls: ['./kng-home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class KngHomeComponent implements OnInit, OnDestroy {
  isReady: boolean = false;
  config: Config;
  categories:Category[];
  cached:any={};
  products: Product[] = [];
  group:any={};
  user:User;
  locale:string;
  subscription;

  //
  // infinite scroll callback
  scrollCallback;
  currentPage:number=3;

  //
  //gradient of background image 
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.1),
    rgba(50, 50, 50, 0.7)
  ),`;

  //
  // products for home
  // /v1/products?available=true&discount=true&home=true&maxcat=8&popular=true&status=true&when=true
  options:{discount:boolean;home:boolean;maxcat:number;when:Date|boolean}={
    discount:true,
    home:true,
    maxcat:8,
    // popular:true,
    // available:true,
    // status:true
    when:true
  };


  constructor(
    private $cart:CartService,
    private $i18n:i18n,
    private $loader: LoaderService,
    private $product: ProductService,
    private $route: ActivatedRoute
  ) { 
    // bind infinite scroll callback function
    this.scrollCallback=this.getNextPage.bind(this);

    let loader=this.$route.snapshot.parent.data['loader'];
    this.isReady = false;
    this.config = loader[0];
    this.user=loader[1];
    this.categories=loader[2]||[];


    
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

  ngOnInit() {        
    this.locale=this.$i18n.locale;

    this.subscription=this.$loader.update().subscribe(emit=>{
      // emit signal for config
      if(emit.config){
      }

      // emit signal for user
      if(emit.user){
      }

      // emit signal for CartAction[state]
      if(emit.state){
        if([CartAction.CART_SHPPING,CartAction.CART_LOADED].indexOf(emit.state.action)>-1||
          !this.isReady){
         this.options.when=this.$cart.getCurrentShippingDay();
         this.productsGroupByCategory();
       }
     }
     this.isReady = true;
     console.log(this.constructor.name,'------------',emit)
      
    });    
  }

  getHeaderStyle(){
    //{'background-image': 'url(' + getStaticMap(edit.address) + ')'}
    if(!this.hasBackgroundCover()){
      return {};
    }

    let bgStyle = 'url(' + this.config.shared.home.about.image + ')';
    return {'background-image':this.bgGradient+bgStyle};
  }

  getAboutContent(elem:string){
    return this.config.shared.home.about[elem][this.$i18n.locale];
  }

  hasBackgroundCover(){
    return (!!this.config.shared.home.about.image);
  }

  hasAboutContent(elem:string){
    let content=this.getAboutContent(elem);
    return content!=''&&content!=null&&content!=undefined;
  }

  productsGroupByCategory() {
    //this.options.when
    this.group={};
    this.$product.select(this.options).subscribe((products: Product[]) => {
      products.forEach(product=>{
        if(!this.group[product.categories.name]){
          this.group[product.categories.name]=[];
        }
        this.group[product.categories.name].push(product);
      });
    });
  }

  add(product:Product){
    this.$cart.add(product);
  }

  getNextPage(){
    //
    // next page must be async loaded 
    return timer(10).pipe(map(ctx=>this.currentPage++));
  }

  getCategories(){
    if(this.cached.categories && this.currentPage===this.cached.currentPage){
      return this.cached.categories;
    }
    if(!this.isReady){
      return [];
    }
    this.cached.categories=this.categories.sort(this.sortByWeight).filter((c,i)=> {
      return c.active&&(c.type==='Category');
    }).slice(0,this.currentPage);
    this.cached.currentPage=this.currentPage;
    return this.cached.categories;
  }  

  sortByWeight(a:Category,b:Category){
    return a.weight-b.weight;
  }
  
}
