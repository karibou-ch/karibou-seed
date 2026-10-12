import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminShellService {
  private readonly searchSubject = new BehaviorSubject<string>('');
  readonly search$ = this.searchSubject.asObservable();

  get search(): string {
    return this.searchSubject.value;
  }

  setSearch(value: string): void {
    const next = value || '';
    if (next !== this.searchSubject.value) {
      this.searchSubject.next(next);
    }
  }

  matches(label: string): boolean {
    const query = this.search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return (label || '').toLowerCase().includes(query);
  }
}
