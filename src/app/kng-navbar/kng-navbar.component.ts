import { Component, ElementRef, OnInit, OnDestroy, Input, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService, 
         CartAction,
         Config, 
         ConfigMenu,
         ConfigService, 
         LoaderService, 
         User, 
         UserService,
         Category, 
         Shop} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../shared';
import { MdcSnackbar, MdcMenu, MdcAppBar } from '@angular-mdc/web';

import { merge } from 'rxjs/observable/merge';
import { map } from 'rxjs/operators';



@Component({
  selector: 'kng-navbar',
  templateUrl: './kng-navbar.component.html',
  styleUrls: ['./kng-navbar.component.scss'],
  encapsulation: ViewEncapsulation.None  
})
export class KngNavbarComponent implements OnInit, OnDestroy {


  //
  // howto
  // 1. https://stackoverflow.com/questions/38209713/how-to-make-a-responsive-nav-bar-using-angular-material-2

  config:Config;
  user:User;
  categories:Category[];
  shops:Shop[];
  private route$:any;

  //
  // content
  store:string;
  primary:ConfigMenu[];
  topmenu:ConfigMenu[];
  image:string;
  title:string;
  subtitle:string;
  content:any;
  cardItemsSz:number=0;
  cartItemCountElem:any;
  currentShippingDay:Date;
  isFixed: boolean = true;
  subscription;
  //@ViewChild('navigation') navigation: any;
  //@ViewChild('toolbar') toolbar:MdcToolbar;
  //@ViewChild('profile') profile:MdcMenu;
  //@ViewChild('bottombar') bottombar: MdcAppBar;
  @ViewChild('section') section:ElementRef;
  @ViewChild('shipping') shipping:MdcMenu;
  constructor(
    public  $cart:CartService,
    private $config:ConfigService,
    public  $i18n:i18n,
    private $loader:LoaderService,
    private $route: ActivatedRoute,
    private $user:UserService,
    public  $navigation:KngNavigationStateService,
    private $snack:MdcSnackbar
  ) {

    let loader=this.$route.snapshot.data.loader;
    this.config=<Config>loader[0];
    this.user=<User>loader[1];

    //
    // not mandatory
    this.categories=<Category[]>loader[2]||[];
    this.shops=<Shop[]>loader[3]||[];

    this.primary=[];
    this.topmenu=[];
   
  }
 

  ngOnDestroy() {
    //this.route$.unsubscribe();
    // this.$cart.unsubscribe();
    // this.$user.unsubscribe();
    this.subscription.unsubscribe();
  }  

  ngOnInit() {
    //
    // karibou.ch context is ready
    // this.$i18n.init(this.config.shared.i18n);
    this.$navigation.updateUser(this.user);
    this.$navigation.updateConfig(this.config);
    this.$navigation.updateCategory(this.categories);

    //
    // home.about|footer|shop|siteName|tagLine
    //  - p,h,image
    //    - fr,en
    this.image=this.config.shared.home.tagLine.image;
    this.title=this.config.shared.home.siteName[this.locale];
    this.primary=this.config.shared.menu.filter(menu=>menu.group==='primary'&&menu.active);
    this.topmenu=this.config.shared.menu.filter(menu=>menu.group==='topmenu'&&menu.active);
    this.store=this.$navigation.store;
    this.content=this.$navigation.dispatch(this.$route.snapshot.url,this.$route.snapshot.params);
    //
    // init cart here because navbar is loaded on all pages
    this.$cart.setContext(this.config,this.user,this.shops);
    this.currentShippingDay=this.$cart.getCurrentShippingDay();


    this.subscription=merge(
      this.$user.user$.pipe(map(user=>({user:user}))),
      this.$config.config$.pipe(map(config=>({config:config}))),
      this.$cart.cart$.pipe(map(state=>({state:state})))
    ).subscribe((emit:any)=>{

      //
      // update user 
      if(emit.user){
        Object.assign(this.user, emit.user);        
        this.$navigation.updateUser(this.user);
        this.$cart.setContext(this.config,this.user);
      }
      //
      // update config
      if(emit.config){
        Object.assign(this.config, emit.config);
        this.$navigation.updateConfig(this.config);            
      }
      //
      // update cart
      if(emit.state){
        this.cardItemsSz=this.$cart.getItems().reduce((sum,item)=>{
          return sum+item.quantity;
        },0);
        //
        // FIXME hugly DOM manipulation for : CART ITEMS COUNT
        // Panier <span class="cart-items-count" [hidden]="!cardItemsSz">{{cardItemsSz}}</span>        
        setTimeout(()=>{
          //
          // top bar
          (<Element>(document.querySelector('.cart-items-count')||{})).innerHTML='('+this.cardItemsSz+')';
          //
          // tab bar
          this.cartItemCountElem=this.cartItemCountElem||this.section.nativeElement.querySelector('.cart-items-count');
          if(this.cartItemCountElem){
            this.cartItemCountElem.style.visibility=(this.cardItemsSz>0)?'visible':'hidden';
            this.cartItemCountElem.innerHTML='('+this.cardItemsSz+')';
          }  
        },100);
      
        //
        // update shipping date
        if(!emit.state.item){
          return;
        }
        
        this.$snack.show(this.$i18n.label()[CartAction[emit.state.action]]+emit.state.item.quantity+'x '+emit.state.item.title+' ('+emit.state.item.part+')')          
      }
    });
    
  } 

  doSetCurrentShippingDay($event:any,current:Date,idx:number){
    this.$cart.setShippingDay(current);
    this.shipping.setSelectedIndex(idx);    
  }

  getTagline(key){
    if(!this.config||!this.config.shared.home.tagLine[key]){
      return '';
    }
    return this.config.shared.home.tagLine[key][this.locale];
  }

  getRouterLink(url){
    return ['/store',this.store].concat(url.split('/').filter(item=>item!==''));
  }

  get locale(){
    return this.$i18n.locale;
  }

  getShippingWeek(){
    return this.config.getShippingWeek();
  }

  getShippingDays(){
    return this.config.getShippingDays();
  }
  
  isAppReady(){
    return this.$navigation.store !== undefined;    
  }


}
