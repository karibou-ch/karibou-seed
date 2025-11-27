import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CartItem, CartService, Config, Hub, User, UserAddress, UserCard, CalendarService } from 'kng2-core';
import { i18n } from '../../common';
import { KngPaymentComponent } from '../../common/kng-payment/kng-user-payment.component';

export type InvoiceType = 'cart' | 'subscription';

export interface InvoiceData {
  items: CartItem[];
  address: UserAddress;
  payment: UserCard;
  contract?: any;
  updateItems?: any[];
  subscriptionParams?: any;
}

@Component({
  selector: 'kng-cart-invoice',
  templateUrl: './kng-cart-invoice.component.html',
  styleUrls: ['./kng-cart-invoice.component.scss']
})
export class KngCartInvoiceComponent implements OnInit, OnChanges {

  @Input() type: InvoiceType = 'cart';
  @Input() user: User;
  @Input() data: InvoiceData;
  @Input() config: Config;
  @Input() hub: Hub;
  @Input() i18n: any;

  // Computed values (calculated in ngOnChanges)
  locale: string = 'fr';
  itemsAmount: number = 0;
  currentFeesAmount: number = 0;
  currentShippingFees: number = 0;
  totalDiscount: number = 0;
  currentTotalMinusBalance: number = 0;
  currentTotalUserBalance: number = 0;
  amountReserved: number = 1.11;
  contractTotal: number = 0;
  currentTotalSubscription: number = 0;
  displayShippingDay: Date;
  currentShippingTime: string;
  isLastMinuteShipping: boolean = false;
  shippingDiscount: string = '';
  hasUpdateContract: any = null;
  hasShippingReductionMultipleOrder: boolean = false;
  isCartDeposit: boolean = false;

  doToggleFees: boolean = false;

  constructor(
    private $cart: CartService,
    private $calendar: CalendarService,
    private $i18n: i18n
  ) {}

  get issuer() {
    return KngPaymentComponent.issuer;
  }

  get label() {
    return this.i18n?.[this.locale] || {};
  }

  get glabel() {
    return this.$i18n.label();
  }

  get label_cart_info_subtotal(): string {
    const feesName = this.currentFeesName;
    return (this.label.cart_info_subtotal || '').replace('__FEES__', feesName);
  }

  get label_cart_info_subtotal_fees(): string {
    const feesName = this.currentFeesName;
    return (this.label.cart_info_subtotal_fees || '').replace('__FEES__', feesName);
  }

  get last_minute_label(): string {
    return this.locale === 'fr' ? 'Aujourd\'hui' : 'Today';
  }

  ngOnInit(): void {
    this.locale = this.$i18n.locale || 'fr';
    this.computeAll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['data'] || changes['user'] || changes['type'] || changes['i18n']) {
      this.locale = this.$i18n.locale || 'fr';
      this.computeAll();
    }
  }

  private computeAll(): void {
    if (!this.data || !this.config || !this.hub) {
      return;
    }

    this.amountReserved = this.config?.shared?.order?.reservedAmount || 1.11;
    this.itemsAmount = this.computeItemsAmount();
    this.currentFeesAmount = this.computeServiceFees();
    this.currentShippingFees = this.computeShippingFees();
    this.totalDiscount = this.computeTotalDiscount();
    this.contractTotal = this.computeContractTotal();
    this.currentTotalUserBalance = this.computeTotalUserBalance();
    this.currentTotalMinusBalance = this.computeTotalMinusBalance();
    this.currentTotalSubscription = this.computeTotalSubscription();
    this.displayShippingDay = this.computeDisplayShippingDay();
    this.currentShippingTime = this.computeShippingTime();
    this.isLastMinuteShipping = this.computeIsLastMinuteShipping();
    this.shippingDiscount = this.computeShippingDiscount();
    this.hasUpdateContract = this.computeHasUpdateContract();
    this.hasShippingReductionMultipleOrder = this.computeHasShippingReduction();
    this.isCartDeposit = this.computeIsCartDeposit();
  }

  private computeItemsAmount(): number {
    if (!this.data?.items?.length) return 0;
    const ctx = { forSubscription: this.isSubscription, hub: this.hub.slug };
    return this.$cart.subTotal(ctx);
  }

  private computeServiceFees(): number {
    if (!this.hub) return 0;
    const ctx = { forSubscription: this.isSubscription, hub: this.hub.slug };
    return this.$cart.totalHubFees(ctx);
  }

  private computeShippingFees(): number {
    if (!this.hub || !this.data?.address) return 0;
    const ctx = { forSubscription: this.isSubscription, hub: this.hub.slug, address: this.data.address };
    return this.$cart.computeShippingFees(ctx);
  }

  private computeTotalDiscount(): number {
    if (!this.hub) return 0;
    return this.$cart.getTotalDiscount(this.hub.slug);
  }

  private computeContractTotal(): number {
    if (!this.data?.contract) return 0;
    if (this.data.updateItems?.length) {
      return this.data.updateItems.reduce((sum, item) => (item.fees * item.quantity) + sum, 0);
    }
    return this.data.contract.items.reduce((sum, item) => (item.fees * item.quantity) + sum, 0);
  }

  private computeTotalUserBalance(): number {
    const userBalance = this.user?.balance > 0 ? this.user.balance : 0;
    const total = this.itemsAmount + this.currentFeesAmount + this.currentShippingFees - this.totalDiscount;
    return Math.min(total, userBalance);
  }

  private computeTotalMinusBalance(): number {
    const userBalance = this.user?.balance > 0 ? this.user.balance : 0;
    const total = this.itemsAmount + this.currentFeesAmount + this.currentShippingFees - this.totalDiscount;
    return Math.max(total - userBalance, 0);
  }

  private computeTotalSubscription(): number {
    return this.itemsAmount + this.currentFeesAmount + this.currentShippingFees - this.totalDiscount;
  }

  private computeDisplayShippingDay(): Date {
    if (this.isSubscription && this.data?.subscriptionParams) {
      const oneWeek = this.$calendar.getValidShippingDatesForHub(this.hub, { days: 7 });
      const foundDate = oneWeek.find(date => date.getDay() === this.data.subscriptionParams.dayOfWeek);
      return foundDate || oneWeek[0] || this.$calendar.nextShippingDay(this.hub, this.user);
    }
    return this.$cart.getCurrentShippingDay();
  }

  private computeShippingTime(): string {
    const shippingDay = this.displayShippingDay;
    const fallbackHours = this.$calendar.getDefaultTimeByDay(shippingDay, this.hub) || 16;
    const selectedHours = this.isSubscription ? fallbackHours : (this.$cart.getCurrentShippingTime() || fallbackHours);
    const shippingHours = (this.isCartDeposit ? '0' : selectedHours.toString());
    return this.config.shared.hub.shippingtimes?.[shippingHours] || `${selectedHours}h`;
  }

  private computeIsLastMinuteShipping(): boolean {
    return !this.isSubscription && this.$cart.isCurrentShippingLastMinute();
  }

  private computeShippingDiscount(): string {
    if (!this.hub || !this.data?.address || !this.config?.shared?.shipping) {
      return '';
    }

    const ctx = { forSubscription: this.isSubscription, hub: this.hub.slug, address: this.data.address };
    const { price } = this.$cart.estimateShippingFeesWithoutReduction(ctx);
    const { multiple, discountA, discountB, deposit } = this.$cart.hasShippingReduction(ctx);

    const discountLabel = this.label.cart_info_shipping_discount || '';
    const shipping = this.config.shared.shipping;

    // Grouped discount or deposit
    if (multiple || deposit) {
      return '';
    }

    // Maximum discount
    if (discountB) {
      return this.label.cart_info_shipping_applied || '';
    }

    // Minimum discount
    if (discountA) {
      const discount = Math.max(price - (shipping.priceB || 0), 0).toFixed(2);
      return discountLabel.replace('_AMOUNT_', shipping.discountB || '').replace('_DISCOUNT_', discount);
    }

    // Missing amount
    const discount = Math.max(price - (shipping.priceA || 0), 0).toFixed(2);
    return discountLabel.replace('_AMOUNT_', shipping.discountA || '').replace('_DISCOUNT_', discount);
  }

  private computeHasUpdateContract(): any {
    if (!this.data?.contract || !this.data?.subscriptionParams) return null;
    const contract = this.data.contract;
    const params = this.data.subscriptionParams;
    if (contract.frequency === params.frequency &&
        contract.dayOfWeek === params.dayOfWeek &&
        contract.status !== 'canceled') {
      return contract;
    }
    return null;
  }

  private computeHasShippingReduction(): boolean {
    if (this.data?.contract || !this.data?.address) {
      return false;
    }
    return this.$cart.hasShippingReductionMultipleOrder(this.data.address);
  }

  private computeIsCartDeposit(): boolean {
    if (!this.config?.shared?.hub?.deposits || !this.data?.address) return false;
    const address = this.data.address;
    return this.config.shared.hub.deposits.some(deposit => {
      return UserAddress.isEqual(address, deposit) && deposit.fees >= 0;
    });
  }

  get currentFeesName(): string {
    if (!this.hub) return '0%';
    const gateway = this.$cart.getCurrentGateway();
    const fees = this.hub.serviceFees + gateway.fees;
    return Math.round(fees * 100) + '%';
  }

  get isSubscription(): boolean {
    return this.type === 'subscription';
  }

  get isCart(): boolean {
    return this.type === 'cart';
  }
}

