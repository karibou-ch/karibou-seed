import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User,
         UserCard,
         UserService,
         Config} from 'kng2-core';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { StripeService } from 'ngx-stripe';
import { i18n } from '../common';
import { KngPaymentComponent, PaymentEvent } from '../common/kng-payment/kng-user-payment.component';


// stripe
// https://stripe.com/docs/testing
// visa:     4242424242424242
// declined: 4000000000000002
// expired:  4000000000000069
// sepa:     DE89370400440532013000
// sepa/err: DE62370400440532013001
@Component({
  selector: 'kng-user-payment-page',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class CardComponent {

  i18n: any = {
    fr: {
      title_header: 'Vos méthodes de paiement',
      title_edit: 'Sélectionner une méthode pour la supprimer',
      action_add: 'Ajouter une méthode de paiement',
      action_create_ok: 'Votre méthode de paiement a été enregistrée',
    },
    en: {
      title_header: 'Your payment methods',
      title_edit: 'Select payment method you want to edit',
      action_add: 'Add or update a payment method',
      action_create_ok: 'Your payment method has been saved',
    }
  };

  displayCardError: string;
  isValid: boolean;

  //
  // payment
  selected: UserCard;
  isLoading: boolean;



  @Output() updated: EventEmitter<PaymentEvent> = new EventEmitter<PaymentEvent>();

  @Input() user: User;
  @Input() config: Config;


  constructor(
    public  $i18n: i18n,
    private $user: UserService
  ) {

    this.isLoading = false;
    
  }

  get issuer(){
    return KngPaymentComponent.issuer;
  }

  get label() {
    return this.i18n[this.$i18n.locale];
  }  

  get locale() {
    return this.$i18n.locale;
  }

  onUpdatePayment(result: PaymentEvent) {
    this.isLoading = false;
    this.updated.emit(result);
  }

  isSelectedPayment(payment) {
    return this.selected && this.selected.alias === payment.alias;
  }

  onDelete(payment: UserCard) {
    this.isLoading = true;
    this.$user.deletePaymentMethod(payment.alias, this.user.id).subscribe(
      user => {
        //
        // do not exit on delete payment
        // this.onEmit(<PaymentEvent>({deleted: user.payments}));
        this.isLoading = false;
      },
      result => {
        this.displayCardError = result.error || result.message;
        this.isLoading = false;
      }
    );
  }

  onEmit(result: PaymentEvent) {
    this.isLoading = false;
    this.updated.emit(result);
  }

  setPaymentMethod(payment) {
    this.selected = payment;
  }

}
