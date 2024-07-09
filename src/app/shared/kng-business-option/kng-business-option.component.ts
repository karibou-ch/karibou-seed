import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { 
  Config,
  CartItem, 
  CartService, 
  LoaderService,   
  Hub, 
  User
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
      title:'Décidez de la fréquence de livraison et du jour qui vous arrange pour les produits dans votre panier.',
      title_time_contract:'Quand souhaitez vous être livré ?',
      title_time_contract_update:'La livraison est programmée à'
    },
    en:{
      title:'Decide on the delivery frequency and day that suits you for the products in your basket.',
      title_time_contract:'When would you like delivery?',
      title_time_contract_update:'Delivery is scheduled for'
    }
  }

  @Input() user:User;
  @Input() checkout:boolean;
  @Input() contractId:string;
  @Input() hub: Hub;
  @Input() shippingDay: Date;


  config:Config;
  selIteration:any;
  selDayOfWeek:any;  
  selTime:number;
  items:CartItem[];
  shippingtimes:any;
  //
  // default shipping time for the week and saturday (12)
  defaultTime = [12,16];

  oneWeek: Date[];
  $quote: FormGroup;
  note:string
  audioSrc:string;

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService,
    private $fb: FormBuilder,
    private $cdr: ChangeDetectorRef
  ) { 
    this.items = [];
    this.selTime = 16;
    this.shippingtimes = {};
    this._subscription = new Subscription();

    this.$quote = this.$fb.group({
      'note':   [''],
      'date': ['', [Validators.required, Validators.minLength(4)]],
      'time': ['', [Validators.required, Validators.minLength(4)]],
      'qty': ['', [Validators.required, Validators.minLength(4)]],
      'options':   [''],
      'address': ['', [Validators.required, Validators.minLength(5)]],
      'email':   ['', [Validators.required, Validators.minLength(3)]],
      'phone':  ['', [Validators.required, Validators.minLength(10)]]
    });

    // const shippingDay = this.currentShippingDay();
    // const specialHours = ((shippingDay.getDay() == 6)? 12:16);
  }


  get label() {
    return this.$i18n.label();
  }

  get i18n() {
    return this._i18n[this.locale];
  }

  get locale() {
    return this.$i18n.locale;
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
  onAssistantData($event) {
    console.log('onAssistantData', $event);
  }

}
