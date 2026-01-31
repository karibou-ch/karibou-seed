import { ElementRef, Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

import { Config, ConfigService, ShopService, UserService } from 'kng2-core';

import { debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { fromEvent, Subject } from 'rxjs';

/**
 *
 */
@Injectable()
export class KngNavigationStateService  {

  private _historyCursor ="";
  private _history: string[] = [];
  private _token:string[];
  private _authlink:string;
  private config: Config;
  private menu: any;
  private currentStore: string;
  private agent: string;
  private cached: any = {};
  static forceLockedHub: string = '';
  static forceLandingHub: string;

  private _search$: Subject<string>;
  private _logout$: Subject<void>;
  private _swipePanel$: Subject<number>;

  private theme:{
    slug?:string;
    name:string;
    description:string;
    img?:string;
  }


  constructor(
    private $config: ConfigService,
    private $user: UserService,
    private $shops: ShopService,
    private $location: Location,
    private $route: ActivatedRoute,
    private $router: Router
  ) {
    this.menu = {};
    this.theme = {name:'',description:''};
    this._authlink = '';

    this._search$ = new Subject<string>();
    this._logout$ = new Subject<void>();
    this._swipePanel$ = new Subject<number>();
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
      // stored authlink
      if(!this._authlink) {
        this._authlink = params.authlink || '';
      }

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

        if(hub.colors.colormix) { style.setProperty('--mdc-theme-colormix', hub.colors.colormix);}
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

  get currentTheme() {
    return this.theme;
  }

  get currentAuthlink() {
    return this._authlink;
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

  set currentTheme(theme: any) {
    this.theme = theme;
  }

  set store(store: string) {
    if (!store || this.currentStore === store) {
      return;
    }
    this.currentStore = store;
    // this.$config.get(store).subscribe();
    // this.$shops.query({hub: store}).subscribe();
    console.log('---- DBG set $navigation.store',store);
  }

  get store() {
    return this.currentStore;
  }


  // Ipad Air 5th gen
  // (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15"
  // (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
  get isIOS() {
    const userAgent = window.navigator.userAgent || '';

    // Rechercher la version d'iOS dans l'User-Agent
    const match = userAgent.match(/OS X (\d+)_(\d+)_(\d+)?/i);

    if (match) {
      const majorVersion = match[1] || '0';
      const minorVersion = match[2] || '0';
      const patchVersion = match[3] || '0';

      return `iOS:${majorVersion}.${minorVersion}.${patchVersion}`;
    }

    // Retourne null si la version iOS n'a pas été trouvée
    return '';
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
    if(!this.config.shared.hub) {
      return false;
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

  registerScrollEvent(container?,debounceT?) {
    let scrollPosition = 0;
    let scrollDirection = 0;

    //
    // detect scrall motion and hide component
    // @HostListener('window:scroll', ['$event'])
    const windowScroll:any = ($event?) => {
      const _scrollPosition = $event && $event.target.scrollTop || window.pageYOffset;

      //
      // initial position, event reset value
      if(_scrollPosition == 0) {
        return {direction:0,position:_scrollPosition};
      }
      //
      // avoid CPU usage
      if (Math.abs(scrollPosition - _scrollPosition) < 20) {
        return {direction:0,position:_scrollPosition};
      }

      // console.log(window.pageYOffset,_scrollPosition,'-- > sH, sT, cH: ', $event.target.scrollHeight,$event.target.scrollTop, $event.target.clientHeight);

      if (_scrollPosition > scrollPosition) {
        if (scrollDirection < 0) {
          scrollDirection--;
        } else {
          scrollDirection = -6;
        }
      } else {
        if (scrollDirection > 0) {
          scrollDirection++;
        } else {
          scrollDirection = 1;
        }
      }
      scrollPosition = _scrollPosition;


      // FIXME make it better (<-5 && !exited) = event.exit
      //this._direction$.next(5*(Math.round( scrollDirection / 5)));
      return {direction:scrollDirection,position:scrollPosition};
    }


    //
    // read documentation about renderer
    // https://netbasal.com/angular-2-explore-the-renderer-service-e43ef673b26c
    let elem = document;
    if (container) {
      elem = (container instanceof ElementRef)? container.nativeElement:document.querySelector(container);
    }
    return fromEvent(elem, 'scroll').pipe(
      debounceTime(debounceT||50),
      map(event => windowScroll(event)),
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

  /**
   * Émet le panel actif après un swipe (0=side, 1=center, 2=custom, 3=right)
   * À appeler depuis le composant avec l'event scroll du wrapper
   */
  emitSwipePanel(panelIndex: number) {
    this._currentPanel = panelIndex;
    this._swipePanel$.next(panelIndex);
  }

  /**
   * Observable pour s'abonner aux changements de panel après swipe
   * Les composants peuvent réagir quand on swipe vers un nouveau panel
   */
  swipePanel$() {
    return this._swipePanel$.asObservable().pipe(
      distinctUntilChanged()
    );
  }

  toggleDarkMode() {
    try{
      // screen.prefers-color-scheme = "dark"; //or
      // window.prefers-color-scheme = "dark"; //or
      // navigator.prefers-color-scheme = "dark";

    }catch(err) {

    }
  }

  /**
   * Récupère la valeur d'une variable CSS
   * @param variableName - Nom de la variable CSS (ex: '--mdc-theme-top-bar')
   * @param element - Élément HTML optionnel (défaut: document.documentElement)
   * @returns Valeur de la variable CSS ou chaîne vide si non trouvée
   */
  getCssVariable(variableName: string, element?: HTMLElement): string {
    const target = element || document.documentElement;
    return getComputedStyle(target).getPropertyValue(variableName).trim();
  }

  /**
   * Récupère la valeur numérique d'une variable CSS (en pixels)
   * @param variableName - Nom de la variable CSS (ex: '--mdc-theme-top-bar')
   * @param element - Élément HTML optionnel
   * @returns Valeur numérique en pixels ou 0 si non trouvée/invalide
   */
  getCssVariableAsNumber(variableName: string, element?: HTMLElement): number {
    const value = this.getCssVariable(variableName, element);
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // ============================================================================
  // GRID LAYOUT - Mobile Swipe Navigation
  // ============================================================================

  private _mobileWrapper: HTMLElement | null = null;
  private _currentPanel: number = 1; // 0=side, 1=center, 2=right

  /**
   * Enregistre l'élément wrapper mobile pour le swipe
   * À appeler depuis le composant root avec ViewChild
   */
  setMobileWrapper(element: HTMLElement | null): void {
    this._mobileWrapper = element;
  }

  /**
   * Retourne le panel actif (0=side, 1=center, 2=right)
   */
  get currentPanel(): number {
    return this._currentPanel;
  }

  /**
   * Utilitaire pour replacer le scroll au centre (colonne center) sur mobile
   *
   * @param wrapperElement - L'élément HTML du wrapper mobile (mobile-columns-wrapper)
   * @param behavior - Comportement du scroll : 'auto' (instantané) ou 'smooth' (animé)
   * @returns true si le scroll a été effectué, false sinon
   */
  scrollToCenter(wrapperElement?: HTMLElement | null | undefined, behavior: ScrollBehavior = 'auto'): boolean {
    const wrapper = wrapperElement || this._mobileWrapper;

    if (!wrapper) {
      console.warn('scrollToCenter: wrapperElement is null or undefined');
      return false;
    }

    // Vérifier si on est sur mobile (max-width: 599px)
    if (window.innerWidth > 599) {
      // Pas sur mobile, ne rien faire
      return false;
    }

    // Calculer la position de la colonne center (index 1 = 100vw)
    const centerPosition = window.innerWidth;

    // Scroller vers la colonne center
    wrapper.scrollTo({
      left: centerPosition,
      behavior: behavior
    });

    this._currentPanel = 1;
    return true;
  }

  /**
   * Scroll vers un panel spécifique (0=side, 1=center, 2=right)
   *
   * @param panelIndex - Index du panel (0, 1 ou 2)
   * @param wrapperElement - L'élément wrapper (optionnel si déjà enregistré)
   * @param behavior - Comportement du scroll
   * @returns true si le scroll a été effectué
   */
  scrollToPanel(panelIndex: number, wrapperElement?: HTMLElement | null, behavior: ScrollBehavior = 'smooth'): boolean {
    const wrapper = wrapperElement || this._mobileWrapper;

    if (!wrapper) {
      console.warn('scrollToPanel: wrapperElement is null or undefined');
      return false;
    }

    // Vérifier si on est sur mobile
    if (window.innerWidth > 599) {
      return false;
    }

    // Limiter l'index entre 0 et 2
    const validIndex = Math.max(0, Math.min(2, panelIndex));

    // Calculer la position
    const targetPosition = validIndex * window.innerWidth;

    wrapper.scrollTo({
      left: targetPosition,
      behavior: behavior
    });

    this._currentPanel = validIndex;
    return true;
  }

  /**
   * Scroll vers le panel de gauche (side menu)
   */
  scrollToSide(wrapperElement?: HTMLElement | null, behavior: ScrollBehavior = 'smooth'): boolean {
    return this.scrollToPanel(0, wrapperElement, behavior);
  }

  /**
   * Scroll vers le panel de droite (right sidebar)
   */
  scrollToRight(wrapperElement?: HTMLElement | null, behavior: ScrollBehavior = 'smooth'): boolean {
    return this.scrollToPanel(2, wrapperElement, behavior);
  }

  /**
   * Détecte le panel actuellement visible basé sur la position de scroll
   */
  detectCurrentPanel(wrapperElement?: HTMLElement | null): number {
    const wrapper = wrapperElement || this._mobileWrapper;

    if (!wrapper || window.innerWidth > 599) {
      return 1; // Center par défaut
    }

    const scrollLeft = wrapper.scrollLeft;
    const panelWidth = window.innerWidth;

    // Calculer l'index basé sur le scroll
    this._currentPanel = Math.round(scrollLeft / panelWidth);
    return this._currentPanel;
  }

}
