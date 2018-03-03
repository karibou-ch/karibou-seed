import { Component, OnInit,OnDestroy, ViewChild } from '@angular/core';

import { NavigationService } from '../../shared/navigation.service';
import { MdcSnackbar, MdcDialogComponent, MdcListItemChange } from '@angular-mdc/web';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  DocumentService,
  Document,
  LoaderService,
  ConfigService,
  User,
  Config
}  from 'kng2-core';


@Component({
  selector: 'kng-config',
  templateUrl: './kng-config.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngConfigComponent implements OnInit,OnDestroy {

  config:Config;
  menus:any[];
  groups:string[];

  i18n:any={
    delete_ok:'Suppression effectuée',
    save_ok:'Sauvegarde effectuée'
  };

  

  constructor(
    public $fb: FormBuilder,
    public $config: ConfigService,
    public $loader: LoaderService,
    public $snack:MdcSnackbar,
    public $navigation:NavigationService
  ) { 
    this.$navigation.isAdminLayout=true;
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

  locale(){
    return 'fr';
  }

  ngOnDestroy(){
    this.$navigation.isAdminLayout=false;
  }


  onConfigSave(){
    this.$config.save(this.config).subscribe(()=>{
      this.$snack.show(this.i18n.save_ok,"OK");
    },
    (err)=>this.$snack.show(err._body,"OK"));      
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
  selector: 'kng-site-content',
  templateUrl: './kng-content.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngSiteContentComponent  {
  config:Config;
  contents:Document[];

  constructor(
    public $fb: FormBuilder,
    public $document: DocumentService,
    public $loader: LoaderService,
    public $snack:MdcSnackbar,
    public $navigation:NavigationService
  ) { 
    this.$navigation.isAdminLayout=true;
  }

  ngOnInit() {
    //
    // set navigation layout
    this.$navigation.isAdminLayout=true;
    
    
    this.$loader.ready().subscribe(result=>{
      this.config = result[0];

      this.$document.select('admin').subscribe(
        (contents)=>{
          this.contents=contents;
        }
      )
    });
  }

  ngOnDestroy(){
    //
    // set navigation layout
    this.$navigation.isAdminLayout=false;

  }
  
}


@Component({
  selector: 'kng-site',
  templateUrl: './kng-site.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngSiteComponent extends KngConfigComponent {
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
    this.edit.menu.weight=value.weight;
    this.edit.menu.name.fr=value.name;
    this.edit.menu.url=value.url;
    this.edit.menu.group=value.group;
    this.edit.menu.active=value.active;    
  }
  
  ngOnInit(){
    super.ngOnInit()
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
  onDelete($event){
    let toRemove=this.findMenuItem(this.edit.menu);
    if(toRemove===-1){
      return window.alert('Ooops');
    }

    this.config.shared.menu.splice(toRemove, 1);
    this.$config.save(this.config).subscribe(()=>{
      this.edit.menu=null;
      this.$snack.show(this.i18n.save_ok,"OK");
      this.dlgEdit.close();        
      this.buildMenu();
    },
    (err)=>this.$snack.show(err._body,"OK"));  
    return false;
  }

  onDecline(){
    this.edit.menu=null;
    this.dlgEdit.close();    
  }


  onSave($event){
    let toSave=-1;

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
      this.$snack.show(this.i18n.save_ok,"OK");
      this.dlgEdit.close();      
      this.buildMenu();
    },
    (err)=>this.$snack.show(err._body,"OK"));  
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
