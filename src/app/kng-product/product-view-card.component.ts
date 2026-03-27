import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { ProductComponent } from './product.component';

@Component({
  selector: 'article[kng-product-view-card]',
  templateUrl: './product-view-card.component.html',
  styleUrls: ['./product-view-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'product-card-view-card'
  }
})
export class ProductViewCardComponent {
  @Input() productCtrl: ProductComponent;

  @HostBinding('class.incart') get incart() {
    return !!this.productCtrl?.currentDisplayQuantity;
  }

  @HostBinding('class.insubs') get insubs() {
    return !!this.productCtrl?.cartSubsQuantity;
  }

  @HostBinding('class.noavailable') get noavailable() {
    return !this.productCtrl?.isAvailableForOrder;
  }

  @HostBinding('class.noinstock') get noinstock() {
    return !this.productCtrl?.product?.pricing?.stock;
  }

  @HostBinding('class.timelimited') get timelimited() {
    return !!this.productCtrl?.getTimelimitForOrder;
  }

  @HostBinding('class.timelimit') get timelimit() {
    return !!this.productCtrl?.isOutOfTimelimitForOrder;
  }
}
