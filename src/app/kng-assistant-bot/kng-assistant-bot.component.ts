import { ApplicationRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService, CartService,CartItemsContext, Config, ProductService, User } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../common';
import { KngAudioRecorderService, OutputFormat, RecorderState } from '../shared/kng-audio-recorder.service';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'kng-assistant-bot',
  templateUrl: './kng-assistant-bot.component.html',
  styleUrls: ['./kng-assistant-bot.component.scss']
})
//changeDetection: ChangeDetectionStrategy.OnPush
export class KngAssistantBotComponent implements OnInit {

  @ViewChild('dialog', { static: true }) dialog: ElementRef;
  @ViewChild('recorder') recorder: ElementRef;
  @Input() user:User;
  @Input() config:Config;
  @Input() widget:boolean;

  isRuning: Subscription;
  isReady = false;
  isFeedbackReady = false;
  messages:any[];
  error:string;
  prompt:string;
  markdown:any;
  scrollToBottom:boolean;
  scrollBottomPosition:number;
  scrollStickedToolbar:boolean;
  audioDetected: boolean|undefined;
  audioRecorded: boolean;
  audioError: boolean;
  timeoutRecord;


  currentMessage:any;
  subscription$:any;

  //
  // used to fix html update
  messageId:number;


  tips = [
    {clazz:"", label:"Qui es-tu James?",action:"Qui es-tu James?, qu'elles sont les outils et les informations utiles ?"},
    //{clazz:"hide-sm", label:"Mon panier...",action:"Une semaine de menus avec les produits de mon panier"},
    {clazz:"", label:"Mes commandes",action:"Que proposes-tu avec mes commandes"},
    // {clazz:"", label:"Produits populaires...",action:"Une semaine de menus avec les produits populaires"},
    {clazz:"", label:"Les thématiques...",action:"Quelle liste de thématiques tu proposes?"},
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
    private $audio: KngAudioRecorderService,
    private $i18n: i18n,
    private $cart: CartService,
    private $metrics: AnalyticsService,
    private $navigation: KngNavigationStateService,
    private $products: ProductService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef,
    private $zone: NgZone
  ) { 
    this.user = new User({
      displayName:'Anonymous'
    })
    const ask = this.$route.snapshot.queryParamMap.get('recipe');
    this.prompt = ask? "Les 10 meilleures associations avec "+ask:"";
    this.widget = true;

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

  get audioIsRecording() {
    const state = this.$audio.getRecorderState();
    return state == RecorderState.RECORDING|| state == RecorderState.PAUSED || state == RecorderState.INITIALIZED;
  }

  get randomPrompt() {
    const prompt = this.prompts.sort((a, b) => 0.5 - Math.random())[0];
    return (prompt==this.prompt)? this.randomPrompt:prompt;
  }

  get messagesLimit() {
    return this.messages.length>6;
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
    
    const module = await import('markdown-it');
    //const plugin = await import('linkify-it');
    this.markdown = new module.default({
      html:true,
      breaks:true,
      typographer:true
    });  
    this.isReady = true;
    this.audioDetected = true;
    this.audioError = !(await this.$audio.isAudioGranted());
    this.$audio.preload().then(module => {
      console.log('mp3 loaded');
    });

    //
    // markdown must be available before
    await this.history();


    this.subscription$.add(
      this.$navigation.registerScrollEvent(this.container,10).subscribe(scroll => {
        this.scrollToBottom = scroll.direction<=0 && (scroll.position+100)> this.scrollBottomPosition;
        this.$cdr.markForCheck();
      })  
    );

    if(this.prompt) {
      this.onChat();
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
    }
  }

  ngAfterViewInit() {
    setTimeout(()=> {
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
      this.scrollBottomPosition = this.container.nativeElement.scrollTop;        
      this.scrollStickedToolbar = (this.container.nativeElement.scrollTop>40);
    })
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

  async loadProducts(assistant) {
    const skus = this.parseSKU(assistant.content);
    if(!skus.length) {
      return;
    }

    assistant.products = await this.$products.select({skus}).toPromise();
  }

  async history(clear?) {
    try{
      const filterMessage = (message) => ['tool','system'].indexOf(message.user||message.role)==-1&& message.content;
      this.messages = await this.$cart.chatHistory(clear).toPromise();
      this.messages = this.messages.filter(filterMessage).map(message => {
        const content = (message.content||'').replace(/\(\([0-9]*\)\)/gm,'')
        message.html = this.markdownRender(content);
        message.assistant = false;
        message.running = false;
        message.audio = false;
        message.products = [];
        if(message.role == 'assistant') {
          message.assistant = true;
          message.role = 'James';
        }else{
          message.role = this.displayName;
        }
        return message;
      })
  
      if(this.messages.length) {
        this.currentMessage = this.messages[this.messages.length-1];
        await this.loadProducts(this.currentMessage);
      }
    }catch(err){
      console.log('----',err)
      this.error=err.error;
    }finally{
      this.$cdr.markForCheck();
    }

  }

  markdownRender(content) {
    //
    // apply correction before the rendering
    content = content.replace(/\(\([0-9]*\)\)/gm,'');
    // FIX markdown link
    const link = /\[(.*?)\]\((.*?)\)/g;
    content = content.replace(link, (match, text, target) => {
      return `[${text}](${target.replace(/ /g, "_")})`;
    });
    return this.markdown.render(content);
  }

  //
  // parse GPT content to resolve sku with the right format
  parseSKU(text:string) {
    text = text ||'';
    return (text.match(/10[0-9]{5}/gm)||[]).filter(sku => +sku);
  }

  onChat(base64?:string) {    
    this.messageId = Date.now();

    const assistant = this.currentMessage = {
      role:'James',
      content:'',
      html:'',
      assistant:true,
      tool:{},
      running:true,
      audio:false,
      products: [],
      id: this.messageId
    }


    const params:any = {};
    if(base64) {
      params.body={audio:base64};
      params.q = "( ͡° ᴥ ͡°)";
      assistant.audio = true;
    }else {
      params.q = (this.prompt == '*?')? this.randomPrompt:this.prompt;
    }

    params.hub=this.$navigation.store;

    this.messages.push({
      role:this.displayName,
      content:params.q,
      products:[]
    });
    this.messages.push(assistant);
    this.prompt = "";
    this.error = null;
    // 
    // force change detection
    this.messages = this.messages.slice();


    this.isRuning = this.$cart.chat(params).subscribe(chunk => {
      setTimeout(()=> {
        assistant.audio = false;      
        assistant.content += chunk.text||'';
        assistant.tool = chunk.tool;
        assistant.content = assistant.content.replace(/\(\([0-9]*\)\)/gm,'')

        assistant.html = this.markdownRender(assistant.content);  
        if(this.scrollToBottom) {
          this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;  
          this.scrollBottomPosition = Math.max(this.container.nativeElement.scrollTop,this.scrollBottomPosition)
        }   
        return this.messages;
      });
    },err => {
      this.isRuning = null;
      this.error = err.error;
    },async ()=>{ //complete == finally
      this.isFeedbackReady = true;
      this.isRuning = null;
      assistant.running = false;      

      await this.loadProducts(assistant);
    });

    //
    // close on exit
    this.subscription$.add(this.isRuning);
  }

  onAbort() {
    if(!this.isRuning) {
      return;
    }
    this.isRuning.unsubscribe()
  }
  async onFeedback(evaluation, message){
    const index = this.messages.findIndex(msg => msg.id==message.id);
    if(index>-1) {
      const content = {...this.messages[0],...this.messages.slice(index-1)};
      await this.$metrics.feedback(evaluation,content).toPromise();
      this.isFeedbackReady = false;
    }
    this.$cdr.markForCheck();

  }

  async audioRecord($event) {
    if(this.timeoutRecord || this.isRuning) {
      this.audioStopAndSave();
      return;
    }
    this.audioDetected = true;
    this.timeoutRecord = setTimeout(this.audioStopAndSave.bind(this),10000);
    await this.$audio.startRecording();
    this.$cdr.markForCheck();
  }

  audioStopAndSave($event?) {
    if(!this.timeoutRecord||this.isRuning||this.$audio.recordTime<1) {
      return;
    }
    clearTimeout(this.timeoutRecord);
    this.timeoutRecord = 0;
    //
    // fake subscription to avoid reentrency
    this.isRuning = new Subscription();
    this.$cdr.markForCheck();
    setTimeout(async()=> {
      try{
        const format = OutputFormat.WEBM_BLOB;
        const blob = await this.$audio.stopRecording(format);
        const audioDetected = await this.$audio.detectSound({blob});
        const base64 = await this.$audio.blobToBase64(blob);

        //
        // detect sound on audio, and convert buffer
        this.audioDetected = audioDetected;  

        //
        // should exit 
        if(!this.audioDetected){
          this.prompt = "";
          return;
        }
        //
        // run the prompt and exit
        this.prompt = "audio";
        this.onChat(base64);
      }catch(error){
        console.log(error);
        //
        // use sentry to report the error
        throw error;
      }  
    });


    // this.$audio.stopRecording(format).then(blob=>{
    //   //
    //   // detect sound on audio, and convert buffer
    //   const convert = Promise.all([
    //     this.$audio.detectSound({blob}), 
    //     this.$audio.blobToBase64(blob)
    //   ]);
    //   return convert
    // }).then(([audioDetected,base64]) => {
    //   this.audioDetected = audioDetected;  
    //   //
    //   // should exit 
    //   this.$cdr.markForCheck();
    //   if(!this.audioDetected){
    //     this.prompt = "";
    //     return;
    //   }

    //   return this.onChat(base64);
    // }).then(done => {
    //   console.log('chat done',done);
    // }).catch(error => {
    //   alert(error.message)        
    // }).finally(()=> this.$cdr.markForCheck());
  }  

  //
  // capture Clic on child innerHtml
  @HostListener('click', ['$event'])
  async onClickAction($event) {
    if(this.isRuning || !this.currentMessage) {
      return;
    }
    const target = $event.target as HTMLElement;
    const href = target.getAttribute('href')||'';

    const rules =[
      {regexp:/products\/cart/,prompt:"Quelques recettes avec mon panier ", param:false},      
      {regexp:/products\/orders/,prompt:"Informations sur mes dernières commandes", param:false},      
      {regexp:/popular\/([^)]+)/,prompt:"Quelques recettes avec les produits populaires", param:false},      
      {regexp:/recipe\/([^)]+)/,prompt:"Le détail de la recette ", param:true},      
      {regexp:/search\/([^)]+)/,prompt:"Cherche les aliments séparés pour ", param:true},      
      {regexp:/theme\/([^)]+)/,prompt:"10 recettes de la thématique ", param:true},      
      {regexp:/document\/([^)]+)/,prompt:"Je souhaite connaître ", param:true},      
      {regexp:/sku\/([^)]+)/,prompt:"Je souhaite des variations de ", param:true},      
    ]

    //
    // apply URL action
    for(const rule of rules) {
      const values = rule.regexp.exec(href);  
      if(!values || !values.length) {
        continue;
      }
      $event.stopPropagation();
      $event.preventDefault();
      let param = (rule.param)?("'"+ decodeURI(values[1].replace(/_/gm,' '))+"'"):'';
      const sku = /1[0-9]{6,7}/.exec(param);
      if(sku) {
        const product = this.currentMessage.products.find(product => product.sku==parseInt(sku[0]));
        param = product && product.title || param;
      }

      this.prompt = rule.prompt+param;
      this.onChat();
      break;
    }
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


  async onTip($event,action:string) {
    $event.preventDefault();
    this.prompt = action;
    this.onChat();
  }

  async onClear($event?){
    $event.preventDefault();
    await this.history(true);
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
