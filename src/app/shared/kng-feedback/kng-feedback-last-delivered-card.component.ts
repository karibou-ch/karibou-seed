import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Order } from 'kng2-core';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';

@Component({
  selector: 'kng-feedback-last-delivered-card',
  templateUrl: './kng-feedback-last-delivered-card.component.html',
  styleUrls: ['./kng-feedback-last-delivered-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackLastDeliveredCardComponent {

  @Input() order: Order;
  @Input() orderState: string;
  @Input() boxed = false;
  @Input() locale: string;
  @Input() texts: any;
  @Input() expanded = false;
  @Input() childOrders: Order[] = [];
  @Input() isSubmittingQuick = false;

  @Output() openIssue = new EventEmitter<Order>();
  @Output() quickSubmit = new EventEmitter<number>();
  @Output() reportIssue = new EventEmitter<number>();
  @Output() openOrder = new EventEmitter<Order>();
  @Output() toggleDetails = new EventEmitter<Order>();
  @Output() addAllToCart = new EventEmitter<Order>();
  @Output() cancelOrder = new EventEmitter<Order>();

  selectedScore = -1;

  get hasRefund() {
    const orders = [this.order].concat(this.childOrders || []);
    return orders.some(order => order?.items?.some(item => item?.fulfillment?.refunded));
  }

  onOpenIssue(event?: Event) {
    event?.stopPropagation();
    this.openIssue.emit(this.order);
  }

  onQuickRate(score: number) {
    this.selectedScore = score;
  }

  onQuickSubmit(event?: Event) {
    event?.stopPropagation();
    if (this.selectedScore < 0 || this.isSubmittingQuick) {
      return;
    }
    this.quickSubmit.emit(this.selectedScore);
  }

  onReportIssue(event?: Event) {
    event?.stopPropagation();
    this.reportIssue.emit(this.selectedScore);
  }

  onDropdownSelect(event: CustomEvent) {
    event?.stopPropagation();
    const action = event?.detail?.item?.value;
    if (action === 'details') {
      this.toggleDetails.emit(this.order);
    }
    if (action === 'issue') {
      this.openIssue.emit(this.order);
    }
  }

  onOpenOrder(event?: Event) {
    event?.stopPropagation();
    this.openOrder.emit(this.order);
  }

  onToggleDetails(event?: Event) {
    event?.stopPropagation();
    this.toggleDetails.emit(this.order);
  }
}
