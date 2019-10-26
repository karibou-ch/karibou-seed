import { Component, OnInit } from '@angular/core';
import { UserService } from 'kng2-core';
import { i18n } from '../common';

@Component({
  selector: 'kng-page-not-found',
  templateUrl: './kng-page-not-found.component.html',
  styleUrls: ['./kng-page-not-found.component.scss']
})
export class KngPageNotFoundComponent implements OnInit {


  constructor(
    public $i18n:i18n,
    public $user:UserService
  ) { 
    
  }

  ngOnInit(){

  }

}
