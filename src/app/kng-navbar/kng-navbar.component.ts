import { Component, ElementRef, OnInit, OnDestroy, Input, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService, 
         CartAction,
         CartState, 
         CartItem, 
         Config, 
         ConfigMenu,
         ConfigService, 
         LoaderService, 
         User, 
         UserService,
         Category, 
         Shop} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../shared';
import { MdcToolbar, MdcSnackbar, MdcMenu } from '@angular-mdc/web';



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
  image:string;
  title:string;
  subtitle:string;
  content:any;
  cardItemsSz:number=0;
  cartItemCountElem:any;
  currentShippingDay:Date;
  isFixed: boolean = true;
  @ViewChild('navigation') navigation: any;
  //@ViewChild('cart') cart: any;
  @ViewChild('section') section:ElementRef;
  @ViewChild('toolbar') toolbar:MdcToolbar;
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

    console.log('init navbar')
   
  }
 
  ngOnDestroy() {
    //this.route$.unsubscribe();
    // this.$cart.unsubscribe();
    // this.$user.unsubscribe();
    // this.$config.unsubscribe();
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
    this.subtitle=this.config.shared.home.about.h.fr;
    this.primary=this.config.shared.menu.filter(menu=>menu.group==='primary');
    this.store=this.$navigation.store;
    this.content=this.$navigation.dispatch(this.$route.snapshot.url,this.$route.snapshot.params);

    //
    // init cart here because navbar is loaded on all pages
    this.$cart.setContext(this.config,this.user,this.shops);
    this.currentShippingDay=this.$cart.getCurrentShippingDay();

    this.config.getShippingDays().forEach((day,idx)=>{
      if(+day==+this.currentShippingDay){
        // FIXME, init DOM without using timeout hack!
        setTimeout(()=>{
          this.shipping.setSelectedIndex(idx);
        },200)
      }
    })

    //
    // update user 
    this.$user.subscribe(
      (user:User)=>{
        Object.assign(this.user, user);        
        this.$navigation.updateUser(this.user);
        this.$cart.setContext(this.config,this.user);
      }
    );
    //
    // update config
    this.$config.subscribe(
      (config:Config)=>{
        Object.assign(this.config, config);
        this.$navigation.updateConfig(this.config);            
      }
    );

    this.$cart.subscribe(
      (state:CartState)=>{
        this.cardItemsSz=this.$cart.getItems().length||0;
        //
        // FIXME hugly DOM manipulation
        setTimeout(()=>{
          this.cartItemCountElem=this.cartItemCountElem||this.section.nativeElement.querySelector('.cart-items-count');
          if(this.cartItemCountElem){
            this.cartItemCountElem.style.visibility=(this.cardItemsSz>0)?'visible':'hidden';
            this.cartItemCountElem.innerHTML=this.cardItemsSz;
          }
  
        },100);

        if(state.action===CartAction.CART_LOADED){
          return;
        }
        this.$snack.show(CartAction[state.action])
        console.log('----cart',state)
        // update cart item count
        // Panier <span class="cart-items-count" [hidden]="!cardItemsSz">{{cardItemsSz}}</span>        

      },
      error=>{
        console.log('CART',error);
      }
    )
    
  } 

  doSetCurrentShippingDay($event:any,current:Date,idx:number){
    this.$cart.setShippingDay(current);
    this.shipping.setSelectedIndex(idx);    
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

  handleToolbarChange(position:number){
    
    //
    // desktop
    // if(this.toolbar.flexible){
    //   if(position===0&&this.section){
    //     this.section.nativeElement.style.height='56px';
    //     this.section.nativeElement.style.minHeight='56px';
    //   }  
    // }

    //
    // mobile
    // if(!this.toolbar.flexible){
    //   if(position===1&&this.section){
    //     this.section.nativeElement.style.height='56px';
    //     this.section.nativeElement.style.minHeight='56px';
    //   }  
    // }    
    
  }

}
