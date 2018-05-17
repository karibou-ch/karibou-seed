import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { i18n } from '../shared';
import { Config, 
         LoaderService, 
         UserService, 
         User } from 'kng2-core';
import { Location } from '@angular/common';

@Component({
  selector: 'kng-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  config:Config;
  user:User;
  isReady:boolean;

  constructor(
    private $i18n: i18n,
    private $loader: LoaderService,
    private $user: UserService,
    private $route:ActivatedRoute,
    private $location:Location,
    
  ) { 
    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    //
    // system ready
    this.isReady= true;
    this.user   = loader[1];
    this.config = loader[0];
    
  }

  ngOnInit() {
  }

}
