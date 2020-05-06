import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


import {
  PhotoService, Config
} from 'kng2-core';

import { KngNavigationStateService, i18n } from '../common';

@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-welcome.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngWelcomeComponent implements OnInit {

  photos = [];

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

  constructor(
    public $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $photo: PhotoService
  ) {
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
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


  doLangSwitch() {
    this.$i18n.localeSwitch();
  }
  getTagline(key) {
    if (!this.config || !this.config.shared.home.tagLine[key]) {
      return;
    }
    return this.config.shared.home.tagLine[key][this.$i18n.locale];
  }

  getWelcomeImage() {
    if (!this.config || !this.config.shared || !this.config.shared.home) {
      return {};
    }

    const bgStyle = 'url(' + this.config.shared.home.howto.image + ')';
    return {'background-image': this.bgGradient + bgStyle};
  }


  ngOnInit() {
    //
    //
    this.$route.params.subscribe(params => {
      this.$navigation.store = this.store = params['store'];
    });
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
      this.$router.navigateByUrl(href);
      return;
    }

  }


  set store(name) {
    this.$navigation.store = name;
    // this.$router.navigate(['/store/'+name]);
  }

  get store() {
    return this.$navigation.store;
  }

}
