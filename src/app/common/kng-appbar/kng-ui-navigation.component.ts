import { Component, Input, ViewEncapsulation } from '@angular/core';
import { NAV_SERVICE_ITEMS, NavServiceItem, getCurrentService } from '../../app.model';
import { Router } from '@angular/router';
import { i18n, KngNavigationStateService } from '..';

/**
 * Composant de navigation inter-services (Niveau 1)
 * Affiche les liens vers Hub, Courses, Buffet, Abos, James
 *
 * Usage:
 *   <kng-ui-navigation [store]="store" [currentRoute]="'/home'"></kng-ui-navigation>
 */
@Component({
  selector: 'kng-ui-navigation',
  template: `
    <nav class="service-nav" [class.vertical]="vertical">
      <a *ngFor="let item of filteredServices"
         class="service-link"
         [class.active]="isActive(item)"
         [routerLink]="getRoute(item)">
        <span class="material-symbols-outlined">{{item.icon}}</span>
        <span class="label">{{item.label[locale]}}</span>
      </a>
    </nav>
  `,
  styles: [`
    .service-nav {
      display: flex;
      gap: .5rem;
      padding: 4px 0;

      &.vertical {
        flex-direction: column;
        gap: 0.25rem;
        @media (min-width: 1200px) {
          display: none;
        }
      }
    }

    .service-link {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .5rem var(--wa-form-control-padding-inline);
      border-radius: var(--wa-border-radius-pill);
      background: var(--mdc-theme-appbar-light);
      color: var(--mdc-theme-text-secondary-on-background, #666);
      text-decoration: none;
      font-weight: var(--wa-font-weight-action);
      transition: all 0.15s ease;
      white-space: nowrap;
      border-color: var(--wa-color-neutral-border-normal);
      border-width: var(--wa-border-width-s);
      -border-style: solid;
      &:hover {
        background: var(--wa-color-brand-95, #f0faf0);
        color: var(--mdc-theme-primary, #4caf50);

        .material-symbols-outlined {
          color: var(--mdc-theme-primary, #4caf50);
        }
      }

      &.active {
        background: var(--wa-color-brand-fill-quiet, #d4f5d0);
        color: var(--wa-color-brand-on-quiet, #2e7d32);
        font-weight: 600;

        .material-symbols-outlined {
          color: var(--wa-color-brand-on-quiet, #2e7d32);
        }
      }

      .material-symbols-outlined {
        font-size: 24px;
        color: var(--mdc-theme-secondary) !important;
      }

      .label {
        display: inline;
      }
    }

    // Vertical mode (sidebar) - style fin comme catégories
    .service-nav.vertical .service-link {
      padding: .5rem 1rem;
    }

    // Mobile: hide labels in horizontal mode
    @media (max-width: 768px) {
      .service-nav:not(.vertical) {
        .service-link {
          padding: 6px 10px;

          .label {
            display: none;
          }
        }
      }
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class KngUiNavigationComponent {
  @Input() store: string = '';
  @Input() currentRoute: string = '';
  @Input() vertical: boolean = false;
  @Input() showHub: boolean = true;

  services = NAV_SERVICE_ITEMS;

  constructor(
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $router: Router
  ) {}

  get locale(): 'fr' | 'en' {
    return this.$i18n.locale as 'fr' | 'en';
  }

  get currentService(): NavServiceItem | undefined {
    return getCurrentService(this.currentRoute || this.$router.url);
  }

  isActive(item: NavServiceItem): boolean {
    const current = this.currentService;
    return current?.id === item.id;
  }

  getRoute(item: NavServiceItem): string[] {
    const store = this.store || this.$navigation.store;
    if (item.route === '') {
      return ['/store', store];
    }
    return ['/store', store, ...item.route.split('/')];
  }

  get filteredServices(): NavServiceItem[] {
    if (this.showHub) {
      return this.services;
    }
    return this.services;//.filter(s => s.id !== 'hub');
  }
}
