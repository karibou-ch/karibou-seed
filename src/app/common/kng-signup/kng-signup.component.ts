import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Config, User, UserAddress, geolocation } from 'kng2-core';
import { i18n } from 'src/app/common';
import { Loader } from "@googlemaps/js-api-loader"
import { HttpClient } from '@angular/common/http';
import { KngInputValidator } from 'src/app/shared';

@Component({
  selector: 'kng-signup',
  templateUrl: './kng-signup.component.html',
  styleUrls: ['./kng-signup.component.scss']
})
export class KngSignupComponent implements OnInit {

  private _signin: boolean;
  private _user: User;

  i18n: any = {
    fr: {
    },
    en: {
    }
  };

  $user: FormGroup;

  @Output() updatedSignup: EventEmitter<User|undefined> = new EventEmitter<User>();
  @Input() set signin(singin:boolean) {
    this._signin = singin;
    this.onUpdateForm();
  }
  @Input() config:Config;
  @Input() phone: string;
  @Input() displayOnly: boolean;
  @Input() set user(user: User){
    this._user = user;
    this.onUpdateUser(user);
  }


  constructor(
    public  $i18n: i18n,
    private $fb: FormBuilder,
    private $http: HttpClient
  ) {
    
  }

  get isValid() {
    return this.$user.valid;
  }

  get isClear() {
    return this.user.name.givenName === '' && 
           this.user.name.familyName === '' && 
           this.user.email.address === ''; 
  }

  get user() {
    const user:any = {
      name:{
        givenName: this.$user.value.forname as string,
        familyName: this.$user.value.name as string
      },
      email: this.$user.value.email as string   
    };
    const phone = this.$user.value.phone;
    if(phone)user.phoneNumbers = [phone]
    return user;
  }

  get glabel() {
    return this.$i18n.label();
  }  

  get label() {
    return this.i18n[this.$i18n.locale];
  }  
  get locale() {
    return this.$i18n.locale;
  }

  get signin() {
    return this._signin;
  }

  ngOnInit(): void {
    if(!this.config) throw new Error('KngSignupComponent: config is required');
    this.onUpdateForm();
    this.onUpdateUser(this._user);
  }

  isInvalid(controlName: string): boolean {
    const control = this.$user.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  async onSignup() {
    this.updatedSignup.emit(this.user);
  }

  onCancel() {
    this.$user.get('phone')?.reset();
    this.$user.get('name')?.reset();
    this.$user.get('forname')?.reset();
    this.updatedSignup.emit();
  }

  onUpdateForm() {
    const postalCodeValidator= (control) => {
      if(this.config.shared.user.location.list.indexOf(control.value)==-1){
        return {invalidPostalcode:true};
      }    
      return null;
    }
    if(this._signin) {
      this.$user = this.$fb.group({
        'email': ['', [Validators.required, KngInputValidator.emailValidator]],
        'password': ['', [Validators.required, KngInputValidator.passwordValidator]],
      });

    } else {  
      this.$user = this.$fb.group({
        'name': ['', [Validators.required, ]],
        'forname': ['', [Validators.required]],
        'email': ['', [Validators.required, KngInputValidator.emailValidator]],
        'password': ['', [Validators.required, KngInputValidator.passwordValidator]],
        'confirm': ['', [Validators.required, KngInputValidator.passwordValidator]],
        'postalcode':['',[postalCodeValidator]],
        'phone': ['', [Validators.required, Validators.minLength(9)]]
      });
  
    }   

  }

  onUpdateUser(user: User) {
    if(!user ||!this.$user) return;
    if(!user.isAuthenticated()){
      this.$user.reset();

      if(user.email.address) {
        this.$user.patchValue({
          email: user.email.address
        });
      }

      if(user.name.familyName) {
        this.$user.patchValue({
          name: user.name.familyName
        });
      }

      if(user.name.givenName) {
        this.$user.patchValue({
          name: user.name.givenName
        });
      }

      if(user.phoneNumbers && user.phoneNumbers.length>0) {
        this.$user.patchValue({
          phone: user.phoneNumbers[0].number
        });
      }
      return;
    }
    this.$user.setValue({
      name: user.name.familyName,
      forname: user.name.givenName,
      email: user.email.address,
      phone: user.phoneNumbers[0]?.number || '',
      password: '',
      confirm: '',
      postalcode: ''
    });    
  }
}
