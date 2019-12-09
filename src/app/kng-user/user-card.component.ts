import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User,
         UserCard,
         UserService,
         Config} from 'kng2-core';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { StripeService, Elements, ElementsOptions, TokenResult } from 'ngx-stripe';
import { i18n } from '../common';


export interface PaymentEvent {
  deleted?: UserCard[];
  card?: UserCard;
  error?: Error|any;
}

// stripe
// https://stripe.com/docs/testing
// visa:     4242424242424242
// declined: 4000000000000002
// expired:  4000000000000069
// sepa:     DE89370400440532013000
// sepa/err: DE62370400440532013001
@Component({
  selector: 'kng-user-payment',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class CardComponent {

  i18n: any = {
    fr: {
      title_header: 'Vos méthodes de paiement',
      title_edit: 'Sélectionner une méthode pour l\'éditer',
      action_add: 'Ajouter une méthode de paiement',
      action_create_ok: 'Votre méthode de paiement a été enregistrée',
    },
    en: {
      title_header: 'Your payment methods',
      title_edit: 'Select payment method you want to edit',
      action_add: 'Add a new payment method',
      action_create_ok: 'Your payment method has been saved',
    }
  };

  defaultUser: User = new User();
  isValid: boolean;

  //
  // payment
  stripe: FormGroup;
  elements: Elements;
  selected: UserCard;
  card: any;
  isLoading: boolean;

  // optional parameters
  elementsOptions: ElementsOptions = {
    locale: 'fr'
  };

  //
  // TODO shared this issuer assets
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

   // TOCHECK
  @Output() updated: EventEmitter<PaymentEvent> = new EventEmitter<PaymentEvent>();

  @Input() user: User;
  @Input('config') set config(config: Config) {
    this.main(config);
  }

  constructor(
    public  $i18n: i18n,
    private $fb: FormBuilder,
    private $stripe: StripeService,
    private $user: UserService
  ) {
    //
    // payment method
    this.stripe = this.$fb.group({
      'name': ['', [Validators.required]]
    });

    this.isLoading = false;
  }

  get locale() {
    const locale = this.$i18n.locale;
    switch (locale) {
      case 'fr':
      this.elementsOptions.locale = 'fr';
      break;
      default:
      this.elementsOptions.locale = 'en';
    }
    return locale;
  }
  //
  // entry point
  main(config: Config) {
    const locale = this.locale;
    //
    // set the stripe key
    this.$stripe.setKey(config.shared.keys.pubStripe);

    if (this.user.isAuthenticated()) {
      this.$user.checkPaymentMethod(this.user).subscribe(user => {
        this.user = user;
      });
    }

    this.$stripe.elements(this.elementsOptions).subscribe(elements => {
      this.elements = elements;
      // Only mount the element the first time
      if (this.card) {
        return;
      }
      this.card = this.elements.create('card', {
        hidePostalCode: true,
        style: {
          base: {
            iconColor: '#444',
            color: '#31325F',
            lineHeight: '40px',
            fontWeight: 300,
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSize: '18px',
            '::placeholder': {
              color: '#666'
            }
          }
        }
      });


      setTimeout(() => {
        this.card.addEventListener('change', (event) => {
          // event.brand=> "mastercard"
          // event.complete=> true|false
          // event.elementType=> "card"
          // event.empty=> false
          // event.error=> undefined
          // event.value=> {postalCode: ""}
          this.isValid = event.complete;
        });

        this.card.mount('#card-element');
      }, 100);
    });

  }

  isSelectedPayment(payment) {
    return this.selected && this.selected.alias === payment.alias;
  }

  onDelete(payment: UserCard) {
    this.isLoading = true;
    this.$user.deletePaymentMethod(payment.alias, this.user.id).subscribe(
      user => {
        this.onEmit(<PaymentEvent>({deleted: user.payments}));
      },
      err => this.onEmit(<PaymentEvent>({error: new Error(err.error)}))
    );
  }

  onEmit(result: PaymentEvent) {
    this.isLoading = false;
    this.updated.emit(result);
  }

  onPayment() {
    this.isLoading = true;
    const name = this.stripe.get('name').value;
    this.$stripe
      .createToken(this.card, { name })
      .subscribe((result: TokenResult) => {
        // id: string;
        // object: 'token';
        // bank_account?: {
        //   id: string;
        //   country: string;
        //   currency: string;
        //   fingerprint: string;
        //   object: 'bank_account';
        //   account_holder_name: string;
        //   account_holder_type: 'individual' | 'company';
        //   bank_name: string;
        //   last4: string;
        //   routing_number: string;
        //   status:
        //     | 'new'
        //     | 'validated'
        //     | 'verified'
        //     | 'verification_failded'
        //     | 'errored';
        // };
        // card?: {
        //   id: string;
        //   country: string;
        //   currency: string;
        //   fingerprint: string;
        //   object: 'card';
        //   address_city: string;
        //   address_country: string;
        //   address_line1: string;
        //   address_line1_check: FieldCheck;
        //   address_line2: string;
        //   address_state: string;
        //   address_zip: string;
        //   address_zip_check: FieldCheck;
        //   brand: string;
        //   cvc_check: FieldCheck;
        //   dynamic_last4: string;
        //   exp_month: number;
        //   exp_year: number;
        //   funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
        //   last4: string;
        //   metadata: { [key: string]: any };
        //   name: string;
        //   tokenization_method: 'apple_pay' | 'android_pay';
        // };
        // client_ip: string;
        // livemode: boolean;
        // type: 'card' | 'bank_account';
        // used: boolean;
        if (result.token) {
          // Use the token to create a charge or a customer
          // https://stripe.com/docs/charges
          const card: UserCard = new UserCard({
            id: result.token.id,
            name: result.token.card.name,
            issuer: result.token.card.brand.toLowerCase(),
            number: 'xxxx-xxxx-xxxx-' + result.token.card.last4,
            expiry: result.token.card.exp_month + '/' + result.token.card.exp_year
          });

          this.$user.addPaymentMethod(card, this.user.id).subscribe(
            user => this.onEmit(<PaymentEvent>({card: card})),
            err => this.onEmit(<PaymentEvent>({error: new Error(err.error)}))
          );

        } else if (result.error) {
          //
          // Error creating the token
          this.onEmit(<PaymentEvent>{error: result.error});
        }
      });
  }

  setPaymentMethod(payment) {
    this.selected = payment;
  }

}
