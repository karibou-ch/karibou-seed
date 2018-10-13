<<<<<<< HEAD
import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { Observable ,  timer } from 'rxjs';
=======
import { Component, 
         OnInit, 
         OnDestroy, 
         ViewEncapsulation, 
         HostListener, 
         ViewChildren, 
         ElementRef, 
         QueryList 
        } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { timer } from  'rxjs/observable/timer';
>>>>>>> oe-mdc
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
import { runInThisContext } from 'vm';


@Component({
  selector: 'kng-home',
  templateUrl: './kng-home.component.html',
  styleUrls: ['./kng-home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class KngHomeComponent implements OnInit, OnDestroy {

  @ViewChildren('section') sections: QueryList<ElementRef>;
    
  isReady: boolean = false;
  config: Config;
  categories:Category[];
  cached:any={};
  group:any={};
  user:User;
  locale:string;
  subscription;
  showCategories:boolean;

  //
  // infinite scroll callback
  scrollCallback;
  scrollPosition:number;
  scrollDirection:number;
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
  options:{
    discount:boolean;
    home:boolean;
    maxcat:number;
    available:boolean;
    status:boolean;
    when:Date|boolean;
  }={
    discount:true,
    home:true,
    maxcat:8,
    // popular:true,
    available:true,
    status:true,
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
      // ITEM_ADD       = 1,
      // ITEM_REMOVE    = 2,
      // ITEM_MAX       = 3,
      // CART_INIT      = 4,
      // CART_LOADED    = 5,
      // CART_LOAD_ERROR= 6,
      // CART_SAVE_ERROR= 7,
      // CART_ADDRESS   = 8,
      // CART_PAYMENT   = 9,
      // CART_SHPPING   =10,      
      if(emit.state){
        if(CartAction.CART_SHPPING==emit.state.action){
          this.options.when=this.$cart.getCurrentShippingDay();
        }
        if([CartAction.CART_SHPPING,CartAction.CART_LOADED].indexOf(emit.state.action)>-1||
           !Object.keys(this.group).length){
          this.productsGroupByCategory();
        }
      }
      this.isReady = true;
      console.log(this.constructor.name,'------------',emit)
      
    });    
  }

  add(product:Product){
    this.$cart.add(product);
  }

  doDirectionUp(){
    
  }

  doDirectionDown(){

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


  scrollNextSectionIntoView(currentIndex: number) {
    const nextSection = this.findNextSection(currentIndex);
    this.scrollElIntoView(nextSection);
  }

  scrollHasNextSection(currentIndex: number) {
    return true;//currentIndex < this.images.length - 1;
  }

  private findNextSection(currentIndex: number): HTMLElement {
    const nextIndex = currentIndex + 1;
    const sectionNativeEls = this.getSectionsNativeElements();
    return sectionNativeEls[nextIndex];
  }

  private getSectionsNativeElements() {
    return this.sections.toArray().map(el => el.nativeElement);
  }


  scrollElIntoView(el: HTMLElement) {
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }  

  sortByWeight(a:Category,b:Category){
    return a.weight-b.weight;
  }
  

  //
  // detect scrall motion and hide component
  @HostListener('window:scroll', ['$event'])
  windowScroll() {
      const scrollPosition = window.pageYOffset;
      if(Math.abs(this.scrollPosition-scrollPosition)<4){
        return;
      }
      if (scrollPosition > this.scrollPosition) {
        if(this.scrollDirection<0){
          this.scrollDirection--;
        }else{
          this.scrollDirection=-1;
        }
    } else {
      if(this.scrollDirection>0){
        this.scrollDirection++;
      }else{
        this.scrollDirection=1;
      }
    }
    if(this.scrollDirection>20){
      this.doDirectionUp();
    }
    if(this.scrollDirection<-20){
      this.doDirectionDown();
    }
    this.scrollPosition = scrollPosition;      
  }
}
