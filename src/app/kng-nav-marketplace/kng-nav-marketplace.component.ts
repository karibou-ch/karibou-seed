import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, HostBinding, ElementRef } from '@angular/core';
import { i18n, KngNavigationStateService } from '../common';
import { CartItemsContext, CartService, Config, LoaderService, Order, CalendarService, User } from 'kng2-core';
import pkgInfo from '../../../package.json';
import { Router } from '@angular/router';

@Component({
  selector: 'kng-nav-marketplace',
  templateUrl: './kng-nav-marketplace.component.html',
  styleUrls: ['./kng-nav-marketplace.component.scss']
})
export class KngNavMarketplaceComponent implements OnInit,OnDestroy {
  @Input() config: Config;
  @Input() user: User;
  @Input() orders: Order[];
  @Input() currentShippingDay: Date;
  @Input() isPremium: boolean;

  @Output() updated: EventEmitter<any> = new EventEmitter<any>();

  VERSION = pkgInfo.version;
  labelTime: string;
  currentRanks: any;
  currentLimit: number;
  premiumLimit: number;
  showHUBs: boolean;
  currentHub: any;
  currentCart: any;

  weekdays:{
    fr:[],
    en:[]
  };

  constructor(
    public $elem: ElementRef<HTMLElement>,
    public $cart: CartService,
    public $i18n: i18n,
    public $navigation: KngNavigationStateService,
    public $loader: LoaderService,
    public $router: Router,
    private $calendar: CalendarService
  ) {
    this.weekdays = {
      fr:[],
      en:[]
    }
    this.currentCart = {};
  }


  ngOnDestroy() {
  }

  ngOnInit() {


    this.$loader.update().subscribe(emit=> {
      // ✅ CORRECTION CRITIQUE: Écouter emit.user pour mise à jour après login
      if (emit.user) {
        this.user = emit.user;
      }

      if(emit.state){
        this.config.shared.hubs.forEach(hub => {
          const ctx:CartItemsContext = {
            forSubscription:false,
            hub:hub.slug
          }
          const items = this.$cart.getItems(ctx);
          this.currentCart[hub.slug]={
            count:items.length,
            amount:this.$cart.subTotal(ctx)
          };
        })
      }
      if(!emit.config) {
        return;
      }

      // FIXME remove hardcoded shippingtimes[16]
      this.currentHub = this.config.shared.hub;
      if (this.currentHub && this.currentHub.slug) {
        this.labelTime = this.config.shared.hub.shippingtimes[16] || 'loading...';
        this.currentRanks = this.config.shared.currentRanks[this.currentHub.slug] || {};
        this.currentLimit = this.config.shared.hub.currentLimit || 1000;
        this.premiumLimit =  this.config.shared.hub.premiumLimit || 0;
      }

      this.config.shared.hubs.forEach(hub => {
        this.currentCart[hub.slug]={
          count:0,
          amount:0
        };
      })

      //
      // update scroll position
      const index = this.config.shared.hubs.findIndex(hub => this.currentHub._id == hub.id);
        setTimeout(()=>{
          try {
            document.querySelector('kng-nav-marketplace .marketplace').scrollLeft = 274*index;
          } catch (e) {}
        },100);



      // console.log('----cfg',this.config.shared.hub);
      // const hub = this.config.shared.hub;
      // hub.tagline.image;
      // hub.siteName.image;
      // hub.about.image;


      if(this.lockedHUB) {
        const native: HTMLElement =this.$elem.nativeElement;
        native.setAttribute('hidden','');
      }

    })

  }

  get hubs() {
    if(!this.config.shared.hubs) {
      return [];
    }

    return this.config.shared.hubs.filter(hub => !hub.status.private);
  }

  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.$i18n.label();
  }

  get lockedHUB() {
    return this.$navigation.isLocked();
  }


  getWeekDay(idx) {
    // ✅ MIGRATION: Utiliser CalendarService centralisé au lieu de logique dupliquée
    return this.$calendar.getWeekDay(idx, this.locale);
  }

  onLang($event, lang) {
    this.$i18n.locale = lang;
  }

  toggleStore(hub) {
    //
    // this HUB is running is own domain!!
    if (this.$navigation.isLocked() || this.currentHub.domainOrigin) {
      // FIXME hardcoded link there
      window.location.href = 'https://karibou.ch/store/' + hub.slug + '';
    } else {
      const url = '/store/' + hub.slug + '';
      this.updated.emit(hub);
    }
  }

  // FIXME, scheduler should be in API
  isDayAvailable(day: Date) {
    // ✅ MIGRATION: Utiliser CalendarService avec logique complète (currentRanks only)
    // Note: ce composant n'a pas d'Input user, CalendarService utilisera isPremium du service
    return this.$calendar.isDayAvailable(day, [], {
      hub: this.config.shared.hub
    });
  }

  getShippingDays() {
    return this.config.shared.shippingweek;
  }
}
