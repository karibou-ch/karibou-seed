import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserAddress, UserCard } from 'kng2-core';
import { i18n } from 'src/app/common';
import { KngPaymentComponent } from 'src/app/common/kng-payment/kng-user-payment.component';

@Component({
  selector: 'kng-checkout-review',
  templateUrl: './kng-checkout-review.component.html',
  styleUrls: ['./kng-checkout-review.component.scss']
})
export class KngCheckoutReviewComponent {
  @Input() address: UserAddress;
  @Input() addresses: UserAddress[] = [];
  @Input() depositAddresses: UserAddress[] = [];
  @Input() payment: UserCard;
  @Input() payments: UserCard[] = [];
  @Input() shippingDay: Date;
  @Input() shippingTime: string;
  @Input() shippingNote: string;
  @Input() isLastMinuteShipping = false;
  @Input() isAddressEditing = false;
  @Input() isAddressDeposit = false;
  @Input() isPaymentEditing = false;
  @Input() computeShippingAmount: (address: UserAddress) => number;

  @Output() editAddress = new EventEmitter<void>();
  @Output() addressSelected = new EventEmitter<UserAddress>();
  @Output() addAddressRequested = new EventEmitter<void>();
  @Output() shippingNoteChange = new EventEmitter<string>();
  @Output() editPayment = new EventEmitter<void>();
  @Output() paymentSelected = new EventEmitter<UserCard>();
  @Output() addPaymentRequested = new EventEmitter<void>();

  readonly i18n: any = {
    fr: {
      review_title: 'Vérification',
      review_delivery: 'Livraison',
      review_payment: 'Paiement',
      review_change: 'Changer',
      review_last_minute: 'Aujourd\'hui',
      review_payment_note: 'Facturé le jour de livraison',
      review_delivery_note_placeholder: 'Code, étage, instruction...',
      review_delivery_policy: 'Si vous n\'êtes pas présent lors de la livraison et sans indication contraire de votre part, les produits seront déposés devant votre porte.'
    },
    en: {
      review_title: 'Review',
      review_delivery: 'Delivery',
      review_payment: 'Payment',
      review_change: 'Change',
      review_last_minute: 'Today',
      review_payment_note: 'Charged on delivery day',
      review_delivery_note_placeholder: 'Code, floor, instruction...',
      review_delivery_policy: 'If you are not present at delivery and unless instructed otherwise, the products will be left at your door.'
    }
  };

  constructor(private $i18n: i18n) {}

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.i18n[this.locale] || this.i18n.fr;
  }

  get glabel() {
    return this.$i18n.label();
  }

  get issuer() {
    return KngPaymentComponent.issuer;
  }

  get paymentName() {
    return this.paymentDisplayName(this.payment);
  }

  isSelectedAddress(address: UserAddress) {
    if (!address || !this.address) {
      return false;
    }
    return (address.streetAdress || address.streetAddress) === (this.address.streetAdress || this.address.streetAddress);
  }

  shippingAmount(address: UserAddress) {
    if (this.computeShippingAmount) {
      return this.computeShippingAmount(address);
    }
    return (address as any)?.fees || 0;
  }

  paymentDisplayName(payment: UserCard) {
    if (!payment?.issuer || !this.issuer[payment.issuer]) {
      return '';
    }
    return this.issuer[payment.issuer].label + (payment.last4 ? ' **' + payment.last4 : '');
  }

  paymentExpiry(payment: UserCard) {
    if (payment?.issuer === 'twint') {
      return null;
    }
    return payment && typeof payment.expiryToDate === 'function' ? payment.expiryToDate() : null;
  }

  isSelectedPayment(payment: UserCard) {
    return !!payment && !!this.payment && payment.alias === this.payment.alias;
  }

  isPaymentInvalid(payment: UserCard) {
    return !!payment && typeof payment.isValid === 'function' && !payment.isValid();
  }
}
