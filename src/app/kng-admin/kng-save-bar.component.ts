import { Component, EventEmitter, Input, Output } from '@angular/core';
import { i18n } from '../common';

@Component({
  selector: 'kng-save-bar',
  template: `
    <div class="kng-save-bar" *ngIf="dirty">
      <p class="kng-save-bar__note">
        <span class="kng-save-bar__dot" aria-hidden="true"></span>
        {{ note }}
      </p>
      <span class="kng-save-bar__spacer"></span>
      <wa-button appearance="plain" size="small" (click)="cancel.emit()">{{ labels.cancel }}</wa-button>
      <wa-button variant="brand" size="small" [loading]="loading" (click)="save.emit()">{{ labels.save }}</wa-button>
    </div>
  `
})
export class KngSaveBarComponent {
  @Input() dirty = false;
  @Input() count = 0;
  @Input() loading = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  constructor(public $i18n: i18n) {}

  get labels() {
    return this.$i18n.adm();
  }

  get note(): string {
    if (this.count === 1) {
      return this.labels.unsaved_one;
    }
    return this.labels.unsaved.replace('__N__', String(this.count || 0));
  }
}
