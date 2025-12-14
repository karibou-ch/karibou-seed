import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { Hub, User, UserService } from 'kng2-core';
import { CartService, Config, LoaderService, Order, CalendarService } from 'kng2-core';
import { i18n } from '../i18n.service';

@Component({
  selector: 'kng-calendar',
  templateUrl: './kng-calendar.component.html',
  styleUrls: ['./kng-calendar.component.scss']
})
export class KngCalendarComponent implements OnInit {
  private _minimal:boolean;

  private _i18n = {
    'fr': {
      'lastMinuteLabel': "Jusqu'à"
    },
    'en': {
      'lastMinuteLabel': 'Until'
    }
  }

  @Input() user: User;
  @Input() title: string;
  @Input() config: Config;
  @Input() set minimal(value){
    this._minimal = ['true','yes','on',true].indexOf(value)>-1;
  }

  @HostBinding('class.minimal') get isMinimal() { return this._minimal; }

  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  labelTime: string;
  noshippingMsg: string;
  currentWeek:Date[];
  currentHub: Hub;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  isPremium:boolean;
  lastMinuteOption: { when: Date; hours: number } | null = null;
  isLastMinuteSelected = false;

  currentShippingDay: Date;
  currentShippingTime: number;
  availableDays:Date[];
  multipleHubsDays:Date[];
  pendingOrder: Order|undefined;
  displayHubSwitch: Hub;
  displayHubMoreOptions: boolean;

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $user: UserService,
    private $loader: LoaderService,
    private $calendar: CalendarService
  ) {
    this.currentWeek = [];
    this.availableDays = [];
    this.multipleHubsDays = [];
  }

  // user can also have a prefered HUB @ reminder.defaultHub
  get prefferedHub() {
    const mapper = {
      'b2b-school': 'superlocal',
      'marche-bio-local-lft':'marche-bio-local-lft'
    }
    if(!this.user || !this.user.plan){
      return this.config.shared.hubs.find(hub => hub.slug != this.currentHub.slug);
    }

    const plan = this.user.plan.name;
    //
    // for school
    if(mapper[plan]){
      return mapper[plan];
    }

    //
    // for special customer
    if(mapper[this.user.email['source']]){
      return mapper[this.user.email['source']]
    }
    const hubs = this.config.shared.hubs.filter(hub => hub.slug != 'superlocal');
    return hubs.find(hub => hub.slug != this.currentHub.slug);
  }

  get mainTitle() {
    return this.title || this.currentHub?.siteName[this.locale];
  }

  get minimal() {
    return this._minimal;
  }


  get i18n() {
    return this._i18n[this.locale];
  }



  get label() {
    return this.$i18n.label();
  }

  get label_switch_store() {
    return (this.currentHub.weekdays.length <= 4)?this.label.nav_store_sublong:this.label.nav_store_subshort;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get pendingOrderShipping() {
    return this.pendingOrder && this.pendingOrder.shipping.when;
  }

  get lastMinuteTime() {
    return this.currentHub?.acceptLastMinuteOrder || 0;
  }

  ngOnInit(): void {

    this.$loader.update().subscribe(emit => {
      // ✅ CORRECTION CRITIQUE: Écouter emit.user pour mise à jour après login
      if (emit.user) {
        this.user = emit.user;
      }

      if(emit.state &&  this.config) {
        this.refreshCurrentSelection();
        this.updated.emit({
          day: this.currentShippingDay,
          time: this.currentShippingTime,
          lastMinute: this.isLastMinuteSelected
        });
      }
      if(!emit.config) {
        return;
      }
      this.currentWeek = [];
      this.availableDays = [];
      this.multipleHubsDays = [];
      this.config = emit.config;
      this.currentHub = this.config.shared.hub as Hub;
      this.labelTime = this.config.shared.hub.shippingtimes[16]
      this.currentRanks = this.config.shared.currentRanks[this.currentHub.slug] || {};
      this.currentLimit = this.config.shared.hub.currentLimit || 1000;
      this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
      const hub = this.config.shared.hubs.find(hub => hub.slug != this.currentHub.slug);

      // propose to switch to another hub
      // user have a prefered HUB
      this.displayHubSwitch = hub;
      if(this.user){
        // propose to switch to another hub
        // user have a prefered HUB
        this.displayHubSwitch = this.prefferedHub|| hub;
      }
      this.displayHubMoreOptions = (this.currentHub.weekdays.length == 3);

      //
      // validate shipping state
      this.noshippingMsg = this.getNoShippingMessage();
            // ✅ MIGRATION COMPLÈTE: Utiliser CalendarService
      this.availableDays = this.$calendar.getValidShippingDatesForHub(this.currentHub, {
        days: 7,
        user: this.user
      });

      // 🔍 DEBUG: Print dates pour identifier le problème
      // console.log('🔍 DEBUG kng-calendar availableDays:', this.availableDays);
      // console.log('🔍 DEBUG kng-calendar currentHub:', this.currentHub?.slug);
      // console.log('🔍 DEBUG kng-calendar user:', this.user?.email);

      // ✅ PROTECTION: Vérifier que availableDays[0] est valide avant usage
      if (this.availableDays && this.availableDays.length > 0 && this.availableDays[0] && !isNaN(this.availableDays[0].getTime())) {
        this.currentWeek = Array.from({length: 7}).map((id,idx) => (new Date(this.availableDays[0])).plusDays(idx));
      } else {
        console.warn('⚠️ availableDays[0] est invalide, utilisation fallback');
        // Fallback: utiliser demain comme base
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.currentWeek = Array.from({length: 7}).map((id,idx) => new Date(tomorrow.getTime() + idx * 24 * 3600000));
      }
      this.multipleHubsDays = this.$cart.getShippingDayForMultipleHUBs();
      this.pendingOrder = this.$cart.hasPendingOrder();

      if(!this.isDayAvailable(this.currentWeek[0])){
        this.currentWeek.shift();
      }
      this.updateLastMinuteAvailability();
    })
  }

  ngOnChanges()  {
    this.pendingOrder = this.$cart.hasPendingOrder();

  }

  ngAfterViewInit() {
    try {
      document.querySelector('kng-calendar .calendar').scrollLeft = 80;
    } catch (e) {}
  }

  //
  // label is 'nav_no_shipping' or 'nav_no_shipping_long'
  getNoShippingMessage() {
    // ✅ MIGRATION: Utiliser CalendarService au lieu de config.noShippingMessage
    return this.$calendar.getNoShippingMessage(this.currentHub, this.currentShippingDay, this.locale);
  }

  doSetCurrentShippingDay($event, day: Date, idx: number) {
    if (!this.isDayAvailable(day)) {
      return;
    }
    // this.dialogRef.close(day);

    // ✅ MIGRATION: Utiliser CalendarService au lieu de config
    const hours = this.$calendar.getDefaultTimeByDay(day, this.currentHub);
    this.$cart.setShippingDay(day,hours);
    this.updated.emit({day, time: hours});
  }

  isDayAvailable(day: Date) {
    if(!day){
      return false;
    }
    // ✅ MIGRATION: Utiliser CalendarService avec logique complète (FIXME résolu)
    return this.$calendar.isDayAvailable(day, this.availableDays, {
      user: this.user,
      hub: this.currentHub
    });
  }

  getShippingText(day: Date) {
    if (!this.isDayAvailable(day)) {
      return this.label.nav_shipping_off;
    }
    return this.labelTime;
  }

  getShippingDays() {
    return this.config.shared.shippingweek;
  }

  private refreshCurrentSelection() {
    this.currentShippingDay = this.$cart.getCurrentShippingDay();
    this.currentShippingTime = this.$cart.getCurrentShippingTime();
    this.isLastMinuteSelected = this.$cart.isCurrentShippingLastMinute();
  }

  private updateLastMinuteAvailability() {
    try {
      const availability = this.$calendar.isLastMinuteAvailable(this.currentHub, { now: new Date() });
      this.lastMinuteOption = (availability && availability.available) ? {
        when: availability.when,
        hours: availability.hours || 16
      } : null;
    } catch (err) {
      this.lastMinuteOption = null;
    }
  }


  selectLastMinute() {
    if (!this.lastMinuteOption) {
      return;
    }
    try {
      this.$cart.selectLastMinuteShipping();
      this.refreshCurrentSelection();
      this.updated.emit({
        day: this.currentShippingDay,
        time: this.currentShippingTime,
        lastMinute: true
      });
    } catch (err) {
      console.warn('Last-minute selection failed:', err?.message || err);
    }
  }

}
