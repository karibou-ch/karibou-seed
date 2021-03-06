import { Injectable } from '@angular/core';

import { Config, ConfigService, CartAction } from 'kng2-core';
import { MdcSnackbarConfig } from '@angular-mdc/web';


/**
 *
 */
@Injectable({
  providedIn: 'root'
})
export class i18n  {

  public snackOpt: MdcSnackbarConfig = {
    timeoutMs: 5000
  };


  public fr: any = {
    action_ko: 'À, corriger!',
    action_save: 'Enregistrer',
    action_del: 'Supprimer',
    action_cancel: 'Annuler',
    action_lang_switch: 'switch into English',
    action_error_reload: 'Zut, un problème est survenu lors du chargement de la page. Réessayez?',
    action_install_ios: 'Installez Karibou.ch dans votre appareil.<br/> Appuyez sur l\'icône de Partage, puis sélectionnez<br/><b>Ajouter à l\'écran d\'accueil.</b>',
    cart_address_add: 'Gérer vos adresses',
    cart_address_info: 'En cas d\'absence, le cycliste dépose vos sacs devant votre porte',
    cart_payment_add: 'Gérer vos méthodes de paiements',
    cart_save_deliver: 'Votre commande est enregistrée, vous serez livré le ',
    cart_corrected: 'Votre commande doit être corrigée',
    home_feedback_title: 'Comment était votre dernière commande?',
    home_links_title: 'Découvrez les boutiques de cette page',
    nav_account: 'Votre compte',
    nav_i18n: 'Changer de langue',
    nav_login: 'Connectez-vous',
    nav_login2: 'Login',
    nav_closed: 'Non disponible',
    nav_no_shipping: 'Complet',
    nav_no_shipping_long: 'La livraison ne peut être planifiée',
    nav_shipping: 'Prochaine livraison',
    nav_shipping2: 'livraison',
    nav_shipping_off: 'Cette journée n\'est plus disponible',
    nav_store: 'La sélection de marchés de votre région',
    nav_store_sub: 'Ou souhaitez vous faire vos courses?',
    nav_store_change: 'Faire ses courses',
    nav_store_shops_list: 'Les boutiques',
    nav_contactus: 'Contactez-nous!',
    nav_installapp: 'Installer karibou.ch',
    e404: 'Cette page n\'existe pas :-(',
    eSession: '<b>Info!</b> Votre session est restée inactive trop longtemps. Veuillez recharger la page',
    img_max_sz: 'Attention, la taille maximum d\'une image est limitée à 150kb',
    user_confirmation_mail: 'Merci, une confirmation a été envoyée à votre adresse email',
    user_login_ko: 'Ho ho, nous ne pouvons pas vous identifier...',
    user_login_ok: 'Bienvenue !',
    user_register_ok: 'Votre compte a été créé',
    user_recover_ok: 'Un nouveau mot de passe à été envoyé',
    user_logout: 'Fermer votre session',
    user_name: 'Votre nom',
    user_firstname: 'Votre prénom',
    user_display_name: 'Nom & Prénom',
    user_phone: 'Téléphone (mobile)*',
    user_email: 'Votre email',
    user_password: 'Mot de passe',
    user_password_old: 'Votre ancien mot de passe',
    user_password_new: 'Votre nouveau mot de passe',
    user_repassword: 'Confirmer votre mot de passe',
    user_confirm_password: 'Confirmer avec votre mot de passe',
    user_address_note: 'Note au livreur, code, autres remarques',
    delete_ok : 'Suppression effectuée',
    karibou_project: ' Karibou.ch',
    modify_ok : 'Modification effectuée',
    save_ok   : 'Sauvegarde effectuée',
    thanks: 'OK, Merci!',    
    ITEM_ADD: 'ajouté: ',
    ITEM_REMOVE: 'supprimé: ',
    ITEM_MAX: 'Impossible de commander d\'avantage de ce produit'
  };

  public en: any = {
    action_ko: 'Retry!',
    action_save: 'Save!',
    action_del: 'Delete',
    action_cancel: 'Cancel',
    action_lang_switch: 'basculer en français',
    action_error_reload: 'Ooops, there was a problem loading, try again?',
    action_install_ios: 'Install this app on your device.<br/> Tap the share icon and then<br/><b>Add to homescreen.</b>',
    home_feedback_title: 'How was your last order ?',
    home_links_title: 'Discover the stores on this page',
    cart_address_add: 'Add or modify your shipping address',
    cart_address_info: 'In case of absence, we leave the groceries bags in a safe place in front of your door',
    cart_payment_add: 'Add or modify payment methods',
    cart_payment_not_available: 'This payment method is not more available',
    cart_save_deliver: 'Your order is registered, you will be delivered on ',
    cart_corrected: 'Your order must be corrected',
    nav_account: 'Account',
    nav_i18n: 'Choose language',
    nav_login: 'Sign in',
    nav_login2: 'Login',
    nav_closed: 'Not available',
    nav_no_shipping: 'Not available',
    nav_no_shipping_long:'Delivery connot be planned',
    nav_shipping: 'Next delivery',
    nav_shipping2: 'delivery windows',
    nav_shipping_off: 'This delivery day is currently fully booked',
    nav_store: 'Big-selection markets in your area',
    nav_store_sub: 'Where do you want  Shop ?',
    nav_store_change: 'Go shopping',
    nav_store_shops_list: 'All stores',
    nav_contactus: 'Contact-us!',
    nav_installapp: 'Install karibou.ch',
    e404: 'We couldn\'t find this page :-(',
    eSession: '<b>Info!</b> Votre session est restée inactive trop longtemps. Veuillez recharger la page',
    img_max_sz: 'Warning, the maximum image size is 150kb',
    user_confirmation_mail: 'Thanks, we just sent an email confirmation ',
    user_login_ko: 'Ooops, we dont know who you are...',
    user_login_ok: 'Welcome !',
    user_logout: 'Close your session',
    user_register_ok: 'Yeah, your accout is almost ready!',
    user_recover_ok: 'A new password just be sent',
    user_name: 'Name',
    user_firstname: 'First name',
    user_display_name: 'Name & first name',
    user_phone: 'Your phone (mobile)*',
    user_email: 'Your email',
    user_password: 'Your password',
    user_password_old: 'Your current password',
    user_password_new: 'Your new password',
    user_repassword: 'Confirm your password',
    user_confirm_password: 'Confirm with your password',
    user_address_note: 'Note to the deliveryman, door code, or other remarks',
    delete_ok : 'Deleted',
    karibou_project: ' Karibou.ch ',
    modify_ok : 'Updated',
    save_ok   : 'Save done!',
    thanks: 'OK, Thanks!',
    ITEM_ADD: 'Add: ',
    ITEM_REMOVE: 'Remove: ',
    ITEM_MAX: 'Oops reach the order limit of this produtc'
  };

  //
  // bind
  public _ = this.lang.bind(this);

  public config: Config;
  //
  // default locale
  currentLocale = 'fr';

  constructor(
    private $config: ConfigService
  ) {
    this.currentLocale = this.$config.locale || 'fr';
    if (this.currentLocale.indexOf('en-') > -1) {
      this.currentLocale = 'en';
    }
    if (this.currentLocale.indexOf('fr-') > -1) {
      this.currentLocale = 'fr';
    }
    //
    // FIXME currentLocale fr-CH should be managed on kng2-core
    // FIXME unit test currentLocale with all possible locale
    // force default
    if (['en', 'fr'].indexOf(this.currentLocale) === -1) {
      this.currentLocale = 'fr';
    }

    console.log('---i18n', navigator.language || navigator['userLanguage'], this.$config.locale);
    // FIXME subscribe to config
    // this.$config.subscribe((config:Config)=>{
    //   this.config=config;
    //   // TODO configure locale switch/setup
    //   // this.config.shared.i18n [defaultLocale:string, locales:[]]
    // });
    // this.currentLocale = navigator.language || navigator['userLanguage'];

    // this.currentLocale=this.$config.locale;


  }

  label() {
    return this[this.currentLocale];
  }

  lang(elem: any) {
    if (!elem) { return ''; }
    return elem[this.currentLocale];
  }

  localeSwitch() {
    this.locale = (this.locale === 'fr') ? 'en' : 'fr';
  }


  set locale(lang: string) {
    this.$config.locale = lang;
    this.currentLocale = lang;
  }

  get locale() {

    return this.currentLocale;
  }





}
