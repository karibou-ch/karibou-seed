import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, UserService, Config } from 'kng2-core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { KngInputValidator } from '../shared';
import { i18n } from '../common';
import { MdcSnackbar } from '@angular-mdc/web';

@Component({
  selector: 'kng-user-password',
  templateUrl: './user-password.component.html',
  styleUrls: ['./user-password.component.scss']
})
export class UserPasswordComponent {

  @Output() updated:EventEmitter<User>=new EventEmitter<User>();

  @Input() user:User;
  @Input() set config(config:Config){
    this.main(config);
  }

  
  $password:FormGroup;
  isLoading:boolean;
  
  constructor(
    public  $i18n:i18n,
    private $fb: FormBuilder,
    private $user:UserService,
    private $route:ActivatedRoute,
    private $snack:MdcSnackbar,
  ){

    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    //
    // system ready
    this.user   = loader[1];
    this.config = loader[0];
    
    this.isLoading=false;
    //[ngModelOptions]="{updateOn: 'blur'}"
    this.$password = this.$fb.group({
      'previous':   ['', [Validators.required,Validators.minLength(6)]],
      'password':   ['',[Validators.required,Validators.minLength(6)]],
      'confirm':  ['', [Validators.required,Validators.minLength(6)]]
    },{
      Validators:KngInputValidator.MatchPasswordAndConfirm
    });
    //[ngModelOptions]="{updateOn: 'blur'}"
  }

  get locale(){
    return this.$i18n.locale;
  }

  //
  // entry poiont
  main(config:Config){
  }


  onChange(){
    //
    // let update password
    let change={
      current:this.$password.value.previous,
      new:this.$password.value.password,
      email:this.user.email.address
    }
    let locale=this.$i18n.locale;
    this.$user.newpassword(this.user.id,change).subscribe( // FIXME to proofread return value, ther is no error when the two password aren't similar
      ()=>this.$snack.open(
        this.$i18n.label().modify_ok,
        this.$i18n.label().thanks,this.$i18n.snackOpt
      ),
      err=>this.$snack.open(err.error)
    );
  }
}
