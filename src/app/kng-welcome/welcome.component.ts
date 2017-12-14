import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { LoaderService, User, UserService, Category, CategoryService } from 'kng2-core';

@Component({
  selector: 'kng-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  categories:Category[];
  user:User;
  isReady:boolean;

  constructor(
    private $loader:LoaderService,
    private $user:UserService
  ) {
    this.isReady=false;
    this.user=new User();
    this.categories=[];
  }
 
  
  ngOnInit() {
    //
    // karibou.ch context is ready
    this.$loader.ready().subscribe(loader=>{
      Object.assign(this.user, loader[1]);
      this.categories=loader[2]||[];
      this.isReady=true;
    });
  } 

  doLogin(username:string,password:string){
    console.log('---------------',username,password)
  }

  getCategories(){
    return this.categories.filter(c=> c.active&&c.type==='Category').sort(this.sortByWeight);
  }

  sortByWeight(cat:Category){
    return -cat.weight;
  }
}
