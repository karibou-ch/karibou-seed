import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService, CartService,CartItemsContext, Config, ProductService, User } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../common';
import { KngAudioRecorderService, RecorderState } from '../shared/kng-audio-recorder.service';
import { Subscription } from 'rxjs';
import { EnumMetrics, MetricsService } from '../common/metrics.service';
import { AssistantState, KngAssistantComponent } from '../shared/kng-assistant/kng-assistant.component';

@Component({
  selector: 'kng-assistant-bot',
  templateUrl: './kng-assistant-bot.component.html',
  styleUrls: ['./kng-assistant-bot.component.scss']
})
//changeDetection: ChangeDetectionStrategy.OnPush
export class KngAssistantBotComponent implements OnInit {

  @ViewChild('dialog', { static: true }) dialog: ElementRef;
  @ViewChild('assistant',{static: true}) assistant: KngAssistantComponent;

  user:User;
  config:Config;
  isReady = false;
  isFeedbackReady = false;
  messages:any[];
  error:string;
  prompt:string;
  scrollToBottom:boolean;
  scrollBottomPosition:number;
  scrollStickedToolbar:boolean;

  assistantState:AssistantState;

  subscription$:any;


  tips = [
    {clazz:"", label:"Qui es-tu James?",action:"Bonjour James, qui es-tu et quelles sont les services que tu proposes ?"},
    //{clazz:"hide-sm", label:"Mon panier...",action:"Une semaine de menus avec les produits de mon panier"},
    {clazz:"hide-sm", label:"Mes commandes",action:"Que proposes-tu avec mes commandes"},
    {clazz:"", label:"Un événement",action:"Je veux organiser un buffet pour un événement"},
    {clazz:"hide-sm", label:"Une école",action:"Une composition équilibrée de 10 produits pour le parascolaire des enfants"},
    // {clazz:"", label:"Produits populaires...",action:"Une semaine de menus avec les produits populaires"},
    // {clazz:"", label:"Les thématiques...",action:"Quelle liste de thématiques tu proposes?"},
    {clazz:"", label:"J'ai de la chance",action:"*?"},
  ];
  prompts = [
    "Les 10 meilleures recettes de cuisine française",
    "Les 10 meilleures recettes de cuisine italienne", 
    "Les 10 meilleures recettes de cuisine Espagnole et Tapas", 
    "Les 10 meilleures recettes de cuisine de la mer", 
    "La recette du Hamburgers texans",
    "La recette de Viande hachée façon Cambodgienne",
    "La recette Gyudon Japonais",
    "La recette Blanquette de veau traditionnelle",
    "La recette Lasagnes à la bolognaise",
    "La recette de La Vraie Moussaka Grecque",
    "La recette du Filet mignon en croûte",
    "La recette de Béchamel rapide et facile",
    "La recette du Gratin dauphinois",
    "La recette du Sauté de veau au chorizo",
    "La recette du Boeuf Bourguignon rapide",
    "La recette du Couscous poulet et merguez",
    "La recette du Chili con carne",
    "La recette du Lapin à la moutarde maison",
    "La recette de la Ratatouille",
    "La Mayonnaise maison",
    "La Sauce béarnaise",
    "La Sauce au poivre",
    "La Sauce aigre-douce"
  ];


  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $metric: AnalyticsService,
    private $metrics: MetricsService,
    private $navigation: KngNavigationStateService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef
  ) { 
    const ask = this.$route.snapshot.queryParamMap.get('recipe');
    this.prompt = ask? "Les 10 meilleures associations avec "+ask:"";
    
    // this.$router.navigate([], {
    //   queryParams: {recipe: null}
    // });

    this.subscription$ = new Subscription();    

    const loader = this.$route.snapshot.parent.data.loader || this.$route.snapshot.data.loader;
    if(loader) {
      this.config = loader[0];
      this.user = loader[1];  
    }

    this.messages = [];
    this.scrollBottomPosition = 0;
  }
  get label() {
    return this.$i18n.label();
  }

  get container() {
    return this.dialog;
  }

  get displayName () {    
    return this.user.displayName;
  }

  get store(){
    return this.hub && this.config.shared.hub.slug;
  }

  get hub(){
    return this.config && this.config.shared.hub;
  }

  get clientWidth() {
    if(!this.dialog || !this.dialog.nativeElement){
      return 0;
    }
    return this.dialog.nativeElement.children[1].clientWidth    
  }

  get cartAmount() {
    const ctx:CartItemsContext = {
      forSubscription:false,
      hub:this.store
    }    
    return this.$cart.subTotal(ctx).toFixed(2)
  }

  get randomPrompt() {
    const prompt = this.prompts.sort((a, b) => 0.5 - Math.random())[0];
    return (prompt==this.prompt)? this.randomPrompt:prompt;
  }

  get isAssistantRuning() {
    if(!this.assistantState) return false;
    return this.assistantState.isAssistantRuning;
  }

  get audioIsRecording() {
    if(!this.assistant) return false;
    return this.assistant.audioIsRecording;
  }

  get messagesCount() {
    if(!this.assistantState) return 0;
    return this.assistantState.messagesCount;
  }

  get messagesLimit() {
    if(!this.assistant) return 0;
    return this.assistantState.tokensOut>15000;
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();

    //
    // DIALOG INIT HACK
    document.body.classList.remove('mdc-dialog-scroll-lock');
    // const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    // const eventName = supportTouchEvent? 'touchend':'mouseup';
    // window.removeEventListener(eventName,this.audioStopAndSave.bind(this));
  }

  async ngOnInit() {
    //
    // detect end recording and use filters to avoid multiple fire
    // const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    // const eventName = supportTouchEvent? 'touchend':'mouseup';

    // this.subscription$.add(
    //   fromEvent<MouseEvent>(window,eventName).pipe(map ($evt => $evt.screenX * $evt.screenY),debounceTime(50),distinctUntilChanged()).subscribe(this.audioStopAndSave.bind(this))
    // );

    //
    // publish metrics
    const metric ={
      path:window.location.pathname,
      hub:this.store,
      action:'james',
      title:document.title
    }
    this.$metrics.event(EnumMetrics.metric_view_page,metric);


    this.subscription$.add(
      this.$navigation.registerScrollEvent(this.container,10).subscribe(scroll => {
        this.scrollToBottom = scroll.direction<=0 && (scroll.position+100)> this.scrollBottomPosition;
        this.$cdr.markForCheck();
      })  
    );

    if(this.prompt) {
      // this.onChat();
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
      this.container.nativeElement.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
    this.isReady = true;
  }

  ngAfterViewInit() {
    this.onScrollToBottom();
  }

  ngAfterViewChecked() {
    //
    // DIALOG INIT HACK
    document.body.classList.add('mdc-dialog-scroll-lock');
  }

  clean() {
    this.isReady = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }  

  //
  // stop assistant 
  onAbort() {
  }


  onScrollToBottom() {
    setTimeout(()=>{
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
      this.scrollBottomPosition = this.container.nativeElement.scrollTop;        
      this.scrollStickedToolbar = (this.container.nativeElement.scrollTop>40);
    },500);
  }

  onAssistant(state) {
    this.assistantState = state;
    this.onScrollToBottom();
  }
  // //
  // // capture mic control
  // @HostListener('window:keydown.m',['$event']) 
  // async onKeydownCtrl($event) {
  //   console.log('down')
  //   this.audioRecord(0); 
  // }

  // @HostListener('window:keyup.m',['$event']) 
  // async onKeyupCtrl($event) {
  //   this.audioStopAndSave(0); 
  // }

  onAudioRecord($event) {
    this.assistant.audioRecord($event);
  }

  onChat($event?) {
    this.assistant.onChat($event);
  }

  onPrompt($event,action?) {
    this.assistant.onPrompt($event,action);
  }

  async onClear($event?){
    $event.preventDefault();
    // await this.history(true);
  }

  onClose(closedialog) {
    this.clean();
    //
    // case of onboarding from ad clic
    const query = this.$route.snapshot.queryParams;
    const landing = query.source || query.fbclid;
    if(landing ||!this.$navigation.hasHistory) {
      return this.$router.navigate(['../../'], { relativeTo: this.$route });
    }
    this.$navigation.back();
  }

}
