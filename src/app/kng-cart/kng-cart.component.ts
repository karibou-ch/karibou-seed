import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CartService, 
         CartState, 
         CartAction, 
         CartItem, 
         Config, 
         LoaderService, 
         Utils,
         User, 
         UserAddress,
         UserCard,
         UserService,
         OrderService} from 'kng2-core';

import { MdcSnackbar } from '@angular-mdc/web';
import { KngNavigationStateService, KngUtils, i18n } from '../shared';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderShipping } from '../../../../kng2-core/dist/order/order';

@Component({
  selector: 'kng-cart',
  templateUrl: './kng-cart.component.html',
  styleUrls: ['./kng-cart.component.scss']
})
export class KngCartComponent implements OnInit, OnDestroy {


  //
  // TODO remove this ASAP if not needed
  // if(['visa','mastercard','american express'].indexOf(gateway.label)!==-1){
  //   this.cartConfig.gateway.label=gateway.label+" (3.0% aujourd'hui offert)";
  // }        
  
  store:string;
  user:User=new User();
  config:Config;
  items:CartItem[];
  sign:any;
  cgAccepted:boolean=false;

  //
  // generating dynamic background image url 
  bgGradient=`linear-gradient(
    rgba(0, 50, 0, 0.15),
    rgba(0, 0, 0, 0.1)
  ),`;

  issuer={
    wallet:{
      img:'/assets/img/payment/wallet.jpg',
      label:'Votre compte privé'
    },
    invoice:{
      img:'/assets/img/payment/invoice.jpg',
      label:'Facture en ligne'
    },
    mastercard:{
      img:'/assets/img/payment/mc.jpg',
      label:'Mastercard'
    },
    visa:{
      img:'/assets/img/payment/visa.jpg',
      label:'VISA'
    },
    'american express':{
      img:'/assets/img/payment/ae.jpg',
      label:'American Express'
    },
    btc:{
      img:'/assets/img/payment/btc.jpg',
      label:'Bitcoin'
    },
    bch:{
      img:'/assets/img/payment/bch.jpg',
      label:'Bitcoin Cash'
    },
    lumen:{
      img:'/assets/img/payment/xlm.jpg',
      label:'Lumen'
    }
  }
  

  constructor(
    public $i18n:i18n,
    public $loader:LoaderService,
    public $cart:CartService,
    private $fb: FormBuilder,
    public $navigation:KngNavigationStateService,
    private $order:OrderService,
    private $route:ActivatedRoute,
    private $router:Router,
    public $snack:MdcSnackbar,
    private $user:UserService
  ) { 
    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    this.config=loader[0];      
    this.user=loader[1];
    this.items=[];

  }


  ngOnInit() {
    this.store=this.$navigation.store;

    this.$cart.subscribe(
      (state:CartState)=>{
        this.items=this.$cart.getItems();
      },
      error=>{
        console.log('CART',error);
      }
    );
    this.$user.subscribe(user=>{
      this.user=user;
    })
    this.checkPaymentMethod();
  }

  ngOnDestroy(){

  }

  doOrder(){

    // //
    // // prepare shipping
    // var shipping=cart.config.address;
    // shipping.when=(config.shop.shippingweek[cart.config.shipping]);
    // shipping.hours=16;//config.shop.order.shippingtimes;


    // //
    // // prepare items
    // var items=$scope.cart.items;

    // //
    // // get payment token
    // var payment={
    //   alias:cart.config.payment.alias,
    //   issuer:cart.config.payment.issuer,
    //   name:cart.config.payment.name,
    //   number:cart.config.payment.number
    // };
    // FIXME hours should not be hardcoded
    let shipping=new OrderShipping(
      this.currentShipping(),
      this.$cart.getCurrentShippingDay(),
      16
    );


    this.$order.create(
      shipping,
      this.items.map(item=>item.toDEPRECATED()),
      this.$cart.getCurrentPaymentMethod()
    ).subscribe((order)=>{
        this.$snack.show("Votre  commande est enregistrée, vous serez livré le "+order.shipping.when.toDateString());
        this.$router.navigate(['/store',this.store,'me','orders']);
        this.items=[];
        this.$cart.empty();
      },
      err=>this.$snack.show(err.error)
    )
  }

  computeShippingByAddress(address:UserAddress){
    return this.$cart.computeShippingFees(address);
  }

  currentShipping(){
    return this.$cart.getCurrentShippingAddress();
  }

  currentShippingFees(){
    return this.$cart.getCurrentShippingFees();
  }
  
  currentGatewayLabel(){
    return (this.$cart.getCurrentGateway().label);
  }

  currentGatewayFees(){
    return (this.$cart.getCurrentGateway().fees*100).toFixed(1);
  }

  currentGatewayAmount(){
    return this.$cart.gatewayAmount();
  }

  checkPaymentMethod(){
    if(!this.user.isAuthenticated()){
      return;
    }
    this.$user.checkPaymentMethod(this.user).subscribe(user=>{
      //this.user=user;
    })
  }  

  getStaticMap(address:UserAddress){
    return KngUtils.getStaticMap(address);
  }
  
  getDepositAddress(){
    return this.config.shared.deposit;
  }

  setShippingAddress(address:UserAddress){
    this.$cart.setShippingAddress(address);
  }

  isSelectedAddress(add){
    let current=this.$cart.getCurrentShippingAddress();
    return current.name==add.name&&
           (current.streetAdress||current['streetAddress'])==(add.streetAdress||add['streetAddress'])
  }

  isSelectedPayment(payment:UserCard){
    let current=this.$cart.getCurrentGateway();
    return (current.label)==payment.issuer;
  }  
  isPaymentMethodsValid(){
    return this.user.payments.every(payment=>payment.isValid());
  }

  isOrderReady(){
    let payment=this.$cart.getCurrentGateway();
    let address=this.$cart.getCurrentShippingAddress();
    return this.user.isReady()&&(payment.fees>=0)&&address.name&&this.items.length;
  }

  setPaymentMethod(payment:UserCard){
    if(!payment.isValid()){
      this.$snack.show(payment.error,"OK",{multiline:true})
      return;
    }
    this.$cart.setPaymentMethod(payment);      
  }

  add(item:CartItem) {
    this.$cart.add(item);
  }

  remove(item:CartItem){
    this.$cart.remove(item);
  }
  
  onSelect(source,item){
    this.items.forEach(i=>{
      i['selected']=(i.sku===item.sku&&!i['selected']);
    });
  }

  onSign(){
    
  }


}
