import { Component, OnInit, ViewEncapsulation, HostListener, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


import {
  PhotoService, Config, LoaderService
} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';
import { EnumMetrics, MetricsService } from '../common/metrics.service';

@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-welcome.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngWelcomeComponent implements OnInit {

  @ViewChild('background') background: ElementRef;
  @ViewChild('boxes') boxes: ElementRef;

  photos = [];
  exited: boolean;

  K_BRAND = '/assets/img/k-puce.svg';
  //
  // gradient of background image
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.1),
    rgba(50, 50, 50, 0.7)
  ),`;


  i18n: any = {
    fr: {
      title_hypercenter: "Ville de Genève ",
      title_periphery: "Tarif dans ma commune ",
      title_others: "Tarif dans ma commune ",
      title_b2b: "Vous êtes une entreprise ?",
      title_none: "Nous ne livrons pas encore votre commune, essayez votre lieu de travail ?",
      title_postal: "Entrez votre code postal pour afficher les tarifs de livraison",
      title_discount: "➡️ Dès chf <b>__LIMIT__</b> d'achat: livraison",
      title_custom_time: "➡️ Horaire flexible pour les professionnels +<b>__AMOUNT__ fr</b> "
    },
    en: {
      title_hypercenter: "Geneva city ",
      title_periphery: "Rate in my municipality ",
      title_others: "Rate in my municipality ",
      title_b2b: "Are you a company?",
      title_none: "We don't deliver to your municipality yet, why not try your workplace?",
      title_postal: "Enter your postal code to view delivery rates",
      title_discount: "➡️ From chf <b>__LIMIT__</b> of purchases: shipping ",
      title_custom_time: "➡️ Flexible schedule for businesses +<b>__AMOUNT__ fr</b>"
    }
  };

  config: Config;
  postalCode: string;
  image = new Image();
  pi = 50;
  b2b: boolean;
  waiting:boolean;


  constructor(
    public $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $metric: MetricsService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $loader: LoaderService
  ) {
    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config } = this.$loader.getLatestCoreData();
    this.config = config;
    this.exited = false;
    this.b2b = false;
    this.waiting = false;
    // Object.assign(this.config, loader[0]);


    // this.$photo.shops({active: true, random: 40}).subscribe((photos: any) => {
    //   // remove underconstruction shops with missing photos //
    //   this.photos = photos.filter(s => s.photo).map(shop => shop.photo.fg);
    // });
  }

  get locale() {
    return this.$i18n.locale;
  }

  _(id) {
    return this.$i18n[this.locale][id] || this.i18n[this.locale][id];
  }


  get c2a() {
    return this.b2b ? this._('nav_store_b2b'):this._('nav_store_change')
  }

  get faqs() {
    return this.config.shared.faq || [];
  }

  get logo() {
    return this.tagline.image;
  }

  get tagline() {
    if (!this.config || !this.config.shared.tagLine) {
      return {};
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name && shared.hub.domainOrigin) ? hub.tagLine : shared.tagLine;

  }

  get isMessageActive(){
    if (!this.config || !this.config.shared.welcome) {
      return false;
    }
    return !!this.config.shared.welcome.active
  }

  get welcomeMessage(){
    if (!this.config || !this.config.shared.welcome) {
      return "";
    }
    return this.config.shared.welcome.message[this.locale];
  }

  get about() {
    if (!this.config || !this.config.shared.about) {
      return {};
    }
    const shared = this.config.shared;
    const hub =  this.config.shared.hub;
    return (hub && hub.about && shared.hub.domainOrigin) ? hub.about : shared.about;
  }



  get shippingLabel() {
    const code = this.shippingkeyCode;
    if(!this.postalCode || this.postalCode.length<4) {
      return "";
    }

    if(!code) {
      return this.i18n[this.locale]['title_none'];
    }

    const label = 'title_'+code;
    return this.i18n[this.locale][label];
  }


  get shippingPrice() {
    const code = this.shippingkeyCode;
    if(!code) {
      return ""
    }
    return this.config.shared.shipping.price[code];
  }

  get isValidPostalCode() {
    return this.getShippingPostalCode().indexOf(this.postalCode) > -1;
  }

  get shippingkeyCode() {
    const code = ['hypercenter','periphery','others'].find(key => {
      let codes = this.config.shared.shipping.district[key] || [];
      return (codes.indexOf(this.postalCode) > -1)
    })
    return code;
  }


  get isLocked(){
    return this.$navigation.isLocked();
  }


  get width(){
    return "100%";
  }

  get height(){
    return "100%";
  }

  get canvas() {
    return this.background.nativeElement;
  }


  get ctx() {
    if(!this.canvas) {
      return new CanvasRenderingContext2D();
    }
    return this.canvas.getContext('2d') as CanvasRenderingContext2D;
  }


  get homeDestination() {
    const market = this.store || 'artamis';
    const route = ['/store',market,'home'];
    if(!this.b2b) {
      return route
    }

    route.push('business');
    return route;
  }


  get store() {
    return this.$navigation.store;
  }

  ngOnInit() {
    //
    // publish metrics
    // FIXME default HUB should not be Artamis!
    // window.location.host
    const hub = (this.config.shared.hub && this.config.shared.hub.slug)||'artamis';
    this.waiting = false;



    const metric ={
      path:window.location.pathname,
      title: 'Landing',
      action:'landing',
      hub,
    };
    this.$metric.event(EnumMetrics.metric_view_page,metric);
    // const url = this.tagline.image;
    // this.image.src = url;
    // this.image.onload = () => {
    //   this.drawBackground();
    // }

  }

  drawBackground () {
    const lum = Math.min(this.pi*0.3,70)|0;
    const light = (Math.cos(this.pi * 0.1)+1)*10+50|0;
    const angle = this.pi%360;
    const saturation = `hsl(${angle},100%,${lum}%)`;
    this.pi+=2;


    //
    // cover image instead of stretch
    // https://stackoverflow.com/a/66560970

    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalCompositeOperation = "multiply";
    this.ctx.fillStyle = saturation;  // saturation at 100%
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);  // apply the comp filter
    this.ctx.globalCompositeOperation = "source-over";  // restore default comp
    setTimeout(()=>{
      requestAnimationFrame(this.drawBackground.bind(this))
    },80)
  }


  getShippingDiscount(key:"A"|"B") {
    const code = this.shippingkeyCode;
    if(!code) {
      return ""
    }



    const label = this.i18n[this.locale].title_discount;
    const limit = this.config.shared.shipping['discount'+key];
    if(!limit) {
      return "";
    }
    const price = (this.shippingPrice - this.config.shared.shipping['price'+key]);
    if(!price) {
      return "";
    }
    const label_price = price ? (price.toFixed(1)+' fr'):('OFFERTE')
    return label.replace('__LIMIT__',limit)+' <b>'+label_price+' </b>';
  }

  getShippingPostalCode() {
    if (!this.config || !this.config.shared.shipping) {
      return [];
    }
    const center = this.config.shared.shipping.district.hypercenter || [];
    const periphery = this.config.shared.shipping.district.periphery || [];
    return center.concat(periphery,this.config.shared.shipping.district.others);
  }

  getShippingCustomHours() {
    const code = this.shippingkeyCode;


    if (!code||!this.config || !this.config.shared.shipping) {
      return '';
    }

    const label = this.i18n[this.locale].title_custom_time;
    const shipping = this.config.shared.shipping;

    const time = +Object.keys(shipping.pricetime).find(time => shipping.pricetime[time]>0) as number;
    if(!time) {
      return '';
    }

    return label.replace('__AMOUNT__',(shipping.pricetime[time]).toFixed(1));
  }

  isAppReady() {
    return this.$navigation.store !== undefined;
  }

  //
  // capture Clic on child innerHtml
  @HostListener('click', ['$event'])
  onClick($event): void {
    const target = $event.target as HTMLElement;
    const href = target.getAttribute('href');
    //
    // verify if it's a routerLink
    if(href && href.length > 2 &&
      (href.indexOf('http') === -1&&href.indexOf('mailto:') === -1&&href.indexOf('tel:') === -1)) {
      $event.stopPropagation();
      $event.preventDefault();
      this.exited = true;
      this.$router.navigateByUrl(href);
      return;
    }

  }

  //
  // codepostal
  onChange($event) {
    this.postalCode = $event.target.value;
    //setTimeout(() => this.$cdr.markForCheck(),100);
  }

  doB2B() {
    this.b2b = !this.b2b;
    if(!this.boxes||!this.boxes.nativeElement) {
      return;
    }

    let elems = this.boxes.nativeElement.querySelectorAll('.b2b');
    if(!elems.length){
      elems = this.boxes.nativeElement.querySelectorAll('.business');
    }

    elems.forEach(elem => {
      if(this.b2b){
        elem.classList.add('view-b2b');
      }else{
        elem.classList.remove('view-b2b');
      }
    })

  }

  doLangSwitch() {
    this.$i18n.localeSwitch();
  }


}
