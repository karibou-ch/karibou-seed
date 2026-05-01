import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'kng2-core';
import { i18n } from 'src/app/common';

@Component({
  selector: 'kng-checkout-confirmation',
  templateUrl: './kng-checkout-confirmation.component.html',
  styleUrls: ['./kng-checkout-confirmation.component.scss']
})
export class KngCheckoutConfirmationComponent {
  @Input() billNote: string;
  @Input() cgAccepted = false;
  @Input() store: string;
  @Input() user: User;
  @Input() useCartSubscriptionView = false;
  @Input() isFinalizeDisabled = true;
  @Input() isRunning = false;
  @Input() errorMessage: string|null = null;

  @Output() billNoteChange = new EventEmitter<string>();
  @Output() cgAcceptedChange = new EventEmitter<boolean>();
  @Output() orderRequested = new EventEmitter<void>();
  @Output() subscriptionRequested = new EventEmitter<void>();

  readonly i18n: any = {
    fr: {
      cart_info_bill_note:'Annoter la facture',
      cart_cg: 'J\'accepte les conditions générales de vente',
      cart_cg_middle:' et je confirme que ',
      cart_cg_18: 'j\'ai l\'âge légal pour l\'achat d\'alcool',
      cart_order: 'Enregistrer la commande',
      cart_subscription: 'Confirmer l\'abonnement'
    },
    en: {
      cart_info_bill_note:'Annotate the invoice',
      cart_cg: 'I agree to the general selling conditions',
      cart_cg_middle:' and I confirm that ',
      cart_cg_18: 'I am of legal age to purchase alcohol',
      cart_order: 'Order now ',
      cart_subscription: 'Confirm Subscription'
    }
  };

  constructor(private $i18n: i18n) {}

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.i18n[this.locale] || this.i18n.fr;
  }
}
