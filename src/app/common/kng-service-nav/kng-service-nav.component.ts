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
      gap: 8px;
      padding: 8px 0;
      
      &.vertical {
        flex-direction: column;
        gap: 4px;
      }
    }
    
    .service-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--mdc-theme-background-container, #f5f5f5);
      color: var(--mdc-theme-text-primary-on-background, #333);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
      
      &:hover {
        background: var(--mdc-theme-primary-light, #e8f5e9);
        color: var(--mdc-theme-primary, #4caf50);
      }
      
      &.active {
        background: var(--mdc-theme-primary, #4caf50);
        color: white;
        
        .material-symbols-outlined {
          color: white;
        }
      }
      
      .material-symbols-outlined {
        font-size: 20px;
        color: var(--mdc-theme-text-icon-on-background, #666);
      }
      
      .label {
        display: inline;
      }
    }
    
    // Vertical mode (sidebar)
    .service-nav.vertical .service-link {
      border-radius: 8px;
      padding: 12px 16px;
      
      .label {
        display: inline;
      }
    }
    
    // Mobile: hide labels, show only icons
    @media (max-width: 768px) {
      .service-nav:not(.vertical) {
        .service-link {
          padding: 8px 12px;
          
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
