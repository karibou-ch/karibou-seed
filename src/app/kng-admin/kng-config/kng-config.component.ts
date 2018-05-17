import { Component, OnInit,OnDestroy, ViewChild } from '@angular/core';

import { KngNavigationStateService, i18n, KngUtils } from '../../shared';

import { MdcSnackbar, MdcDialogComponent, MdcListItemChange } from '@angular-mdc/web';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  DocumentService,
  Document,
  LoaderService,
  ConfigService,
  User,
  Config,
  UserAddress,
  Utils,
  DocumentHeader
}  from 'kng2-core';

import { forkJoin } from 'rxjs/observable/forkJoin';
import { concat } from 'rxjs/observable/concat';
//import { mergeMap, filter } from 'rxjs/operators';


@Component({
  selector: 'kng-config',
  templateUrl: './kng-config.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngConfigComponent implements OnInit,OnDestroy {

  config:Config;
  menus:any[];
  groups:string[];
  isLoading:boolean;

  

  constructor(
    public http:HttpClient,
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $loader: LoaderService,
    public $snack:MdcSnackbar,
    public $navigation:KngNavigationStateService
  ) { 
    this.$navigation.isAdminLayout=true;
    this.isLoading=false;
    this.ngConstruct();
  }

  ngConstruct(){

  }

  ngOnInit() {
    //
    // set navigation layout
    this.$navigation.isAdminLayout=true;
    
    
    this.$loader.ready().subscribe(result=>{
      this.config = result[0];
      this.buildMenu();    
    });
  }


  buildMenu(){
    //
    // make sure to find menu item
    // this.config.shared.menu.forEach((menu,i)=>{
    //   menu.id=menu._id||i;
    //   menu.index=i;
    // })
    this.menus=this.config.shared.menu.sort(this.sortByGroupAndWeight)
    //
    // get menu groups names
    this.groups=this.menus.map(menu=>menu.group)
    .filter((item, i, ar)=> ar.indexOf(item) === i);  
  }

  findMenuItem(item){
    return this.config.shared.menu.findIndex(m=>m._id===item._id);
    //return this.menus.find(menu=>menu.id===item.id).index;
  }

  ngOnDestroy(){
    this.$navigation.isAdminLayout=false;
    this.isLoading=false
  }

  onUpload(info:any,key:string){
    this.config.shared.home[key].image=info.cdnUrl;
    this.onConfigSave();
  }
  

  onConfigSave(){
    this.isLoading=true;
    this.$config.save(this.config).subscribe(
      ()=>this.$snack.show(this.$i18n.label().save_ok,"OK"),
      (err)=>this.$snack.show(err.error,"OK"),
      ()=>this.isLoading=false
    );      
  }

  sortByGroupAndWeight(m1,m2){
    let g1=m1.group||'';
    let g2=m2.group||'';
    if(g1===g2){
      return m1.weight-m2.weight;  
    }
    return g1.toLowerCase().localeCompare(g2.toLowerCase());
  }


}

@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngWelcomeCfgComponent extends KngConfigComponent {
}

@Component({
  selector: 'kng-home',
  templateUrl: './kng-home.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHomeComponent extends KngConfigComponent {
}

@Component({
  selector: 'kng-shop',
  templateUrl: './kng-shop.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngShopComponent extends KngConfigComponent {
}

@Component({
  selector: 'kng-page-content',
  templateUrl: './kng-page.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngPageContentComponent  {
  config:Config;
  contents:DocumentHeader[];

  constructor(
    public $fb: FormBuilder,
    public $i18n:i18n,
    public $document: DocumentService,
    public $loader: LoaderService,
    public $snack:MdcSnackbar,
    public $navigation:KngNavigationStateService
  ) { 
  }

  ngOnInit() {
    this.$navigation.isAdminLayout=true;
    //
    // set navigation layout
    // let categories=this.getCategories().map(type=>{
    //   return this.$document.select(type);
    // });
    // concat(categories).subscribe(docs=>{
    //   this.contents=docs;      
    // });



    
    this.$loader.ready().subscribe(result=>{
      this.config = result[0];
      this.$document.getAll(true).subscribe((docs:DocumentHeader[])=>{
        this.contents=docs;
      },err=>this.$snack.show(err.error));
    });
  }

  ngOnDestroy(){
    //
    // set navigation layout
    this.$navigation.isAdminLayout=false;

  }

  getCategories(){
    return this.$document.getCategories();
  }
  
}


@Component({
  selector: 'kng-navigation',
  templateUrl: './kng-navigation.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngNavigationComponent extends KngConfigComponent {
  //
  // edit content
  edit:{
    menu:any;
    form: any;
  }
  
  @ViewChild('dlgEdit') dlgEdit: MdcDialogComponent;
  
  assign(value){
    let lang=this.$i18n.locale;
    this.edit.menu.weight=value.weight;
    this.edit.menu.name[lang]=value.name;
    this.edit.menu.url=value.url;
    this.edit.menu.group=value.group;
    this.edit.menu.active=value.active;    
  }
  
  ngConstruct(){
    //
    // init edit struct
    this.edit={
      form:null,
      menu:null
    };
    
    //
    // init formBuilder
    this.edit.form=this.$fb.group({
      'weight':['', [Validators.required]],
      'active':['', []],
      'group': ['', [Validators.required]],
      'name': ['', [Validators.required]],
      'url': ['', [Validators.required]]
    });    
  }

  ngOnInit(){
    super.ngOnInit()
  }
  onDelete($event){
    this.isLoading=true;
    let toRemove=this.findMenuItem(this.edit.menu);
    if(toRemove===-1){
      return window.alert('Ooops');
    }

    this.config.shared.menu.splice(toRemove, 1);
    this.$config.save(this.config).subscribe(()=>{
      this.edit.menu=null;
      this.$snack.show(this.$i18n.label().save_ok,"OK");
      this.dlgEdit.close();        
      this.buildMenu();
    },
    (err)=>this.$snack.show(err.error,"OK"),
    ()=>this.isLoading=false
    );  
    return false;
  }

  onDecline(){
    this.edit.menu=null;
    this.dlgEdit.close();    
  }


  onSave($event){
    let toSave=-1;
    this.isLoading=true;

    //
    // save specific menu
    this.assign(this.edit.form.value);
    //
    // create this menu
    if(!this.edit.menu._id){
      toSave=this.config.shared.menu.push(this.edit.menu);
    }else{
      toSave=this.findMenuItem(this.edit.menu);
      Object.assign(this.config.shared.menu[toSave],this.edit.menu);        
    }

    //
    // never goes there!
    if(toSave===-1){
      return window.alert('Ooops, pas bien ça!');
    }
    
    this.$config.save(this.config).subscribe(()=>{
      this.edit.menu=null;
      this.$snack.show(this.$i18n.label().save_ok,"OK");
      this.dlgEdit.close();      
      this.buildMenu();
    },
    (err)=>this.$snack.show(err.error,"OK"),
    ()=>this.isLoading=false);  
    return false;
  }
  onMenuCreate(){
    this.edit.menu={name:{fr:'',en:null,de:null}};
    this.dlgEdit.show();    
    
  }

  onMenuSelect($event,menu){
    this.edit.menu=menu;
    this.dlgEdit.show();    
  }  
  
}


@Component({
  selector: 'kng-deposit',
  templateUrl: './kng-deposit.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngDepositComponent extends KngConfigComponent {

  STATIC_MAP:string="https://maps.googleapis.com/maps/api/staticmap?";
  //
  // edit content
  edit:{
    idx:number;
    address:any;
    form: any;
  }
  
  @ViewChild('dlgEdit') dlgEdit: MdcDialogComponent;
  
  assign(value){
    let lang=this.$i18n.locale;
    this.edit.address.fees=value.fees;
    this.edit.address.weight=value.weight;
    this.edit.address.name=value.name;
    this.edit.address.streetAddress=value.streetAddress;
    this.edit.address.postalCode=value.postalCode;
    this.edit.address.region=value.region;
    this.edit.address.note=value.note;    
    this.edit.address.active=value.active;    
    console.log('--update',this.edit.address)
  }
  
  ngOnInit(){
    super.ngOnInit();
    //
    // init edit struct
    this.edit={
      idx:null,
      form:null,
      address:null
    };
    
    //
    // init formBuilder
    this.edit.form=this.$fb.group({
      'weight':['', [Validators.required,Validators.min(0)]],
      'active':['', []],
      'name': ['', [Validators.required]],
      'streetAddress': ['', [Validators.required,Validators.minLength(4)]],
      'postalCode': ['', [Validators.required,Validators.minLength(4)]],
      'region': ['', [Validators.required]],
      'note': ['', [Validators.required]],
      'fees': ['', [Validators.required,Validators.min(0)]]
    });    

    this.updateMap();
  }

  updateMap(){
    let lastlen=0,newlen;
    //
    //
    this.edit.form.valueChanges.subscribe(value => {
      newlen=[value.streetAddress,value.postalCode,value.region].join(',').length;
      if(Math.abs(lastlen-newlen)<3||newlen<20||!value.name){
        return;
      }
      lastlen=newlen;
      // get geo only if last value changed more than 3 chars
      KngUtils.getGeoCode(this.http,value.streetAddress,value.postalCode,value.region).subscribe((geo)=>{
        if(!geo.location){return;}
        this.edit.address.geo={
          lat:geo.location.lat,
          lng:geo.location.lng
        }
      });        
    });

  }
  onDelete($event,){
    if(this.edit.idx==null){
      // FIXME place the string in our i18n service
      return window.alert('Impossible de supprimer cet élément');
    }
    this.config.shared.deposit.splice(this.edit.idx, 1);
    this.$config.save(this.config).subscribe(()=>{
      this.edit.address=null;
      this.$snack.show(this.$i18n.label().save_ok,"OK");
      this.dlgEdit.close();        
    },
    (err)=>this.$snack.show(err.error,"OK"));  
    return false;
  }


  getStaticMap(address:UserAddress){
    return KngUtils.getStaticMap(address);    
  }
  
  onDecline(){
    this.edit.idx=null;
    this.edit.address=null;
    this.dlgEdit.close();    
  }


  //
  // save specific address
  onSave($event){
    this.assign(this.edit.form.value);
    if(this.edit.idx==null){
      this.config.shared.deposit=this.config.shared.deposit||[];
      this.edit.idx=this.config.shared.deposit.push({})-1;
    }
    Object.assign(this.config.shared.deposit[this.edit.idx],this.edit.address);

    this.$config.save(this.config).subscribe(()=>{
      this.edit.address=null;
      this.$snack.show(this.$i18n.label().save_ok,"OK");
      this.dlgEdit.close();      
    },
    (err)=>this.$snack.show(err.error,"OK"));  
    return false;
  }
  onAddressCreate(){
    this.edit.idx=null;
    this.edit.address={};
    this.edit.address.fees=0;
    this.dlgEdit.show();    
    
  }

  onAddressSelect($event,address,i){
    this.edit.idx=i;
    this.edit.address=address;
    this.dlgEdit.show();    
  }  
  
}
