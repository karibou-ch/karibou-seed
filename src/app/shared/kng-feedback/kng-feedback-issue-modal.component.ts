import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Order } from 'kng2-core';

@Component({
  selector: 'kng-feedback-issue-modal',
  templateUrl: './kng-feedback-issue-modal.component.html',
  styleUrls: ['./kng-feedback-issue-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngFeedbackIssueModalComponent {

  @Input() order: Order;
  @Input() childOrders: Order[] = [];
  @Input() feedbackText = '';
  @Input() analysisText = '';
  @Input() isAnalyzing = false;
  @Input() isAnalysisReady = false;
  @Input() texts: any;
  @Input() locale: string;
  @Input() audioKey: string;

  @Output() close = new EventEmitter<void>();
  @Output() feedbackTextChange = new EventEmitter<string>();
  @Output() analyzeIssue = new EventEmitter<void>();
  @Output() submitIssue = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onTextChange(text: string) {
    this.feedbackTextChange.emit(text);
  }

  onAudioReady(ctx: { transcription?: string }) {
    if (!ctx?.transcription) {
      return;
    }
    const next = [this.feedbackText, ctx.transcription].filter(Boolean).join('\n\n').trim();
    this.feedbackTextChange.emit(next);
  }

  onSubmit() {
    this.submitIssue.emit();
  }

  onAnalyze() {
    this.analyzeIssue.emit();
  }
}
