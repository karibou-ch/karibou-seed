import { Component, ElementRef, OnInit, OnDestroy, Input, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Config, ConfigService, LoaderService, User, UserService,Category } from 'kng2-core';

import { NavigationService } from '../shared';
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
  @ViewChild('navigation') navigation: any;
  @ViewChild('cart') cart: any;
  @ViewChild('section') section:ElementRef;
  @ViewChild('toolbar') toolbar:MdcToolbar;

  constructor(
    private $config:ConfigService,
    private $loader:LoaderService,
    private $route: ActivatedRoute,
    private $user:UserService,
    public  $navigation:NavigationService
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
      console.log('---- user init',this.user.display())
      this.$navigation.updateUser(this.user);
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

    //
    // update user 
    this.$user.subscribe(
      (user:User)=>{
        console.log('---- user stream',user.display())
        Object.assign(this.user, user);        
        this.$navigation.updateUser(this.user);
      }
    );
    //
    // update config
    this.$config.subscribe(
      (config:Config)=>{
        Object.assign(this.config, config);
        this.$navigation.init(this.config,this.categories);
      }
    );
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


  isAppReady(){
    return this.$navigation.store !== undefined;    
  }

  getRouterLink(url){
    return ['/store',this.store].concat(url.split('/').filter(item=>item!==''));
  }


  ngOnDestroy() {
    //this.route$.unsubscribe();
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
