import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CartService, CartSubscription, Config, Hub, User, UserAddress, UserCard } from 'kng2-core';
import { i18n } from 'src/app/common';
import { KngPaymentComponent } from 'src/app/common/kng-payment/kng-user-payment.component';
import { CheckoutMode } from '../checkout-session';

@Component({
  selector: 'kng-checkout-review',
  templateUrl: './kng-checkout-review.component.html',
  styleUrls: ['./kng-checkout-review.component.scss']
})
export class KngCheckoutReviewComponent implements OnChanges {
  @Input() config: Config;
  @Input() user: User;
  @Input() address: UserAddress;
  @Input() addresses: UserAddress[] = [];
  @Input() depositAddresses: UserAddress[] = [];
  @Input() payment: UserCard;
  @Input() payments: UserCard[] = [];
  @Input() phone: string;
  @Input() shippingDay: Date;
  @Input() shippingTime: string;
  @Input() shippingNote: string;
  @Input() isLastMinuteShipping = false;
  @Input() isAddressEditing = false;
  @Input() isPaymentEditing = false;
  @Input() computeShippingAmount: (address: UserAddress) => number;
  @Input() mode: CheckoutMode = 'order';
  @Input() hasPendingSubscription = false;
  @Input() subscriptionContract: CartSubscription | null = null;
  @Input() hub: Hub;

  @Output() addressSelected = new EventEmitter<UserAddress>();
  @Output() addressSaved = new EventEmitter<UserAddress|undefined>();
  @Output() addAddressRequested = new EventEmitter<void>();
  @Output() shippingNoteChange = new EventEmitter<string>();
  @Output() paymentSelected = new EventEmitter<UserCard>();
  @Output() paymentSaved = new EventEmitter<any>();
  @Output() addPaymentRequested = new EventEmitter<void>();

  isTimeEditing = false;
  private addressChoices: boolean | null = null;
  private paymentChoices: boolean | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isAddressEditing) {
      this.addressChoices = null;
    }
    if (changes.isPaymentEditing) {
      this.paymentChoices = null;
    }
  }

  get showAddressChoices() {
    return this.addressChoices === null ? this.isAddressEditing : this.addressChoices;
  }

  get showPaymentChoices() {
    return this.paymentChoices === null ? this.isPaymentEditing : this.paymentChoices;
  }

  toggleAddressChoices() {
    this.addressChoices = !this.showAddressChoices;
  }

  togglePaymentChoices() {
    this.paymentChoices = !this.showPaymentChoices;
  }

  chooseAddress(option: UserAddress) {
    this.addressChoices = false;
    this.addressSelected.emit(option);
  }

  choosePayment(option: UserCard) {
    this.paymentChoices = false;
    this.paymentSelected.emit(option);
  }

  readonly i18n: any = {
    fr: {
      review_title: 'Vérification',
      review_delivery: 'Livraison',
      review_payment: 'Paiement',
      review_change: 'Changer',
      review_last_minute: 'Aujourd\'hui',
      review_payment_note: 'Facturé le jour de livraison',
      review_delivery_note_placeholder: 'Code, étage, instruction...',
      review_delivery_policy: 'Si vous n\'êtes pas présent lors de la livraison et sans indication contraire de votre part, les produits seront déposés devant votre porte.',
      review_subscription_rhythm: 'Rythme',
      review_subscription_time: 'Créneau',
      review_subscription_time_locked: 'La livraison est programmée à',
      review_subscription_no_twint: 'TWINT n\'est pas disponible pour les abonnements. Utilisez une carte.'
    },
    en: {
      review_title: 'Review',
      review_delivery: 'Delivery',
      review_payment: 'Payment',
      review_change: 'Change',
      review_last_minute: 'Today',
      review_payment_note: 'Charged on delivery day',
      review_delivery_note_placeholder: 'Code, floor, instruction...',
      review_delivery_policy: 'If you are not present at delivery and unless instructed otherwise, the products will be left at your door.',
      review_subscription_rhythm: 'Schedule',
      review_subscription_time: 'Time slot',
      review_subscription_time_locked: 'Delivery is scheduled for',
      review_subscription_no_twint: 'TWINT is not available for subscriptions. Use a card.'
    }
  };

  constructor(
    private $i18n: i18n,
    private $cart: CartService
  ) {}

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

  get hasUserAddresses() {
    return !!this.addresses?.length;
  }

  get hasOnlyTwintPayment() {
    const payments = this.payments || [];
    return payments.length === 1 && payments[0]?.issuer === 'twint';
  }

  isSelectedAddress(address: UserAddress) {
    if (!address || !this.address) {
      return false;
    }
    return (address.streetAdress || address.streetAddress) === (this.address.streetAdress || this.address.streetAddress);
  }

  get otherAddresses() {
    return (this.addresses || []).filter(option => !this.isSelectedAddress(option));
  }

  get otherDepositAddresses() {
    return (this.depositAddresses || []).filter(option => !this.isSelectedAddress(option));
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

  get otherPayments() {
    return (this.payments || []).filter(option => !this.isSelectedPayment(option));
  }

  isPaymentInvalid(payment: UserCard) {
    return !!payment && typeof payment.isValid === 'function' && !payment.isValid();
  }

  get isSubscription() {
    return this.mode === 'subscription';
  }

  get showSubscriptionTimes() {
    return this.isSubscription && !this.hasPendingSubscription;
  }

  get subscriptionTimes() {
    const prices = this.config?.shared?.shipping?.pricetime || {};
    const labels = this.config?.shared?.hub?.shippingtimes || {};
    return Object.keys(labels)
      .filter(key => Number(key) > 0 && String(labels[key] ?? '').trim() !== '')
      .sort((a, b) => Number(a) - Number(b))
      .map(key => ({
        key,
        label: String(labels[key]).trim(),
        price: Number(prices[key]) || 0
      }));
  }

  get selectedSubscriptionTime() {
    return Number(this.$cart.subscriptionGetParams()?.time) || 16;
  }

  get selectedSubscriptionPrice() {
    const prices = this.config?.shared?.shipping?.pricetime || {};
    return Number(prices[this.selectedSubscriptionTime]) || 0;
  }

  toggleTimeEditing() {
    this.isTimeEditing = !this.isTimeEditing;
  }

  subscriptionTimeLabel(time: number|string) {
    const labels = this.config?.shared?.hub?.shippingtimes || {};
    return labels[time] || `${time}h`;
  }

  isSelectedSubscriptionTime(key: string) {
    return Number(key) === this.selectedSubscriptionTime;
  }

  selectSubscriptionTime(key: string) {
    const currentParams = this.$cart.subscriptionGetParams();
    if (!currentParams) {
      return;
    }
    this.$cart.subscriptionSetParams({
      ...currentParams,
      time: Number(key)
    });
    this.isTimeEditing = false;
  }
}
