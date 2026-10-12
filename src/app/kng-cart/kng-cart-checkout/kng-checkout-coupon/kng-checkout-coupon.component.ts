import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserCouponCredit } from 'kng2-core';
import { i18n } from 'src/app/common';

@Component({
  selector: 'kng-checkout-coupon',
  templateUrl: './kng-checkout-coupon.component.html',
  styleUrls: ['./kng-checkout-coupon.component.scss']
})
export class KngCheckoutCouponComponent {
  @Input() couponCode: string;
  @Input() couponCredit: UserCouponCredit|null = null;
  @Input() couponError: string|null = null;
  @Input() isRunning = false;

  @Output() couponCodeChange = new EventEmitter<string>();
  @Output() couponChanged = new EventEmitter<void>();
  @Output() applyCoupon = new EventEmitter<void>();

  readonly i18n: any = {
    fr: {
      cart_coupon_title:'Bon de réduction',
      cart_coupon_placeholder:'code coupon',
      cart_coupon_apply:'Appliquer',
      cart_coupon_applied:'Bon de réduction appliqué'
    },
    en: {
      cart_coupon_title:'Discount coupon',
      cart_coupon_placeholder:'coupon code',
      cart_coupon_apply:'Apply',
      cart_coupon_applied:'Discount applied'
    }
  };

  constructor(private $i18n: i18n) {}

  get locale() {
    return this.$i18n.locale;
  }

  get label() {
    return this.i18n[this.locale] || this.i18n.fr;
  }

  onCouponCodeChange(code: string) {
    this.couponCodeChange.emit(code);
    this.couponChanged.emit();
  }
}
