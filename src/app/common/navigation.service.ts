import { ElementRef, Injectable } from '@angular/core';
import { Router, NavigationEnd, Route, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

import { Config, ConfigService, ShopService, UserService } from 'kng2-core';

import { debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, fromEvent, Observable, ReplaySubject, Subject } from 'rxjs';

/**
 *
 */
@Injectable()
export class KngNavigationStateService  {

  private _historyCursor ="";
  private _history: string[] = [];
  private _token:string[];

  private config: Config;
  private menu: any;
  private currentStore: string;
  private agent: string;
  private cached: any = {};
  static forceLockedHub: string;
  static forceLandingHub: string;

  private _search$: Subject<string>;
  private _logout$: Subject<void>;

  constructor(
    private $config: ConfigService,
    private $user: UserService,
    private $shops: ShopService,
    private $location: Location,
    private $route: ActivatedRoute,
    private $router: Router
  ) {
    this.menu = {};

    this._search$ = new Subject<string>();
    this._logout$ = new Subject<void>()
    this._logout$.pipe(
      debounceTime(1000),
      switchMap(()=>this.$user.logout())
    ).subscribe();
    
    //
    // init common parameters
    this.agent = navigator.userAgent || navigator.vendor || window['opera'];
    this.$route.queryParams.subscribe(params => {
      KngNavigationStateService.forceLockedHub = params.locked || KngNavigationStateService.forceLockedHub;

      //
      // stored sign-in 
      const token = params.token;
      if (token && token.length) {
        try{ this._token = atob(token).split('::') }catch(e) {}
      }
  
    });

    this.$router.events
      .pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
        this._history.push(event.urlAfterRedirects);
        // get position in site
        const elem = event.urlAfterRedirects.split('/home').pop()|| '/home';
        this._historyCursor = elem.split('/')[1];
      });

    this.$config.config$.subscribe(config =>{
      this.updateConfig(config);
    });   

    //
    // UX for easy login 
    this._token = [];

  }

  //
  // FIXME, config.shared can be undefined
  private updateConfig(config: Config) {
    if (!config.shared) {
      return;
    }
    this.config = config;
    this.menu = {};
    this.cached = {};

    const hub = this.config.shared.hub;

    //
    // set Landing HUB
    if(!this.landingHubSlug && hub) {
      KngNavigationStateService.forceLandingHub = hub.slug;
    }

    //
    // set HUB theme
    if (hub && hub.colors && hub.colors.primary) {
      try {
        const style = document.documentElement.style;
        if (hub.colors.primary) { style.setProperty('--mdc-theme-primary', hub.colors.primary); }
        if (hub.colors.primaryText) { style.setProperty('--mdc-theme-primary-text', hub.colors.primaryText); }
        if (hub.colors.action) { style.setProperty('--mdc-theme-secondary', hub.colors.action); }
        if (hub.colors.actionText) { style.setProperty('--mdc-theme-secondary-text', hub.colors.actionText); }
        //
        // remove pink 
        //if (hub.colors.action) { style.setProperty('--mdc-theme-karibou-pink', hub.colors.action); }

        //
        // force appBar to Null if not exists
        if(hub.colors.appbar){
          style.setProperty('--mdc-theme-appbar', hub.colors.appbar);
        }else{
          style.removeProperty('--mdc-theme-appbar');
        }
        if(hub.colors.appbarText){
          style.setProperty('--mdc-theme-appbar-text', hub.colors.appbarText);
        }else{
          style.removeProperty('--mdc-theme-appbar-text');
        }

      } catch (err) {}
    }


    //
    // group menu
    const menus = config.shared.menu || [];
    menus.forEach(menu => {
      if (!this.menu[menu.group]) {
        this.menu[menu.group] = [];
      }
      this.menu[menu.group].push(menu);
    });

    if(!this.store && hub && hub.slug) {
      this.store = hub.slug;
    }
  }

  get currentToken() {
    return this._token; 
  }

  get currentContentType() {
    return this._historyCursor;
  }  


  get hasHistory() {
    return this._history.length>1;
  }  
  get landingHubSlug() {
    return KngNavigationStateService.forceLandingHub;
  }

  get HUBs() {
    return this.config.shared.hubs || [];
  }

  set store(store: string) {
    if (!store || this.currentStore === store) {
      return;
    }
    this.currentStore = store;
    this.$config.get(store).subscribe();
    this.$shops.query({hub: store}).subscribe();
    console.log('---- DBG set $navigation.store',store);
  }

  get store() {
    return this.currentStore;
  }

  //
  // FIXME implement 100% complete back
  back() {
    if(!this.hasHistory) {
      // use unique code HERE to go back
    }
    this.$location.back();

    //
    // check if back is going no where
    // setTimeout(() => {
    //   if (!this.isReady|| query.source) {
    //     return;
    //   }
    //   this.$router.navigate(['../../'], { relativeTo: this.$route });
    // }, 500);    

  }

  debounceLogout() {
    this._logout$.next();
    return this._logout$.asObservable();
  }

  //
  // list item for one group
  // "howto","karibou","links","shop","shipping","admin"
  getMenuItems(group: string) {
    if (this.cached[group]) {
      return this.cached[group];
    }
    // active, name.fr, url, weight
    if (!this.menu[group]) {
      return [];
    }

    this.cached[group] = this.menu[group].filter(menu => {
      return menu.active == true && menu.url;
    }).sort((a1, a2) => {
      return a1.weight - a2.weight;
    });
    return this.cached[group];
  }


  isLocked(): boolean {

    if(KngNavigationStateService.forceLockedHub == this.store) {
      return true;
    }
    return !!this.config.shared.hub.domainOrigin;
  }

  isMobile(): boolean {
    // tslint:disable-next-line: max-line-length
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(this.agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(this.agent.substr(0, 4))) {
      return true;
    }
    return false;
  }

  isMobileOrTablet(): boolean {
    // tslint:disable-next-line: max-line-length
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(this.agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(this.agent.substr(0, 4))) {
     return true;
    }
    return false;
  }

  registerScrollEvent(container?) {
    let _scrollPosition = 0;
    let _scrollDirection = 0;
  
    //
    // detect scrall motion and hide component
    // @HostListener('window:scroll', ['$event'])
    const windowScroll:any = ($event?) => {
      const scrollPosition = $event && $event.target.scrollTop || window.pageYOffset;
      //
      // initial position, event reset value
      if(scrollPosition == 0) {
        return(scrollPosition);
      }
      //
      // avoid CPU usage
      if (Math.abs(_scrollPosition - scrollPosition) < 20) {
        return;
      }

      // console.log(window.pageYOffset,scrollPosition,'-- > sH, sT, cH: ', $event.target.scrollHeight,$event.target.scrollTop, $event.target.clientHeight);

      if (scrollPosition > _scrollPosition) {
        if (_scrollDirection < 0) {
          _scrollDirection--;
        } else {
          _scrollDirection = -6;
        }
      } else {
        if (_scrollDirection > 0) {
          _scrollDirection++;
        } else {
          _scrollDirection = 1;
        }
      }
      _scrollPosition = scrollPosition;


      // FIXME make it better (<-5 && !exited) = event.exit 
      //this._direction$.next(5*(Math.round( _scrollDirection / 5)));
      return (_scrollDirection);
    }


    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    let elem = document;
    if (container) {
      elem = (container instanceof ElementRef)? container.nativeElement:document.querySelector(container);
    }
    return fromEvent(elem, 'scroll').pipe(
      debounceTime(50),
      map(event => windowScroll(event)),
      filter(position=> Number.isInteger(position)),
      distinctUntilChanged()
    );
  }

  searchAction(keyword: string) {
    this._search$.next(keyword);
  }

  search$() {
    return this._search$.asObservable().pipe(
      filter(keyword => !!keyword && keyword.length>3),
      debounceTime(600)
    );
  }

}
