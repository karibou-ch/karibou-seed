import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import {
  CategoryService,
  Category,
  LoaderService,
  User,
  UserService,
  config
}  from 'kng2-core';

@Component({
  selector: 'kng-category-edit',
  templateUrl: './kng-category-edit.component.html',
  styleUrls: ['./kng-category-edit.component.scss']
})
export class KngCategoryEditComponent implements OnInit {

  create:boolean=false;
  errors:any;

  // TODO, note, je propose que tous les instances des services Kng2-core
  // soient préfixés par $ (c'est pour éviter le suffix Srv)
  constructor(
    private $loader: LoaderService,
    private $category: CategoryService,
    private route:ActivatedRoute
  ){

  }

  //
  // optional input (instance of Category, or )
  @Input() slug:string;
  currentUser:User;
  isReady:boolean;
  config:any;
  category:Category=new Category();


  ngOnInit() {
    // TIPS: If you expect users to navigate from bank to bank directly,
    // without navigating to another component first, you ought
    // to access the parameter through an observable:
    // this.route.params.subscribe( params =>
    //     this.slug = params['slug'];
    // )
    this.$loader.ready().subscribe(ready=>{
      this.isReady=true;
      this.config=ready[0];
      this.currentUser=ready[1];

      //
      // on category creation there is no slug available
      this.create=this.route.snapshot.data.create;
      if(this.create){
        return;
      }
      //
      // two options for slug initialisation : 1) Input, 2) URL
      if(!this.slug){
        this.slug=this.route.snapshot.params['slug'];
      }

      //
      // TODO manage on Error user feedback!
      this.$category.findBySlug(this.slug).subscribe(cat=>this.category=cat)

    });
  }

  onSave(){
    // TODO use error feedback for user!
    if(this.create){
      return this.$category.create(this.category).subscribe(this.noop,this.processErrors);
    }
    this.$category.save(this.slug,this.category).subscribe(this.noop,this.processErrors);
  }

  //
  // no operation function
  noop(){
    //TODO sucess info
  }

  processErrors(err){
    this.errors=err;
  }
}
