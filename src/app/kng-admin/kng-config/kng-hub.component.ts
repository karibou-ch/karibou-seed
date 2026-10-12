import { Component, OnInit, OnDestroy, Directive } from '@angular/core';
import { KngNavigationStateService, i18n, KngUtils } from '../../common';
import { FormBuilder } from '@angular/forms';
import {
  LoaderService,
  Category,
  ConfigService,
  Config,
  HubService,
  Hub,
  ShopService,
  Shop
} from 'kng2-core';
import { ActivatedRoute } from '@angular/router';
import { KngCheckItem } from '../kng-checklist.component';

function diffCount(left: any, right: any): number {
  if (JSON.stringify(left) === JSON.stringify(right)) {
    return 0;
  }
  if (left == null || right == null || typeof left !== 'object' || typeof right !== 'object') {
    return 1;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return 1;
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  let count = 0;
  keys.forEach(key => count += diffCount(left[key], right[key]));
  return count;
}

/**
 * Base Hub component for admin dashboard
 * Handles hub loading, saving and common functionality
 */
@Directive()
export class KngHUBBase implements OnInit, OnDestroy {
  hubs: Hub[];
  categories: Category[];
  config: Config;
  menus: any[];
  groups: string[];
  isLoading = false;
  isReady = false;
  currentHub: Hub;
  sixMOnth: Date;
  edit = {};
  saveMessage = '';
  saveError = '';
  private hubSnapshot = '';

  constructor(
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $hub: HubService,
    public $loader: LoaderService,
    public $shops: ShopService,
    public $route: ActivatedRoute,
    public $utils: KngUtils,
    public $navigation: KngNavigationStateService
  ) {
    const { config, categories } = this.$loader.getLatestCoreData();
    this.isLoading = false;
    this.isReady = true;
    this.config = config;
    this.categories = categories;

    const hubSlug = this.config?.shared?.hub?.slug || 'artamis';
    this.sixMOnth = new Date(Date.now() - 86400000 * 30 * 6);
    this.hubs = this.config?.shared?.hubs || [];

    this.$hub.get(hubSlug).subscribe({
      next: (hub) => {
        this.initHub(hub);
        Object.assign(this.currentHub, hub);
        this.rememberHub();
      },
      error: (err) => this.showError(err.error)
    });

    this.$hub.list().subscribe({
      next: (hubs) => {
        hubs.forEach(hub => hub.slug = hub.slug[0]);
        this.hubs = hubs;
      },
      error: (err) => this.showError(err.error)
    });
  }

  get locale(): string {
    return this.$i18n.locale;
  }

  addContent(): void {
    if (!this.currentHub.home) {
      this.currentHub.home = { content: [] as any } as any;
    }
    if (!this.currentHub.home.content) {
      (this.currentHub.home as any).content = [];
    }
    (this.currentHub.home.content as any[]).push({
      t: { en: '', fr: '', de: '' },
      h: { en: '', fr: '', de: '' },
      p: { en: '', fr: '', de: '' },
      image: null,
      target: ''
    });
  }

  initHub(hub: Hub): void {
    this.currentHub = {} as Hub;
    this.currentHub.description = { fr: null, en: null, de: null };
    this.currentHub.logo = this.currentHub.logo || null;

    const format = (d: Date | string): string => {
      const date = new Date(d);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      return date.getFullYear() + '-' + month + '-' + day;
    };

    ((hub.noshipping || []) as any[]).forEach(noshipping => {
      noshipping.from = format(noshipping.from as Date);
      noshipping.to = format(noshipping.to as Date);
    });
  }

  ngOnInit(): void {
    this.$utils.getGeoCode().subscribe(result => {
      if (!result.geo) {
        return;
      }
      this.currentHub.address = result.address;
      this.currentHub.address.geo = result.geo || this.currentHub.address.geo;
    });
  }

  ngOnDestroy(): void {}

  onDialogOpen(dialog: any): void {
    if (!dialog || !dialog.done) {
      return;
    }
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.showError(this.$i18n.label().img_max_sz);
        return;
      }
      setTimeout(() => this.onHubSave(), 1000);
    });
  }

  onHubSave(): void {
    const weekdays: string | string[] = this.currentHub.weekdays as any;
    if (typeof weekdays === 'string') {
      this.currentHub.weekdays = weekdays.split(',').map(day => parseInt(day + '')) as number[];
    }
    this.isReady = false;
    this.isLoading = true;

    this.$hub.save(this.currentHub).subscribe({
      next: (hub) => {
        this.isReady = true;
        this.showSuccess(this.$i18n.label().save_ok);
        Object.assign(this.config.shared.hub, hub);
        Object.assign(this.currentHub, hub);
        this.rememberHub();
      },
      error: (err) => this.showError(err.error),
      complete: () => this.isLoading = false
    });
  }

  onHubSaveManager(): void {
    this.isReady = false;
    this.isLoading = true;
    this.$hub.saveManager(this.currentHub).subscribe({
      next: (hub) => {
        this.isReady = true;
        this.showSuccess(this.$i18n.label().save_ok);
        if (hub) {
          this.initHub(hub);
          Object.assign(this.currentHub, hub);
          this.rememberHub();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isReady = true;
        this.showError(err.error);
      },
      complete: () => this.isLoading = false
    });
  }

  onAdminHubSave(): void {
    this.isReady = false;
    this.isLoading = true;
    this.$hub.saveAdmin(this.currentHub).subscribe({
      next: () => {
        this.isReady = true;
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => {
        this.isLoading = false;
        this.isReady = true;
        this.showError(err.error);
      }
    });
  }

  updateGeo($event: any): void {
    const street = this.currentHub.address.streetAdress;
    const postal = this.currentHub.address.postalCode;
    const region = this.currentHub.address.region;

    if (!street || !postal || [street, postal].indexOf($event) > -1) {
      return;
    }

    this.$utils.updateGeoCode(street, postal, region);
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

  protected rememberHub(): void {
    this.hubSnapshot = JSON.stringify(this.currentHub || {});
  }

  get hubDirty(): boolean {
    return !!this.currentHub && JSON.stringify(this.currentHub) !== this.hubSnapshot;
  }

  get hubDirtyCount(): number {
    if (!this.hubDirty) {
      return 0;
    }
    try {
      return diffCount(JSON.parse(this.hubSnapshot || '{}'), this.currentHub);
    } catch {
      return 1;
    }
  }

  revertHub(): void {
    if (!this.hubSnapshot) {
      return;
    }
    this.currentHub = JSON.parse(this.hubSnapshot);
  }

  get labels() {
    return this.$i18n.adm();
  }
}


@Component({
  selector: 'kng-hub',
  templateUrl: './kng-hub.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHUBComponent extends KngHUBBase {
  editingWeekdays = false;
  editingSlots = false;
  confirmDeactivate = false;
  readonly slotHours = [0, 10, 12, 16, 19];
  readonly weekdayIndexes = [1, 2, 3, 4, 5, 6, 0];

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $hub: HubService,
    $loader: LoaderService,
    $shops: ShopService,
    $route: ActivatedRoute,
    $utils: KngUtils,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $hub, $loader, $shops, $route, $utils, $navigation);
  }

  get contentFields() {
    const hub = this.currentHub;
    if (!hub) {
      return [];
    }
    return [
      hub.siteName, hub.description, hub.tagLine?.t, hub.tagLine?.h, hub.tagLine?.p,
      hub.about?.t, hub.about?.h, hub.about?.p, hub.footer?.t, hub.footer?.h, hub.footer?.p,
      hub.home?.customLink?.label, hub.maintenance?.reason, hub.status?.reason
    ];
  }

  weekdayList(): number[] {
    const value = this.currentHub?.weekdays as any;
    if (Array.isArray(value)) {
      return value.map(day => +day).filter(day => !isNaN(day));
    }
    if (typeof value === 'string') {
      return value.split(',').map(day => parseInt(day, 10)).filter(day => !isNaN(day));
    }
    return [];
  }

  weekdaySpan(): string {
    const days = [...this.weekdayList()].sort((a, b) => a - b);
    if (!days.length) {
      return '';
    }
    const names = (this.$i18n.label().weekdays || '').split('_');
    const short = (index: number) => {
      const name = names[index] || '';
      return name.charAt(0).toUpperCase() + name.slice(1, 3);
    };
    const contiguous = days.every((day, index) => index === 0 || day === days[index - 1] + 1);
    if (contiguous && days.length > 1) {
      return `${short(days[0])} — ${short(days[days.length - 1])}`;
    }
    return days.map(short).join(', ');
  }

  weekdayName(index: number): string {
    return (this.$i18n.label().weekdays || '').split('_')[index] || '';
  }

  isWeekday(day: number): boolean {
    return this.weekdayList().indexOf(day) > -1;
  }

  toggleWeekday(day: number, on: boolean): void {
    const next = new Set(this.weekdayList());
    if (on) {
      next.add(day);
    } else {
      next.delete(day);
    }
    this.currentHub.weekdays = [...next].sort((a, b) => a - b) as any;
  }

  toggleSlots(): void {
    if (!this.currentHub.shippingtimes) {
      this.currentHub.shippingtimes = { type: '', default: '' };
    }
    this.editingSlots = !this.editingSlots;
  }

  get slotCount(): number {
    const times = this.currentHub?.shippingtimes || {};
    return this.slotHours.filter(hour => {
      const value = times[hour + ''];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }

  onApplyShipping(): void {
    this.isLoading = true;
    this.$config.save(this.config).subscribe({
      next: () => this.showSuccess(this.$i18n.label().save_ok),
      error: (err) => this.showError(err.error),
      complete: () => this.isLoading = false
    });
  }

  deactivateHub(): void {
    if (!this.currentHub.status) {
      this.currentHub.status = { active: false, reason: { fr: '', en: '', de: '' } } as any;
    }
    this.currentHub.status.active = false;
    this.confirmDeactivate = false;
    this.onHubSave();
  }
}


@Component({
  selector: 'kng-hub-closures',
  templateUrl: './kng-hub-closures.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHubClosuresComponent extends KngHUBBase {
  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $hub: HubService,
    $loader: LoaderService,
    $shops: ShopService,
    $route: ActivatedRoute,
    $utils: KngUtils,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $hub, $loader, $shops, $route, $utils, $navigation);
  }

  get closureFields() {
    return (this.currentHub?.noshipping || []).map((row: any) => row.reason);
  }

  addDate(): void {
    const today = new Date();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    const stamp = today.getFullYear() + '-' + month + '-' + day;
    this.currentHub.noshipping = [...(this.currentHub.noshipping || []), {
      reason: { en: '', fr: '', de: '' },
      from: stamp,
      to: stamp
    }] as any;
  }

  removeDate(index: number): void {
    this.currentHub.noshipping.splice(index, 1);
  }
}


@Component({
  selector: 'kng-hub-team',
  templateUrl: './kng-hub-team.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHubTeamComponent extends KngHUBBase {
  newManager = '';
  newLogistic = '';
  confirm: { list: 'manager' | 'logistic'; index: number } | null = null;

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $hub: HubService,
    $loader: LoaderService,
    $shops: ShopService,
    $route: ActivatedRoute,
    $utils: KngUtils,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $hub, $loader, $shops, $route, $utils, $navigation);
  }

  initials(email: string): string {
    const parts = (email || '?').split(/[@.\s]+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  private addEmail(list: 'manager' | 'logistic', value: string): void {
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showError(this.labels.email_invalid);
      return;
    }
    const managers = this.currentHub.manager || [];
    const logistics = this.currentHub.logistic || [];
    if (managers.includes(email) || logistics.includes(email)) {
      this.showError(this.labels.email_duplicate);
      return;
    }
    if (list === 'manager') {
      this.currentHub.manager = [...managers, email];
      this.newManager = '';
    } else {
      this.currentHub.logistic = [...logistics, email];
      this.newLogistic = '';
    }
  }

  addManager(): void {
    this.addEmail('manager', this.newManager);
  }

  addLogistic(): void {
    this.addEmail('logistic', this.newLogistic);
  }

  askRemove(list: 'manager' | 'logistic', index: number): void {
    this.confirm = { list, index };
  }

  cancelRemove(): void {
    this.confirm = null;
  }

  confirmRemove(): void {
    if (!this.confirm) {
      return;
    }
    const list = this.confirm.list === 'manager' ? this.currentHub.manager : this.currentHub.logistic;
    list?.splice(this.confirm.index, 1);
    this.confirm = null;
  }
}


@Component({
  selector: 'kng-hub-vendors',
  templateUrl: './kng-hub-vendors.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHubVendorsComponent extends KngHUBBase {
  vendors: Shop[] = [];
  private names: Record<string, string> = {};

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $hub: HubService,
    $loader: LoaderService,
    $shops: ShopService,
    $route: ActivatedRoute,
    $utils: KngUtils,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $hub, $loader, $shops, $route, $utils, $navigation);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.$shops.query({ status: true }).subscribe(vendors => {
      this.vendors = vendors.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
      this.vendors.forEach(vendor => this.names[vendor._id] = vendor.name);
    });
  }

  get vendorItems(): KngCheckItem[] {
    const selected = new Set(this.currentHub?.vendors || []);
    const items = new Map<string, KngCheckItem>();
    this.vendors.forEach(vendor => {
      const fresh = vendor.status || (vendor.created > this.sixMOnth);
      if (!fresh && !selected.has(vendor._id)) {
        return;
      }
      items.set(vendor._id, {
        id: vendor._id,
        label: vendor.name,
        status: vendor.status ? 'active' : 'new'
      });
    });
    (this.currentHub?.vendors || []).forEach(id => {
      if (!items.has(id)) {
        items.set(id, { id, label: this.names[id] || id, status: 'active' });
      }
    });
    return [...items.values()];
  }

  onVendorsChange(ids: string[]): void {
    this.currentHub.vendors = [...new Set(ids)];
  }

  save(): void {
    this.currentHub.vendors = [...new Set(this.currentHub.vendors || [])];
    this.onHubSaveManager();
  }
}


@Component({
  selector: 'kng-hub-categories',
  templateUrl: './kng-hub-categories.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHubCategoriesComponent extends KngHUBBase {
  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $hub: HubService,
    $loader: LoaderService,
    $shops: ShopService,
    $route: ActivatedRoute,
    $utils: KngUtils,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $hub, $loader, $shops, $route, $utils, $navigation);
  }

  get allCategories(): boolean {
    return !(this.currentHub?.categories || []).length;
  }

  get categoryItems(): KngCheckItem[] {
    const seen = new Set<string>();
    return [...(this.categories || [])]
      .sort((a, b) => (a.weight || 0) - (b.weight || 0) || a.name.localeCompare(b.name, 'fr'))
      .filter(category => {
        if (!category?._id || seen.has(category._id)) {
          return false;
        }
        seen.add(category._id);
        return true;
      })
      .map(category => ({ id: category._id, label: category.name, status: category.group }));
  }

  onAllChange(checked: boolean): void {
    if (checked) {
      this.currentHub.categories = [];
    }
  }

  onCategoriesChange(ids: string[]): void {
    this.currentHub.categories = [...new Set(ids)];
  }

  save(): void {
    this.currentHub.categories = [...new Set(this.currentHub.categories || [])];
    this.onHubSaveManager();
  }
}


@Component({
  selector: 'kng-information',
  templateUrl: './kng-hub-information.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngInformationCfgComponent extends KngHUBBase {
  get editFields() {
    const hub = this.currentHub;
    const fields: any[] = [
      hub?.header?.message, hub?.home?.selection?.t,
      hub?.checkout?.title, hub?.checkout?.address, hub?.checkout?.payment,
      hub?.checkout?.resume, hub?.checkout?.message
    ];
    (hub?.home?.content || []).forEach((section: any) => fields.push(section.t, section.h, section.p));
    return fields;
  }

  removeSection(index: number): void {
    this.currentHub.home.content.splice(index, 1);
  }

  constructor(
    $fb: FormBuilder,
    $i18n: i18n,
    $config: ConfigService,
    $hub: HubService,
    $loader: LoaderService,
    $shops: ShopService,
    $route: ActivatedRoute,
    $utils: KngUtils,
    $navigation: KngNavigationStateService
  ) {
    super($fb, $i18n, $config, $hub, $loader, $shops, $route, $utils, $navigation);
  }
}
