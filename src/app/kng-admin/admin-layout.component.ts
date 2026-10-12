import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { LoaderService, UserService } from 'kng2-core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { KngNavigationStateService, i18n } from '../common';
import { AdminShellService } from './admin-shell.service';

interface NavItem {
  link: string;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'kng-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly version = '15.0.2';
  sidebarOpen = false;
  mobileNav = true;
  mode: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  dark = false;
  private hadDark = false;
  private savedZoom = '';
  private subs = new Subscription();
  private mobileQuery = window.matchMedia('(max-width: 899px)');
  private desktopQuery = window.matchMedia('(min-width: 1200px)');

  constructor(
    private $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    private $user: UserService,
    private renderer: Renderer2,
    private router: Router,
    public shell: AdminShellService,
    public $i18n: i18n
  ) {}

  ngOnInit(): void {
    this.savedZoom = document.body.style.getPropertyValue('zoom') || '';
    this.renderer.setStyle(document.body, 'zoom', '1');
    this.hadDark = document.documentElement.classList.contains('wa-dark');
    const stored = localStorage.getItem('kng-admin-color-scheme');
    this.dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme();
    this.readMode();
    this.mobileQuery.addEventListener('change', this.readMode);
    this.desktopQuery.addEventListener('change', this.readMode);
    this.subs.add(this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.sidebarOpen = false;
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.mobileQuery.removeEventListener('change', this.readMode);
    this.desktopQuery.removeEventListener('change', this.readMode);
    if (this.savedZoom) {
      this.renderer.setStyle(document.body, 'zoom', this.savedZoom);
    } else {
      this.renderer.removeStyle(document.body, 'zoom');
    }
    if (!this.hadDark) {
      document.documentElement.classList.remove('wa-dark');
    }
  }

  get labels() {
    return this.$i18n.adm();
  }

  get hubs() {
    return this.$navigation.HUBs || [];
  }

  get store(): string {
    return this.$navigation.store;
  }

  get hubName(): string {
    const hub = this.hubs.find(item => item.slug === this.store);
    return hub?.name || this.store || '';
  }

  get locale(): string {
    return this.$i18n.locale;
  }

  get userName(): string {
    const user = this.$user.currentUser as any;
    if (!user) {
      return this.hubName;
    }
    return user.displayName || user.email?.address || this.hubName;
  }

  get initials(): string {
    const parts = (this.userName || 'A').split(/[\s@.]+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'A';
  }

  get groups(): NavGroup[] {
    const t = this.labels;
    const query = this.shell.search.trim().toLowerCase();
    const groups: NavGroup[] = [
      {
        id: 'hub',
        label: t.nav_hub,
        items: [
          { link: './main-hub', label: t.nav_config },
          { link: './closures', label: t.nav_closures },
          { link: './team', label: t.nav_team },
          { link: './deposit', label: t.nav_deposits },
          { link: './hub-vendors', label: t.nav_vendors },
          { link: './hub-categories', label: t.nav_categories }
        ]
      },
      {
        id: 'catalogue',
        label: t.nav_catalogue,
        items: [
          { link: './shop', label: t.nav_shops },
          { link: './category', label: t.nav_catalog_categories }
        ]
      },
      {
        id: 'content',
        label: t.nav_content,
        items: [
          { link: './welcome', label: t.nav_welcome },
          { link: './page', label: t.nav_pages },
          { link: './navigation', label: t.nav_navigation },
          { link: './information', label: t.nav_information }
        ]
      },
      {
        id: 'system',
        label: t.nav_system,
        items: [
          { link: './config', label: t.nav_configuration }
        ]
      }
    ];
    if (!query) {
      return groups;
    }
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.label.toLowerCase().includes(query) || group.label.toLowerCase().includes(query))
      }))
      .filter(group => group.items.length);
  }

  private readMode = (): void => {
    if (this.mobileQuery.matches) {
      this.mode = 'mobile';
    } else if (this.desktopQuery.matches) {
      this.mode = 'desktop';
    } else {
      this.mode = 'tablet';
    }
  };

  onSearch(event: Event): void {
    this.shell.setSearch((event.target as HTMLInputElement).value || '');
  }

  onNavPick(): void {
    this.sidebarOpen = false;
    if (this.mode === 'mobile') {
      this.mobileNav = false;
    }
  }

  showMobileNav(): void {
    this.mobileNav = true;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onHubChange(hubSlug: string): void {
    if (!hubSlug || hubSlug === this.store) {
      return;
    }
    const currentPath = location.pathname.split('/');
    const adminPath = currentPath.slice(currentPath.indexOf('admin')).join('/');
    location.href = `/store/${hubSlug}/${adminPath}`;
  }

  onLocaleChange(locale: string): void {
    if (locale === 'fr' || locale === 'en') {
      this.$i18n.locale = locale;
    }
  }

  toggleTheme(): void {
    this.dark = !this.dark;
    localStorage.setItem('kng-admin-color-scheme', this.dark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('wa-dark', this.dark);
    document.documentElement.classList.toggle('wa-light', !this.dark);
  }
}
