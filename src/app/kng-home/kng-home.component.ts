import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import {
  ProductService,
  Product,
  LoaderService,
  User,
  Category,
  Config
}  from 'kng2-core';


@Component({
  selector: 'kng-home',
  templateUrl: './kng-home.component.html',
  styleUrls: ['./kng-home.component.scss']
})
export class KngHomeComponent implements OnInit {
  isReady: boolean = false;
  config: Config;
  categories:Category[];
  cached:any={};
  products: Product[] = [];
  group:any={};
  user:User=new User();

  //
  // infinite scroll callback
  scrollCallback;
  currentPage:number=3;


  //
  // products for home
  // /v1/products?available=true&discount=true&home=true&maxcat=8&popular=true&status=true&when=true
  options={
    discount:true,
    home:true,
    maxcat:8,
    // popular:true,
    // available:true,
    // status:true
    when:true
  };


  constructor(
    private $loader: LoaderService,
    private $product: ProductService
  ) { 
    // bind infinite scroll callback function
    this.scrollCallback=this.getNextPage.bind(this);
  }


  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
        this.isReady = true;
        this.config = loader[0];
        Object.assign(this.user,loader[1]);
        this.categories=loader[2]||[];
        
        this.loadGroupByCategory();
    });
  }

  loadGroupByCategory() {
    this.$product.select(this.options).subscribe((products: Product[]) => {
      products.forEach(product=>{
        if(!this.group[product.categories.name]){
          this.group[product.categories.name]=[];
        }
        this.group[product.categories.name].push(product);
      });
    });
  }

  getNextPage(){
    //
    // next page can be async loaded 
    return Observable.timer(10).map(ctx=>this.currentPage++)
  }

  getCategories(){
    if(this.cached.categories && this.currentPage===this.cached.currentPage){
      return this.cached.categories;
    }
    if(!this.isReady){
      return [];
    }
    this.cached.categories=this.categories.sort(this.sortByWeight).filter((c,i)=> {
      return c.active&&(c.type==='Category');
    }).slice(0,this.currentPage);
    this.cached.currentPage=this.currentPage;
    return this.cached.categories;
  }  

  sortByWeight(a:Category,b:Category){
    return a.weight-b.weight;
  }
  
}
