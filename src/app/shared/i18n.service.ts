import { Injectable } from '@angular/core';

import { Config, ConfigService, CartAction } from 'kng2-core';

/**
 * 
 */
@Injectable()
export class i18n  {


  public fr:any={
    img_max_sz:"Attention, la taille maximum d'une image est limitée à 150kb",
    user_confirmation_mail:"Merci, une confirmation a été envoyée à votre adresse email",
    user_login_ko:"Ho ho, nous ne pouvons pas vous identifier...",
    user_login_ok:"Bienvenu !",
    user_register_ok:"Votre compte a été créé",
    user_recover_ok:"Un nouveau mot de passe à été envoyé",
    password  :"Confirmer votre mot de passe",
    delete_ok :'Suppression effectuée',    
    modify_ok :'Modification effectuée',    
    save_ok   :'Sauvegarde effectuée',
    ITEM_ADD:"ajouté: ",
    ITEM_REMOVE:"supprimé: ",
  };
  
  //
  // bind 
  public _= this.lang.bind(this);

  public config:Config;
  //
  // default locale
  currentLocale:string='fr';

  constructor(
    private $config:ConfigService
  ) { 
    this.currentLocale='fr';
    // FIXME subscribe to config
    // this.$config.subscribe((config:Config)=>{
    //   this.config=config;
    //   // TODO configure locale switch/setup
    //   // this.config.shared.i18n [defaultLocale:string, locales:[]]
    // });
    //this.currentLocale=this.$config.locale;
  }

  label(){
    return this[this.currentLocale];
  }

  lang(elem:any){
    if(!elem) return '';
    return elem[this.currentLocale];
  }


  set locale(lang:string){
    this.$config.locale=lang;
    this.currentLocale=lang;
  }

  get locale(){
    return this.currentLocale;
  }



}
