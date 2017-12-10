import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { LoaderService, User, UserService } from 'kng2-core';

@Component({
  selector: 'karibou-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

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

  doLogin(username:string,password:string){
    console.log('---------------',username,password)
  }
}
