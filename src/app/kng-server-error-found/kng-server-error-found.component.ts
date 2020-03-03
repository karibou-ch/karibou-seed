import { Component, OnInit } from '@angular/core';
import { UserService } from 'kng2-core';
import { i18n } from '../common';

import { environment } from '../../environments/environment';
import { version } from '../../../package.json';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-kng-server-error-found',
  templateUrl: './kng-server-error-found.component.html',
  styleUrls: ['./kng-server-error-found.component.scss']
})
export class KngServerErrorFoundComponent implements OnInit {
  APP_VERSION = version;

  i18n: any = {
    fr: {
      title_migration: `Nous avons publié de nouvelles fonctionalités et malheureusement
       notre petite équipe n\'a pas les moyens d\'effectuer des tests sur toutes les versions
       de téléphone ou ordinateur. Cette page a généré un message qui va nous permettre de trouver une solution.`,
      title_salutation: 'Merci beaucoup pour votre patience. Contactez nous : <a href="mailto:hello@karibou.ch">hello@karibou.ch</a>, <a href="tel:0793772113">079 377 21 13</a>',
      title_intro: 'Les données techniques du problème ont été transmises...',
      title_reload: 'recharger l\'application [Yes]'
    },
    en: {
      title_migration: `Hello, we've added new functions to the software.
       Despite the tests ran by the developer it occurs that our application
       doesn't work properly with some versions of devices or web browsers..
       This page has generated a message to our team so we can find a solution as soon as possible.`,
      title_salutation: 'Thank you so much for your patience. Please contact us for further info : <a href="mailto:hello@karibou.ch">hello@karibou.ch</a>, <a href="tel:0793772113">079 377 21 13</a>',
      title_intro: 'The technical data of the problem have been transmitted...',
      title_reload: 'restart the App [Yes]'
    }
  };


  constructor(
    public $i18n: i18n,
    public $user: UserService
  ) {

  }


  get locale() {
    return this.$i18n.locale;
  }

  ngOnInit() {
    this.$user.me().subscribe(() => {
      // window.location.href='/';
    });
    const Sentry = window['Sentry'];
    if (!Sentry) {
      return;
    }

    if (!Sentry ||
        !environment.production ||
        window.location.origin.indexOf('karibou.ch') === -1) {
        return;
    }

    //
    // publish sentry event only on production
    Sentry.captureException(new Error('--DEBUG 404 landing'));
  }

}
