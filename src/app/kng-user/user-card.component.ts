import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User,
         UserCard,
         UserService,
         Config} from 'kng2-core';

import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { StripeService } from 'ngx-stripe';
import { i18n } from '../common';
import { StripeCardElement, StripeCardElementOptions, StripeElements, StripeElementsOptions } from '@stripe/stripe-js';


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
      stripe_issue: 'Votre banque à indiqué le problème suivant',
      title_header: 'Vos méthodes de paiement',
      title_edit: 'Sélectionner une méthode pour l\'éditer',
      action_add: 'Ajouter ou modifier une méthode de paiement',
      action_create_ok: 'Votre méthode de paiement a été enregistrée',
    },
    en: {
      stripe_issue: 'Your bank indicate the following issue',
      title_header: 'Your payment methods',
      title_edit: 'Select payment method you want to edit',
      action_add: 'Add or update a payment method',
      action_create_ok: 'Your payment method has been saved',
    }
  };

  displayCardError: string;
  defaultUser: User = new User();
  isValid: boolean;

  //
  // payment
  stripe: FormGroup;
  elements: StripeElements;
  selected: UserCard;
  card: StripeCardElement;
  paymentSecret: any;
  isLoading: boolean;

  // optional parameters
  elementsOptions: StripeElementsOptions = {
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
      // console.log('--- DB USER PAYMENTS 1',this.user.payments);
      this.$user.checkPaymentMethod(this.user, 'stripe').subscribe(user => {
        this.user = user;
        // console.log('--- DB USER PAYMENTS 2',user.context);
      });
    }

    this.$stripe.elements(this.elementsOptions).subscribe(elements => {
      this.elements = elements;

      // Only mount the element the first time
      if (this.card) {
        return;
      }
      const cardOptions: StripeCardElementOptions = {

        hidePostalCode: true,
        style: {
          base: {
            iconColor: '#444',
            color: '#31325F',
            lineHeight: '40px',
            fontWeight: "300",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSize: '18px',
            '::placeholder': {
              color: '#666'
            }
          }
        }
      };

      this.card = this.elements.create("card", cardOptions);


      setTimeout(() => {
        this.card.on('change', (event) => {
          // event.brand=> "mastercard"
          // event.complete=> true|false
          // event.elementType=> "card"
          // event.empty=> false
          // event.error=> undefined
          // event.value=> {postalCode: ""}
          // console.log('--- DEBUG event',event);
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
        //
        // do not exit on delete payment
        // this.onEmit(<PaymentEvent>({deleted: user.payments}));
        this.isLoading = false;
      },
      result => {
        this.displayCardError = result.message || result.error.message;
        this.isLoading = false;
      }
    );
  }

  onEmit(result: PaymentEvent) {
    this.isLoading = false;
    this.updated.emit(result);
  }

  onPayment() {
    const name = this.stripe.get('name').value;
    let postal_code;
    let city;
    let country = 'CH';
    //
    // COLLECT USER DATA FOR STRIPE
    // - card.postal_code
    // - card.city
    if (this.user.addresses && this.user.addresses.length) {
      const names = name.split(' ');
      const address = this.user.addresses.find(add => {
        return names.some(name => (add.name.indexOf(name) > -1));
      }) || this.user.addresses[0];


      if (address){
        postal_code = address.postalCode;
        city = address.region;
      }

    }

    this.isLoading = true;
    const paymentMethod = {
      type: 'card',
      card: this.card,
      billing_details: { name, address: { postal_code, city, country} }
    };
    const paymentSecret = this.user.context.intent;
    this.$stripe.confirmCardSetup(paymentSecret.client_secret, { payment_method: paymentMethod}).subscribe((result: any) => {
        // console.log('---- DEBUG intent', result);

        this.displayCardError = null;
        const setupIntent = result.setupIntent;
        if (setupIntent && setupIntent.payment_method) {
          // Use the token to create a charge or a customer
          // https://stripe.com/docs/charges
          const card = {
            id: setupIntent.payment_method,
            name: name,
            issuer: 'stripe',
          } as UserCard;
          const force_replace = true;
          this.$user.addPaymentMethod(card, this.user.id, force_replace).subscribe(
            user => {
              this.isLoading = false;
              this.onEmit(<PaymentEvent>({card: card}));
            },
            err => {
              this.displayCardError = err.error || err.message;
              this.isLoading = false;
            }
          );

        } else if (result.error) {
          //
          // Error creating the token
          this.displayCardError = result.error.message;

          //
          // request a new payment intent
          this.$user.checkPaymentMethod(this.user, 'stripe').subscribe(user => {
            this.isLoading = false;
            this.user = user;
          });
        }
      });
  }

  setPaymentMethod(payment) {
    this.selected = payment;
  }

}
