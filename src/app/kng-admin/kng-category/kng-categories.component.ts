import { Component, EventEmitter, OnDestroy,OnInit, ViewChild } from '@angular/core';
import {
  CategoryService,
  Category,
  LoaderService,
  config
}  from 'kng2-core';

import { KngNavigationStateService, i18n } from '../../shared';
import { MdcSnackbar, MdcDialogComponent, MdcListItemChange } from '@angular-mdc/web';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  }


  errors:any;

  @ViewChild('dlgEdit') dlgEdit: MdcDialogComponent;

  constructor(
    private $fb: FormBuilder,
    private $i18n:i18n,
    private $loader: LoaderService,
    private $category: CategoryService,
    private $snack:MdcSnackbar,
    private $navigation:KngNavigationStateService
  ){
    
    //
    // init edit struct
    this.edit={
      form:null,
      category:null
    };

  }

  ngOnInit() {
    //
    // init formBuilder
    this.edit.form=this.$fb.group({
      'weight':['', [Validators.required]],
      'active':['', []],
      'home': ['', []],
      'color':['', [Validators.required]],
      'cover': ['', [Validators.required]],
      'image': ['', [Validators.required]],
      'name': ['', [Validators.required]],
      'description': ['', [Validators.required]],
      'type': ['', [Validators.required]]
    });
    
    this.$navigation.isAdminLayout=true;
    this.$loader.ready().subscribe((loader) => {
      this.isReady=true;
      this.config=loader[0];
      this.loadCategories()
    });
  }

  ngOnDestroy(){
    this.$navigation.isAdminLayout=false;
  }

  loadCategories(){
    this.$category.select({stats:true}).subscribe((categories:Category[])=>{
      this.categories=categories.sort(this.sortByGroupAndWeight.bind(this));
    });
  }

  onSave(){
    //console.log('---------------',this.edit.form.value)
    //
    // copy data 
    Object.assign(this.edit.category,this.edit.form.value)
    this.$category.save(this.edit.category.slug,this.edit.category).subscribe(
      ()=>{
        this.edit.category=null;
        this.$snack.show(this.$i18n.label().save_ok,"OK")
      },
      (err)=>this.$snack.show(err.error,"OK")
    );
  }

  onDecline(){
    this.edit.category=null;
  }

  onDelete(){
    let position=-1;
    let pwd=window.prompt(this.$i18n.label().password,"");

    this.$category.remove(this.edit.category.slug,pwd).subscribe(
      ()=>{
        this.$snack.show(this.$i18n.label().delete_ok,"OK");
        position=this.categories.findIndex(elem=>elem.slug===this.edit.category.slug);
        if(position>-1){
          this.categories.splice(position, 1);
        }
        
        this.dlgEdit.close();
        this.edit.category=null;
      },
      (err)=>this.$snack.show(err.error,"OK")
    );
  }

  onCategorySelect($event,category){
    this.edit.category=category;
    this.dlgEdit.show();
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
