import { Component, OnInit, OnDestroy } from '@angular/core';
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
  saveMessage = '';
  saveError = '';

  constructor(
    private $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    public $i18n: i18n
  ) {
    const { config } = this.$loader.getLatestCoreData();
    this.config = config;
    this.currentHub = this.config?.shared?.hub;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  get hubs(): Hub[] {
    return this.$navigation.HUBs || [];
  }

  get store(): string {
    return this.$navigation.store;
  }

  get locale(): string {
    return this.$i18n.locale;
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
