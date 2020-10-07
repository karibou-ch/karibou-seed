import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { KngInputValidator } from '../shared';
import { KngNavigationStateService, i18n } from '../common';

import { MdcSnackbar } from '@angular-mdc/web';
import { Config, User, UserService } from 'kng2-core';

@Component({
  selector: 'kng-user-sign',
  templateUrl: './user-sign.component.html',
  styleUrls: ['./user-sign.component.scss']
})
export class UserSignComponent {

  K_BRAND = '/assets/img/k-brand-lg.png';

  issuer = {
    wallet: {
      img: '/assets/img/payment/wallet.jpg',
      label: 'Votre compte privé'
    },
    invoice: {
      img: '/assets/img/payment/invoice.jpg',
      label: 'Facture en ligne'
    },
    mastercard: {
      img: '/assets/img/payment/mc.jpg',
      label: 'Mastercard'
    },
    visa: {
      img: '/assets/img/payment/visa.jpg',
      label: 'VISA'
    },
    'american express': {
      img: '/assets/img/payment/ae.jpg',
      label: 'American Express'
    },
    btc: {
      img: '/assets/img/payment/btc.jpg',
      label: 'Bitcoin'
    },
    bch: {
      img: '/assets/img/payment/bch.jpg',
      label: 'Bitcoin Cash'
    },
    lumen: {
      img: '/assets/img/payment/xlm.jpg',
      label: 'Lumen'
    }
  };


  i18n: any = {
    fr: {
      action_reset: 'Réinitialiser',
      login_title: 'Identifiez-vous avec votre email',
      login_why: `Une fois identifié, vous aurez une meilleure expérience du marché en ligne 😉`,
      login_create_account: 'Je n\'ai pas de compte',
      login_forgot_password: 'J\'ai oublié mon mot de passe',
      login_reset_password: 'Réinitialisez votre mot de passe',
      login_wait_msg: 'L\'envoi peut prendre quelques minutes',
      login_back_login: 'J\'ai déjà un compte',
      login_ok: 'Merci, vous êtes maintenant connecté',
      login_ko: 'L\'utilisateur ou le mot de passe est incorrect',
      login_skip: 'Je veux visiter le marché sans m\'identifier',
      signup_create: 'Créer votre compte',
      signup_phone: 'Le téléphone est essentiel pour pouvoir vous contacter lors d\'une commande',
      password_change_ok: 'Votre mot de passe à été modifié',
      profil_ok: 'Profil enregistré',
      register_ok: 'Votre compte à été créé! Une demande de confirmation vous a été envoyée à votre adresse email',
      recover_ok: 'Merci, une information a été envoyé à votre adresse email',
      validate_mail_ok: 'Votre adresse email à été validée!'
    },
    en: {
      action_reset: 'Reset',
      login_title: 'Use email to Sign in',
      login_why: `Identified user will have a better experience of the marketplace 😉`,
      login_create_account: 'New to karibou? Sign up',
      login_forgot_password: 'Forgot password?',
      login_reset_password: 'We’ll send you an email to help you reset it',
      login_wait_msg: 'Sending may take a few minutes',
      login_back_login: 'Already have an account? Sign in',
      login_ok: '1000 Thanks, you are now connected',
      login_ko: 'Username or password are not correct',
      login_skip: 'Visit the food store without identification',
      signup_create: 'Continue',
      signup_phone: 'The phone is mandatory to contact you when ordering',

      password_change_ok: 'Votre mot de passe à été modifié',
      profil_ok: 'Profil enregistré',
      register_ok: 'Votre compte à été créé! Une demande de confirmation vous a été envoyée à votre adresse email',
      recover_ok: 'Merci, une information a été envoyé à votre adresse email',
      validate_mail_ok: 'Votre adresse email à été validée!'
    }

  };


  config: Config;
  user: User = new User();
  isReady = false;
  sign: any;
  recover: any;
  signup: any;
  store: string;


  askAction: string;
  mandatory: {
    address: boolean;
    payment: boolean;
    validation: boolean;
    referrer: string;
  };

  insideClick = false;
  signoutOk = false;


  constructor(
    public  $i18n: i18n,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $fb: FormBuilder,
    private $location: Location,
    private $nav: KngNavigationStateService,
    private $snack: MdcSnackbar
  ) {
    //
    // initialize HTML content (check on route definition)
    this.askAction = this.$route.snapshot.data.action;

    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    //
    // system ready
    this.isReady = true;
    this.config = loader[0];
    this.user   = loader[1];

    this.mandatory = {
      address: this.$route.snapshot.data.address,
      payment: this.$route.snapshot.data.payment,
      validation: this.$route.snapshot.data.validation,
      referrer: this.$route.snapshot.data.referrer
    };


    //
    // create account
    this.signup = this.$fb.group({
      'name': ['', [Validators.required, ]],
      'forname': ['', [Validators.required]],
      'email': ['', [Validators.required, KngInputValidator.emailValidator]],
      'password': ['', [Validators.required, KngInputValidator.passwordValidator]],
      'confirm': ['', [Validators.required, KngInputValidator.passwordValidator]],
      'phone': ['', [Validators.required, Validators.minLength(9)]]
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

  get locale() {
    return this.$i18n.locale;
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
  updateState() {
    const isAuth = this.user.isAuthenticated();
    const hasAddress = this.user.hasPrimaryAddress() !== false;
    const hasValidMail = this.user.isReady();
    const hasValidPayment = this.user.payments.every(p => p.isValid());
    this.store  = this.$nav.store;

    //
    // mandatory add,payment
    if (isAuth) {
      //
      // logout case
      if (this.askAction === 'logout') {
        this.$user.logout().subscribe(
          ok => this.signoutOk = true,
          err => this.$snack.open(err.error)
        );
      }

      if (this.mandatory.address) {
        return this.askAction = 'address';
      }
      if (this.mandatory.payment) {
        return this.askAction = 'payment';
      }
      //
      // we are ok
      return this.onBack();
    }


  }


  ngOnInit() {
    if (this.askAction === 'payment') {
    }
  }

  getHubSlug() {
    if (!this.config || !this.config.shared.hub) {
      return 'geneva';
    }
    return this.config.shared.hub.slug;
  }

  getTagline(key) {
    if (!this.config || !this.config.shared.tagLine[key]) {
      return;
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name) ? hub.tagLine[key][this.$i18n.locale] : shared.tagLine[key][this.$i18n.locale];
  }

  getTaglineLogo() {
    const defaultImg = (this.config.shared.hub && this.config.shared.hub.tagLine) ?
          this.config.shared.hub.tagLine.image : this.K_BRAND;

    const bgStyle = 'url(' + defaultImg + ')';
    return {'background-image': bgStyle};

  }

  // @HostListener('document:click')
  onBack() {
    const referrer = this.$route.snapshot.queryParams['referrer'];


    if (referrer) {
      return this.$router.navigate([referrer]);
    }

    if (this.mandatory.referrer) {
      return this.$router.navigate([this.mandatory.referrer]);
    }


    if (document['referrer']) {
      return this.$location.back();
    }



    //
    // last case, HOME
    return this.$location.back();
    // this.$router.navigate(['/store',this.$nav.store]);
  }


  onUpdateAddress($result) {
    const msg = ($result.error) ? ($result.error.message || $result.error) : 'OK';
    this.$snack.open(msg, this.$i18n.label().thanks, this.$i18n.snackOpt);
    this.onBack();
  }

  onUpdatePayment($result,other?){
    //
    // force update of all payments method
    this.$user.me().subscribe(user => {
      this.user = user;
      const msg = ($result.error) ? ($result.error.message || $result.error) : 'Ok';
      this.$snack.open(msg, this.$i18n.label().thanks, this.$i18n.snackOpt);
      this.onBack();
    });
  }

  onRecover() {
    const email = this.recover.value.email.toLocaleLowerCase();
    this.$user.recover(email).subscribe(
      ok => {
        this.$snack.open(this.$i18n.label().user_recover_ok, this.$i18n.label().thanks, this.$i18n.snackOpt);
      }, err => {
        this.$snack.open(err.error, this.$i18n.label().thanks, this.$i18n.snackOpt);
      }
    );
  }


  onSign() {
    this.$user.login({
      email: this.sign.value.email,
      password: this.sign.value.password,
      provider: 'local'
    }).subscribe(
    (user: User) => {
      if (!user.isAuthenticated()) {
        return this.$snack.open(this.$i18n.label().user_login_ko, this.$i18n.label().thanks, this.$i18n.snackOpt);
      }
      this.$snack.open(this.$i18n.label().user_login_ok, this.$i18n.label().thanks, this.$i18n.snackOpt);
      this.onBack();
    }, (err) => this.$snack.open(err.error, this.$i18n.label().thanks, this.$i18n.snackOpt));
  }

  onSignup() {
    //
    // phone number is mandatory
    const user = {
      email: this.signup.value.email,
      firstname: this.signup.value.forname,
      lastname: this.signup.value.name,
      password: this.signup.value.password,
      confirm: this.signup.value.confirm,
      phoneNumbers: [{number: this.signup.value.phone, what: 'mobile'}]
    };
    this.$user.register(user).subscribe(
      (user) => {
        this.$snack.open(this.$i18n.label().user_register_ok, this.$i18n.label().thanks, {
          timeoutMs: 9000
        });
        this.onBack();
      },
      (err) => {
        this.$snack.open(err.error, this.$i18n.label().thanks, {
          timeoutMs: 9000
        });
      }
    );
  }

}
