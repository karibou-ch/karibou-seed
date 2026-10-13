import { Component, Input } from '@angular/core';
import { i18n } from '../common';

export type KngStatusState = 'enabled' | 'pending' | 'error' | 'inactive' | 'disabled';

@Component({
  selector: 'kng-status',
  template: `
    <span class="kng-status" [attr.data-state]="state">
      <span class="material-symbols-outlined" aria-hidden="true">{{ icon }}</span>
      {{ text }}
    </span>
  `
})
export class KngStatusComponent {
  @Input() state: KngStatusState = 'inactive';

  constructor(private $i18n: i18n) {}

  get icon(): string {
    return {
      enabled: 'check',
      pending: 'schedule',
      error: 'error',
      inactive: 'close',
      disabled: 'block'
    }[this.state];
  }

  get text(): string {
    const labels = this.$i18n.adm();
    return {
      enabled: labels.status_enabled,
      pending: labels.status_pending,
      error: labels.status_error,
      inactive: labels.status_inactive,
      disabled: labels.status_disabled
    }[this.state];
  }
}
