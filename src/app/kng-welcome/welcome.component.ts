import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MdcTemporaryDrawer, MdcPersistentDrawer } from '@angular-mdc/web';

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
  image:string;

  @ViewChild('temporary') temporaryDrawer: MdcTemporaryDrawer;
  @ViewChild('persistent') persistentDrawer: MdcPersistentDrawer;

  constructor(
    private $loader:LoaderService,
    private $user:UserService
  ) {
    this.isReady=false;
    this.user=new User();
    this.categories=[];
    //
    // 
    this.image='https://d2d8wwwkmhfcva.cloudfront.net/1920x/filters:quality(50)/d2lnr5mha7bycj.cloudfront.net/warehouse/background_image/1/27ad618f-fa8c-46bf-be99-2d08f76197cc.jpg';
  }


  handleTemporary() {
    this.temporaryDrawer.open();
  }
  handlePersistent() {
    !this.persistentDrawer.isOpen() ? this.persistentDrawer.open() : this.persistentDrawer.close();
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
