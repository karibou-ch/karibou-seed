import { Component, OnInit } from '@angular/core';
import { i18n } from '../shared';
import { Config, User, Shop, PhotoService } from 'kng2-core';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from 'kng2-core';


//
// layout example
// https://www.instacart.com/whole-foods/aisles/594-bread

@Component({
  selector: 'kng-shops',
  templateUrl: './kng-shops.component.html',
  styleUrls: ['./kng-shops.component.scss']
})
export class KngShopsComponent implements OnInit {

  config:Config;
  photos=[];
  user:User;
  urlpath:string;
  error:string;
  vendor:Shop=new Shop();

  constructor(
    public $i18n: i18n,
    public $photo: PhotoService,
    public $shop: ShopService,
    public $route: ActivatedRoute
  ) { 
    let loader=this.$route.snapshot.data.loader;
    this.config=<Config>loader[0];
    this.user=<User>loader[1];
    this.urlpath=this.$route.snapshot.params.urlpath;
  }


  ngOnInit() {
    // this.$photo.shops({active:true,random:40}).subscribe((photos:any)=>{
    //   this.photos=photos.map(shop=>shop.photo.fg);
    // })

    this.$shop.get(this.urlpath).subscribe(vendor=>{
      Object.assign(this.vendor,vendor);
    },error=>{
      this.error=error.error;
    });
  }

}
