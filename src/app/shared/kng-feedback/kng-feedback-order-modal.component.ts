import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Order } from 'kng2-core';

@Component({
  selector: 'kng-feedback-order-modal',
  templateUrl: './kng-feedback-order-modal.component.html',
  styleUrls: ['./kng-feedback-order-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackOrderModalComponent {

  @Input() order: Order;
  @Input() childOrders: Order[] = [];
  @Input() locale: string;
  @Input() texts: any;

  @Output() close = new EventEmitter<void>();
  @Output() addAllToCart = new EventEmitter<Order>();

  onClose() {
    this.close.emit();
  }
}
