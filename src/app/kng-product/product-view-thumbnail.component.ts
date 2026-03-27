import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { ProductComponent } from './product.component';

@Component({
  selector: 'article[kng-product-view-thumbnail]',
  templateUrl: './product-view-thumbnail.component.html',
  styleUrls: ['./product-view-thumbnail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'product-card-view-thumbnail card-skeleton'
  }
})
export class ProductViewThumbnailComponent {
  @Input() productCtrl: ProductComponent;

  @HostBinding('class.large') get large() {
    return this.productCtrl?.large;
  }

  @HostBinding('class.incart') get incart() {
    return !!this.productCtrl?.currentDisplayQuantity;
  }

  @HostBinding('class.insubs') get insubs() {
    return !!this.productCtrl?.cartSubsQuantity;
  }

  @HostBinding('class.timelimited') get timelimited() {
    return !!this.productCtrl?.getTimelimitForOrder;
  }

  @HostBinding('class.timelimit') get timelimit() {
    return !!this.productCtrl?.isOutOfTimelimitForOrder;
  }

  @HostBinding('class.noavailable') get noavailable() {
    return !this.productCtrl?.isAvailableForOrder;
  }

  @HostBinding('class.popular') get popular() {
    return !!this.productCtrl?.product?.stats && this.productCtrl.product.stats.score > 0.25;
  }

  @HostBinding('class.noinstock') get noinstock() {
    return !this.productCtrl?.product?.pricing?.stock;
  }
}
