import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Order } from 'kng2-core';

@Component({
  selector: 'kng-feedback-order-items',
  templateUrl: './kng-feedback-order-items.component.html',
  styleUrls: ['./kng-feedback-order-items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackOrderItemsComponent {

  @Input() order: Order;
  @Input() childOrders: Order[] = [];
  @Input() selected: { [key: string]: boolean } = {};
  @Input() editable = false;
  @Input() texts: any;
  @Input() showBasketAction = true;
  @Input() showRefundState = false;
  @Input() icon = 'shopping_bag';
  @Input() complementTitle = 'En complement';

  @Output() addAllToCart = new EventEmitter<Order>();

  get orderGroups(): Array<{ title?: string; order: Order }> {
    const groups: Array<{ title?: string; order: Order }> = [];
    if (this.order) {
      groups.push({ order: this.order });
    }
    (this.childOrders || []).forEach((childOrder, index) => {
      groups.push({
        title: index === 0 ? this.complementTitle : undefined,
        order: childOrder
      });
    });
    return groups;
  }

  toggleSelected(sku: string | number) {
    if (!this.editable) {
      return;
    }
    this.selected[sku] = !this.selected[sku];
  }

  onAddAllToCart(event?: Event) {
    event?.preventDefault();
    this.addAllToCart.emit(this.order);
  }
}
