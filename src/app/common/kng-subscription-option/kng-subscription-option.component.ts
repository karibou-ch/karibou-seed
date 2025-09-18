import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { i18n } from '../i18n.service';
import {
  Config,
  CartSubscription,
  CartSubscriptionParams,
  CartItemFrequency,
  CartItem,
  CartService,
  LoaderService,
  Order,
  Hub,
  CartAction,
  CalendarService,
  User
} from 'kng2-core';
import { Subscription } from 'rxjs';



@Component({
  selector: 'kng-subscription-option',
  templateUrl: './kng-subscription-option.component.html',
  styleUrls: ['./kng-subscription-option.component.scss']
})
export class KngSubscriptionOptionComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private _i18n = {
    fr:{
      title:'Fréquence et jour de livraison.',
      title_time_contract:'Quand souhaitez vous être livré ?',
      title_time_contract_update:'La livraison est programmée à'
    },
    en:{
      title:'Frequency and delivery day',
      title_time_contract:'When would you like delivery?',
      title_time_contract_update:'Delivery is scheduled for'
    }
  }

  @Input() checkout:boolean;
  @Input() quiet:boolean;
  @Input() contract:CartSubscription;
  @Input() contractId:string;
  @Input() hub: Hub;
  @Input() user: User;
  @Input() shippingDay: Date;

  iterations=[
    {label:{fr:"Semaine",en:"Week"},id:"week" },
    {label:{fr:"14 jours",en:"Biweekly"},id:"2weeks" },
    {label:{fr:"Mois", en:"month"},id:"month" },
  ]

  config:Config;
  selIteration:any;
  selDayOfWeek:any;
  selTime:number;
  items:CartItem[];
  subscriptions:CartSubscription[];
  subscriptionParams:CartSubscriptionParams;
  shippingtimes:any;
  //
  // default shipping time for the week and saturday (12)
  defaultTime = [12,16];

  oneWeek: Date[];

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService,
    private $cdr: ChangeDetectorRef,
    private $calendar: CalendarService
  ) {
    this._subscription = new Subscription();
    this.items = [];
    this.subscriptions = [];
    this.subscriptionParams = {
        dayOfWeek:2,
        frequency:'week',
        activeForm: false
    };
    this.selTime = 16;

    // ✅ CORRECTION CRITIQUE: Ne PAS utiliser @Input dans le constructeur
    // Les inputs ne sont pas encore disponibles ! Attendre ngOnInit
    this.oneWeek = [];
    this.shippingtimes = {};

    // ✅ INITIALISATION SAFE : Valeurs par défaut sans dépendre des @Input
    this.selIteration = this.findIteration(this.subscriptionParams.frequency);
  }

  get dayOfWeek() {
    // ✅ CORRECTION CRITIQUE: Utiliser seulement les jours de livraison VALIDES selon CalendarService
    if (!this.hub) {
      return [];
    }

    const weekLabels = this.label.weekdays.split('_');
    const weekdays = this.hub.weekdays || [2,3,5];

    // ✅ NOUVEAU: Vérifier que ces jours sont réellement disponibles selon CalendarService
    const validDates = this.$calendar.getValidShippingDatesForHub(this.hub, { days: 30, user: this.user });
    const availableWeekdays = [...new Set(validDates.map(date => date.getDay()))];

    // ✅ FILTRER: Ne présenter que les jours qui sont à la fois dans hub.weekdays ET dans les dates valides
    const validWeekdays = weekdays.filter(day => availableWeekdays.includes(day));

    return validWeekdays.map(day => ({
      label: weekLabels[day],
      id: day
    }));
  }

  get nextShippingDay() {
    if (!this.selDayOfWeek || !this.hub) {
      // ✅ FALLBACK sécurisé: Utiliser CalendarService pour obtenir la prochaine date valide
      return this.$calendar.nextShippingDay(this.hub, this.user) || new Date();
    }

    const day = this.selDayOfWeek.id;
    // ✅ CORRECTION CRITIQUE: Utiliser les dates valides de CalendarService
    // au lieu de chercher dans une liste générée incorrectement
    const validDates = this.$calendar.getValidShippingDatesForHub(this.hub, { days: 30, user: this.user });
    const foundDate = validDates.find(date => date.getDay() == day);

    // ✅ SAFETY: Si le jour sélectionné n'existe pas dans les dates valides, fallback
    return foundDate || this.$calendar.nextShippingDay(this.hub, this.user) || new Date();
  }

  get label() {
    return this.$i18n.label();
  }

  get i18n() {
    return this._i18n[this.locale];
  }

  get locale() {
    return this.$i18n.locale;
  }

  get update() {
    if(!this.contract){
      return false;
    }
    return this.contract.frequency == (this.selIteration&&this.selIteration.id);
  }

  get timeprice() {
    if(!this.selTime||!this.config.shared.shipping) {
      return 0;
    }
    return this.config.shared.shipping.pricetime[this.selTime];

  }

  /**
   * ✅ CORRECTION CRITIQUE: Initialiser les dates valides selon CalendarService
   * Cette méthode remplace la logique buggée qui générait 30 jours consécutifs
   */
  private initializeValidDates() {
    // ✅ Attendre que hub soit disponible (Input non défini dans constructor)
    if (!this.hub) {
      this.oneWeek = [];
      return;
    }

    // ✅ LOGIQUE CORRECTE: Utiliser seulement les dates VALIDES de CalendarService
    this.oneWeek = this.$calendar.getValidShippingDatesForHub(this.hub, {
      days: 30,
      user: this.user
    });

    console.log('🔍 DEBUG kng-subscription-option initializeValidDates:', this.oneWeek);
  }

  /**
   * ✅ CORRECTION CRITIQUE: Initialiser les sélections seulement quand hub et config sont disponibles
   * Évite les crashes lors de l'initialisation du composant
   */
  private initializeSelectionsSafely() {
    // ✅ GUARD: Vérifier que les dépendances sont disponibles
    if (!this.hub || !this.config) {
      console.log('🔍 DEBUG initializeSelectionsSafely: hub ou config non disponible, attendre...');
      return;
    }

    // ✅ SAFE: Initialiser selDayOfWeek seulement quand tout est prêt
    if (!this.selDayOfWeek && this.subscriptionParams) {
      this.selDayOfWeek = this.findDayOfWeek(this.subscriptionParams.dayOfWeek);
      // ✅ SAFETY: Si findDayOfWeek retourne null, utiliser le premier jour disponible
      if (!this.selDayOfWeek && this.dayOfWeek.length > 0) {
        this.selDayOfWeek = this.dayOfWeek[0];
        this.subscriptionParams.dayOfWeek = this.selDayOfWeek.id;
        console.warn('initializeSelectionsSafely: fallback vers premier jour disponible:', this.selDayOfWeek.id);
      }
    }

    // ✅ SAFE: Initialiser selIteration (pas de dépendance aux inputs)
    if (!this.selIteration && this.subscriptionParams) {
      this.selIteration = this.findIteration(this.subscriptionParams.frequency);
    }

    // ✅ SAFE: Initialiser selTime avec les valeurs du config ou fallback
    if (!this.selTime && this.subscriptionParams && this.subscriptionParams.time) {
      this.selTime = this.subscriptionParams.time;
    } else if (!this.selTime) {
      // ✅ FALLBACK: Utiliser 16h par défaut
      this.selTime = 16;
    }

    console.log('🔍 DEBUG initializeSelectionsSafely: selDayOfWeek=', this.selDayOfWeek, 'selIteration=', this.selIteration, 'selTime=', this.selTime);
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  async ngOnInit(){
    this._subscription.add(
      this.$loader.update().subscribe(emit => {
        // ✅ CORRECTION CRITIQUE: Écouter emit.user pour mise à jour après login
        if (emit.user) {
          this.user = emit.user;
        }

        // ITEM_ADD       = 1,
        // ITEM_REMOVE    = 2,
        // ITEM_MAX       = 3,
        // CART_INIT      = 4,
        // CART_LOADED    = 5,
        // CART_LOAD_ERROR= 6,
        // CART_SAVE_ERROR= 7,
        // CART_ADDRESS   = 8,
        // CART_PAYMENT   = 9,
        // CART_SHIPPING   =10,
        if(emit.state && emit.state.action) {
          //this.currentShippingDay = this.$cart.getCurrentShippingDay();
          this.subscriptionParams = this.$cart.subscriptionGetParams();
          // ✅ ATTENDRE que config et hub soient disponibles avant d'initialiser selDayOfWeek
          this.initializeSelectionsSafely();
          this.$cdr.markForCheck();
        }
        if(!emit.config) {
          return;
        }
        this.config = emit.config;

        // ✅ CORRECTION CRITIQUE: Initialiser les dates valides après réception de la config
        this.initializeValidDates();
        this.initializeSelectionsSafely();

        const times = Object.keys(this.config.shared.shipping.pricetime || {});
        this.shippingtimes = times.reduce((shippingtimes,time)=> {
          shippingtimes[time]=emit.config.shared.hub.shippingtimes[time];
          return shippingtimes;
        },{});
      })
    );
  }

  findDayOfWeek(day:number) {
    const availableDays = this.dayOfWeek;

    // ✅ GUARD CRITIQUE: Vérifier que dayOfWeek n'est pas vide
    if (!availableDays || availableDays.length === 0) {
      console.warn('findDayOfWeek: aucun jour disponible, attendre que hub soit chargé');
      return null;
    }

    const find = availableDays.find(dayOf => dayOf.id == day);
    if (find) return find;

    // ✅ FALLBACK SAFE: Utiliser le premier jour disponible
    const fallbackDay = availableDays[0];
    if (!fallbackDay) {
      console.error('findDayOfWeek: fallbackDay est undefined, hub non configuré?');
      return null;
    }

    console.warn(`findDayOfWeek: jour ${day} non disponible, utilise fallback ${fallbackDay.id}`);
    this.selDayOfWeek = fallbackDay;
    this.subscriptionParams.dayOfWeek = fallbackDay.id;
    this.$cart.subscriptionSetParams(this.subscriptionParams, true);
    return this.selDayOfWeek;
  }

  findIteration(iteration:string|CartItemFrequency) {
    return this.iterations.find(it => it.id==iteration);
  }

  /**
   * ✅ NOUVELLE MÉTHODE: Sauvegarder seulement l'heure sans affecter le jour
   */
  onTimeChange(newTime: string | number) {
    this.selTime = Number(newTime);

    // ✅ CRITIQUE: Récupérer les paramètres actuels du service avant modification
    const currentParams = this.$cart.subscriptionGetParams();

    // ✅ SAFE: Mettre à jour seulement le temps, préserver le reste
    const updatedParams = {
      ...currentParams,
      time: this.selTime
    };


    // ✅ PRESERVATION: Sauvegarder avec synchronisation complète
    this.$cart.subscriptionSetParams(updatedParams);

    // ✅ SYNC: Mettre à jour l'état local aussi
    this.subscriptionParams = updatedParams;
  }

  onSave(){
    this.subscriptionParams.dayOfWeek = this.selDayOfWeek.id;
    this.subscriptionParams.frequency = this.selIteration.id;
    this.subscriptionParams.time = this.selTime;
    this.$cart.subscriptionSetParams(this.subscriptionParams);

  }


}
