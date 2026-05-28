import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { LoaderService, Config, Hub } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../common';

@Component({
  selector: 'kng-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {

  config: Config;
  currentHub: Hub;
  sidebarOpen = false;
  hubMenuOpen = false;

  constructor(
    private $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    private renderer: Renderer2,
    public $i18n: i18n
  ) {
    const { config } = this.$loader.getLatestCoreData();
    this.config = config!;
    this.currentHub = this.config?.shared?.hub;
  }

  private savedZoom = '';

  ngOnInit(): void {
    this.savedZoom = document.body.style.getPropertyValue('zoom') || '';
    this.renderer.setStyle(document.body, 'zoom', '1');
  }

  ngOnDestroy(): void {
    if (this.savedZoom) {
      this.renderer.setStyle(document.body, 'zoom', this.savedZoom);
    } else {
      this.renderer.removeStyle(document.body, 'zoom');
    }
  }

  toggleHubMenu(): void {
    this.hubMenuOpen = !this.hubMenuOpen;
  }

  get hubs(): Hub[] {
    return this.$navigation.HUBs || [];
  }

  get store(): string {
    return this.$navigation.store;
  }

  get locale(): string {
    return this.$i18n.locale;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onHubChange(hubSlug: string): void {
    const currentPath = location.pathname.split('/');
    const adminPath = currentPath.slice(currentPath.indexOf('admin')).join('/');
    location.href = `/store/${hubSlug}/${adminPath}`;
  }

  onLocaleChange(locale: string): void {
    this.$i18n.locale = locale;
  }
}
