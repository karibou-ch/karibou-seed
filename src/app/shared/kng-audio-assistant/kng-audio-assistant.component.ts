import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { KngAudioRecorderEnhancedService } from '../../common/kng-audio/services/kng-audio-recorder-enhanced.service';
import { RecorderState } from '../../common/kng-audio/interfaces/audio.interfaces';

import { i18n } from '../../common';
import { AssistantService, Product } from 'kng2-core';

@Component({
  selector: 'kng-audio-assistant',
  templateUrl: './kng-audio-assistant.component.html',
  styleUrls: ['./kng-audio-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngAudioAssistantComponent implements OnInit {

  private _sentences= {
    "productsagentfruits-legumes":[
      "Un panier de fruits et légumes pour petits budgets",
      "Un panier de fruits gourmand pour une grande famille",
      "Un assortiment gourmand pour un événement dans mon entreprise ",
      "Un assortiment pour une soirée grillade entre amis",
      "Un assortiment généreux et gourmand pour 10 personnes",
    ],
    "productsagenttraiteurs":[
      "Un assortiment gourmand pour un événement dans mon entreprise ",
      "Un assortiment généreux et gourmand pour 10 personnes",
      "Un assortiment pour un Petit-Déjeuner Gourmand",
    ],
    "productsagentboucherie-artisanale":[
      "Un assortiment pour des Grillades Festives",
      "Un assortiment pour une Cuisine Suisse Authentique",
      "Un assortiment pour une Cuisine de Brasserie",
      "Un assortiment pour une Cuisine Française Raffinée",
      "Un assortiment pour une Cuisine Italienne Chaleureuse",
      "Un assortiment pour une Cuisine Espagnole et Tapas",
      "Un assortiment pour une Cuisine Méditerranéenne",
      "Un assortiment pour une Cuisine Moyen-Orientale",
    ],
    "productsagentcharcuterie-pates":[
      "Un assortiment gourmand pour un événement dans mon entreprise ",
      "Un assortiment pour une soirée grillade entre amis",
      "Un assortiment généreux et gourmand pour un anniversaire",
    ],
    "productsagentboulangerie-artisanale":[
      "Un assortiment généreux et gourmand pour un anniversaire",
      "Un assortiment pour un Petit-Déjeuner Gourmand",
      "Un assortiment pour le gouter de 50 enfants",
    ],
    productsagent:[
      "Un assortiment festif pour un événement dans mon entreprise ",
      "Un assortiment généreux et gourmand pour 10 personnes",
      "Un assortiment pour un Petit-Déjeuner Gourmand",
      "Un assortiment pour des Grillades Festives",
      "Un assortiment pour une Cuisine Suisse Authentique",
      "Un assortiment pour une Cuisine de Brasserie",
      "Un assortiment pour une Cuisine Française Raffinée",
      "Un assortiment pour une Cuisine Italienne Chaleureuse",
      "Un assortiment pour une Cuisine Espagnole et Tapas",
      "Un assortiment pour une Cuisine Méditerranéenne",
      "Un assortiment pour une Cuisine Moyen-Orientale",
      "Un assortiment pour une Cuisine de la Mer"
    ],
    feedback: [
    ],
    quote: [
    ]
  }


  public i18n = {
    fr: {
      title: 'Donnez moi un peu de contexte sur vos envies, je fais une sélection',
      note_quote:"Vous pouvez aussi décrire votre projet avec un audio ",
      note_productsagent:"Donnez moi un peu de contexte sur vos envies, je fais une sélection.",
      note_checkout:'Je vais vous aider à finaliser votre commande.',
      note_feedback:'Vous pouvez aussi nous laissez un message'
    },
    en:{
      title: 'Give me a bit of context about your desires, I will make a selection',
      note_quote: 'You can describe your project with audio',
      note_productsagent: 'Give me a bit of context about your desires, I will make a selection.',
      note_checkout: 'I will help you finalize your order.',
      note_feedback:'You can also leave us a message'
    }
  }

  defaulPrompt = "Comment puis-je vous aider ?";

  @Output() onAudioLoading = new EventEmitter<boolean>();
  @Output() onAudioError = new EventEmitter<Error>();
  @Output() onAudio = new EventEmitter<string>();
  @Output() onData = new EventEmitter<any>();
  @Output() onNote = new EventEmitter<string>();

  audioLoading: boolean;
  audioError: boolean;
  urlAudio: string;
  note: string ="";
  audioDetected: boolean|undefined;
  audioRecorded: boolean;

  onContextMenu:any;
  markdown:any;
  whisperNote:string;

  cleanMarkdown = /\(\/sku\/\d+\)|{{[\d,]*?}}|\[[\d,]*?\]/ig;


  @Input() promptmore:string = "";
  @Input() store:string;
  @Input() whisperOnly = false;
  @Input() quiet = false;
  @Input() cleanQuery = true;
  @Input() withHistory = false;
  @Input() agent: "productsagent"|"quote"|"checkout"|"feedback";
  @Input() category: string = "";
  @Input() products: Product[];
  isThinking: boolean;

  @Input() set src(url: string){
    this.urlAudio = url;
    if(url) {
     this.checkAudioDetected(url);
    }
  }



  constructor(
    private $assistant: AssistantService,
    private $audio: KngAudioRecorderEnhancedService,
    private $i18n: i18n,
    private $cdr: ChangeDetectorRef
  ) {
    this.whisperNote = '';
    this.audioDetected = undefined;
    this.products = [];
    this.agent= "productsagent";
    this.$audio.recorderError.subscribe(error => {
      //
      // record error , display user message
      this.audioError = true;
    })

    this.markdown = {render:((any)=>{})};
  }

  get audioIsRecording() {
    const state = this.$audio.state;
    return state == RecorderState.RECORDING|| state == RecorderState.PAUSED;
  }

  get hasNoAudio() {
    return (this.audioDetected == undefined)
  }

  get isAgentFeedback() {
    return this.agent == 'feedback';
  }

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.i18n[this.$i18n.locale];
  }

  get glabel() {
    return this.$i18n.label();
  }

  get label_title() {
    return this.i18n[this.locale]['note_'+this.agent];
  }


  get sentences() {
    return this._sentences[this.agent+this.category]||this._sentences[this.agent]||[]
  }

  //
  //
  get markdownRender() {
    let content = this.note || this.whisperNote;
    if(!content) return '';
    //
    // apply correction before the rendering
    content = content.replace(this.cleanMarkdown,'').replace('[ok]','');
    // FIX markdown link
    const link = /\[(.*?)\]\((.*?)\)/g;
    content = content.replace(link, (match, text, target) => {
      return `[${text}](${target.replace(/ /g, "_")})`;
    });
    return this.markdown.renderInline(content.replace(/\n+/g, '\n'));
  }

  ngOnDestroy() {
    //const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    //const eventName = supportTouchEvent? 'touchend':'mouseup';
    //window.removeEventListener(eventName,this.audioStopAndSave.bind(this));
    this.$audio.closeAudioStream();
  }

  ngOnInit() {
    const module =  import('markdown-it').then(module => {
      this.markdown = new module.default({
        html:true,
        breaks:true,
        typographer:true
      });
    });

    //
    // detect end recording
    //const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    //const eventName = supportTouchEvent? 'touchend':'mouseup';
    //window.addEventListener(eventName,this.audioStopAndSave.bind(this));
    if(this.isAgentFeedback || this.whisperOnly){
      return;
    }

    this.$assistant.history({agent:this.agent,trim:true,hub:this.store}).subscribe((content) => {
      const skus = /{{([\d,]*?)}}|\[([\d,]*?)\]/ig;
      const result = content.filter(item => item['role'] == 'assistant');
      if(result.length) {
        const msg = (this.withHistory)? result.reduce((note, msg) => note + msg['content']+'\n', ''):(result[result.length-1]['content']);
        this.note = msg.replace("<thinking>","<section class='thinking'>").replace("</thinking>","</section>");

        let products =msg.match(skus)?.map(match => match.replace(/{{|}}|\[|\]/g, '').split(',')).flat().map(sku => (+sku)).filter(sku => sku);
        if(products && products.length){
          this.onData.emit(products);
        }
        this.onNote.emit(this.note.trim());
      }
      this.$cdr.markForCheck();
    },(error)=>{

    },()=>{

    });

  }

  async checkAudioDetected(url) {
    if(this.audioDetected == undefined && url) {
      this.audioDetected = await this.$audio.detectSound({url});
    }
  }


  async audioWhisper(base64: string, src: string) {
    const params:any = {body:{audio:base64,whisperOnly:true}};
    params.q = 'whisper';
    this.whisperNote = '';
    this.isThinking = true;
    this.$assistant.chat(params).subscribe((content) => {
      this.whisperNote += content.text;
      this.$cdr.markForCheck();
    },(error) => {
      this.isThinking = false;
      this.note = "Oups, il y a un problème :"+error.error?.message||error.message;
      this.$cdr.markForCheck();

    },()=>{
      this.isThinking = false;
      this.whisperNote = this.whisperNote.trim().replace('**traitement...**','');
      this.onNote.emit(this.whisperNote);
      this.$cdr.markForCheck();
    });
  }

  async assistant(base64?) {
    if(this.whisperOnly){
      await this.audioWhisper(base64,this.urlAudio);
      return;
    }
    const filterProductAsFIX = (product) => {
      if(product.attributes.bundle || product.attributes.customized){
        return false;
      }
      return product.vendor?.urlpath !== 'tresor-des-halles' && product.belong.name !== 'Noix et fruits secs';
    };

    this.isThinking = true;
    const query = (this.cleanQuery)? /\*\*Question:?\*\*.+?[\n?!]/i : /\*\*Question:?\*\*?/i;
    let endprint = false;
    const body:any = { products:this.products.filter(filterProductAsFIX).map(product => product.sku)};
    const params:any = {agent:this.agent};
    params.q = this.defaulPrompt;
    if(base64) {
      params.q = this.promptmore || "( ͡° ᴥ ͡°)";
      body.audio = base64;
    }
    params.body = body;
    this.$cdr.markForCheck();
    let streamTxt = '', attach='';
    this.$assistant.chat(params).subscribe((content) => {
      console.log('content', content.text);
      if(content.tool && content.tool.length) {
        this.onData.emit(content.tool);
      }

      const indexOfSku = content.text.indexOf('---')
      if(endprint||indexOfSku>-1) {
        attach+=content.text;
        streamTxt+=content.text.substring(0,indexOfSku);
        endprint=true;
        return
      }
      streamTxt+=(content.text.replace('**traitement...**','').replace(query,''));

      this.$cdr.markForCheck()
    }, err => {
      this.isThinking = false;
      this.note = "Oups, il y a un problème :"+err.message;
      this.$cdr.markForCheck();
    },async ()=>{
      this.isThinking = false;
      const skus = /{{([\d,]*?)}}|\[([\d,]*?)\]/ig;
      let products =attach.match(skus)?.map(match => match.replace(/{{|}}|\[|\]/g, '').split(',')).flat().map(sku => (+sku)).filter(sku => sku);
      if(products && products.length){
        this.onData.emit(products);
      }

      this.note = (streamTxt.trim());
      this.onNote.emit(this.note);
      this.$cdr.markForCheck();
  });


  }

  async audioRecord($event) {
    if(this.audioIsRecording ) {
      return this.audioStopAndSave();
    }
    this.audioError = !(await this.$audio.isAudioGranted());

    await this.$audio.startRecording({timeout:15000});
    this.$cdr.markForCheck()
  }

  async audioStopAndSave() {
    if(!this.audioIsRecording) {
      return;
    }

    try{

      const {blob, base64} = await this.$audio.stopRecording();
      this.audioLoading = true;
      this.onAudioLoading.emit(true);
      this.$cdr.markForCheck();

      //
      // detect sound on audio
      this.audioDetected = await this.$audio.detectSound({blob});

      //
      // should exit
      if(!this.audioDetected){
        this.audioLoading = false;
        this.$cdr.markForCheck();
        this.onAudioLoading.emit(false);
        return;
      }

      this.onAudioLoading.emit(false);
      this.audioLoading = false;
      this.$cdr.markForCheck();

      this.urlAudio = base64;
      // const audio:HTMLAudioElement = document.querySelector('#audio');
      // audio.setAttribute('src', this.urlAudio);

      this.onAudio.emit(base64);

      if(this.isAgentFeedback){
        return;
      }

      this.assistant(base64);

    }catch(error){
      this.audioLoading = false;
      this.audioError = true;
      this.onAudioLoading.emit(false);
      this.onAudioError.emit(error);
      this.$cdr.markForCheck();
    }
  }

  onTest($event) {
    this.defaulPrompt = $event.sentence;
    this.isThinking = true;
    this.assistant().then(() => {});
    this.$cdr.markForCheck();
  }
  onClear() {
    this.$assistant.history({agent:'productsagent',clear:true}).subscribe((content) => {
      this.note = '';
      this.onData.emit([]);
      this.onNote.emit('');
      this.$cdr.markForCheck();
    });
  }

  async onSearch(){
    this.note = '';
    await this.$assistant.history({agent:'productsagent',clear:true}).toPromise()
    this.assistant();
  }
}
