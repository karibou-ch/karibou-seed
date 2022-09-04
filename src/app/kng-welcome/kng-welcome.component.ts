import { Component, OnInit, ViewEncapsulation, HostListener, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


import {
  PhotoService, Config
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

  photos = [];
  exited: boolean;

  K_BRAND = '/assets/img/k-brand-lg.png';
  //
  // gradient of background image
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.1),
    rgba(50, 50, 50, 0.7)
  ),`;


  i18n: any = {
    fr: {
    },
    en: {
    }
  };

  config: Config;
  postalCode: string;

  constructor(
    public $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $metric: MetricsService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $photo: PhotoService
  ) {
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
    this.exited = false;
    // Object.assign(this.config, loader[0]);

  
    this.$photo.shops({active: true, random: 40}).subscribe((photos: any) => {
      // remove underconstruction shops with missing photos //
      this.photos = photos.filter(s => s.photo).map(shop => shop.photo.fg);
    });
  }

  get locale() {
    return this.$i18n.locale;
  }

  _(id) {
    return this.$i18n[this.locale][id];
  }


  ngOnInit() {
    //
    // publish metrics
    // FIXME default HUB should not be Artamis!
    // window.location.host
    const source = this.$route.snapshot.queryParamMap.get('target')||
                   this.$route.snapshot.queryParamMap.get('ad') ||
                   this.$route.snapshot.queryParamMap.get('umt_source');
    const hub = (this.config.shared.hub && this.config.shared.hub.slug)||'artamis';

    const metric ={
      path:window.location.pathname,
      title: 'Landing',
      action:'landing',
      hub,
      source
    };
    console.log('---DBG metrics',metric);
    this.$metric.event(EnumMetrics.metric_view_page,metric);

  }
  

  doLangSwitch() {
    this.$i18n.localeSwitch();
  }

  getAbout(key) {
    if (!this.config || !this.config.shared.about[key]) {
      return;
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name) ? hub.about[key][this.$i18n.locale] : shared.about[key][this.$i18n.locale];
  }

  getAboutImage() {
    const defaultImg = (this.config && this.config.shared.hub && this.config.shared.hub.tagLine) ?
          this.config.shared.hub.about.image : this.K_BRAND;

    const bgStyle = 'url(' + defaultImg + ')';
    return {'background-image': this.bgGradient + bgStyle};
  }

  getShippingPostalCode() {
    if (!this.config || !this.config.shared.shipping) {
      return [];
    }
    const periphery = this.config.shared.shipping.periphery || [];
    return [1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209].concat(periphery);
  }

  getTagline(key) {
    if (!this.config || !this.config.shared.tagLine[key]) {
      return;
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name) ? hub.tagLine[key][this.$i18n.locale] : shared.tagLine[key][this.$i18n.locale];
  }

  getTaglineImage() {
    if(!this.config.shared || !this.config.shared.tagLine) {
      return {};
    }
    let defaultImg = this.config.shared.tagLine.image;
    if(this.config.shared.hub && this.config.shared.hub.tagLine) {
      defaultImg = this.config.shared.hub.tagLine.image;
    }


    const bgStyle = 'url(' + defaultImg + ')';
    return {'background-image': bgStyle};

  }

  get isValidPostalCode() {
    return this.getShippingPostalCode().indexOf(+this.postalCode) > -1;
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
    if(href && href.length > 2 && href.indexOf('http') === -1) {
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


  set store(name) {
    this.$navigation.store = name;
    // this.$router.navigate(['/store/'+name]);
  }

  get store() {
    return this.$navigation.store;
  }

}
