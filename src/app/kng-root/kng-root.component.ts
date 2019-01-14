import { Component, OnInit } from '@angular/core';
import { i18n, KngNavigationStateService } from '../common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-kng-root',
  templateUrl: './kng-root.component.html',
  styleUrls: ['./kng-root.component.scss']
})
export class KngRootComponent implements OnInit {

  config:any;

  constructor( 
    public $i18n:i18n,
    private $navigation:KngNavigationStateService,
    private $route: ActivatedRoute,
  ) { 
    let loader=this.$route.snapshot.data.loader;
    this.config=loader[0];      
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
  }

  get store(){
    return this.$navigation.store;
  }

}
