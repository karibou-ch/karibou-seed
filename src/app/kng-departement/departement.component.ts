import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MdcDrawer } from '@angular-mdc/web';

import { LoaderService, User, UserService, Category, CategoryService } from 'kng2-core';

@Component({
  selector: 'kng-departement',
  templateUrl: './departement.component.html',
  styleUrls: ['./departement.component.scss']
})
export class KngDepartementComponent implements OnInit {

  categories:Category[];
  user:User;
  isReady:boolean;
  image:string;

  @ViewChild('temporary') temporaryDrawer: MdcDrawer;
  @ViewChild('persistent') persistentDrawer: MdcDrawer;

  constructor(
    private $loader:LoaderService,
    private $user:UserService
  ) {
    this.isReady=false;
    this.user=new User();
    this.categories=[];
    //
    // 
    console.log('-------------KngDepartement')
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

  getGroup(name:string){
    this.categories.filter(c=>{
      return c.group===name;
    });
  }


  doLogin(username:string,password:string){
  }

  getCategories(group?:string){
    return this.categories.filter(c=> {
      if(!group){
        return c.active&&c.type==='Category' && c.group==='';  
      }
      return c.active&&c.type==='Category' && c.group===group;
    }).sort(this.sortByWeight);
  }

  sortByWeight(cat:Category){
    return -cat.weight;
  }
}
