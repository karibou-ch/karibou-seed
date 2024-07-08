import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { KngAudioRecorderService, RecorderState } from '../kng-audio-recorder.service';
import { i18n } from 'src/app/common';
import { Subscription } from 'rxjs';
import { Config, CartService, User, ProductService, Product, AssistantService, Assistant } from 'kng2-core';

export interface AssistantQuery extends Assistant{
  content:string;
  role:string;  
}
export interface AssistantMessage extends AssistantQuery {
  assistant:boolean;
  running:boolean;
  audio:boolean;
  products:Product[];
  html?:string;
  id?:string;
  tool?:any
}

export interface AssistantState {  
  status:"init"|"start"|"running"|"end"|"record"|string;
  audioDetected: boolean|undefined;
  audioRecorded: boolean;
  audioError: boolean;
  error?:string;
  isFeedbackReady: boolean;
  isAssistantRuning: boolean;
  message?:AssistantMessage;
  messagesCount?:number;
  tokensIn:number;
  tokensOut:number;
  tokensLimit:number;
}

@Component({
  selector: 'kng-assistant',
  templateUrl: './kng-assistant.component.html',
  styleUrls: ['./kng-assistant.component.scss']
})
//changeDetection: ChangeDetectionStrategy.OnPush
export class KngAssistantComponent implements OnInit {

  @ViewChild('recorder') recorder: ElementRef;

  @Output() assistant:EventEmitter<AssistantState> = new EventEmitter<AssistantState>();

  @Input() user:User;
  @Input() config:Config;
  @Input() widget:boolean;
  @Input() agent:string;
  @Input() tips:string[];
  @Input() prompts:string[];
  @Input() set prompt(value:string){
    this._prompt = value;
    if(!value) {
      return
    }
    if(!this.isReady) {
      return;
    }

    // this.onChat();
  }

  private _prompt:string;


  isReady:boolean;
  isFeedbackReady: boolean;
  isAssistantRuning: Subscription;
  messages:AssistantMessage[];
  tokensLimit= 16000;
  error:string;
  markdown:any;
  audioDetected: boolean|undefined;
  audioRecorded: boolean;
  audioError: boolean;


  //
  // latest prompt result
  currentMessage:AssistantMessage;

  // avoid leak of Obs
  subscription$:any;

  constructor(
    private $audio: KngAudioRecorderService,
    private $i18n: i18n,
    private $assistant: AssistantService,
    private $products: ProductService,
    private $cdr: ChangeDetectorRef
  ) { 
    this.user = new User({
      displayName:'Anonymous'
    })
    this.widget = true;    
    
    this.subscription$ = new Subscription();    

    this.prompts = [];
    this.tips = [];
    this.messages = [];
  }

  get label() {
    return this.$i18n.label();
  }

  get displayName () {    
    return this.user.displayName;
  }

  get store(){
    return this.hub?.slug;
  }

  get hub(){
    return this.config?.shared.hub;
  }

  get audioIsRecording() {
    const state = this.$audio.state;
    return [RecorderState.RECORDING, state == RecorderState.PAUSED].indexOf(state)>-1
  }

  get messageSKU() {
    return this.parseSKU(this.currentMessage.content);
  }

  //
  // use a fixed message limit to avoid the tokens limit exception
  get messagesLimit() {
    return this.messages.length>10;
  }

  get messagesCount() {
    return this.messages.length;
  }


  get randomPrompt() {
    const prompt = this.prompts.sort((a, b) => 0.5 - Math.random())[0];
    return (prompt==this.prompt)? this.randomPrompt:prompt;
  }


  get prompt() {
    return this._prompt;
  }

  get tokensIn() {
    return this.messages.filter(msg => msg.role=='user'||msg.role=='system').reduce((tokens, message)=> {
      const chars = message.content.replace(/\s+/gm, "");
      return tokens + (chars.length) * 0.8;
    },0.0);
  }

  get tokensOut() {
    return this.messages.filter(msg => msg.role=='assistant').reduce((tokens, message)=> {
      const chars = message.content.replace(/\s+/gm, "");
      return tokens + (chars.length) * 0.8;
    },0.0);
  }  

  ngOnDestroy() {
    this.subscription$.unsubscribe();
    this.$audio.closeAudioStream();

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
    this.markdown = new module.default({
      html:true,
      breaks:true,
      typographer:true
    });  
    this.audioDetected = true;
    this.audioError = !(await this.$audio.isAudioGranted());

    //
    // markdown must be available before
    await this.history();

    this.subscription$.add(
      this.$audio.recorderState.subscribe(state =>  {
        if(state == RecorderState.SILENCE) {
          this.audioStopAndSave();          
        }
      })
    );

    const state:AssistantState = {
      status:"init",
      audioDetected: this.audioDetected,
      audioRecorded: this.audioRecorded,
      audioError: this.audioError,
      isFeedbackReady: false,
      isAssistantRuning: !!this.isAssistantRuning,
      tokensIn:this.tokensIn,
      tokensOut:this.tokensOut,
      tokensLimit:this.tokensLimit,
      messagesCount:this.messages.length
    }
    this.assistant.emit(state);

    this.isReady=true;
    if(this.prompt) {
      this.onChat();
    }

  }


  async history(clear?) {
    try{
      const filterMessage = (message) => ['tool','system'].indexOf(message.user||message.role)==-1&& message.content;
      this.messages = await this.$assistant.history({clear:(!!clear)}).toPromise() as AssistantMessage[];
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
        await this.products(this.currentMessage);
      }
    }catch(err){
      this.error=err.error;
    }finally{
      this.$cdr.markForCheck();
    }
  }

  onChat(base64?:string) {    
    const assistant:AssistantMessage = this.currentMessage = {
      role:'James',
      content:'',
      html:'',
      assistant:true,
      running:true,
      audio:false,
      tool:{},
      products: [],
      deleted:false
    }


    const params:any = {};
    if(base64) {
      params.body={audio:base64};
      params.q = "( ͡° ᴥ ͡°)";
      assistant.audio = true;
    }else {
      params.q = (this.prompt == '*?')? this.randomPrompt:this.prompt;
    }

    params.hub=this.store;

    this.messages.push({
      assistant:false,
      running:true,
      audio:false,
      role:this.displayName,
      content:params.q,
      products:[],
      deleted:false
    });
    this.messages.push(assistant);
    this.prompt = "";
    this.error = null;
    // 
    // force change detection
    this.messages = this.messages.slice();

    const state:AssistantState = {
      status:"start",
      audioDetected: this.audioDetected,
      audioRecorded: this.audioRecorded,
      audioError: this.audioError,
      isFeedbackReady: false,
      isAssistantRuning: !!this.isAssistantRuning,
      message:assistant,
      tokensIn:this.tokensIn,
      tokensOut:this.tokensOut,
      tokensLimit:this.tokensLimit,
      messagesCount:this.messages.length
    }
    this.assistant.emit(state);

    this.isAssistantRuning = this.$assistant.chat(params).subscribe(chunk => {
      setTimeout(()=> {
        assistant.assistant = true;      
        assistant.audio = false;      
        assistant.content += chunk.text||'';
        assistant.tool = chunk.tool;
        assistant.content = assistant.content.replace(/\(\([0-9]*\)\)/gm,'')

        assistant.html = this.markdownRender(assistant.content);  
        state.message = assistant;
        state.status = "running";
        state.tokensIn=this.tokensIn;
        state.tokensOut=this.tokensOut;
        state.messagesCount=this.messages.length;
        this.assistant.emit(state);

        return this.messages;
      });
    },err => {
      this.isAssistantRuning = null;
      this.error = err.error;
      state.message = assistant;
      state.status = "end";
      state.isAssistantRuning = false;
      state.isFeedbackReady = false;
      state.error = this.error;
      state.tokensIn=this.tokensIn;
      state.tokensOut=this.tokensOut;
      state.messagesCount=this.messages.length;
    this.assistant.emit(state);

    },async ()=>{ 
      //complete == finally
      this.isFeedbackReady = true;
      this.isAssistantRuning = null;
      assistant.running = false;      

      await this.products(assistant);
      state.message = assistant;
      state.status = "end";
      state.isAssistantRuning = false;
      state.tokensIn=this.tokensIn;
      state.tokensOut=this.tokensOut;
      state.messagesCount=this.messages.length;
    this.assistant.emit(state);
  });

    //
    // auto close on exit
    this.subscription$.add(this.isAssistantRuning);
  }

  //
  // stop assistant 
  abort() {
    if(!this.isAssistantRuning) {
      return;
    }
    this.isAssistantRuning.unsubscribe()
  }


  async audioRecord($event) {
    //
    // not recording but assistant is running
    if(this.isAssistantRuning) {
      return;
    }
    //
    // if recording, then stop
    if(this.audioIsRecording) {
      return this.audioStopAndSave();
    }

    //
    // else, start recording
    this.audioDetected = true;
    await this.$audio.startRecording({timeout:25000});// with max len
    this.$cdr.markForCheck();

    const state:AssistantState = {
      status:"record",
      audioDetected: this.audioDetected,
      audioRecorded: this.audioRecorded,
      audioError: this.audioError,
      isFeedbackReady: false,
      isAssistantRuning: false,
      tokensIn:this.tokensIn,
      tokensOut:this.tokensOut,
      tokensLimit:this.tokensLimit,
      messagesCount:this.messages.length
    }
    this.assistant.emit(state);

  }

  audioStopAndSave($event?) {
    if(this.isAssistantRuning) {
      return;
    }

    //
    // fake subscription to avoid reentrency
    this.isAssistantRuning = new Subscription();

    setTimeout(async()=> {
      try{
        const {blob, base64} = await this.$audio.stopRecording();
        const audioDetected = await this.$audio.detectSound({blob});

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
        this.onChat(base64);
        this.$cdr.markForCheck();
      }catch(error){
        console.log(error);
        //
        // use sentry to report the error
        this.isAssistantRuning = null;
        throw error;
      }  
    });
  }  



  //
  // capture Clic on child innerHtml
  @HostListener('click', ['$event'])
  async onClickAction($event) {
    if(this.isAssistantRuning || !this.currentMessage) {
      return;
    }
    const target = $event.target as HTMLElement;
    const href = target.getAttribute('href')||'';

    const rules =[
      {regexp:/quote\/orders/,prompt:"10 des exemples de produits pour ma demande de devis ", param:false},      
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


  async onClear($event?){
    $event.preventDefault();
    await this.history(true);
  }

  //
  // get feedback from users
  async onFeedback(evaluation, message){
    const index = this.messages.findIndex(msg => msg.id==message.id);
    if(index>-1) {
      const content = {...this.messages[0],...this.messages.slice(index-1)};
      // await this.$metric.feedback(evaluation,content).toPromise();
      this.isFeedbackReady = false;
    }
    this.$cdr.markForCheck();

  }

  async onPrompt($event,action:string) {
    $event.preventDefault();
    this.prompt = action;
    this.onChat();
  }

  //
  // private
  private markdownRender(content) {
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


  private async products(assistant) {
    const skus = this.parseSKU(assistant.content);
    if(!skus.length) {
      return;
    }

    assistant.products = await this.$products.select({skus}).toPromise();
  }

  //
  // parse GPT content to resolve sku with the right format
  private parseSKU(text:string) {
    text = text ||'';
    return (text.match(/10[0-9]{5}/gm)||[]).filter(sku => +sku);
  }

}
