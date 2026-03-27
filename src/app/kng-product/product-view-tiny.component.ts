import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { ProductComponent } from './product.component';

@Component({
  selector: 'div[kng-product-view-tiny]',
  templateUrl: './product-view-tiny.component.html',
  styleUrls: ['./product-tiny.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'thumbnails'
  }
})
export class ProductViewTinyComponent {
  @Input() productCtrl: ProductComponent;

  @HostBinding('class.noavailable') get noavailable() {
    return !this.productCtrl?.product?.isAvailableForOrder();
  }

  @HostBinding('class.noinstock') get noinstock() {
    return !this.productCtrl?.product?.pricing?.stock;
  }
}
