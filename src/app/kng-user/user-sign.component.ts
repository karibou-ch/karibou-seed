import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputValidator, NavigationService, i18n } from '../shared';

import { MdcSnackbar } from '@angular-mdc/web'; 
import { Config, LoaderService, User, UserService } from 'kng2-core';

@Component({
  selector: 'kng-user-sign',
  templateUrl: './user-sign.component.html',
  styleUrls: ['./user-sign.component.scss']
})
export class UserSignComponent {

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
  askAction:string;
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
    private $nav:NavigationService,
    private $snack:MdcSnackbar
  ) {
    //
    // initialize HTML content (check on route definition)
    this.askAction=this.$route.snapshot.data.action;

    this.signup = this.$fb.group({
      'name':['', [Validators.required,]],
      'forname':['', [Validators.required]],
      'email': ['', [Validators.required, InputValidator.emailValidator]],
      'password': ['', [Validators.required, InputValidator.passwordValidator]],
      'confirm': ['', [Validators.required, InputValidator.passwordValidator]]
    });

    this.sign = this.$fb.group({
      'email': ['', [Validators.required, InputValidator.emailValidator]],
      'password': ['', [Validators.required, InputValidator.passwordValidator]]
    });

    this.recover = this.$fb.group({
      'email': ['', [Validators.required, InputValidator.emailValidator]]
    });

    //
    // system ready
    this.$loader.ready().subscribe((loader) => {
      this.isReady = true;
      this.config = loader[0];
      Object.assign(this.user,loader[1]);
      if(this.askAction==='logout'){
        this.$user.logout().subscribe(
          ok=>{
            this.signoutOk=true;
          },
          err=>this.$snack.show(err._body)
        )
      }
    });

    
  }

  //@HostListener('document:click')
  onWindowClick(){
    if(document['referrer']){
      return this.$location.back();
    }
    this.$router.navigate(['/store',this.$nav.store]);
  }


  onRecover(){
    this.$user.recover(this.recover.value.email).subscribe(
      ok=>{
        this.$snack.show(this.$i18n.lang().recover_ok);
      },err=>{
        this.$snack.show(err._body,'OK');
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
        return this.$snack.show(this.$i18n.lang().login_ko,"OK",{
          timeout:5000
        });        
      }
      this.$router.navigate(['store',this.$nav.store]);
      this.$snack.show(this.$i18n.lang().login_ok,"OK");
    },(err)=>this.$snack.show(err._body,"OK"));    
  }

  onSignup(){
    let user={
      email:this.signup.value.email,
      firstname:this.signup.value.forname,
      lastname:this.signup.value.name,
      password:this.signup.value.password,
      confirm:this.signup.value.confirm
    };    
    this.$user.register(user).subscribe(
      ()=>this.$snack.show(this.$i18n.lang().register_ok,"OK"),
      (err)=>this.$snack.show(err._body,"OK")
    )
  }
  

  // BACKPORT FROM K1
  // onPostSignIn(){

  //   //
  //   // if referer is in protected path?
  //   if($scope.referrer&&_.find(config.loginPath,function(path){
  //       return ($scope.referrer.indexOf(path)!==-1);})){
  //     return $location.url($scope.referrer);
  //   }
  //   if($scope.referrer&&_.find(config.readonlyPath,function(path){
  //       return ($scope.referrer.indexOf(path)!==-1);})){
  //     return $location.url($scope.referrer);
  //   }

  //   //
  //   // admin collect food
  //   if(user.isAdmin()){
  //     return $location.url('/admin/collect');
  //   }

  //   //
  //   // user is a shopper 
  //   if(user.hasRole('logistic')){
  //     return $location.url('/admin/shipping');
  //   }

  //   //
  //   // user manage his shop
  //   if(user.shops.length){
  //     return $location.url('/admin/orders');
  //   }

  //   //
  //   // else goto '/'
  //   $location.url('/');
  
  // }

  // $scope.hasPostalCode=function(cp) {
  //   var lst=user.logistic.postalCode||[];
  //   return lst.indexOf(cp)!==-1;
  // }

  // $scope.togglePostalCode=function(cp) {
  //   var lst=user.logistic.postalCode||[];
  //   var pos=lst.indexOf(cp);
  //   if(pos===-1){
  //     lst.push(cp);
  //   }else{
  //     lst.splice(pos,1);
  //   }    
  //   user.logistic.postalCode=lst;
  // }

}
