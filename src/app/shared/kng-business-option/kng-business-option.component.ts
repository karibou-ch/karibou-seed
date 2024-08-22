import { ChangeDetectorRef, Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output, ViewContainerRef } from '@angular/core';
import { 
  Config,
  CartItem, 
  CartService, 
  LoaderService,   
  Hub, 
  User,
  CartItemsContext,
  AssistantService,
  AnalyticsService
} from 'kng2-core';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { i18n } from 'src/app/common';



@Component({
  selector: 'kng-business-option',
  templateUrl: './kng-business-option.component.html',
  styleUrls: ['./kng-business-option.component.scss']
})
export class KngBusinessOptionComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private _i18n = {
    fr:{
      identity:'Connectez-vous ou indiquez le mail et téléphone de la personne de contact 🙏🏼\n',
      empty:'Le formulaire est incomplet, merci de préciser les éléments de votre projet 🙏🏼\n',
      title:'Décrivez votre projet',
      title_info:'Vous souhaitez obtenir un devis personalisé? (formulaire)',
      title_cart:'* Votre panier 🛒 sera transmis avec votre demande',
      action:'Envoyer la demande de devis',
      title_time_contract:'Quand souhaitez vous être livré ?',
      title_time_contract_update:'La livraison est programmée à'
    },
    en:{
      identity:'Login or provide the email and telephone number on the contact form 🙏🏼\n',
      empty:'The form is incomplete, please specify the elements of your project 🙏🏼\n',
      title: 'Describe your project',
      title_info: 'Would you like to receive a personalized quote? (form)',
      title_cart: '* Your cart 🛒 will be submitted with your request',
      action: 'Send quote request',
      title_time_contract:'When would you like delivery?',
      title_time_contract_update:'Delivery is scheduled for'
    }
  }

  private _defaultNotes: string = `Veuillez indiquer la date de l'événement, l'heure , le lieu (entreprise ou particulier), le nombre de participants et éventuellement le type d'événement. Merci 🐱.\n`;

  @Input() user:User;
  @Input() checkout:boolean;
  @Input() contractId:string;
  @Input() hub: Hub;
  @Input() shippingDay: Date;

  // @HostBinding('class.locked') get locked() {return this.options.project};

  @Output() onOpen = new EventEmitter<boolean>();
  config:Config;
  selIteration:any;
  selDayOfWeek:any;  
  selTime:number;
  shippingtimes:any;
  isValid:boolean;
  isRunning:boolean
  formError:string;
  //
  // default shipping time for the week and saturday (12)
  defaultTime = [12,16];

  oneWeek: Date[];
  $quote: FormGroup;
  audioSrc:string;

  options = {
    project:false,
    identity:false,
    address:false,
    more:false,
    signup:false
  }

  constructor(
    private $assistant: AssistantService,
    private $metric: AnalyticsService,
      private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService,
    private $fb: FormBuilder,
    private $cdr: ChangeDetectorRef
  ) { 
    this.selTime = 16;
    this.shippingtimes = {};
    this._subscription = new Subscription();

    this.$quote = this.$fb.group({
      'notes':   [''],
      'date': ['', [Validators.required, Validators.minLength(4)]],
      'time': ['', [Validators.required, Validators.minLength(4)]],
      'qty': ['', [Validators.required, Validators.minLength(4)]],
      'options':   [''],
      'address': ['', [Validators.required, Validators.minLength(5)]],
      'email':   ['', [Validators.required, Validators.minLength(3)]],
      'phone':  ['', [Validators.required, Validators.minLength(10)]]
    });

    this.notes = this._defaultNotes;
  }

  get store() {
    if(!this.config || !this.config.shared.hub) {
      return '';
    }
    return this.config.shared.hub.slug;
  }

  get label() {
    return this._i18n[this.locale];
  }

  get glabel() {
    return this.$i18n.label();
  }  

  get isUserReady() {
    return this.user.isAuthenticated() || this.userIdentity.length > 1;
  }

  get userIdentity() {
    if(this.user.isAuthenticated()) {
      return [this.user.displayName,this.user.email.address, this.user.phoneNumbers[0].number];
    }
    const matches = [...this.notes.matchAll(/([\w.]{2,}@[\w.]{2,}|([\d.\- \/]{6,}))/gi)].map(m=> m[0]);
    return matches;
  }

  get items() {
    const ctx = {
      forSubscription: false,
      onSubscription: false,
      hub: this.store
    } as CartItemsContext;
    return this.$cart.getItems(ctx).filter((item:CartItem) => item)||[];
  }

  get userPrompt() {
    const signup = this.options.signup? 'Le client souhaite creer son compte':'';
    const identity = this.userIdentity.concat(signup);

    return (identity.length>1)? `\nPersonne de contact:\n${identity.join('\n')}`:''; 
  }
  get itemsPrompt() {
    const items = this.items;
    const prompt = items.reduce((prompt, item:CartItem) => {
      return `${prompt}  ${item.title} (${item.quantity}x${item.part})\n`;
    },'');
    return (items.length)? `Le type d'événement:\n${prompt}`:'' ;
  }

  get locale() {
    return this.$i18n.locale;
  }

  get notes() {
    return this.$quote.get('notes').value.trim();
  }

  set notes(notes:string){
    this.$quote.patchValue({
      notes
    });

  }

  get timeprice() {
    if(!this.selTime||!this.config.shared.shipping) {
      return 0;
    }
    return this.config.shared.shipping.pricetime[this.selTime];

  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  async ngOnInit(){
    this._subscription.add(
      this.$loader.update().subscribe(emit => {

        // ITEM_ADD       = 1,
        // ITEM_REMOVE    = 2,
        // ITEM_MAX       = 3,
        // CART_INIT      = 4,
        // CART_LOADED    = 5,
        // CART_LOAD_ERROR= 6,
        // CART_SAVE_ERROR= 7,
        // CART_ADDRESS   = 8,
        // CART_PAYMENT   = 9,
        // CART_SHIPPING   =10,
        if(emit.state && emit.state.action) {
          this.$cdr.markForCheck();
        }
        if(!emit.config) {
          return;
        }
        this.config = emit.config;
        const times = Object.keys(this.config.shared.shipping.pricetime || {});
        this.shippingtimes = times.reduce((shippingtimes,time)=> {
          shippingtimes[time]=emit.config.shared.hub.shippingtimes[time];
          return shippingtimes;
        },{});  
      })
    );
  }

  onSave(){
  }

  onSignup($event){
    console.log('onSignup', $event);
  }
  onAssistantNote($event) {
    console.log('onAssistantData', $event);
    this.notes = $event || this._defaultNotes;
  }

  onToggleOptions(){
    // if(this.options.project){
    //   document.body.classList.add('mdc-dialog-scroll-lock');
    // }else {
    //   document.body.classList.remove('mdc-dialog-scroll-lock');

    // }

    this.onOpen.emit(!this.options.project);

  }

  onAddress(address){
    console.log('onAddress', address);
  }

  onValidate(){
    this.formError = '';    
    const prefix = "VALIDER:\n";
    const notes = this.notes;
    const prompt = prefix+notes+this.userPrompt+this.itemsPrompt;
    console.log('onValidate', prompt);
    const params:any = {agent:'quote', q: prompt, zeroshot:true};
    return new Promise(async (resolve, reject) => {
      if(this.isRunning){
        return resolve(false);
      }

      if(!this.user.isAuthenticated() && !this.isUserReady) {
        await this.streamOutput(this.label.identity);
        return resolve(false);
      }
      if(notes.length < 10) {
        await this.streamOutput(this.label.empty);
        return resolve(false);
      }
      this.isRunning = true;
      this.$assistant.chat(params).subscribe(message=> {
        this.formError += message.text;
        if(this.isValid){          
          this.notes = "";
        }else{
          this.isValid = this.formError.toLowerCase().indexOf('[ok]') > -1;
        }
        this.formError = this.formError.replace(/\[?\[OK\]\]?/gi,'')
        this.$cdr.markForCheck();
      },(err)=> {
        this.isRunning = false;
        reject(err);
      },()=> {
        this.isRunning = false;
        resolve(this.isValid);
      });
    });

  }

  async onMail(){
    try{
      this.$cdr.markForCheck();
      const message = this.notes+this.userPrompt+this.itemsPrompt;
  
      const isOK = await this.onValidate();
      this.isRunning = true;
      if(!this.isValid || !isOK) {
        return;
      }
      await this.$metric.feedback('DEVIS-B2B',message).toPromise();
      console.log('onMail', this.notes);

    }catch(e){
      throw e;
    }
    finally{
      this.isRunning = false;
    }
  }

  async streamOutput(sentence:string,step:number=4) {
    for (let i = 0; i < sentence.length; i += step) {
      this.formError+=sentence.substring(i, Math.min(i + step, sentence.length));
      this.$cdr.markForCheck();
      await this.time(30);
    }

  }


  async time(ttl) {
    return new Promise(res => {
      setTimeout(res, ttl || 0);
    });
  }  
}
