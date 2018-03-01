import { Component, OnInit } from '@angular/core';


import {
  LoaderService,
  ConfigService,
  User,
  Config
}  from 'kng2-core';


@Component({
  selector: 'app-kng-config',
  templateUrl: './kng-config.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngConfigComponent implements OnInit {

  config:Config;

  constructor(
    private $config: ConfigService,
    private $loader: LoaderService
  ) { }

  ngOnInit() {
      this.$loader.ready().subscribe(result=>{
        this.config = result[0];
      });
  }

  save(){
    this.$config.save(this.config).subscribe(()=>{
      //TODO done
    });  
  }


}
