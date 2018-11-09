import { Component, EventEmitter, OnDestroy,OnInit, ViewChild } from '@angular/core';
import {
  CategoryService,
  Category,
  LoaderService,
  config
}  from 'kng2-core';

import { KngNavigationStateService, i18n } from '../../shared';
import { MdcSnackbar, MdcDialogComponent, MdcListItemChange, MdcRadioChange } from '@angular-mdc/web';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'kng-categories',
  templateUrl: './kng-categories.component.html',
  styleUrls: ['./kng-categories.component.scss']
})
export class KngCategoriesComponent implements OnInit,OnDestroy {
  isReady:boolean = false;
  config:any;
  categories:Category[]=[];

  //
  // edit content
  edit:{
    category:Category;
    form: any;
    create:boolean;
    pubUpcare:string;
  }


  errors:any;

  @ViewChild('dlgEdit') dlgEdit: MdcDialogComponent;

  constructor(
    private $fb: FormBuilder,
    private $i18n:i18n,
    private $loader: LoaderService,
    private $category: CategoryService,
    private $route:ActivatedRoute,
    private $snack:MdcSnackbar,
    private $navigation:KngNavigationStateService
  ){
    
    let loader=this.$route.snapshot.data.loader;
    this.config=loader[0];      
    
    //
    // init edit struct
    this.edit={
      form:null,
      create:false,
      category:null,
      pubUpcare:this.config.shared.keys.pubUpcare
    };

  }

  ngOnInit() {
    //
    // init formBuilder
    this.edit.form=this.$fb.group({
      'weight':['', [Validators.required]],
      'active':['', []],
      'home': ['', []],
      'color':['', []],
      'image': ['', [Validators.required]],
      'group': ['', []],
      'name': ['', [Validators.required]],
      'description': ['', [Validators.required]],
      'type': ['', [Validators.required]]
    });
    
    this.$navigation.isAdminLayout=true;
    this.loadCategories()
  }

  ngOnDestroy(){
    this.$navigation.isAdminLayout=false;
  }


  getImagePrefix(image){
    if(!/^((http|https):\/\/)/.test(image)){
      return "https:"+image;
    }
  }

  loadCategories(){
    this.$category.select({stats:true}).subscribe((categories:Category[])=>{
      this.isReady=true;
      this.categories=categories.sort(this.sortByGroupAndWeight.bind(this));
    });
  }

  onSave(){
    //console.log('---------------',this.edit.form.value)
    //
    // copy data 

    // FIXME radio button is not working
    delete this.edit.form.value.type;
    Object.assign(this.edit.category,this.edit.form.value)
    let editor=(this.edit.create)?
      this.$category.create(this.edit.category):
      this.$category.save(this.edit.category.slug,this.edit.category);
    editor.subscribe(
      (category)=>{
        if(this.edit.create){
          category.usedBy=[];
          this.categories.push(category);
        }
        this.edit.category=null;
        this.edit.create=false;
        this.$snack.show(this.$i18n.label().save_ok,"OK")
      },
      (err)=>this.$snack.show(err.error,"OK")
    );
  }

  // FIXME radio button is not working
  onTypeChange(evt: MdcRadioChange,value:string): void {
    this.edit.category.type = value;
  }  

  onDecline(){
    this.edit.category=null;
  }

  onDelete(){
    let position=-1;
    let pwd=window.prompt(this.$i18n.label().password,"CONFIRMER AVEC LE PASSWORD");
    // FIXME, server should always respond an JSON (simple string like "OK" hang)
    let onOk=()=>{
      this.$snack.show(this.$i18n.label().delete_ok,"OK");
      position=this.categories.findIndex(elem=>elem.slug==this.edit.category.slug);
      if(position>-1){
        this.categories.splice(position, 1);
      }
      
      this.dlgEdit.close();
      this.edit.create=false;
      this.edit.category=null;
    }

    this.$category.remove(this.edit.category.slug,pwd).subscribe(
      ()=>onOk,
      (err)=>{
        if(err.status==200){
          return onOk();
        }
        this.$snack.show(err.error,"OK")
      }
    );
  }

  onCategorySelect($event,category){
    this.edit.category=category;
    this.edit.create=false;
    this.dlgEdit.show();
  }

  onCategoryCreate(){
    this.edit.category=new Category();
    this.edit.category.usedBy=[];
    this.edit.create=true;
    this.dlgEdit.show();
  }

  onDialogOpen(dialog){
    dialog.done(dlg=>{
      if(dlg.state()=='rejected'){
        this.$snack.show(this.$i18n.label().img_max_sz,"OK")
      }
    })
  }

  onUpload(info:any){
    if(this.edit.category.cover==info.cdnUrl){
      return;
    }
    this.edit.category.cover=info.cdnUrl;//.replace('https:','');
  }

  ucValidator(info){
    if (info.size !== null && info.size > 150 * 1024) {
    throw new Error("fileMaximumSize");
  }  
}

  sortByGroupAndWeight(c1,c2){
    let g1=c1.group||'';
    let g2=c2.group||'';
    if(g1===g2){
      return c1.weight-c2.weight;  
    }
    return g1.toLowerCase().localeCompare(g2.toLowerCase());
  }


}
