import { Component, OnInit } from '@angular/core';
import { LoaderService, User, UserService } from 'kng2-core';

@Component({
  selector: 'kng-navbar',
  templateUrl: './kng-navbar.component.html',
  styleUrls: ['./kng-navbar.component.scss']
})
export class KngNavbarComponent implements OnInit {


  //
  // howto
  // 1. https://stackoverflow.com/questions/38209713/how-to-make-a-responsive-nav-bar-using-angular-material-2

  user:User;
  isReady:boolean;

  constructor(
    private $loader:LoaderService,
    private $user:UserService
  ) {
    this.isReady=false;
    this.user=new User();
  }
 
  
  ngOnInit() {
    //
    // karibou.ch context is ready
    this.$loader.ready().subscribe(loader=>{
      Object.assign(this.user, loader[1]);
      this.isReady=true;
    });
  } 

  handleToolbarChange(event:any){
    
  }

}
