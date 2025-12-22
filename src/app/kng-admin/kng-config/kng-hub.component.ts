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
      },
      error: (err) => this.showError(err.error),
      complete: () => this.isLoading = false
    });
  }

  onHubSaveManager(): void {
    this.isReady = false;
    this.isLoading = true;
    this.$hub.saveManager(this.currentHub).subscribe({
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
}


@Component({
  selector: 'kng-hub',
  templateUrl: './kng-hub.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHUBComponent extends KngHUBBase {
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


@Component({
  selector: 'kng-hub-manager',
  templateUrl: './kng-hub-manager.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngHUBManagerComponent extends KngHUBBase {
  mapVendors: Record<string, string> = {};
  mapCategories: Record<string, Category> = {};
  vendors: Shop[] = [];
  newUser = '';

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
    this.mapVendors = {};
    this.vendors = [];
    super.ngOnInit();

    this.$shops.query({ status: true }).subscribe(vendors => {
      this.vendors = vendors.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
      this.vendors.forEach(vendor => this.mapVendors[vendor._id] = vendor.name);
    });

    this.categories.forEach(cat => this.mapCategories[cat._id] = cat);
  }

  addDate(): void {
    const day = new Date();
    this.currentHub.noshipping.push({
      reason: { en: '', fr: '', de: '' },
      from: day,
      to: day
    });
  }

  getShopName(id: string): string {
    return this.mapVendors[id];
  }

  getCategoryName(id: string): string {
    return this.mapCategories[id]?.name || '';
  }

  getAvailableVendors(filter?: any): Shop[] {
    return this.vendors.filter(vendor => {
      const a = this.currentHub.vendors.indexOf(vendor._id) === -1;
      const b = vendor.status || (vendor.created > this.sixMOnth);
      return a && b;
    });
  }

  getAvailableCategories(filter?: any): Category[] {
    return this.categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  delCategory(idx: number): void {
    this.currentHub.categories.splice(idx, 1);
  }

  delManager(idx: number): void {
    this.currentHub.manager.splice(idx, 1);
  }

  addManager(): void {
    if (!this.currentHub.manager) {
      this.currentHub.manager = [];
    }
    this.currentHub.manager.push(this.newUser);
    this.newUser = '';
  }

  addLogistic(): void {
    if (!this.currentHub.logistic) {
      this.currentHub.logistic = [];
    }
    this.currentHub.logistic.push(this.newUser);
    this.newUser = '';
  }

  delLogistic(idx: number): void {
    this.currentHub.logistic.splice(idx, 1);
  }

  delVendor(idx: number): void {
    this.currentHub.vendors.splice(idx, 1);
  }

  onAddCategory($event: any): void {
    this.currentHub.categories.push($event._id || $event.value);
  }

  onAddVendor($event: any): void {
    this.currentHub.vendors.push($event._id || $event.value);
  }
}


@Component({
  selector: 'kng-information',
  templateUrl: './kng-hub-information.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngInformationCfgComponent extends KngHUBBase {
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
