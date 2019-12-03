import { Component, OnInit,OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { UserService, User } from 'kng2-core';
import { MdcSnackbar } from '@angular-mdc/web';
import { i18n } from '../../common';

import { timer ,  Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'kng-mail-confirmation',
  templateUrl: './kng-mail-confirmation.component.html',
  styleUrls: ['./kng-mail-confirmation.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngMailConfirmationComponent implements OnInit,OnDestroy {

  @Input() user:User;

  checker$:Subscription;


  i18n:any={
    fr:{
      title_h3:"En attente de confirmation de votre adresse email",
      title_h2:"Votre adresse email n'a toujours pas été confirmée.",
      action_1:"Une demande de confirmation vous a été envoyée par email le",      
      action_2:"Vous pouvez aussi demander un nouveau email de confirmation"
    },
    en:{
      title_h3:"Waiting for email confirmation",
      title_h2:"Your email addresse must be valided before to continue.",
      action_1:"A confirmation email has been sent in your inbox on the ",      
      action_2:"Send a new confirmation email "
    }
  }


  constructor(
    private $i18n:i18n,
    private $user:UserService,
    private $snack:MdcSnackbar
  ) { 

  }

  get locale(){
    return this.$i18n.locale;
  }

  ngOnInit(){
    //
    // verify each 5s the validation
    this.checker$ = timer(8000, 8000).pipe(
      mergeMap(()=>this.$user.me())
    ).subscribe(user=>{      
      this.user=user;
      if(user.isReady()){
        this.checker$.unsubscribe()
      }
    });
  }

  ngOnDestroy(){
    if(!this.checker$.closed){
      this.checker$.unsubscribe();
    }    
  }

  sendConfirmationMail(){
    if(!this.user.isAuthenticated()){
      return;
    }
    this.$user.validateEmail().subscribe((status:any)=>{
      //.created:Date
      //.email:string
      //.owner:string
      this.user.email.status=status.created;
      this.$snack.open(
        this.$i18n.label().user_confirmation_mail,
        this.$i18n.label().thanks,this.$i18n.snackOpt)
    },err=>{
      this.$snack.open(
        err.error,
        this.$i18n.label().thanks,this.$i18n.snackOpt
      );
    });
  }
  
}
