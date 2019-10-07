import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


import {
  PhotoService
}  from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';

@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-welcome.component.scss'],
  encapsulation: ViewEncapsulation.None  
})
export class KngWelcomeComponent implements OnInit {

  photos=[];

  //
  //gradient of background image 
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.1),
    rgba(50, 50, 50, 0.7)
  ),`;


  i18n:any={
    fr:{
    },
    en:{
    }
  }


  stores=[
    {title:"Genève",name:"geneve",image:"http://www.davidfraga.ch/blog/wp-content/uploads/cathedraleStPierre_vignette.jpg"},
    {title:"Fribourg",name:"fribourg",image:"https://img.myswitzerland.com/mys/n64489/images/buehne/st0034724_fribourg.jpg"},
    {title:"Meyrin",name:"meyrin",image:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Eglise_Saint-Julien_%28Meyrin%29_01.jpg/1200px-Eglise_Saint-Julien_%28Meyrin%29_01.jpg"},
  ]

  config:any;

  constructor( 
    public $i18n:i18n,
    private $navigation:KngNavigationStateService,
    private $route: ActivatedRoute,
    private $photo: PhotoService
  ) { 
    let loader=this.$route.snapshot.data.loader;
    this.config=loader[0];      
    this.$photo.shops({active:true,random:40}).subscribe((photos:any)=>{
      this.photos=photos.map(shop=>shop.photo.fg);
    })
  }

  get locale(){
    return this.$i18n.locale;
  }

  _(id){
    return this.$i18n[this.locale][id];
  }


  doLangSwitch(){
    this.$i18n.localeSwitch();
  }
  getTagline(key){
    if(!this.config||!this.config.shared.home.tagLine[key]){
      return;
    }
    return this.config.shared.home.tagLine[key][this.$i18n.locale];
  }

  getWelcomeImage(){
    if(!this.config||!this.config.shared||!this.config.shared.home){
      return {};
    }

    let bgStyle = 'url(' + this.config.shared.home.howto.image + ')';
    return {'background-image':this.bgGradient+bgStyle};
  }
  

  ngOnInit() {
    //
    // 
    this.$route.params.subscribe(params=>{
      this.$navigation.store=this.store=params['store'];
    });    
  }

  isAppReady(){
    return this.$navigation.store !== undefined;
  }

  set store(name){
    this.$navigation.store=name;
    // this.$router.navigate(['/store/'+name]);
  }

  get store(){
    return this.$navigation.store;
  }

}
