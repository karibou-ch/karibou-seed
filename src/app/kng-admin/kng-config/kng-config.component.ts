import { Component, OnInit,OnDestroy, Inject } from '@angular/core';

import { KngNavigationStateService, i18n, KngUtils } from '../../common';

import { MdcSnackbar, MdcDialogComponent, MdcDialogRef, MDC_DIALOG_DATA, MdcDialog, MdcDialogConfig } from '@angular-mdc/web';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import {
  DocumentService,
  LoaderService,
  ConfigService,
  Config,
  UserAddress,
  DocumentHeader
}  from 'kng2-core';

import { forkJoin ,  concat } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
// import { ConsoleReporter } from 'jasmine';
// import { mergeMap, filter } from 'rxjs/operators';


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
    public $dlg: MdcDialog,
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $loader: LoaderService,
    public $route:ActivatedRoute,
    public $snack:MdcSnackbar,
    public $navigation:KngNavigationStateService
  ) { 
    this.$navigation.isAdminLayout=true;
    this.isLoading=false;
    let loader=this.$route.snapshot.data.loader;
    this.config=loader[0];      
    this.config.shared.maintenance.reason=this.config.shared.maintenance.reason||{};
    this.config.shared.welcome.message=this.config.shared.welcome.message||{};
    this.config.shared.header.message=this.config.shared.header.message||{};
    this.config.shared.checkout.address=this.config.shared.checkout.address||{};
    this.config.shared.checkout.payment=this.config.shared.checkout.payment||{};
    this.config.shared.checkout.message=this.config.shared.checkout.message||{};

    this.ngConstruct();

  }

  ngConstruct(){

  }

  ngOnInit() {
    //
    // set navigation layout
    this.$navigation.isAdminLayout=true;  
    this.formatDates();
    this.buildMenu();    
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

  formatDates(){
    let format=(d:Date)=>{
      d=new Date(d);
      let month=("0" + (d.getMonth() + 1)).slice(-2);
      let day=("0" + d.getDate()).slice(-2);
      //return day+'-'+month+'-'+d.getFullYear();
      return d.getFullYear()+'-'+month+'-'+day;
    }
    (this.config.shared.noshipping||[]).forEach(noshipping=>{
      noshipping.from=format(<Date>noshipping.from);
      noshipping.to=format(<Date>noshipping.to);
    })
  }

  ngOnDestroy(){
    this.$navigation.isAdminLayout=false;
    this.isLoading=false
  }


  onDialogOpen(dialog){
    dialog.done(dlg=>{
      if(dlg.state()=='rejected'){
        this.$snack.show(this.$i18n.label().img_max_sz,"OK")
      }
    })
  }

  ucValidator(info){
      if (info.size !== null && info.size > 150 * 1024) {
      throw new Error("fileMaximumSize");
    }  
  }


  onUpload(info:any,key:string){
    if(!this.config.shared.home[key]){
      return;    
    }
    this.config.shared.home[key].image=info.cdnUrl;
    this.onConfigSave();
  }
  
  onClear(key:string){
    if(!this.config.shared.home[key]){
      return;    
    }
    this.config.shared.home[key].image=null;
    this.onConfigSave();
  }

  onConfigSave(){
    this.isLoading=true;
    this.$config.save(this.config).subscribe(
      ()=>{
        this.formatDates();
        this.$snack.show(this.$i18n.label().save_ok,"OK")
      },(err)=>this.$snack.show(err.error,"OK"),
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
  selector: 'kng-information',
  templateUrl: './kng-information.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngInformationCfgComponent extends KngConfigComponent {
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
    
    this.$document.getAll(true).subscribe((docs:DocumentHeader[])=>{
      this.contents=docs;
    },err=>this.$snack.show(err.error));
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
  templateUrl: './kng-navigation-dlg.component.html',
  styleUrls: ['./kng-config-dlg.component.scss']
})
export class KngNavigationDlgComponent {
  constructor(
    public $dlgRef: MdcDialogRef<KngNavigationDlgComponent>,
    public $fb: FormBuilder,
    public $i18n:i18n,
    @Inject(MDC_DIALOG_DATA) public data:any
    ) { 
      this.menu=data;
    }

    menu:any;

  //
  // init formBuilder
  form=this.$fb.group({
    'weight':['', [Validators.required]],
    'active':['', []],
    'group': ['', [Validators.required]],
    'name': ['', [Validators.required]],
    'url': ['', [Validators.required]]
  });    

  askSave(){
    if (this.form.invalid) {
      return;
    }
   
    this.$dlgRef.close(this.form.value);

  }

  askDelete() {
    this.$dlgRef.close();
  }

  askDecline() {
    this.$dlgRef.close();
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
      this.buildMenu();
    },
    (err)=>this.$snack.show(err.error,"OK"),
    ()=>this.isLoading=false
    );  
    return false;
  }

  onDecline(){
    this.edit.menu=null;
  }


  onSave(value){
     let toSave=-1;
    this.isLoading=true;

    //
    // save specific menu
    this.assign(value);
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
      this.buildMenu();
    },
    (err)=>this.$snack.show(err.error,"OK"),
    ()=>this.isLoading=false);  
    return false;
  }
  onMenuCreate(){
    this.edit.menu={name:{fr:'',en:null,de:null}};
    const dialogRef = this.$dlg.open(KngNavigationDlgComponent, {
      data:this.edit.menu
    });
    dialogRef.afterClosed().subscribe(value => {
      this.onSave(value);
    });
  }

  onMenuSelect($event,menu){
    this.edit.menu=menu;
    const dialogRef = this.$dlg.open(KngNavigationDlgComponent, {
      data:this.edit.menu
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== 'close') {
        this.onSave(result);
      } else {
        this.onDecline();
      }
    });

  }  
  
}

@Component({
  templateUrl: './kng-deposit-dlg.component.html',
  styleUrls: ['./kng-config-dlg.component.scss'],
  
})
export class KngDepositDlgComponent{

  pubMap:string;
  STATIC_MAP:string="https://maps.googleapis.com/maps/api/staticmap?";

  constructor(
    public $http:HttpClient,
    public $dlgRef: MdcDialogRef<KngDepositDlgComponent>,
    public $fb: FormBuilder,
    public $i18n:i18n,
    @Inject(MDC_DIALOG_DATA) public data:any
  ) { 
    this.address= data.edit.address;
    this.idx = data.edit.idx;
    this.pubMap = data.pubMap;
  }

  address:any;
  idx: any;

  //
  // init formBuilder
  // init formBuilder
  form=this.$fb.group({
    'weight':['', [Validators.required,Validators.min(0)]],
    'active':['', []],
    'name': ['', [Validators.required]],
    'streetAddress': ['', [Validators.required,Validators.minLength(4)]],
    'floor': ['', [Validators.required,Validators.minLength(1)]],
    'postalCode': ['', [Validators.required,Validators.minLength(4)]],
    'region': ['', [Validators.required]],
    'note': ['', [Validators.required]],
    'fees': ['', [Validators.required,Validators.min(0)]]
  });

  ngOnInit(){    
    this.updateMap();
  }

  askSave(){
    if (this.form.invalid) {
      return;
    }
   
    this.$dlgRef.close(this.form.value);

  }

  askDelete() {
    this.$dlgRef.close();
  }

  askDecline() {
    this.$dlgRef.close();
  }

  getStaticMap(address:UserAddress){
    return KngUtils.getStaticMap(address,this.pubMap);    
  }


  updateMap(){
    let lastlen=0,newlen;
    //
    console.log(this.form);
    //console.log(value.streetAddres);
    this.form.valueChanges.subscribe(value => {
      newlen=[value.streetAddress,value.postalCode,value.region].join(',').length;
      if(Math.abs(lastlen-newlen)<2||
        !value.name||
        !value.streetAddress||
        !value.postalCode||
        !value.region){
        return;
      }
      lastlen=newlen;
      console.log('form add change',value)
      // get geo only if last value changed more than 3 chars
      KngUtils.getGeoCode(this.$http,value.streetAddress,value.postalCode,value.region,this.pubMap).subscribe((result)=>{
        console.log('form geo change',result.geo.location)
        if(!result.geo.location){return;}
        this.address.geo={
          lat:result.geo.location.lat,
          lng:result.geo.location.lng
        }
      });        
    });

  }

}



@Component({
  selector: 'kng-deposit',
  templateUrl: './kng-deposit.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngDepositComponent extends KngConfigComponent {

  pubMap:string;
  //
  // edit content
  edit:{
    idx:number;
    address:any;
    form: any;
  }
  
  
  assign(value){
    let lang=this.$i18n.locale;
    this.edit.address.fees=value.fees;
    this.edit.address.weight=value.weight;
    this.edit.address.name=value.name;
    // FIXME streetAddress vs streetAdress !
    this.edit.address.streetAdress=value.streetAddress;
    this.edit.address.floor=value.floor;
    this.edit.address.postalCode=value.postalCode;
    this.edit.address.region=value.region;
    this.edit.address.note=value.note;    
    this.edit.address.active=value.active;    
  }

  ngConstruct(){
    //
    // init edit struct
    this.edit={
      idx:null,
      form:null,
      address:null
    };
  }
  
  ngOnInit(){
    super.ngOnInit();
    this.pubMap=this.config.shared.keys.pubMap;
  }

  getStaticMap(address:UserAddress){
    return KngUtils.getStaticMap(address,this.pubMap);    
  }

  onDelete($event){
    if(this.edit.idx==null){
      // FIXME place the string in our i18n service
      return window.alert('Impossible de supprimer cet élément');
    }
    this.config.shared.deposits.splice(this.edit.idx, 1);
    this.$config.save(this.config).subscribe(()=>{
      this.edit.address=null;
      this.$snack.show(this.$i18n.label().save_ok,"OK");
      //this.dlgEdit.dialogRef.close();        
    },
    (err)=>this.$snack.show(err.error,"OK"));  
    return false;
  }

  onDecline(){
    this.edit.idx=null;
    this.edit.address=null;
   // this.dlgEdit.dialogRef.close();    
  }


  //
  // save specific address
  onSave(value){
    this.assign(value);
    if(this.edit.idx==null){
      this.config.shared.deposits=this.config.shared.deposits||[];
      this.edit.idx=this.config.shared.deposits.push({})-1;
    }
    Object.assign(this.config.shared.deposits[this.edit.idx],this.edit.address);

    this.$config.save(this.config).subscribe(()=>{
      this.edit.address=null;
      this.$snack.show(this.$i18n.label().save_ok,"OK");
     // this.dlgEdit.dialogRef.close();      
    },
    (err)=>this.$snack.show(err.error,"OK"));  
    return false;
  }
  onAddressCreate(){
    this.edit.idx=null;
    this.edit.address={};
    this.edit.address.fees=0;
    const dialogRef = this.$dlg.open(KngDepositDlgComponent, {
      data:this.edit
    });
    dialogRef.afterClosed().subscribe(value => {
       this.onSave(value);    
  })
}

  onAddressSelect($event,address,i){
    this.edit.idx=i;
    this.edit.address=address;
    this.edit.address=address;
    const dialogRef = this.$dlg.open(KngDepositDlgComponent, {
      data:{
        pubMap:this.pubMap,
        edit:this.edit
      }      
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== 'close') {
        this.onSave(result);
      } else {
        this.onDecline();
      }
    });

  

  }  
  
}
