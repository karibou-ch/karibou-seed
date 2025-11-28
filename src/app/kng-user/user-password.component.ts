import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, UserService, Config, LoaderService } from 'kng2-core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { KngInputValidator } from '../shared';
import { i18n, NotifyService } from '../common';

@Component({
  selector: 'kng-user-password',
  templateUrl: './user-password.component.html',
  styleUrls: ['./user-password.component.scss']
})
export class UserPasswordComponent {

  @Output() updated: EventEmitter<User> = new EventEmitter<User>();

  @Input() user: User;
  @Input() set config(config: Config) {
    this.main(config);
  }


  $password: FormGroup;
  isLoading: boolean;

  constructor(
    public  $i18n: i18n,
    private $fb: FormBuilder,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $snack: NotifyService,
    private $loader: LoaderService
  ) {

    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config, user } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;

    this.isLoading = false;
    // [ngModelOptions]="{updateOn: 'blur'}"
    this.$password = this.$fb.group({
      'previous':   ['', [Validators.required, Validators.minLength(6)]],
      'password':   ['', [Validators.required, Validators.minLength(6)]],
      'confirm':  ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validator: KngInputValidator.MatchPasswordAndConfirm
    });
    // [ngModelOptions]="{updateOn: 'blur'}"
  }

  get locale() {
    return this.$i18n.locale;
  }

  //
  // entry poiont
  main(config: Config) {
  }


  onChange() {
    //
    // let update password
    const change = {
      current: this.$password.value.previous,
      new: this.$password.value.password,
      email: this.user.email.address
    };
    const locale = this.$i18n.locale;
    this.$user.newpassword(this.user.id, change).subscribe(
      // FIXME to proofread return value, ther is no error when the two password aren't similar
      () => this.$snack.open(
        this.$i18n.label().modify_ok,
        this.$i18n.label().thanks, this.$i18n.snackOpt
      ),
      err => this.$snack.open(err.error)
    );
  }
}
