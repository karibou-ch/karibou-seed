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
    user_address_add: 'Ajoutez ou modifiez vos adresses',
    cart_address_info: 'En cas d\'absence, le cycliste dépose vos sacs devant votre porte',
    user_payment_add: 'Gérez vos méthodes de paiements',
    cart_save_deliver: 'Votre commande est enregistrée, vous serez livré le ',
    cart_corrected: 'Votre commande doit être corrigée',
    cart_audio: 'Enregistrez vos souhaits avec un message audio. Et pensez à bien adapter le budget à votre besoin.',
    cart_audio_note: 'Le montant facturé sera mis à jour lors de la préparation par le commerçant et ne pourra pas dépasser le maximum réservé de',
    cart_others: 'Panier(s) des autres marchés du réseau karibou.ch',
    cart_order_grouped_details:'Vous avez une commande en préparation',
    cart_order_grouped_details_more:'Pour compléter votre commande, il suffit d\'en passer une nouvelle à la même date.',
    cart_order_grouped_info:'<b>Psst!</b> Vous avez oublié quelque chose? Pour compléter votre commande, il suffit d\'en passer une nouvelle <span class="bold">😇</span>!',
    home_feedback_title: 'Comment était votre dernière commande?',
    home_links_title: 'Découvrez les boutiques de cette page',
    nav_bottom_home: 'Accueil',
    nav_bottom_browse: 'Parcourir',
    nav_bottom_search: 'Recherche',
    nav_bottom_shops: 'Boutiques',
    nav_bottom_cart: 'Panier',
    nav_market:'Marché',
    nav_shops:'Les commerçants',
    nav_shops_sub:'Parcourez les boutiques de A à Z',
    nav_account: 'Votre compte',
    nav_i18n: 'Changer de langue',
    nav_login: 'Connectez-vous',
    nav_login2: 'Login',
    nav_closed: 'Non disponible',
    nav_no_shipping: 'Complet',
    nav_no_shipping_long: 'La livraison ne peut être planifiée',
    nav_shipping: 'Mon jour de livraison pour le marché ',
    nav_shipping_off: 'Cette journée n\'est plus disponible',
    nav_shortcuts: 'Les raccoursis',
    nav_store: 'Faites votre marché !',
    nav_store_sub: 'Vous souhaitez des produits de différents marchés? Pas de problème ! Recevez tous vos paniers en une seule livraison ​​​​​​​​​​​​​​​​​​​​​​​​😉​',
    nav_store_change: 'Faire ses courses',
    nav_store_shops_list: 'Les boutiques',
    nav_store_continue:'J\'ai oublié un produit de ce marché',
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
    karibou_news_ok:'J\'ai pris note de l\'information',
    karibou_news_ko:'Je lirai plus tard',
    modify_ok : 'Modification effectuée',
    search_bookmark: 'Favoris',
    search_placeholder: 'Que souhaitez-vous manger?',
    save_ok   : 'Sauvegarde effectuée',
    thanks: 'OK, Merci!',    
    weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi",
    ITEM_UPDATE: 'modifé: ',
    ITEM_ADD: 'ajouté: ',
    ITEM_REMOVE: 'supprimé: ',
    ITEM_MAX: 'Impossible de commander d\'avantage de ce produit',
    category_title:'Les catégories'
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
    user_address_add: 'Add or modify your shipping address',
    cart_address_info: 'In case of absence, we leave the groceries bags in a safe place in front of your door',
    user_payment_add: 'Add or modify payment methods',
    cart_payment_not_available: 'This payment method is not more available',
    cart_save_deliver: 'Your order is registered, you will be delivered on ',
    cart_corrected: 'Your order must be corrected',
    cart_audio: 'Record your special request with an audio message. Remember to adjust the budget to your needs.',
    cart_audio_note: 'The amount charged will be updated during preparation by the merchant and cannot exceed the maximum reserved of ',
    cart_others: 'Cart(s) from other markets of the karibou.ch network',
    cart_order_grouped_details:'You have an order in process',
    cart_order_grouped_details_more:'To complete your order, just place a new one on the same day',
    cart_order_grouped_info:'<b>Psst!</b> Forgot something? To complete your order, just place a new one <span class="bold">😇</span>!',
    nav_bottom_home: 'Home',
    nav_bottom_browse: 'Browse',
    nav_bottom_search: 'Search',
    nav_bottom_shops: 'Shops',
    nav_bottom_cart: 'Cart',
    nav_market:'Market',
    nav_shops:'List shops',
    nav_shops_sub:'Browse the shops from A to Z',
    nav_accoun: 'Account',
    nav_i18n: 'Choose language',
    nav_login: 'Sign in',
    nav_login2: 'Login',
    nav_closed: 'Not available',
    nav_no_shipping: 'Not available',
    nav_no_shipping_long:'Delivery connot be planned',
    nav_shipping: 'My delivery day for the market',
    nav_shipping_off: 'This delivery day is currently fully booked',
    nav_shortcuts: 'Shortcuts',
    nav_store: 'Shop on GVA Food markets !',
    nav_store_sub: 'You want products from different markets ? No problem ! You are entitled to multiple baskets 😉',
    nav_store_change: 'Go shopping',
    nav_store_shops_list: 'All stores',
    nav_store_continue:'Continue shopping in this market',
    nav_contactus: 'Contact-us!',
    nav_installapp: 'Install karibou.ch',
    e404: 'We couldn\'t find this page :-(',
    eSession: '<b>Psst!</b> Your session has been inactive for too long. Please reload the page.',
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
    karibou_news_ok:'Got it',
    karibou_news_ko:'Show me later',
    modify_ok : 'Updated',
    search_bookmark: 'Favorites',
    search_placeholder: 'Search',
    save_ok   : 'Save done!',
    thanks: 'OK, Thanks!',
    weekdays : "sunday_monday_tuesday_wednesday_thursday_friday_saturday",
    ITEM_UPDATE: 'Updated: ',
    ITEM_ADD: 'Add: ',
    ITEM_REMOVE: 'Remove: ',
    ITEM_MAX: 'Oops reach the order limit of this product',
    category_title:'Categories',
    category_name_champagnes:'Champagne',
    category_name_fruits_legumes:'Fruits & Vegetables',
    category_name_boucherie_artisanale:'Meat Shop',
    category_name_poissonnerie:'Fish Shop',
    category_name_boissons:'Drinks',
    category_name_bieres_artisanales:'Craft Beer',
    category_name_vins_rouges:'Red Wines',
    category_name_vins_blancs_roses:'White Wines & Rosé',
    category_name_aperitifs_digestifs:'Aperitifs & Digestives',
    category_name_traiteur_maison:'Delicatessen shop',
    category_name_antipasti_conserves:'Antipasti & Canned food ',
    category_name_miels_confitures_et_plus:'Honey, Jam and more',
    category_name_pates_sauces:'Pasta & Sauces',
    category_name_huiles_vinaigre_condiments:'Oils, Vinegar & Condiments',
    category_name_bien_etre:'Well-Being Products',
    category_name_cereales_legumineuses_graines:'Cereals, Legumes, Seeds',
    category_name_douceurs_chocolats:'Sweets & Chocolates',
    category_name_fromages_produits_frais:'Cheeses & Fresh Products',
    category_name_boulangerie_artisanale:'Artisanal Bakery',
    category_name_charcuterie_pates:'Charcuterie & Pâtés',
    category_name_fleurs:'Flowers',
    category_name_idees_cadeaux:'Gift Ideas',
    category_name_lessives_menage:'Cleaning Products'    
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
