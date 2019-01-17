import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MdcSnackbar } from '@angular-mdc/web';


import { mergeMap, filter } from 'rxjs/operators';

// import { forkJoin } from 'rxjs/observable/forkJoin';
// import { zip } from 'rxjs/observable/zip';
// import { merge } from 'rxjs/observable/merge';


import { i18n } from '../common';


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
    let loader=this.$route.snapshot.data.loader[0];
    this.document=this.$route.snapshot.data.loader[1];
    this.config=<Config>loader[0];
    this.user=<User>loader[1];
    this.isReady = true;    
  }


  getCategories() {
    return this.$document.getCategories();
  };

  //
  // check for mandatory fields
  isDocumentReady(){
    return this.document.title[this.locale]&&this.document.type&&this.document.signature;
  }

  ngOnDestroy(){
    document.body.style.overflowY='auto';
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
      
      //
      // on open page => force scroll to top
      setTimeout(()=>{
        try{window.scroll(0,0);}catch(e){}
      },100);      
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
    document.body.style.overflowY='hidden';
    //document.body.classList.add('mdc-dialog-scroll-lock');

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
      this.edit.lastupdate=Date.now();
      this.onSave(false,false)
    });
    
  }

  doDelete(){
    let password="";

    //
    // confirm delete
    if(!confirm("Voulez-vous vraiment supprimer l'élément ?")){
      return;
    }
    this.$document.remove(this.document.slug[0],password).subscribe(
      ()=>{
        this.$snack.show(this.$i18n.label().save_ok,this.$i18n.label().thanks,this.$i18n.snackOpt);
        this.$router.navigate(['../']);
      },
      err=>this.$snack.show(err.error)
    )
  }
  
  removeSlug(idx:number){
    if(this.document.slug.length<2){
      return
    }
    this.document.slug.splice(idx,1);
    this.onSave(false,false);
  }

  onShow(){
    if(!this.edit.form.valid){
      return;
    }

    // save and close
    this.onSave(true,true);
  }

  onSave(closeAfter:boolean=false,displaySnack:boolean=true){
    if(!this.edit.form.valid){
      return;
    }
    // sync    
    this.document.style=this.edit.form.value.style;
    this.document.type=this.edit.form.value.type;
    this.document.available=this.edit.form.value.available;
    this.document.published=this.edit.form.value.published;
    this.document.signature=this.edit.form.value.signature;

    // i18n 
    this.document.title[this.locale]=this.edit.form.value.title;
    this.document.header[this.locale]=this.edit.form.value.header;
    this.document.content[this.locale]=this.edit.form.value.body;

    if(this.create){
      this.$document.create(this.document).subscribe(
        (doc)=>this.onResult(doc,closeAfter,displaySnack),
        (err)=>this.onResult(err.error,closeAfter,displaySnack)
      )  
    }else{
      this.$document.save(this.document.slug[0],this.document).subscribe(
        (doc)=>this.onResult(doc,closeAfter,displaySnack),
        (err)=>this.onResult(err.error,closeAfter,displaySnack)
      )
        
    }
  }

  onDialogOpen(dialog){
    dialog.done(dlg=>{
      if(dlg.state()=='rejected'){
        this.$snack.show(this.$i18n.label().img_max_sz,"OK")
      }
    })
  }

  onUpload(info:any){
    this.document.photo.bundle.push(info.cdnUrl);
    this.onSave();
  }

  onResult(result:Document|string,closeAfter:boolean,displaySnack:boolean){
    this.create=false;
    this.edit.lastupdate=Date.now();
    if(displaySnack){
      this.$snack.show(this.$i18n[this.locale].save_ok);
    }
    if(closeAfter){
      this.$router.navigate(['../'],{ relativeTo: this.$route });
    }
  }

  ucValidator(info){
    if (info.size !== null && info.size > 150 * 1024) {
    throw new Error("fileMaximumSize");
  }  
}

}