import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KngInputValidator, KngNavigationStateService, i18n } from '../shared';

import { MdcSnackbar } from '@angular-mdc/web'; 
import { Config, LoaderService, User, UserService, UserCard, UserAddress } from 'kng2-core';
import { StripeService, Elements, ElementsOptions } from 'ngx-stripe';

@Component({
  selector: 'kng-user-sign',
  templateUrl: './user-sign.component.html',
  styleUrls: ['./user-sign.component.scss']
})
export class UserSignComponent {


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


  i18n:any={
    login_ok:"Merci, vous êtes dès maintenant connecté",
    login_ko:"L'utilisateur ou le mot de passe est incorrect",
    password_change_ok:"Votre mot de passe à été modifié",
    profil_ok:"Profil enregistré",
    register_ok:"Votre compte à été créé! Une demande de confirmation vous a été envoyée à votre adresse email",
    recover_ok:"Merci, une information a été envoyé à votre adresse email",
    validate_mail_ok:"Votre adresse email à été validée!"
  }
  

  config: Config;
  user:User=new User();
  isReady:boolean=false;
  sign: any;
  recover: any;
  signup: any;
  store:string;

  
  askAction:string;
  mandatory:{
    address:boolean;
    payment:boolean;
    validation:boolean;
    referrer:string;
  };

  insideClick:boolean=false;
  signoutOk:boolean=false;


  constructor(
    private $i18n: i18n,
    private $loader: LoaderService,
    private $user: UserService,
    private $route:ActivatedRoute,
    private $router: Router,
    private $fb: FormBuilder,
    private $location:Location,
    private $nav:KngNavigationStateService,
    private $snack:MdcSnackbar
  ) {
    //
    // initialize HTML content (check on route definition)
    this.askAction=this.$route.snapshot.data.action;

    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    //
    // system ready
    this.isReady= true;
    this.config = loader[0];
    this.user   = loader[1];

    this.mandatory={
      address:this.$route.snapshot.data.address,
      payment:this.$route.snapshot.data.payment,
      validation:this.$route.snapshot.data.validation,
      referrer:this.$route.snapshot.data.referrer
    };


    //
    // create account
    this.signup = this.$fb.group({
      'name':['', [Validators.required,]],
      'forname':['', [Validators.required]],
      'email': ['', [Validators.required, KngInputValidator.emailValidator]],
      'password': ['', [Validators.required, KngInputValidator.passwordValidator]],
      'confirm': ['', [Validators.required, KngInputValidator.passwordValidator]],
      'phone':['', [Validators.required,Validators.minLength(9)]]
    });

    //
    // login account
    this.sign = this.$fb.group({
      'email': ['', [Validators.required, KngInputValidator.emailValidator]],
      'password': ['', [Validators.required, KngInputValidator.passwordValidator]]
    });

    //
    // generate new password
    this.recover = this.$fb.group({
      'email': ['', [Validators.required, KngInputValidator.emailValidator]]
    });


    this.updateState();
  }

  //
  // if not address or payment
  // - check is user as a valid address
  // - check is user as a valid payment solution
  
  //
  // askAction:null (signin)
  //  - address:payment:validation
  // askAction:'logout'
  // askAction:'signup'
  //  - address:payment:validation
  updateState(){
    let isAuth=this.user.isAuthenticated();
    let hasAddress=this.user.hasPrimaryAddress()!=false;
    let hasValidMail=this.user.isReady();
    let hasValidPayment=this.user.payments.every(p=>p.isValid());
    this.store  = this.$nav.store;

    // 
    // mandatory add,payment
    if(isAuth){
      //
      // logout case
      if(this.askAction==='logout'){
        this.$user.logout().subscribe(
          ok=>this.signoutOk=true,
          err=>this.$snack.show(err.error)
        )
      }
      
      if(this.mandatory.address){
        return this.askAction='address';
      }
      if(this.mandatory.payment){
        return this.askAction='payment';
      }    
      //
      // we are ok
      return this.onBack();      
    }

    
  }



  ngOnInit(){
    if(this.askAction=='payment'){  
    }
  }

  //@HostListener('document:click')
  onBack(){    
    if(this.mandatory.referrer){
      this.$router.navigate([this.mandatory.referrer])
    }

    if(document['referrer']){
      return this.$location.back();
    }

    //
    // last case, HOME
    return this.$location.back();
    // this.$router.navigate(['/store',this.$nav.store]);
  }


  onUpdateAddress($result){
    let msg=($result.error)? ($result.error.message||$result.error):'OK';
    this.$snack.show(msg,this.$i18n.label().thanks,this.$i18n.snackOpt);
    this.onBack();
  }

  onUpdatePayment($result,other){
    //
    // delete payment method
    if($result.deleted){
      this.user.payments=$result.deleted;
      return;
    }
    let msg=($result.error)? ($result.error.message||$result.error):'Ok';
    this.$snack.show(msg,this.$i18n.label().thanks,this.$i18n.snackOpt);
    this.onBack();
  }

  onRecover(){
    this.$user.recover(this.recover.value.email).subscribe(
      ok=>{
        this.$snack.show(this.$i18n.label().user_recover_ok,this.$i18n.label().thanks,this.$i18n.snackOpt);
      },err=>{
        this.$snack.show(err.error,this.$i18n.label().thanks,this.$i18n.snackOpt);
      }
    );
  }


  onSign() {    
    this.$user.login({
      email: this.sign.value.email,
      password: this.sign.value.password,
      provider: "local"
    }).subscribe(
    (user:User) => {
      if(!user.isAuthenticated()){
        return this.$snack.show(this.$i18n.label().user_login_ko,this.$i18n.label().thanks,this.$i18n.snackOpt);        
      }
      this.$snack.show(this.$i18n.label().user_login_ok,this.$i18n.label().thanks,this.$i18n.snackOpt);
      this.onBack();      
    },(err)=>this.$snack.show(err.error,this.$i18n.label().thanks,this.$i18n.snackOpt));    
  }

  onSignup(){
    //
    // phone number is mandatory
    let user={
      email:this.signup.value.email,
      firstname:this.signup.value.forname,
      lastname:this.signup.value.name,
      password:this.signup.value.password,
      confirm:this.signup.value.confirm,
      phoneNumbers:[{number:this.signup.value.phone,what:'mobile'}]
    };    
    this.$user.register(user).subscribe(
      (user)=>{
        this.$snack.show(this.$i18n.label().user_register_ok,this.$i18n.label().thanks,{
          timeout:8000,
          multiline:true
        });        
        this.onBack();        
      },
      (err)=>{
        this.$snack.show(err.error,this.$i18n.label().thanks,{
          timeout:8000,
          multiline:true
        })
      }
    )
  }

}
