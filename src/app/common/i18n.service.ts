import { Injectable } from '@angular/core';

import { Config, ConfigService } from 'kng2-core';
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
    audio_recording:'Enregistrement en cours, patientez...',
    audio_error:'Désolé, le micro n\'est pas activé ou autorisé pour un enregistrement!',
    audio_silent:'Merci de vérifier votre micro, aucun son a été enregistré',
    action_ko: 'À, corriger!',
    action_check: 'Vérifier',
    action_save: 'Enregistrer',
    action_del: 'Supprimer',
    action_cancel: 'Annuler',
    action_day_switch: 'trop tard pour demain',
    action_day_limit: 'pour commander',
    action_lang_switch: 'English',
    action_error_reload: 'Zut, un problème est survenu lors du chargement de la page. Réessayez?',
    action_install_ios: 'Installez Karibou.ch dans votre appareil.<br/> Appuyez sur l\'icône de Partage, puis sélectionnez<br/><b>Ajouter à l\'écran d\'accueil.</b>',
    action_session: '<b>Info!</b> Votre session est restée inactive trop longtemps. Veuillez recharger la page',
    cart_address_info: 'En cas d\'absence, le cycliste dépose vos sacs devant votre porte',
    cart_save_deliver: 'Votre commande est enregistrée, vous serez livré le ',
    cart_save_subscription: 'Votre abonnement est enregistré, consulter l\'accueil pour les modifications',
    cart_corrected: 'Votre commande doit être corrigée',
    cart_audio: 'Ajouter une touche personnelle avec un message audio. Et pensez à bien adapter le budget à votre besoin.',
    cart_audio_note: 'Le montant facturé sera mis à jour lors de la préparation avec la limite de votre budget',
    cart_others: 'Panier(s) des autres marchés',
    cart_order_grouped_details:'Vous avez une commande en préparation',
    cart_order_grouped_info:'<b class="highlight">Psst!</b> Vous avez oublié quelque chose? Pour compléter votre commande, il suffit d\'en passer une nouvelle <span class="bold">😇</span>!',
    home_feedback_title: 'Votre commande',
    james_school:"La sélection de la semaine pour 100 enfants",
    james_title_cta:'Votre Assistant Cuisine',
    james_selection_pinned: 'La sélection de James 📌',
    james_products:'Produits',
    james_product_title:'Découvrez James avec ce produit',
    james_product_action:'Voir des exemples',
    james_reset_action:'C\'est ma limite, on recommence ? ',
    james_welcome:'Vous chercher une recette ?',
    james_feedback:'Comment avez-vous trouvé cette réponse?',
    nav_bottom_home: 'Accueil',
    nav_bottom_browse: 'Parcourir',
    nav_bottom_shops: 'Boutiques',
    nav_bottom_cart: 'Panier',
    nav_shops:'Les commerçants',
    nav_shops_sub:'Parcourez les boutiques de A à Z',
    nav_account: 'Votre compte',
    nav_help:'besoin d\'aide?',
    nav_i18n: 'Changer de langue',
    nav_login: 'Connectez-vous',
    nav_login2: 'Login',
    nav_closed: 'Non disponible',
    nav_pinned: 'Epinglé 📌',
    nav_no_shipping: 'Complet',
    nav_no_shipping_long: 'La livraison ne peut être planifiée',
    nav_shipping: 'Livraison ',
    nav_shipping_off: 'Cette journée n\'est plus disponible',
    nav_store: 'Informations ',
    nav_store_sublong: 'Vous voulez d\'autres jours de livraison ? Changez de marché !',
    nav_store_subshort: 'Vous souhaitez plus de diversité ? Changez de marché !',
    nav_store_change: 'Faire ses courses',
    nav_store_b2b: 'Découvrir l\'offre entreprise',
    nav_store_continue:'J\'ai oublié un article',
    nav_contactus: 'Contactez-nous!',
    nav_installapp: 'Installer karibou.ch',
    nav_subscription:'Abonnements',
    nav_subscription_b2b:'Cadeaux et Buffets',
    nav_subscription_patreon:'Soutenez notre développement 🎁',
    nav_subscription_patreon_description:'Bénéficiez de l\'accès à l\'assistant culinaire et soutenez l\'innovation chez Karibou.ch',
    nav_menu_information:'OFFRE EVENT!',
    e404: 'Cette page n\'existe pas :-(',
    img_max_sz: 'Attention, la taille maximum d\'une image est limitée à 150kb',
    user_address_add: 'Ajoutez ou modifiez vos adresses',
    user_confirmation_mail: 'Merci, une confirmation a été envoyée à votre adresse email',
    user_login_ko: 'Ho ho, nous ne pouvons pas vous identifier...',
    user_login_ok: 'Bienvenue !',
    user_register_ok: 'Votre compte a été créé',
    user_recover_ok: 'Un nouveau mot de passe à été envoyé',
    user_ask_login: 'N\'oubliez pas de vous identifier pour préparer votre commande',
    user_logout: 'Fermer votre session',
    user_payment_add: 'Gérez vos méthodes de paiements',
    user_name: 'Votre nom',
    user_firstname: 'Votre prénom',
    user_display_name: 'Nom & Prénom',
    user_phone: 'Téléphone (mobile)*',
    user_shipping_title: 'Adresse de livraison ',
    user_email: 'Votre email',
    user_password: 'Mot de passe',
    user_password_old: 'Votre ancien mot de passe',
    user_password_new: 'Votre nouveau mot de passe',
    user_repassword: 'Confirmer votre mot de passe',
    user_confirm_password: 'Confirmer avec votre mot de passe',
    user_address_note: 'Note au livreur, code, remarques',
    user_postalcode:'Vérifier votre code postal',
    user_nlpd:'Nous accordons une grande importance à la protection et à la sécurité de vos données personnelles, en conformité avec la nouvelle loi nLPD, <span class="highlight">garantissant une gestion respectueuse de vos informations privées.</span>',
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
    category_title:'Les catégories',
    subscription_go:'Je souscris',
    subscription_active:'Votre abonnement est actif',
    subscription_premium:'Abonnez-vous à Premium',
    subscription_update:'Vous êtes sur le point de modifier votre abonnement',
    subscription_next_shipping:'La livraison de votre abonnement débutera le ',
    subscription_switch:'Activer pour passer en mode Abonnement',
    subscription_status_on:'Désactiver pour un achat ponctuel',
    subscription_status_off:'Activer pour passer en mode Abonnement',
    month:'chaque mois',
    week:'chaque semaine',
    '2weeks': 'une semaine sur deux',
    category_name_champagnes:'Champagne et mousseux',

  };

  public en: any = {
    audio_recording:'Recording in progress, wait ...',
    audio_error:'Sorry, the microphone seems not allowed for recording',
    audio_silent:'Please check your microphone, no sound has been saved',
    action_ko: 'Retry!',
    action_check: 'Check',
    action_save: 'Save!',
    action_del: 'Delete',
    action_cancel: 'Cancel',
    action_day_switch: 'Not for tomorrow',
    action_day_limit: 'to order',
    action_lang_switch: 'Français',
    action_error_reload: 'Ooops, there was a problem loading, try again?',
    action_install_ios: 'Install this app on your device.<br/> Tap the share icon and then<br/><b>Add to homescreen.</b>',
    action_session: '<b>Psst!</b> Your session has been inactive for too long. Please reload the page.',
    cart_address_info: 'In case of absence, we leave the groceries bags in a safe place in front of your door',
    cart_save_deliver: 'Your order is registered, you will be delivered on ',
    cart_save_subscription: 'Your subscription is registered, consult the homepage for modifications',
    cart_corrected: 'Your order must be corrected',
    cart_audio: 'Add a special request with an audio message. Remember to adjust the budget to your needs.',
    cart_audio_note: 'The amount charged will be updated during preparation by the merchant and cannot exceed the budget',
    cart_others: 'Cart(s) from other markets',
    cart_order_grouped_details:'You have an order in process',
    cart_order_grouped_info:'<b class="highlight">Psst!</b> Forgot something? To complete your order, just place a new one <span class="bold">😇</span>!',
    home_feedback_title: 'Your order',
    james_school:"Weekly Selection for 100 Children",
    james_title_cta:'Your Cook Assistant',
    james_selection_pinned: 'James\' selection 📌',
    james_product_title:'Discover James with this product',
    james_product_action:'See examples',
    james_reset_action:'This is my limit, shall we start again?',
    james_welcome:'Are you looking for a recipe?',
    nav_bottom_home: 'Home',
    nav_bottom_browse: 'Browse',
    nav_bottom_shops: 'Shops',
    nav_bottom_cart: 'Cart',
    nav_shops:'List shops',
    nav_shops_sub:'Browse the shops from A to Z',
    nav_account: 'Account',
    nav_help:'Need Help?',
    nav_i18n: 'Choose language',
    nav_login: 'Sign in',
    nav_login2: 'Login',
    nav_closed: 'Not available',
    nav_pinned: 'Pinned 📌',
    nav_no_shipping: 'Not available',
    nav_no_shipping_long:'Delivery cannot be planned',
    nav_shipping: 'Delivery ',
    nav_shipping_off: 'This delivery day is currently fully booked',
    nav_store: 'Information',
    nav_store_sublong: 'Want other delivery days? Switch markets!',
    nav_store_subshort: 'Want more diversity? Simply switch markets!',
    nav_store_change: 'Go shopping',
    nav_store_b2b: 'Discover our business selection?',
    nav_store_continue:'Continue shopping',
    nav_contactus: 'Contact us!',
    nav_installapp: 'Install karibou.ch',
    nav_subscription:'Subscription',
    nav_subscription_b2b:'Gifts and Buffets',
    nav_subscription_patreon:'Support us! ',
    nav_subscription_patreon_description:'Benefit from access to the culinary assistant and support innovation at Karibou.ch',
    nav_menu_information:'EVENT OFFER!',
    e404: 'We couldn\'t find this page :-(',
    img_max_sz: 'Warning, the maximum image size is 150kb',
    user_address_add: 'Add or modify your shipping address',
    user_confirmation_mail: 'Thanks, we just sent an email confirmation',
    user_login_ko: 'Ooops, we don\'t know who you are...',
    user_login_ok: 'Welcome!',
    user_register_ok: 'Your account has been created',
    user_recover_ok: 'A new password has been sent',
    user_ask_login: 'Don\'t forget to login to prepare your order',
    user_logout: 'Close your session',
    user_payment_add: 'Add or modify payment methods',
    user_name: 'Name',
    user_firstname: 'First name',
    user_display_name: 'Name & first name',
    user_phone: 'Your phone (mobile)*',
    user_shipping_title: 'Shipping address',
    user_email: 'Your email',
    user_password: 'Your password',
    user_password_old: 'Your current password',
    user_password_new: 'Your new password',
    user_repassword: 'Confirm your password',
    user_confirm_password: 'Confirm with your password',
    user_address_note: 'Note to the deliveryman, door code, remarks',
    user_postalcode:'Check postal code for delivery',
    user_nlpd:'We attach great importance to the protection and security of your personal data, in compliance with the new nLPD law, <span class="highlight">guaranteeing respectful management of your private information</span>.',
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
    subscription_go:'Subscribe',
    subscription_active:'Your subscription is already active',
    subscription_premium:'Subscribe to Premium',
    subscription_update:'You are about to change your active subscription',
    subscription_next_shipping:'The next delivery for your subscription will begin on ',
    subscription_switch:'Activate to switch to Subscription mode',
    subscription_status_on:'Disable for one-time purchase',
    subscription_status_off:'Activate to switch to Subscription mode',
    month:'every month',
    week:'every week',
    '2weeks': 'every two weeks',
    category_name_champagnes:'Champagne and Sparkling wines',
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
