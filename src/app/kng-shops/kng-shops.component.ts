import { Component, OnInit } from '@angular/core';
import { i18n, KngUtils } from '../common';
import { Config, User, Shop, PhotoService, Product, ProductService, Category } from 'kng2-core';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from 'kng2-core';
import { merge, combineLatest } from 'rxjs';


//
// layout example
// https://www.instacart.com/whole-foods/aisles/594-bread

@Component({
  selector: 'kng-shops',
  templateUrl: './kng-shops.component.html',
  styleUrls: ['./kng-shops.component.scss']
})
export class KngShopsComponent implements OnInit {

  user:User;
  config:Config;
  categories:Category[];
  
  photos=[];
  urlpath:string;
  error:string;
  vendor:Shop=new Shop();
  products: Product[];

//
  // generating dynamic background image url 
  bgGradient=`linear-gradient(
    rgba(100, 100, 100, 0.15),
    rgba(0, 0, 0, 0.6)
  ),`;  


  i18n:any={
    fr:{
      map_title:"Infos pratiques",
      faq:"Retrouvez la liste des questions fréquentes (FAQ)",
      products_title:"Mes produits",
      products_subtitle:"Retrouvez tous mes produits dans le marché en ligne karibou.ch"
    },
    en:{
      map_title:"Infos pratiques",
      faq:"Frequently asked questions (FAQ)",
      products_title:"My products",
      products_subtitle:"My products are also available on the marketlace karibou.ch"
    }
  }

  constructor(
    public $i18n: i18n,
    public $photo: PhotoService,
    public $shop: ShopService,
    public $product:ProductService,
    public $route: ActivatedRoute
  ) { 
    let loader=this.$route.snapshot.data.loader;
    this.config=<Config>loader[0];
    this.user=<User>loader[1];
    this.categories=loader[2];      

    this.urlpath=this.$route.snapshot.params.urlpath;
    this.products=[];
  }


  ngOnDestroy(){
    //
    // class shop would change the mdc-content behavior
    document.body.classList.remove('shop');
  }

  ngOnInit() {
    // this.$photo.shops({active:true,random:40}).subscribe((photos:any)=>{
    //   this.photos=photos.map(shop=>shop.photo.fg);
    // })
    let options={
      _popular:true,
      available:true,
      shopname:this.urlpath
    };

    combineLatest(
      this.$shop.get(this.urlpath),
      this.$product.select(options)    
    ).subscribe(([vendor,products]:[Shop,Product[]])=>{
      document.body.classList.add('shop');
      Object.assign(this.vendor,vendor);
      this.products=products.sort((a,b)=>{
        return b.stats.score-a.stats.score;
      }).slice(0,18);;
    },error=>{
      this.error=error.error;
    });

    //
    // FIXME remove ugly hack
    setTimeout(()=>{
      try{window.scroll(0,0);}catch(e){}
    },100)

  }

  getCleanPhone(phone:string){
    if (!phone) return "";
    return  phone.replace(/[\.;-]/g, '');
  }

  getStaticMap(address){
    if(!this.config.shared||!this.config.shared.keys.pubMap){
      console.log('--ERROR: config.shared.keys.pubMap ');
      return;
    }
    let pubMap=this.config.shared.keys.pubMap;
    return KngUtils.getStaticMap(address,pubMap,'400x200');    
  }  

  get locale(){
    return this.$i18n.locale;
  }
}
