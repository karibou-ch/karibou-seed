import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Order } from 'kng2-core';

@Component({
  selector: 'kng-feedback-current-order-card',
  templateUrl: './kng-feedback-current-order-card.component.html',
  styleUrls: ['./kng-feedback-current-order-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackCurrentOrderCardComponent {

  @Input() order: Order;
  @Input() orderState: string;
  @Input() boxed = false;
  @Input() locale: string;
  @Input() texts: any;

  @Output() openOrder = new EventEmitter<Order>();
  @Output() cancelOrder = new EventEmitter<Order>();

  get progressValue() {
    return this.order?.getProgress ? (this.order.getProgress() / 100 + 10) : 0;
  }

  get progressLabel() {
    const progress = this.order?.getProgress ? this.order.getProgress() : 0;
    if (progress >= 80) {
      return 'En livraison';
    }
    if (progress >= 40) {
      return 'Livraison planifiee';
    }
    return 'En preparation';
  }

  onOpenOrder(event?: Event) {
    event?.stopPropagation();
    this.openOrder.emit(this.order);
  }

  onCancelOrder(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.cancelOrder.emit(this.order);
  }
}
