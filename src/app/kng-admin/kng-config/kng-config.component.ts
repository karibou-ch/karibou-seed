import { Component, OnInit, OnDestroy, Directive } from '@angular/core';
import { KngNavigationStateService, i18n, KngUtils } from '../../common';
import { FormBuilder } from '@angular/forms';
import {
  DocumentService,
  LoaderService,
  ConfigService,
  Config,
  DocumentHeader,
  Hub
} from 'kng2-core';
import { ActivatedRoute, Router } from '@angular/router';

function diffCount(left: any, right: any): number {
  if (JSON.stringify(left) === JSON.stringify(right)) {
    return 0;
  }
  if (left == null || right == null || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) {
    return 1;
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  let count = 0;
  keys.forEach(key => count += diffCount(left[key], right[key]));
  return count;
}

/**
 * Base configuration component for admin dashboard
 * Handles config loading, saving and common functionality
 */
@Directive()
export class KngConfigBase implements OnInit, OnDestroy {
  currenHub: Hub;
  config: Config;
  menus: any[] = [];
  groups: string[] = [];
  isLoading = false;
  isReady = false;
  saveMessage = '';
  saveError = '';
  private configSnapshot = '';

  constructor(
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $loader: LoaderService,
    public $util: KngUtils,
    public $route: ActivatedRoute,
    public $navigation: KngNavigationStateService
  ) {
    const { config } = this.$loader.getLatestCoreData();
    this.config = config!;
    this.currenHub = this.config?.shared?.hub || {} as Hub;

    // Initialize optional fields
    if (this.config?.shared) {
      this.config.shared.welcome = this.config.shared.welcome || { message: {} };
      this.config.shared.welcome.message = this.config.shared.welcome.message || {};
      this.config.shared.faq_title = this.config.shared.faq_title || { fr: '', en: '' };
    }

    this.isReady = true;
    this.rememberConfig();
    this.ngConstruct();
  }

  ngConstruct(): void {
    if (this.currenHub?.slug) {
      this.$config.get(this.currenHub.slug).subscribe(config => {
        this.config = config;
        this.rememberConfig();
      });
    }
  }

  ngOnInit(): void {
    this.formatDates();
    this.buildMenu();
  }

  ngOnDestroy(): void {
    this.isLoading = false;
  }

  get locale(): string {
    return this.$i18n.locale;
  }

  get labels() {
    return this.$i18n.adm();
  }

  protected rememberConfig(): void {
    try {
      this.configSnapshot = JSON.stringify(this.config || {});
    } catch {
      this.configSnapshot = '';
    }
  }

  get configDirty(): boolean {
    if (!this.configSnapshot) {
      return true;
    }
    try {
      return JSON.stringify(this.config || {}) !== this.configSnapshot;
    } catch {
      return true;
    }
  }

  get configDirtyCount(): number {
    if (!this.configDirty || !this.configSnapshot) {
      return this.configDirty ? 1 : 0;
    }
    try {
      return diffCount(JSON.parse(this.configSnapshot), this.config);
    } catch {
      return 1;
    }
  }

  revertConfig(): void {
    if (!this.configSnapshot) {
      return;
    }
    this.config = JSON.parse(this.configSnapshot);
  }

  buildMenu(): void {
    if (!this.config?.shared?.menu) return;
    this.menus = this.config.shared.menu.sort(this.sortByGroupAndWeight);
    this.groups = this.menus
      .map(menu => menu.group)
      .filter((item, i, ar) => ar.indexOf(item) === i);
  }

  getMenuByGroup(group: string): any[] {
    return this.menus?.filter(menu => menu.group === group) || [];
  }

  findMenuItem(item: any): number {
    if (item._id) {
      return this.config.shared.menu.findIndex((m: any) => m._id === item._id);
    }
    return this.config.shared.menu.findIndex((m: any) => m === item);
  }

  formatDates(): void {
    const format = (d: Date | string): string => {
      const date = new Date(d);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      return date.getFullYear() + '-' + month + '-' + day;
    };

    (this.config?.shared?.noshipping || []).forEach((noshipping: any) => {
      noshipping.from = format(noshipping.from as Date);
      noshipping.to = format(noshipping.to as Date);
    });
  }

  onCreateFAQ(): void {
    this.config.shared.faq = this.config.shared.faq || [];
    this.config.shared.faq.push({
      q: { en: '', fr: '', de: '' },
      a: { en: '', fr: '', de: '' }
    });
  }

  onDialogOpen(url: string): void {
    if (url === 'rejected') {
      this.showError(this.$i18n.label().img_max_sz);
    }
  }

  onConfigSave(): void {
    this.isReady = false;
    this.isLoading = true;
    this.saveMessage = '';
    this.saveError = '';

    this.$config.save(this.config).subscribe({
      next: () => {
        this.formatDates();
        this.isReady = true;
        this.rememberConfig();
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => {
        this.isReady = true;
        this.isLoading = false;
        this.showError(err.error || 'Erreur lors de la sauvegarde');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  showSuccess(message: string): void {
    this.saveMessage = message;
    this.saveError = '';
    setTimeout(() => this.saveMessage = '', 3000);
  }

  showError(message: string): void {
    this.saveError = message;
    this.saveMessage = '';
    setTimeout(() => this.saveError = '', 5000);
  }

  trackFAQ(_idx: number, faq: any): any {
    return faq && (faq._id || faq);
  }

  sortByGroupAndWeight(m1: any, m2: any): number {
    const g1 = m1.group || '';
    const g2 = m2.group || '';
    if (g1 === g2) {
      return m1.weight - m2.weight;
    }
    return g1.toLowerCase().localeCompare(g2.toLowerCase());
  }
}


@Component({
  selector: 'kng-config',
  templateUrl: './kng-config.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngConfigComponent extends KngConfigBase {
  get editFields() {
    const shared = this.config?.shared;
    const fields: any[] = [
      shared?.name, shared?.description, shared?.faq_title,
      shared?.subscription?.t, shared?.subscription?.h, shared?.subscription?.p, shared?.subscription?.article,
      shared?.business?.t, shared?.business?.h, shared?.business?.p, shared?.business?.article,
      shared?.patreon?.t, shared?.patreon?.h, shared?.patreon?.p, shared?.patreon?.article,
      shared?.footer?.t, shared?.footer?.h, shared?.footer?.p
    ];
    (shared?.faq || []).forEach((faq: any) => fields.push(faq.q, faq.a));
    return fields;
  }

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $loader: LoaderService,
    $util: KngUtils,
    $route: ActivatedRoute,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $loader, $util, $route, $navigation);
  }
}


@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngWelcomeCfgComponent extends KngConfigBase {
  get editFields() {
    const shared = this.config?.shared;
    return [
      shared?.welcome?.message, shared?.tagLine?.t, shared?.tagLine?.h, shared?.tagLine?.p,
      shared?.about?.t, shared?.about?.h, shared?.about?.p,
      shared?.footer?.t, shared?.footer?.h, shared?.footer?.p
    ];
  }

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $loader: LoaderService,
    $util: KngUtils,
    $route: ActivatedRoute,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $loader, $util, $route, $navigation);
  }
}


@Component({
  selector: 'kng-shop',
  templateUrl: './kng-shop.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngShopComponent extends KngConfigBase {
  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $loader: LoaderService,
    $util: KngUtils,
    $route: ActivatedRoute,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $loader, $util, $route, $navigation);
  }
}


@Component({
  selector: 'kng-page-content',
  templateUrl: './kng-page.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngPageContentComponent {
  config: Config;
  contents: DocumentHeader[];

  constructor(
    public $i18n: i18n,
    private $doc: DocumentService,
    private $loader: LoaderService,
    private $route: ActivatedRoute,
    private router: Router
  ) {
    const { config } = this.$loader.getLatestCoreData();
    this.config = config!;
    this.contents = [];
    this.ngConstruct();
  }

  ngConstruct(): void {
    this.$doc.select('all').subscribe(pages => {
      this.contents = pages;
    });
  }

  get locale(): string {
    return this.$i18n.locale;
  }

  get labels() {
    return this.$i18n.adm();
  }
}


@Component({
  selector: 'kng-navigation',
  templateUrl: './kng-navigation.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngNavigationComponent extends KngConfigBase {
  showDlg = false;
  dlgItem: any = null;

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $loader: LoaderService,
    $util: KngUtils,
    $route: ActivatedRoute,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $loader, $util, $route, $navigation);
  }

  trackMenu(_idx: number, menu: any): any {
    return menu && (menu._id || menu);
  }

  onMenuCreate(): void {
    this.dlgItem = { name: { en: '', fr: '', de: '' }, url: '', weight: 0, group: '', active: true, type: 'link' };
    this.showDlg = true;
  }

  onMenuSelect(_event: any, item: any): void {
    this.dlgItem = { ...item, name: { ...item.name } };
    this.showDlg = true;
  }

  onSaveMenu(): void {
    if (!this.dlgItem) { return; }
    if (!this.config.shared.menu) { this.config.shared.menu = []; }
    const idx = this.findMenuItem(this.dlgItem);
    if (idx >= 0) {
      this.config.shared.menu[idx] = this.dlgItem;
    } else {
      this.config.shared.menu.push(this.dlgItem);
    }
    this.buildMenu();
    this.showDlg = false;
    this.dlgItem = null;
    this.onConfigSave();
  }

  onDeleteMenu(item: any): void {
    const idx = this.findMenuItem(item);
    if (idx >= 0) {
      this.config.shared.menu.splice(idx, 1);
      this.buildMenu();
      this.onConfigSave();
    }
  }

  closeDlg(): void {
    this.showDlg = false;
    this.dlgItem = null;
  }
}


@Component({
  selector: 'kng-navigation-dlg',
  template: `<div></div>`
})
export class KngNavigationDlgComponent {}
