import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { i18n } from '../shared';


import {
  LoaderService,
  DocumentService,
  Document,
  User,
  Config
}  from 'kng2-core';

@Component({
  selector: 'kng-document',
  templateUrl: './kng-document.component.html',
  styleUrls: ['./kng-document.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngDocumentComponent implements OnInit {

  //
  // common
  isReady: boolean = false;
  config: Config;
  user:User;

  //
  // document context
  create:boolean;
  document:Document;
  furthermore:Document[]=[];

  constructor(
    public $fb: FormBuilder,
    public $i18n:i18n,
    public $document: DocumentService,
    public $loader: LoaderService,
    public $route: ActivatedRoute    
  ) { 
    this.create=this.$route.snapshot.data.create;
  }

  getCategories() {
    return this.$document.getCategories();
  };

  
  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.isReady = true;
      this.config = loader[0];
      this.user=loader[1];
      this.document=new Document();

      this.$route.params.subscribe(params => {        
        if(!params['slug']){
          return;
        }
        this.$document.get(params['slug']).subscribe(content=>{
          this.document=content;
          this.furthermore=this.$document.loaded(content.type);
        });
      });            
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
    content:any;
    form: any;
  }

  ngOnInit(){    
    super.ngOnInit();
    //
    // init edit struct
    this.edit={
      form:null,
      content:{}
    };
    
    //
    // init formBuilder
    this.edit.form=this.$fb.group({
      'title':['', [Validators.required]],
      'header':['', [Validators.required]],
      'body':['', [Validators.required]],
      'available':['', []],
      'type': ['', [Validators.required]]
    });        
  }

  onSave(){
    console.log(this.edit.form.value);

  }
}