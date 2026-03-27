import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'kng-feedback-stars',
  templateUrl: './kng-feedback-stars.component.html',
  styleUrls: ['./kng-feedback-stars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackStarsComponent {

  @Input() score = -1;
  @Input() interactive = false;
  @Input() icon = 'star_rate';
  @Output() scoreChange = new EventEmitter<number>();

  readonly stars = [0, 1, 2, 3];

  onSelect(score: number) {
    if (!this.interactive) {
      return;
    }
    this.scoreChange.emit(score);
  }
}
