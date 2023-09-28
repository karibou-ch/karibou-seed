import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Config } from 'kng2-core';
import { i18n } from '../i18n.service';
import { KngNavigationStateService } from '../navigation.service';


@Component({
  selector: 'kng-news',
  templateUrl: './kng-news.component.html',
  styleUrls: ['./kng-news.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class KngNewsComponent implements OnInit {

  static  KNG_TO_DISPLAY = true;
  private KNG_STORE_NEWS = "kng2-stored-news";
  private _open: boolean;


  @Input() config: Config;


  isReady = false;
  content = "";
  stored= [];
  

  //
  // gradient of background image
  bgGradient = `linear-gradient(
    rgba(50, 50, 50, 0.01),
    rgba(50, 50, 50, 0.1)
  ),`;


  constructor(
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $route: Router
  ) {
  }

  ngOnDestroy() {
  }

  ngOnInit() {

    //
    // avoid open news when landing on product, category or vendor
    this.isReady = this.hasContent('p');
    //
    // already stored news
    try {
      this.stored = JSON.parse(localStorage.getItem(this.KNG_STORE_NEWS)) || [];
      this.content = this.getContent('p');
      const hacha = this.hacha(this.content);
      if(this.stored.indexOf(this.hacha(this.content))==-1){
        this.open = KngNewsComponent.KNG_TO_DISPLAY && this.isReady;
        KngNewsComponent.KNG_TO_DISPLAY = false;
      }
    } catch (err) {
    }

  }

  get i18n() {
    return this.$i18n;
  }

  get locale() {
    return this.$i18n.locale;
  }

  set open(open: boolean) {
    if(open == this._open ){
      return;
    }
    if(open) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }

    this._open = open;
  }

  get open() {
    return this._open;
  }

  //
  // content belongs on navigation position (home,shops,cart,products,etc)
  get contentFromNavigation() {
    const target = this.$navigation.currentContentType;
    const content = this.config.shared.hub.home.content.find(elem => elem.target == target);
    return content;
  }

  doClose() {
    this.stored.unshift(this.hacha(this.content));
    this.stored = this.stored.filter((v, i, a) => a.indexOf(v) === i).slice(0,5);

    try {
      localStorage.setItem(this.KNG_STORE_NEWS, JSON.stringify(this.stored));
    } catch (err) {
    }
    this.open = false;
  }

  doQuit(){
    this.open = false;
  }  

  hacha(str) {
    const hash:number = Array.from(str).reduce((hash:number, char:string) => {
      return (hash << (6)) + (char.charCodeAt(0)) + (hash << (16)) - hash ;
    }, 0) as number;
    // return 8 bytes!
    return (hash & 0xffffffff) ;  
  }

  //
  // HUB information
  getContent(elem: string) {
    try {
      //
      // content belongs on type
      const content = this.contentFromNavigation;
      if(!content) false;
      return this.content = content[elem][this.$i18n.locale];
    } catch (err) {
      return '';
    }
  }  


  //
  // HUB information
  getContentStyle() {
    const content = this.contentFromNavigation;
    if (!content || !content.image) {
      return {};
    }

    const bgStyle = 'url(' + content.image + ')';
    return { 'background-image': this.bgGradient + bgStyle };
  }

  hasBackgroundContent() {
    const content = this.config.shared.hub.home.content[0];
    return (content && !!content.image);
  }

  hasContent(elem: string) {
    try {
      //
      // content belongs on type
      const content = this.contentFromNavigation;
      if(!content) false;

      const value = content[elem][this.$i18n.locale];
      return value !== '' && (!!value);
    } catch (err) {
      return false;
    }
  }

}
