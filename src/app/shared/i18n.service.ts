import { Injectable } from '@angular/core';

import { Config, ConfigService, CartAction } from 'kng2-core';

/**
 * 
 */
@Injectable()
export class i18n  {

  public snackOpt={
    timeout:3500,
    actionOnBottom:true,
    multiline:true
  }


  public fr:any={
    cart_discount:"rabais qunatité",
    cart_signin:"Continuer la commande",
    cart_login:"Pour finaliser votre commande, vous devez vous connecter",
    cart_empty:"Votre panier est vide",
    cart_nextshipping:"Prochaine livraison",
    nav_account:"Vos commandes",
    nav_login:"Connectez-vous",
    nav_login2:"Login",
    nav_shipping:"Prochaines livraison",
    nav_shipping2:"Dates",
    nav_contactus:"Contactez-nous!",
    nav_installapp:"Installer karibou.ch",
    e404:"Cette page n'existe pas :-(",
    eServer:"Il y a un problème :-(",
    eSession:"<b>Info!</b> Votre session est restée inactive trop longtemps. Veuillez recharger la page",
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
    action_ko:"À, Corriger!",
    thanks:"OK, Merci!",
    ITEM_ADD:"ajouté: ",
    ITEM_REMOVE:"supprimé: ",
    ITEM_MAX:'Impossible de commander d\'avantage de ce produit'
  };

  public en:any={
    cart_discount:"discount",
    cart_signin:"Sign In!",
    cart_login:"Please sign in before the checkout",
    cart_empty:"Your cart is empty",
    cart_nextshipping:"Next delivery",
    nav_account:"Your orders",
    nav_login:"Sign in",
    nav_login2:"Login",
    nav_shipping:"Next delivery",
    nav_shipping2:"When",
    nav_contactus:"Contact-us!",
    nav_installapp:"Install karibou.ch",
    e404:"We couldn't find this page :-(",
    eServer:"Ooops, there is an issue in our matrix :-(",
    eSession:"<b>Info!</b> Votre session est restée inactive trop longtemps. Veuillez recharger la page",
    img_max_sz:"Warning, the maximum image size is 150kb",
    user_confirmation_mail:"Thanks, we just sent an email confirmation ",
    user_login_ko:"Ooops, we dont know who you are...",
    user_login_ok:"Welcome !",
    user_register_ok:"Yeah, your accout is almost ready!",
    user_recover_ok:"A new password just be sent",
    password  :"Confirm your password",
    delete_ok :'Deleted',    
    modify_ok :'Updated',    
    save_ok   :'Save done!',
    thanks:"OK, Thanks!",
    action_ko:"Retry!",
    ITEM_ADD:"Add: ",
    ITEM_REMOVE:"Remove: ",
    ITEM_MAX:'Oops reach the order limit of this produtc'
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
    this.currentLocale=this.$config.locale||'fr';
    if(this.currentLocale.indexOf('en-')>-1){
      this.currentLocale='en';
    }

    // FIXME subscribe to config
    // this.$config.subscribe((config:Config)=>{
    //   this.config=config;
    //   // TODO configure locale switch/setup
    //   // this.config.shared.i18n [defaultLocale:string, locales:[]]
    // });
    // this.currentLocale = navigator.language || navigator['userLanguage']; 

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
