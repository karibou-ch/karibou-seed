import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CartService, 
         CartItem, 
         Config, 
         LoaderService, 
         OrderShipping,
         User, 
         UserAddress,
         UserCard,
         UserService,
         OrderService,
         Shop} from 'kng2-core';

import { MdcSnackbar } from '@angular-mdc/web';
import { KngNavigationStateService, KngUtils, i18n } from '../common';
import { FormBuilder } from '@angular/forms';

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
  shops:Shop[];
  vendorAmount:any;
  user:User=new User();
  config:Config;
  items:CartItem[];
  sign:any;
  cgAccepted:boolean=false;
  hasOrderError:boolean=false;
  noshippingMsg:string;
  subscription;
  shippingTime;

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
    this.noshippingMsg=this.getNoShippingMessage();

    // 
    // FIXME currently only one shipping time!
    this.shippingTime=Object.keys(this.config.shared.order.shippingtimes)[0];
    this.shippingTime=this.config.shared.order.shippingtimes[this.shippingTime];

    this.user=loader[1];
    this.shops=loader[3];
    this.items=[];
    this.vendorAmount={};


  }

  getNoShippingMessage(){    
    let noshipping=this.config.noShippingMessage().find(shipping=>!!shipping.message);
    return noshipping&&noshipping.message;
  }


  ngOnDestroy(){
    this.subscription.unsubscribe();
  }


  ngOnInit() {
    this.store=this.$navigation.store;

    //
    // compute available discount and delta to get one
    this.computeDiscount();

    this.subscription=this.$loader.update().subscribe(emit=>{
      // emit signal for config
      if(emit.config){

      }
      // emit signal for user
      if(emit.user){
        this.user=emit.user;
        this.checkPaymentMethod();        
      }
      // emit signal for cart
      if(emit.state){
        this.items=this.$cart.getItems();
      }

    },error=>{
      console.log('loader-update',error);      
    })
    //
    // on open page => force scroll to top
    setTimeout(()=>{
      try{window.scroll(0,0);}catch(e){}
    },100)

    this.checkPaymentMethod();
  }

  add(item:CartItem,variant?:string) {
    this.$cart.add(item,variant);
    this.computeDiscount();
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

    this.hasOrderError=false;

    this.$order.create(
      shipping,
      this.items.map(item=>item.toDEPRECATED()),
      this.$cart.getCurrentPaymentMethod()
    ).subscribe((order)=>{
        //
        // check order errors 
        if(order.errors){
          this.$cart.setError(order.errors);
          this.hasOrderError=true;
          this.$snack.show(
            "Votre commande doit être corrigée ",
            this.$i18n.label().thanks,
            this.$i18n.snackOpt
          );
          window.scroll(0,0);          
          return;
        }
        this.$snack.show("Votre commande est enregistrée, vous serez livré le "+order.shipping.when.toDateString());
        this.$router.navigate(['/store',this.store,'me','orders']);
        this.items=[];
        this.$cart.empty();
      },
      err=>{
        this.$snack.show(
          err.error,
          this.$i18n.label().thanks,
          this.$i18n.snackOpt
      );
      }
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


  computeDiscount() {
    // init
    Object.keys(this.vendorAmount).forEach(vendor=>{
      if(!this.vendorAmount[vendor]){
        return; 
      }
      this.vendorAmount[vendor].amount=0;
    });

    //
    // sum total by vendor
    this.$cart.getItems().forEach(item=>{
      //let vendor=this.shops.find(shop=>shop.urlpath==item.vendor.urlpath).urlpath;
      let vendor=item.vendor.urlpath;
      if(!this.vendorAmount[vendor]){
        this.vendorAmount[vendor]={
          amount:0,discount:{}
        };        
        Object.assign(this.vendorAmount[vendor].discount,item.vendor.discount,{total:0});
      }
      this.vendorAmount[vendor].amount+=(item.price*item.quantity);  
    });

    //
    // compute available discount
    Object.keys(this.vendorAmount)
          .map(vendor=>this.vendorAmount[vendor])
          .filter(vendor=>vendor.discount.threshold)
          .forEach(vendor=>{
      let amount=vendor.amount;
      let discountMagnitude=Math.floor(amount/vendor.discount.threshold);      
      vendor.discount.needed=vendor.discount.threshold-amount%(vendor.discount.threshold|0)+amount;
      vendor.discount.total=discountMagnitude*vendor.discount.amount;
      
    });

    //
    // DEBUG 
    // Object.keys(this.vendorAmount).forEach(vendor=>{
    //   console.log('--- vendor.discount',vendor,this.vendorAmount[vendor])
    // });
  }  

  getDiscount(item:CartItem){
    let discount=this.vendorAmount[item.vendor.urlpath].discount;

    if(discount.threshold){
      // discount.total;
      // discount.needed;
      // discount.threshold;
      // console.log('--- vendor.discount',this.vendorAmount[item.vendor.urlpath]);
      return discount.needed;
    }
    return "";
  }

  getVendorDiscount(item:CartItem){
    return this.vendorAmount[item.vendor.urlpath].discount;
  }

  getTotalDiscount() {
    var amount=0;
    for(var slug in this.vendorAmount){
      amount+=this.vendorAmount[slug].discount.total;
    }
    return amount;
  }  

  getStaticMap(address:UserAddress){
    return KngUtils.getStaticMap(address,this.config.shared.keys.pubMap||'');
  }
  
  getDepositAddress(){
    return this.config.shared.deposits;
  }

  
  goBack(): void {
    this.$router.navigate(['../home'], { relativeTo: this.$route });
  }
  
  isCartDeposit(){
    let current=this.$cart.getCurrentShippingAddress();
    // deposit address contains fees
    // TODO make a test for that
    return current['fees']!=undefined;
  }  

  isSelectedAddress(add:UserAddress){
    let current=this.$cart.getCurrentShippingAddress();
    return add.isEqual(current);
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
    return this.user.isReady()&&(payment.label!='Aucun')&&address.name&&this.items.length;
  }

  setShippingAddress(address:UserAddress){
    this.$cart.setShippingAddress(address);
  }
  
  setPaymentMethod(payment:UserCard){
    if(!payment.isValid()){
      this.$snack.show(payment.error,"OK",{multiline:true})
      return;
    }
    this.$cart.setPaymentMethod(payment);      
  }


  remove(item:CartItem,variant?:string){
    this.$cart.remove(item,variant);
    this.computeDiscount();
  }
  
  removeAll(item:CartItem,variant?:string){
    this.$cart.removeAll(item,variant);
    this.computeDiscount();
  }
  
  onSelect(source,item){
    this.items.forEach(i=>{
      i['selected']=(i.sku===item.sku&&!i['selected']);
    });
  }

  onSign(){
    
  }


}
