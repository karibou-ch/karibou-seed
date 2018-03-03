import { Injectable } from '@angular/core';

import { Config, ConfigService } from 'kng2-core';

/**
 * 
 */
@Injectable()
export class i18n  {


  public fr:any={
    password  :"Confirmer votre mot de passe",
    delete_ok :'Suppression effectuée',    
    save_ok   :'Sauvegarde effectuée'
  };

  //
  // bind 
  public _= this.lang.bind(this);

  public config:Config;
  currentLocale:string;

  constructor(
    private $config:ConfigService
  ) { 
    this.$config.subscribe(config=>this.config=config);
    this.currentLocale=this.$config.locale;
  }

  lang(elem?:any){
    if(elem){
      return elem[this.currentLocale];
    }
    return this[this.currentLocale];
  }


  set locale(lang:string){
    this.$config.locale=lang;
    this.currentLocale=lang;
  }

  get locale(){
    return this.currentLocale;
  }



}
