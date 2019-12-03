import { Component, OnDestroy,OnInit, Inject } from '@angular/core';
import {
  CategoryService,
  Category,
  LoaderService,
}  from 'kng2-core';

import { KngNavigationStateService, i18n } from '../../common';
import { MdcSnackbar, MdcDialogComponent, MdcRadioChange, MDC_DIALOG_DATA, MdcDialogRef, MdcDialog } from '@angular-mdc/web';
import { FormBuilder, Validators } from '@angular/forms';
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

  
  constructor(
    private $i18n:i18n,
    private $loader: LoaderService,
    private $category: CategoryService,
    private $route:ActivatedRoute,
    private $snack:MdcSnackbar,
    private $navigation:KngNavigationStateService,
    public $dlg: MdcDialog,
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

  onSave(value : any){
    //
    // copy data 

    // FIXME radio button is not working
      delete value.type;
    Object.assign(this.edit.category,value)
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
        // FIXME, verify IF name != old.name =>  update SLUG
        // this.categories.find()
        this.$snack.open(this.$i18n.label().save_ok,"OK")
      },
      (err)=>this.$snack.open(err.error,"OK")
    );
  }

 
  onDecline(){
    this.edit.category=null;
  }

  onDelete(){
    let position=-1;
    let pwd=window.prompt(this.$i18n.label().user_confirm_password,"CONFIRMER AVEC LE PASSWORD");
    // FIXME, server should always respond an JSON (simple string like "OK" hang)
    let onOk=()=>{
      this.$snack.open(this.$i18n.label().delete_ok,"OK");
      position=this.categories.findIndex(elem=>elem.slug==this.edit.category.slug);
      if(position>-1){
        this.categories.splice(position, 1);
      }
      
      // this.$dlg.close(); FIXME ici on ferme la fenêtre mais pas dans kng_config
      this.edit.create=false;
      this.edit.category=null;
    }

    this.$category.remove(this.edit.category.slug,pwd).subscribe(
      ()=>onOk,
      (err)=>{
        if(err.status==200){
          return onOk();
        }
        this.$snack.open(err.error,"OK")
      }
    );
  }

  onCategorySelect($event,category){
    this.edit.category=category;
    this.edit.create=false;
   
    const dialogRef = this.$dlg.open(KngCategoryDlgComponent, {
      data:this.edit.category
    });

    dialogRef.afterClosed().subscribe(result => {
      // on delete
      if (result === 'delete') {
        return this.onDelete();
      }
      // on Save
      if (typeof result === 'object') {
        return this.onSave(result);
      }
      // on close
      this.onDecline();
    });

   
  }

  onCategoryCreate(){
    this.edit.category=new Category();
    this.edit.category.usedBy=[];
    this.edit.create=true;
    const dialogRef = this.$dlg.open(KngCategoryDlgComponent, {
      data:this.edit.category
    });
    dialogRef.afterClosed().subscribe(result => {
      if (typeof result === 'object') {
            this.onSave(result);
      } else{
            this.onDecline();
      }
  })
  }

  onDialogOpen(dialog){
    dialog.done(dlg=>{
      if(dlg.state()=='rejected'){
        this.$snack.open(this.$i18n.label().img_max_sz,"OK")
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



@Component({
  templateUrl: './kng-category-dlg.component.html',
  styleUrls: ['./kng-categories.component.scss']
})
export class KngCategoryDlgComponent {
  constructor(
    public $dlgRef: MdcDialogRef<KngCategoryDlgComponent>,
    public $fb: FormBuilder,
    public $i18n:i18n,
    @Inject(MDC_DIALOG_DATA) public category:any
    ) { 
      this.category = category;
    }

    //
    // edit.category
    // edit.id
    //category:any;

  //
  // init formBuilder
  form=this.$fb.group({
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

  askSave(){
    if (this.form.invalid) {
      return;
    }
   
    this.$dlgRef.close(this.form.value);

  }

  askDelete() {
    this.$dlgRef.close('delete');
  }

  askDecline() {
    this.$dlgRef.close();
  }

   // FIXME radio button is not working
   onTypeChange(evt: MdcRadioChange,value:string): void {
    this.category.type = value;
  }  

}
