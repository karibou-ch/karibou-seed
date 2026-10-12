import { Component, EventEmitter, Input, Output } from '@angular/core';
import { i18n } from '../common';

export interface KngCheckItem {
  id: string;
  label: string;
  status?: string;
}

@Component({
  selector: 'kng-checklist',
  template: `
    <div class="kng-checklist__toolbar">
      <wa-input size="small" [label]="searchLabel" [placeholder]="searchLabel"
                [value]="query" (input)="query = $any($event.target).value"></wa-input>
      <wa-radio-group size="small" orientation="horizontal" [value]="filter" [label]="labels.filter"
                      (change)="filter = $any($event.target).value">
        <wa-radio appearance="button" value="all">{{ labels.all }}</wa-radio>
        <wa-radio appearance="button" value="selected">{{ labels.selected }}</wa-radio>
        <wa-radio appearance="button" value="unselected">{{ labels.unselected }}</wa-radio>
      </wa-radio-group>
    </div>
    <p class="kng-checklist__count">{{ countLabel }}</p>
    <div class="kng-checklist__row" *ngFor="let item of visible" [class.is-on]="isSelected(item.id)">
      <wa-checkbox size="small" [checked]="isSelected(item.id)"
                   (change)="toggle(item.id, $any($event.target).checked)">
        {{ item.label }}
      </wa-checkbox>
      <span class="kng-checklist__status" *ngIf="item.status">{{ statusLabel(item.status) }}</span>
    </div>
    <p class="kng-empty" *ngIf="!visible.length">{{ labels.unselected }}</p>
  `
})
export class KngChecklistComponent {
  @Input() items: KngCheckItem[] = [];
  @Input() selected: string[] = [];
  @Input() searchLabel = '';
  @Input() noun = '';
  @Output() selectedChange = new EventEmitter<string[]>();

  query = '';
  filter: 'all' | 'selected' | 'unselected' = 'all';

  constructor(public $i18n: i18n) {}

  get labels() {
    return this.$i18n.adm();
  }

  get uniqueItems(): KngCheckItem[] {
    const seen = new Map<string, KngCheckItem>();
    (this.items || []).forEach(item => {
      if (item?.id && !seen.has(item.id)) {
        seen.set(item.id, item);
      }
    });
    return [...seen.values()];
  }

  get selectedSet(): Set<string> {
    return new Set(this.selected || []);
  }

  get visible(): KngCheckItem[] {
    const query = this.query.trim().toLowerCase();
    return this.uniqueItems.filter(item => {
      if (query && !item.label.toLowerCase().includes(query)) {
        return false;
      }
      const on = this.selectedSet.has(item.id);
      if (this.filter === 'selected') {
        return on;
      }
      if (this.filter === 'unselected') {
        return !on;
      }
      return true;
    });
  }

  get selectedCount(): number {
    const ids = new Set(this.uniqueItems.map(item => item.id));
    return [...this.selectedSet].filter(id => ids.has(id)).length;
  }

  get countLabel(): string {
    return this.labels.selected_count
      .replace('__N__', String(this.selectedCount))
      .replace('__T__', String(this.uniqueItems.length))
      .replace('__NOUN__', this.noun || '');
  }

  isSelected(id: string): boolean {
    return this.selectedSet.has(id);
  }

  toggle(id: string, checked: boolean): void {
    const next = new Set(this.selected || []);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedChange.emit([...next]);
  }

  statusLabel(status: string): string {
    if (status === 'active') {
      return this.labels.status_active;
    }
    if (status === 'new') {
      return this.labels.status_new;
    }
    return status;
  }
}
