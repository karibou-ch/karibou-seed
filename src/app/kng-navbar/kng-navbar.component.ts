import { Component, OnInit, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Config, LoaderService, User, UserService } from 'kng2-core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';

@Component({
  selector: 'kng-navbar',
  templateUrl: './kng-navbar.component.html',
  styleUrls: ['./kng-navbar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngNavbarComponent implements OnInit {


  //
  // howto resp navbar
  // 1. https://stackoverflow.com/questions/38209713/how-to-make-a-responsive-nav-bar-using-angular-material-2
  // 2. https://github.com/trimox/angular-mdc-web/tree/master/src/demo-app/navigation

  config:Config;
  user:User;
  isReady:boolean;
  isFixed: boolean = true;  
  @ViewChild('drawer') drawer: any;

  @Input() image:string;
  @Input() title:string;
  @Input() subtitle:string;


  constructor(
    private $loader:LoaderService,
    private $media:ObservableMedia,
    private $user:UserService
  ) {
    this.isReady=false;
    this.user=new User();
    this.config=new Config();
  }
 
  
  ngOnInit() {
    //
    // karibou.ch context is ready
    this.$loader.ready().subscribe(loader=>{
      Object.assign(this.config, loader[0]);
      Object.assign(this.user, loader[1]);
      this.isReady=true;
      //
      // home.about|footer|shop|siteName|tagLine
      //  - p,h,image
      //    - fr,en
      if(!this.image){
        this.image=this.config.shared.home.tagLine.image;
        this.subtitle=this.config.shared.home.about.h.fr;
        console.log('-------------',this.config,this.image)
      }
    });
  } 

  toggleDrawer() {
    this.drawer.open();
  }


  handleToolbarChange($event:any){
    // if($event===0){
    //     return this.image=undefined;      
    // }
    // this.image=this.config.shared.home.tagLine.image;
    
  }

}
