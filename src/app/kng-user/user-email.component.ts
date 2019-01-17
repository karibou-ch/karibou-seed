import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, UserService, Config } from 'kng2-core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { KngInputValidator } from '../shared';
import { i18n } from '../common';
import { MdcSnackbar } from '@angular-mdc/web';

@Component({
  selector: 'kng-user-email',
  templateUrl: './user-email.component.html',
  styleUrls: ['./user-email.component.scss']
})
export class UserEmailComponent {

  @Output() updated:EventEmitter<User>=new EventEmitter<User>();

  @Input() user:User;
  @Input() set config(config:Config){
    this.main(config);
  }

  
  $profile:FormGroup;
  isLoading:boolean;
  phone:string;
  
  constructor(
    private $i18n:i18n,
    private $fb: FormBuilder,
    private $user:UserService,
    private $route:ActivatedRoute,
    private $snack:MdcSnackbar
  ){

    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    //
    // system ready
    this.user   = loader[1];
    this.config = loader[0];

    //
    // in case of missing phone
    if(!this.user.phoneNumbers||!this.user.phoneNumbers.length){
      this.user.phoneNumbers=[{what:'mobile',number:''}];
    }
    this.phone  = this.user.phoneNumbers[0].number;
    
    this.isLoading=false;
    //[ngModelOptions]="{updateOn: 'blur'}"
    this.$profile = this.$fb.group({
      'name':['', [Validators.required,Validators.minLength(2)]],
      'forname':['', [Validators.required,Validators.minLength(2)]],
      'phone':['', [Validators.required,Validators.minLength(9)]],
      'email':   ['', [Validators.required,KngInputValidator.emailValidator]],
      'password':   ['',[Validators.required,Validators.minLength(6)]]
    },{
      Validators:KngInputValidator.MatchPasswordAndConfirm
    });
    //[ngModelOptions]="{updateOn: 'blur'}"
  }


  //
  // entry poiont
  main(config:Config){
  }


  onChange(){
    //
    // let update password
    let update=new User(this.user);
    update.name.familyName=this.$profile.value.name;
    update.name.givenName=this.$profile.value.forname;
    update.email.address=this.$profile.value.email;
    update.phoneNumbers[0].number=this.$profile.value.phone;

    let locale=this.$i18n.locale;
    this.$user.save(update).subscribe(
      ()=>this.$snack.show(
        this.$i18n.label().modify_ok,
        this.$i18n.label().thanks,this.$i18n.snackOpt
      ),
      err=>this.$snack.show(err.error)
    );
  }
}
