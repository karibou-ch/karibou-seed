import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KngNavigationService } from '../kng-navbar';
@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-welcome.component.scss']
})
export class KngWelcomeComponent implements OnInit {

  photos=[
    "//ucarecdn.com/d8feba43-5e83-4e5b-b870-a65c4ae487cd/",
    "//ucarecdn.com/598d3708-9eb5-4ea8-8ad8-49e875d81357/",
    "//ucarecdn.com/d3081c50-5b49-48df-bf90-c346c5deb67b/",
    "//ucarecdn.com/e91bcbdb-8674-48f1-8c43-56d2b864f0e3/",
    "//ucarecdn.com/ca4d7f3a-2723-4123-a9fc-d858868f7ec7/",
    "//ucarecdn.com/c5a78caa-7511-4af7-93da-410bef493a34/",
    "//ucarecdn.com/4b477288-fcb8-4550-a149-1c619973443a/",
    "//ucarecdn.com/428f6eab-a84c-461f-a74f-e61b8d80afb6/",
    "//ucarecdn.com/cac90069-1822-4d02-8149-1f6b0e332d7a/",
    "//ucarecdn.com/19ff5c09-c038-4aee-a5ad-af6f0e23e6cf/",
    "//ucarecdn.com/4c16a4c2-79f8-461a-9eeb-a20ee5efe01a/",
    "//ucarecdn.com/58a621c7-8af8-445d-a8b7-4828151928e2/",
    "//ucarecdn.com/40fb7941-0ca2-4a56-b6e6-69bb06fe4058/",
    "//ucarecdn.com/d9d4650e-fcd4-4c38-b3d7-75e42a759fff/",
    "//ucarecdn.com/78122f08-f100-4a14-9a0a-46eebbe33c50/",
    "//ucarecdn.com/d8feba43-5e83-4e5b-b870-a65c4ae487cd/",
    "//ucarecdn.com/598d3708-9eb5-4ea8-8ad8-49e875d81357/",
    "//ucarecdn.com/d3081c50-5b49-48df-bf90-c346c5deb67b/",
    "//ucarecdn.com/e91bcbdb-8674-48f1-8c43-56d2b864f0e3/",
    "//ucarecdn.com/58a621c7-8af8-445d-a8b7-4828151928e2/",
    "//ucarecdn.com/ca4d7f3a-2723-4123-a9fc-d858868f7ec7/",
    "//ucarecdn.com/c5a78caa-7511-4af7-93da-410bef493a34/",
    "//ucarecdn.com/4b477288-fcb8-4550-a149-1c619973443a/",
    "//ucarecdn.com/428f6eab-a84c-461f-a74f-e61b8d80afb6/",
    "//ucarecdn.com/cac90069-1822-4d02-8149-1f6b0e332d7a/",
    "//ucarecdn.com/19ff5c09-c038-4aee-a5ad-af6f0e23e6cf/",
    "//ucarecdn.com/4c16a4c2-79f8-461a-9eeb-a20ee5efe01a/",
    "//ucarecdn.com/40fb7941-0ca2-4a56-b6e6-69bb06fe4058/",
    "//ucarecdn.com/d9d4650e-fcd4-4c38-b3d7-75e42a759fff/",
    "//ucarecdn.com/598d3708-9eb5-4ea8-8ad8-49e875d81357/",
    "//ucarecdn.com/d3081c50-5b49-48df-bf90-c346c5deb67b/",
    "//ucarecdn.com/e91bcbdb-8674-48f1-8c43-56d2b864f0e3/",
    "//ucarecdn.com/ca4d7f3a-2723-4123-a9fc-d858868f7ec7/",
    "//ucarecdn.com/c5a78caa-7511-4af7-93da-410bef493a34/",
    "//ucarecdn.com/4b477288-fcb8-4550-a149-1c619973443a/",
    "//ucarecdn.com/78122f08-f100-4a14-9a0a-46eebbe33c50/",
    "//ucarecdn.com/58a621c7-8af8-445d-a8b7-4828151928e2/" 
  ]

  stores=[
    {title:"Genève",name:"geneve",image:"http://www.davidfraga.ch/blog/wp-content/uploads/cathedraleStPierre_vignette.jpg"},
    {title:"Fribourg",name:"fribourg",image:"https://img.myswitzerland.com/mys/n64489/images/buehne/st0034724_fribourg.jpg"},
    {title:"Meyrin",name:"meyrin",image:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Eglise_Saint-Julien_%28Meyrin%29_01.jpg/1200px-Eglise_Saint-Julien_%28Meyrin%29_01.jpg"},
  ]

  constructor( 
    private $navigation:KngNavigationService,
    private $route: ActivatedRoute,
    private $router: Router,    
  ) { 
    console.log('---------------KngWelcome')

  }

  ngOnInit() {
    //
    // 
    this.$route.params.subscribe(params=>{
      console.log('---------------1',params)
      this.$navigation.store=this.store=params['store'];
      
    })
    // if(this.$route.firstChild){
    //   this.$route.firstChild.params.subscribe(params=>{
    //     this.$navigation.store=this.store=params['store'];
    //     console.log('---------------2',params)
    //   })
    //   }
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
