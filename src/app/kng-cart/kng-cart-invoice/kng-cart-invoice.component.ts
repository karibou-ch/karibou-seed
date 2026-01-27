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
    this.totalDiscount = this.computeTotalDiscount();
    this.contractTotal = this.computeContractTotal();

    //
    // hasUpdateContract must be computed BEFORE shipping for subscription updates
    this.hasUpdateContract = this.computeHasUpdateContract();

    //
    // Shipping: use different calculation for subscription updates vs normal orders
    if (this.isSubscription && this.hasUpdateContract) {
      this.currentShippingFees = this.computeShippingFeesForSubscriptionUpdate();
    } else {
      this.currentShippingFees = this.computeShippingFees();
    }

    this.currentTotalUserBalance = this.computeTotalUserBalance();
    this.currentTotalMinusBalance = this.computeTotalMinusBalance();
    this.currentTotalSubscription = this.computeTotalSubscription();
    this.displayShippingDay = this.computeDisplayShippingDay();
    this.currentShippingTime = this.computeShippingTime();
    this.isLastMinuteShipping = this.computeIsLastMinuteShipping();
    this.shippingDiscount = this.computeShippingDiscount();
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
    const baseFees = this.$cart.computeShippingFees(ctx);

    //
    // For subscriptions (not update): adjust time price from subscriptionParams.time
    // cart.computeShippingFees uses cache.currentShippingTime, but subscriptions store time in subscriptionParams
    if (this.isSubscription && this.data?.subscriptionParams?.time !== undefined) {
      const shipping = this.config?.shared?.shipping;
      if (shipping?.pricetime) {
        const cacheTimePrice = this.$cart.getCurrentShippingTimePrice() || 0;
        const subscriptionTimePrice = shipping.pricetime[this.data.subscriptionParams.time] || 0;
        //
        // Adjust: remove cache time price, add subscription time price
        return baseFees - cacheTimePrice + subscriptionTimePrice;
      }
    }

    return baseFees;
  }

  /**
   * Compute shipping fees for subscription UPDATE only.
   * Uses combined total (contract items + new items) to determine discount tier.
   * This ensures shipping is calculated on the full subscription amount.
   */
  private computeShippingFeesForSubscriptionUpdate(): number {
    if (!this.hub || !this.data?.address) return 0;

    const ctx = { forSubscription: true, hub: this.hub.slug, address: this.data.address };

    //
    // Get base price from address (deposit, plan, or postal code)
    // Note: estimateShippingFeesWithoutReduction uses cache.currentShippingTime
    // For subscriptions, we need to use subscriptionParams.time instead
    const { price: basePrice, status } = this.$cart.estimateShippingFeesWithoutReduction(ctx);

    //
    // For deposit or plan, return as-is (no discount logic, no time price)
    if (status === 'deposit' || status === 'plan') {
      return basePrice;
    }

    //
    // Adjust price for subscription time selection
    // basePrice already includes cache.currentShippingTime, we need to replace with subscriptionParams.time
    const shipping = this.config?.shared?.shipping;
    if (!shipping) return basePrice;

    const cacheTimePrice = this.$cart.getCurrentShippingTimePrice() || 0;
    const subscriptionTime = this.data?.subscriptionParams?.time;
    const subscriptionTimePrice = subscriptionTime ? (shipping.pricetime?.[subscriptionTime] || 0) : 0;

    //
    // Adjust: remove cache time price, add subscription time price
    let adjustedBasePrice = basePrice - cacheTimePrice + subscriptionTimePrice;

    //
    // Calculate combined total: contract items + new items
    const combinedTotal = this.contractTotal + this.itemsAmount;

    //
    // Apply discount tiers based on combined total
    let finalPrice = adjustedBasePrice;
    if (shipping.discountB && combinedTotal >= shipping.discountB) {
      finalPrice = Math.max(adjustedBasePrice - (shipping.priceB || 0), 0);
    } else if (shipping.discountA && combinedTotal >= shipping.discountA) {
      finalPrice = Math.max(adjustedBasePrice - (shipping.priceA || 0), 0);
    }

    return finalPrice;
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
    // Note: itemsAmount (from subTotal) already includes service fees
    const total = this.itemsAmount + this.currentShippingFees - this.totalDiscount;
    return Math.min(total, userBalance);
  }

  private computeTotalMinusBalance(): number {
    const userBalance = this.user?.balance > 0 ? this.user.balance : 0;
    // Note: itemsAmount (from subTotal) already includes service fees
    const total = this.itemsAmount + this.currentShippingFees - this.totalDiscount;
    return Math.max(total - userBalance, 0);
  }

  private computeTotalSubscription(): number {
    // Note: itemsAmount (from subTotal) already includes service fees
    //
    // For subscription UPDATE: total = contract items + new items + shipping - discount
    if (this.hasUpdateContract) {
      return this.contractTotal + this.itemsAmount + this.currentShippingFees - this.totalDiscount;
    }
    return this.itemsAmount + this.currentShippingFees - this.totalDiscount;
  }

  private computeDisplayShippingDay(): Date {
    if (this.isSubscription && this.data?.subscriptionParams) {
      const oneWeek = this.$calendar.getValidShippingDatesForHub(this.hub, { days: 7 });

      // ✅ CORRECTION BUG TIMEZONE: Utiliser toHubTime pour comparer dans timezone Hub
      // au lieu de date.getDay() qui utilise la timezone locale du navigateur
      const foundDate = oneWeek.find(date => {
        const dateHub = this.$calendar.toHubTime(date, this.hub);
        return dateHub.getDay() === this.data.subscriptionParams.dayOfWeek;
      });
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
    const { price, status } = this.$cart.estimateShippingFeesWithoutReduction(ctx);

    //
    // No discount info for deposit or plan
    if (status === 'deposit' || status === 'plan') {
      return '';
    }

    const discountLabel = this.label.cart_info_shipping_discount || '';
    const shipping = this.config.shared.shipping;

    //
    // For subscription UPDATE: use combined total for discount calculation
    const totalForDiscount = (this.isSubscription && this.hasUpdateContract)
      ? (this.contractTotal + this.itemsAmount)
      : this.itemsAmount;

    //
    // Check for grouped discount (normal orders only)
    if (!this.isSubscription) {
      const { multiple, deposit } = this.$cart.hasShippingReduction(ctx);
      if (multiple || deposit) {
        return '';
      }
    }

    //
    // Maximum discount applied
    if (shipping.discountB && totalForDiscount >= shipping.discountB) {
      return this.label.cart_info_shipping_applied || '';
    }

    //
    // Minimum discount applied - show how to get max discount
    if (shipping.discountA && totalForDiscount >= shipping.discountA) {
      const discount = Math.max(price - (shipping.priceB || 0), 0).toFixed(2);
      return discountLabel.replace('_AMOUNT_', shipping.discountB || '').replace('_DISCOUNT_', discount);
    }

    //
    // No discount yet - show how to get first discount
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

