import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { UserService, User } from 'kng2-core';
import { i18n, NotifyService } from '../../common';

import { timer ,  Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'kng-mail-confirmation',
  templateUrl: './kng-mail-confirmation.component.html',
  styleUrls: ['./kng-mail-confirmation.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngMailConfirmationComponent implements OnInit, OnDestroy {

  @Input() user: User;

  checker$: Subscription;
  sendConfirmation = false;

  i18n: any = {
    fr: {
      title_h3: 'En attente de confirmation de votre adresse email',
      title_h2: 'Nous vous avons envoyé un e-mail de confirmation pour vérifier votre adresse.',
      action_1: 'Si vous n’avez rien reçu ou si vous souhaitez un nouvel envoi, cliquez sur le bouton ci-dessous pour recevoir un nouvel e-mail de confirmation.',
      action_2: 'Recevoir un nouvel e-mail',
      action_2_done:'E-mail envoyé, merci de vérifier votre boîte de réception.'
    },
    en: {
      title_h3: 'Waiting for email confirmation',
      title_h2: 'Your e-mail must be confirmed before to continue. Please check your mailbox!',
      action_1: 'A confirmation email has been sent in your inbox on the ',
      action_2: 'Send a new confirmation email ',
      action_2_done:'Email sent!'
    }
  };


  constructor(
    private $i18n: i18n,
    private $user: UserService,
    private $snack: NotifyService
  ) {

  }

  get locale() {
    return this.$i18n.locale;
  }

  ngOnInit() {
    //
    // verify each 5s the validation
    this.checker$ = timer(8000, 8000).pipe(
      mergeMap(() => this.$user.me())
    ).subscribe(user => {
      this.user = user;
      if (user.isReady()) {
        this.checker$.unsubscribe();
      }
    });
  }

  ngOnDestroy() {
    if (!this.checker$.closed) {
      this.checker$.unsubscribe();
    }
  }

  sendConfirmationMail() {
    if (!this.user.isAuthenticated()) {
      return;
    }
    this.$user.validateEmail().subscribe((status: any) => {
      // .created:Date
      // .email:string
      // .owner:string
      this.user.email.status = status.created;
      this.sendConfirmation = true;
      this.$snack.open(
        this.$i18n.label().user_confirmation_mail,
        this.$i18n.label().thanks, this.$i18n.snackOpt);
    }, err => {
      this.$snack.open(
        err.error,
        this.$i18n.label().thanks, this.$i18n.snackOpt
      );
    });
  }

}
