import { Component, ElementRef, OnInit, OnDestroy, Input, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Config, LoaderService, User, UserService,Category } from 'kng2-core';

import { KngNavigationService } from './kng-navbar.service';
import { MdcToolbar } from '@angular-mdc/web';

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
  private route$:any;

  //
  // content
  store:string;
  image:string;
  title:string;
  subtitle:string;
  content:any;
  categories:Category[];
  isFixed: boolean = true;
  @ViewChild('menu') menu: any;
  @ViewChild('cart') cart: any;
  @ViewChild('section') section:ElementRef;
  @ViewChild('toolbar') toolbar:MdcToolbar;

  constructor(
    private $loader:LoaderService,
    private $route: ActivatedRoute,
    private $user:UserService,
    private $navigation:KngNavigationService
  ) {
    this.user=new User();
    this.config=new Config();
  }
 
  
  ngOnInit() {
    //
    // karibou.ch context is ready
    this.$loader.ready().subscribe(loader=>{
      Object.assign(this.config, loader[0]);
      Object.assign(this.user, loader[1]);
      this.categories=loader[2];
      //
      // home.about|footer|shop|siteName|tagLine
      //  - p,h,image
      //    - fr,en
      this.image=this.config.shared.home.tagLine.image;
      this.subtitle=this.config.shared.home.about.h.fr;
      this.$navigation.init(this.config,this.categories);
      this.store=this.$navigation.store;
      this.content=this.$navigation.dispatch(this.$route.snapshot.url,this.$route.snapshot.params);
      

    });

    this.route$ = this.$route.params.subscribe(params => {
      //
      // dispatch action to load the details here.
      // this.content=this.$navigation.dispatch(this.$route.snapshot.url,params);
    });      
  } 

  getShippingWeek(){
    if(!this.config.shared.order){
      return [];
    }
    return ['Di','Lu','Ma','Me','Je','Ve','Sa'].map((day,i)=>{
      return (this.config.shared.order.weekdays.indexOf(i)>-1)?
        {label:day,state:''}:{label:day,state:'disabled'};
    });
  }
  getShippingDays(){
    return this.config.shared.shippingweek||[];
  }

  isMobile(){
    return this.$navigation.isMobileOrTablet();
  }

  isAppReady(){
    return this.$navigation.store !== undefined;    
  }

  getMenus(){
    return this.$navigation.getMenus();
  }

  getMenuItems(group:string){
    return this.$navigation.getMenuItems(group);
  }

  ngOnDestroy() {
    this.route$.unsubscribe();
  }

  toggleMenu() {
    if(!this.menu.isOpen()){
      this.menu.open();
    }else{
      this.menu.close()
    }
  }

  toggleCart() {
    if(!this.cart.isOpen()){
      this.cart.open();
    }else{
      this.cart.close()
    }
  }

  handleMenuSelect($event:any){
    
  }

  handleToolbarChange(position:number){
    //
    // desktop
    if(this.toolbar.flexible){
      if(position===0&&this.section){
        this.section.nativeElement.style.height='48px';
        this.section.nativeElement.style.minHeight='48px';
      }  
    }

    //
    // mobile
    if(!this.toolbar.flexible){
      if(position===1&&this.section){
        this.section.nativeElement.style.height='48px';
        this.section.nativeElement.style.minHeight='48px';
      }  
    }    
    
  }

}
