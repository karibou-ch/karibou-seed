import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MdcSnackbar } from '@angular-mdc/web';


import { mergeMap, filter } from 'rxjs/operators';

// import { forkJoin } from 'rxjs/observable/forkJoin';
// import { zip } from 'rxjs/observable/zip';
// import { merge } from 'rxjs/observable/merge';


import { i18n } from '../shared';


import {
  LoaderService,
  DocumentService,
  Document,
  User,
  Config,
  DocumentHeader
}  from 'kng2-core';

@Component({
  selector: 'kng-document',
  templateUrl: './kng-document.component.html',
  styleUrls: ['./kng-document.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngDocumentComponent implements OnInit {

  //
  // i18n

  i18n:any={
    fr:{

    }
  }
  


  //
  // common
  isReady: boolean = false;
  config: Config;
  user:User;  
  locale:string;

  //
  // document context
  error:any;
  create:boolean;
  document:Document;
  furthermore:DocumentHeader[]=[];

  constructor(
    public $fb: FormBuilder,
    public $i18n:i18n,
    public $document: DocumentService,
    public $loader: LoaderService,
    public $route: ActivatedRoute,
    public $router:Router,
    public $snack:MdcSnackbar
  ) { 
    this.create=this.$route.snapshot.data.create;
    let loader=this.$route.snapshot.data.loader;
    this.config=<Config>loader[0];
    this.user=<User>loader[1];
    this.isReady = true;    
  }


  doDelete(){
    let password="";
    this.$document.remove(this.document.slug[0],password).subscribe(
      ()=>{
        console.log('---delete',this.$i18n.label().save_ok,this.$i18n.label())
        this.$snack.show(this.$i18n.label().save_ok,'OK');
        this.$router.navigate(['../']);
      },
      err=>this.$snack.show(err.error)
    )
  }
  
  getCategories() {
    return this.$document.getCategories();
  };

  //
  // check for mandatory fields
  isDocumentReady(){
    return this.document.title[this.locale]&&this.document.type&&this.document.signature;
  }

  
  ngOnInit() {
    this.document=new Document();
    this.error=null;
    
    //
    // only if /page/:slug/edit? is present
    this.$route.params.pipe(
      filter(params=>params['slug']),
      mergeMap((params)=>{
        return this.$document.get(params['slug'])
      }),
      mergeMap((doc:Document)=>{
        this.document=doc;
        return this.$document.select(doc.type,true);
      })      
    )
    .subscribe((furthermore:DocumentHeader[]) => {        
      this.furthermore=furthermore;
    },oups=>{
      this.error={msg:oups.error,slug:this.$route.snapshot.params['slug']};
    });            
  }

}

@Component({
  selector: 'kng-document-edit',
  templateUrl: './kng-document-edit.component.html',
  styleUrls: ['./kng-document.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngEditDocumentComponent extends KngDocumentComponent{
  edit:{
    form: FormGroup;
    create:boolean;
    TTS:number;
    lastupdate:number;
  }

  ngOnInit(){        
    super.ngOnInit();
    this.document.signature=this.user.display();
    this.document.created=this.document.created||new Date();
    this.locale=this.$i18n.locale;

 

    //
    // init edit struct
    this.edit={
      form:null,
      lastupdate:Date.now(),
      TTS:35000,
      create:this.$route.snapshot.data.create
    };
    
    //
    // init formBuilder
    this.edit.form=this.$fb.group({
      'title':['', [Validators.required,Validators.minLength(4)]],
      'header':['', [Validators.required,Validators.minLength(10)]],
      'body':['', [Validators.required,Validators.minLength(10)]],
      'available':['', []],
      'published':['', []],
      'signature': ['', [Validators.required,Validators.minLength(3)]],
      'type': ['', [Validators.required,Validators.minLength(3)]],
      'style': ['', []]
    });        

    this.edit.form.valueChanges.subscribe(value => {
      if(!this.edit.form.valid||
         (this.edit.lastupdate+this.edit.TTS)>Date.now()){
        return;
      }
      this.onSave()
    });
    
  }

  removeSlug(idx:number){
    if(this.document.slug.length<2){
      return
    }
    this.document.slug.splice(idx,1);
    this.onSave();
  }

  onShow(){
    if(!this.edit.form.valid){
      return;
    }

    // save and close
    this.onSave(true);
  }

  onSave(closeAfter:boolean=false){
    if(!this.edit.form.valid){
      return;
    }
    // sync    
    this.document.style=this.edit.form.value.style;
    this.document.type=this.edit.form.value.type;
    this.document.available=this.edit.form.value.available;
    this.document.published=this.edit.form.value.published;

    // i18n 
    this.document.title[this.locale]=this.edit.form.value.title;
    this.document.header[this.locale]=this.edit.form.value.header;
    this.document.content[this.locale]=this.edit.form.value.body;

    if(this.create){
      this.$document.create(this.document).subscribe(
        (doc)=>this.onResult(doc,closeAfter),
        (err)=>this.onResult(err.error,closeAfter)
      )  
    }else{
      this.$document.save(this.document.slug[0],this.document).subscribe(
        (doc)=>this.onResult(doc,closeAfter),
        (err)=>this.onResult(err.error,closeAfter)
      )
        
    }
  }
  onUpload(info:any){
    this.document.photo.bundle.push(info.cdnUrl);
    this.onSave();
  }

  onResult(result:Document|string,closeAfter:boolean){
    this.create=false;
    this.edit.lastupdate=Date.now();
    this.$snack.show(this.$i18n[this.locale].save_ok);
    this.$router.navigate(['../'],{ relativeTo: this.$route });
  }

}