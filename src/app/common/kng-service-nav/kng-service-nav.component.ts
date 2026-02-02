import { Component, Input, ViewEncapsulation } from '@angular/core';
import { NAV_SERVICE_ITEMS, NavServiceItem, getCurrentService } from '../../app.model';
import { Router } from '@angular/router';
import { i18n, KngNavigationStateService } from '../';

/**
 * Composant de navigation inter-services (Niveau 1)
 * Affiche les liens vers Hub, Courses, Buffet, Abos, James
 *
 * Usage:
 *   <kng-service-nav [store]="store" [currentRoute]="'/home'"></kng-service-nav>
 */
@Component({
  selector: 'kng-service-nav',
  template: `
    <nav class="service-nav" [class.vertical]="vertical">
      <a *ngFor="let item of services"
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
      gap: 4px;
      padding: 4px 0;
      
      &.vertical {
        flex-direction: column;
        gap: 2px;
      }
    }
    
    .service-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 20px;
      background: transparent;
      color: var(--mdc-theme-text-secondary-on-background, #666);
      text-decoration: none;
      font-size: 14px;
      font-weight: 400;
      transition: all 0.15s ease;
      white-space: nowrap;
      
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
        font-weight: 500;
        
        .material-symbols-outlined {
          color: var(--wa-color-brand-on-quiet, #2e7d32);
        }
      }
      
      .material-symbols-outlined {
        font-size: 18px;
        color: var(--mdc-theme-text-hint-on-background, #999);
      }
      
      .label {
        display: inline;
      }
    }
    
    // Vertical mode (sidebar) - style fin comme catégories
    .service-nav.vertical .service-link {
      border-radius: 16px;
      padding: 8px 14px;
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
export class KngServiceNavComponent {
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

  getFilteredServices(): NavServiceItem[] {
    if (this.showHub) {
      return this.services;
    }
    return this.services.filter(s => s.id !== 'hub');
  }
}
