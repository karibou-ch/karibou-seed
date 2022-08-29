import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService, Config } from 'kng2-core';
import { i18n } from '../common';

@Component({
  selector: 'kng-validate-mail',
  templateUrl: './kng-validate-mail.component.html',
  styleUrls: ['./kng-validate-mail.component.scss']
})
export class KngValidateMailComponent implements OnInit {

  uid: string;
  email: string;
  validate: any;
  error: any;
  config: Config;

  i18n: any = {
    fr: {
      title1: 'Merci d\'avoir validé votre adresse email!',
      title2: 'Vous pouvez fermer cette fenêtre et poursuivre vos achats.',
      warning: 'Oh oh! La validation a déjà été effectuée',
      contact: 'En cas de doute, contactez nous!</a>'
    },
    en: {
      title1: 'Thank you! Your Email has been confirmed.',
      title2: 'You can close this window and continue shopping.',
      warning: 'Oh oh! La validation a déjà été effectuée',
      contact: 'En cas de doute, contactez nous!'
    }
  };

  constructor(
    private $i18n:i18n,
    private $route: ActivatedRoute,
    private $user: UserService
  ) {
    this.uid = this.$route.snapshot.params['uid'];
    this.email = this.$route.snapshot.params['mail'];
    this.config = this.$route.snapshot.data.loader[0];
  }

  get locale() {
    return this.$i18n.locale;
  }


  //
  // testing
  // http://localhost:4000/validate/ac97700878eb995cbad18f45c6c6f7543770f208/test1@karibou.ch
  ngOnInit() {
    this.$user.validate(this.uid, this.email).subscribe(
      (validate) => this.onValidate(null, validate),
      (err) => this.onValidate(err.error)
    );
  }

  onValidate(err, validate?) {
    this.error = err;
    this.validate = validate;
  }

}
