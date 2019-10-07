import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, Config, UserService } from 'kng2-core';
import { i18n, KngNavigationStateService } from '..';

@Component({
  selector: 'kng-footer',
  templateUrl: './kng-footer.component.html',
  styleUrls: ['./kng-footer.component.scss']
})
export class KngFooterComponent implements OnInit {

  @Output() updated:EventEmitter<User>=new EventEmitter<User>();

  @Input() user:User;
  @Input() set config(config:Config){
    this.main(config);
  }

  content:any;
  store:string;
    
  constructor(
    private $i18n:i18n,
    private $user:UserService,
    private $navigation:KngNavigationStateService,
    private $route:ActivatedRoute,
  ){

    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    //
    // system ready
    this.user   = loader[1];
    this.config = loader[0];
    this.content= this.config&&this.config.shared;
  }    

  ngOnInit() {
    this.store=this.$navigation.store;
  }

  get locale(){
    return this.$i18n.locale;
  }

  getFooter(key){
    if(!this.content||!this.content.home.footer[key]){
      return;
    }
    return this.content.home.footer[key][this.locale];
  }
  

  getMenuItems(group:string){
    return this.$navigation.getMenuItems(group);
  }

  main(config:Config){
    this.content=config.shared;
    // Use one uniq central point for updateConfig
    // this.$navigation.updateConfig(config);
  }


  
  
}
