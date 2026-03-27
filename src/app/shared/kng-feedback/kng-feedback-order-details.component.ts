import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Order } from 'kng2-core';

@Component({
  selector: 'kng-feedback-order-details',
  templateUrl: './kng-feedback-order-details.component.html',
  styleUrls: ['./kng-feedback-order-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackOrderDetailsComponent {

  @Input() order: Order;
  @Input() childOrders: Order[] = [];
  @Input() texts: any;

  @Output() cancelOrder = new EventEmitter<Order>();
  @Output() addAllToCart = new EventEmitter<Order>();

  isPending(order: Order) {
    if (!order) {
      return false;
    }
    const status = order.fulfillments?.status;
    return status === 'authorized' || status === 'pending' || status === 'placed';
  }

  onCancel(order: Order, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.cancelOrder.emit(order);
  }

  onAddAllToCart(order: Order, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.addAllToCart.emit(order);
  }
}
