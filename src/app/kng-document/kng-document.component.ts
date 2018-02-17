import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


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
  isReady: boolean = false;
  config: Config;
  user:User;
  document:Document;
  furthermore:Document[]=[];

  constructor(
    private $document: DocumentService,
    private $loader: LoaderService,
    private $route: ActivatedRoute    
  ) { 

  }

  getCategories() {
    return this.config.shared.document.types;
  };
  
  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.isReady = true;
      this.config = loader[0];
      this.user=loader[1];
      if(this.$route.snapshot.params['slug']){
      }

      this.$route.params.subscribe(params => {        
        this.$document.get(params['slug']).subscribe(content=>{
          this.document=content;
          this.furthermore=this.$document.loaded(content.type);
        });
      });      
        

  });
}

}
