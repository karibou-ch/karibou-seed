import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CategoryService,
  Category,
  Config,
  LoaderService,
  Hub,
} from 'kng2-core';
import { KngNavigationStateService, i18n } from '../../common';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'kng-category-dlg',
  template: `
    <wa-dialog class="kng-register-config" [label]="(isCreate ? $i18n.adm().create : $i18n.adm().edit) + ' — ' + $i18n.adm().nav_categories"
               [open]="isOpen" (wa-hide)="onClose()" light-dismiss>
      <form *ngIf="category" class="kng-form" #dlgForm="ngForm">
        <wa-input ngDefaultControl size="small" [label]="$i18n.adm().name" name="name" [(ngModel)]="category.name"></wa-input>
        <wa-textarea ngDefaultControl size="small" [label]="$i18n.adm().description" resize="auto" rows="2"
                     name="description" [(ngModel)]="category.description"></wa-textarea>
        <div class="kng-form-row">
          <wa-input class="is-grow" ngDefaultControl size="small" [label]="$i18n.adm().group" name="group" [(ngModel)]="category.group"></wa-input>
          <wa-input ngDefaultControl size="small" [label]="$i18n.adm().weight" type="number" name="weight" [(ngModel)]="category.weight"></wa-input>
          <wa-input ngDefaultControl size="small" [label]="$i18n.adm().primary_color" name="color" [(ngModel)]="category.color"></wa-input>
        </div>
        <div class="kng-form-row">
          <wa-checkbox ngDefaultControl size="small" name="active" [(ngModel)]="category.active">{{ $i18n.adm().active }}</wa-checkbox>
          <wa-checkbox ngDefaultControl size="small" name="home" [(ngModel)]="category.home">{{ $i18n.adm().home_flag }}</wa-checkbox>
        </div>
        <wa-radio-group size="small" orientation="horizontal" [label]="$i18n.adm().type" [value]="category.type"
                        (change)="category.type = $any($event.target).value">
          <wa-radio appearance="button" value="Category">{{ $i18n.adm().nav_categories }}</wa-radio>
          <wa-radio appearance="button" value="Group">{{ $i18n.adm().group }}</wa-radio>
          <wa-radio appearance="button" value="Catalog">{{ $i18n.adm().nav_catalogue }}</wa-radio>
        </wa-radio-group>
        <div class="kng-inline-field">
          <img *ngIf="category.cover" class="kng-thumb kng-thumb--lg" [src]="getImagePrefix(category.cover)" alt="">
          <ngx-uploadcare-widget [imagesOnly]="true" [value]="category.cover" [validator]="ucValidator"
            (on-upload-complete)="onUpload($event)" (on-dialog-open)="onDialogOpenUC($event)" [public-key]="pubUpcare">
          </ngx-uploadcare-widget>
        </div>
        <wa-callout *ngIf="uploadError" variant="danger" size="small">{{ uploadError }}</wa-callout>
      </form>
      <div slot="footer" class="kng-dialog-footer">
        <wa-button *ngIf="!isCreate" class="is-start" size="small" appearance="plain" variant="danger" (click)="onDelete()">
          <span class="material-symbols-outlined" slot="start" aria-hidden="true">delete</span>
          {{ $i18n.adm().delete }}
        </wa-button>
        <wa-button size="small" appearance="plain" (click)="onClose()">{{ $i18n.adm().cancel }}</wa-button>
        <wa-button size="small" variant="brand" (click)="onSave()">{{ $i18n.adm().save }}</wa-button>
      </div>
    </wa-dialog>
  `
})
export class KngCategoryDlgComponent {
  isOpen = false;
  isCreate = false;
  category: Category;
  pubUpcare = '';
  uploadError = '';

  private saveCallback: (category: Category) => void;
  private deleteCallback: () => void;

  constructor(public $i18n: i18n) {}

  open(data: { category: Category; pubUpcare: string; isCreate: boolean },
       onSave: (category: Category) => void,
       onDelete: () => void): void {
    this.isOpen = true;
    this.category = { ...data.category };
    this.pubUpcare = data.pubUpcare;
    this.isCreate = data.isCreate;
    this.saveCallback = onSave;
    this.deleteCallback = onDelete;
  }

  onClose(): void {
    this.isOpen = false;
  }

  onSave(): void {
    if (this.saveCallback) {
      this.category.weight = +this.category.weight;
      this.saveCallback(this.category);
    }
    this.isOpen = false;
  }

  onDelete(): void {
    if (this.deleteCallback) {
      this.deleteCallback();
    }
    this.isOpen = false;
  }

  getImagePrefix(image: string): string {
    return /^((http|https):\/\/)/.test(image) ? image : 'https:' + image;
  }

  ucValidator(info: { size: number | null }): void {
    if (info.size !== null && info.size > 150 * 1024) {
      throw new Error('fileMaximumSize');
    }
  }

  onDialogOpenUC(dialog: { done: (cb: (dlg: { state: () => string }) => void) => void } | null): void {
    if (!dialog?.done) { return; }
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.uploadError = this.$i18n.label().img_max_sz as string;
        setTimeout(() => this.uploadError = '', 4000);
      }
    });
  }

  onUpload(info: { cdnUrl: string }): void {
    if (this.category && this.category.cover !== info.cdnUrl) {
      this.category.cover = info.cdnUrl;
      this.uploadError = '';
    }
  }
}


@Component({
  selector: 'kng-categories',
  templateUrl: './kng-categories.component.html',
  styleUrls: ['./kng-categories.component.scss']
})
export class KngCategoriesComponent implements OnInit, OnDestroy {
  @ViewChild(KngCategoryDlgComponent) categoryDialog: KngCategoryDlgComponent;
  
  isReady = false;
  config: Config;
  categories: Category[] = [];
  currenHub: Hub;
  saveMessage = '';
  saveError = '';

  edit: {
    category: Category | null;
    create: boolean;
    pubUpcare: string;
  };

  get labels() {
    return this.$i18n.adm();
  }

  constructor(
    private $i18n: i18n,
    private $loader: LoaderService,
    private $category: CategoryService,
    private $route: ActivatedRoute,
    private $navigation: KngNavigationStateService
  ) {
    const { config } = this.$loader.getLatestCoreData();
    this.config = config;
    this.isReady = true;
    this.currenHub = this.config?.shared?.hub || {};

    this.edit = {
      create: false,
      category: null,
      pubUpcare: this.config?.shared?.keys?.pubUpcare || ''
    };
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
  }

  ngOnDestroy(): void {}

  getImagePrefix(image: string): string {
    if (!/^((http|https):\/\/)/.test(image)) {
      return 'https:' + image;
    }
    return image;
  }

  async loadCategories(): Promise<void> {
    const categories = await firstValueFrom(this.$category.select({ stats: true }));
    this.categories = categories.sort(this.sortByGroupAndWeight.bind(this));
  }

  onSave(value: any): void {
    this.isReady = false;
    Object.assign(this.edit.category, value);
    
    const editor = this.edit.create
      ? this.$category.create(this.edit.category)
      : this.$category.save(this.edit.category.slug, this.edit.category);
    
    editor.subscribe({
      next: (category) => {
        if (this.edit.create) {
          category.usedBy = [];
          this.categories.push(category);
        } else {
          const idx = this.categories.findIndex(c => c.slug === category.slug);
          if (idx >= 0) {
            this.categories[idx] = category;
          }
        }
        this.edit.category = null;
        this.edit.create = false;
        this.isReady = true;
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => {
        this.showError(err.error);
        this.isReady = true;
      }
    });
  }

  onDecline(): void {
    this.edit.category = null;
  }

  onDelete(): void {
    const pwd = window.prompt(this.$i18n.label().user_confirm_password, 'CONFIRMER AVEC LE PASSWORD');
    
    this.$category.remove(this.edit.category.slug, pwd).subscribe({
      next: () => this.handleDeleteSuccess(),
      error: (err) => {
        if (err.status === 200) {
          return this.handleDeleteSuccess();
        }
        this.showError(err.error);
      }
    });
  }

  private handleDeleteSuccess(): void {
    this.showSuccess(this.$i18n.label().delete_ok);
    const position = this.categories.findIndex(elem => elem.slug === this.edit.category.slug);
    if (position > -1) {
      this.categories.splice(position, 1);
    }
    this.edit.create = false;
    this.edit.category = null;
  }

  onCategorySelect(event: Event, category: Category): void {
    this.edit.category = category;
    this.edit.create = false;

    if (this.categoryDialog) {
      this.categoryDialog.open(
        { category: this.edit.category, pubUpcare: this.edit.pubUpcare, isCreate: false },
        (value) => this.onSave(value),
        () => this.onDelete()
      );
    }
  }

  onCategoryCreate(): void {
    this.edit.category = new Category();
    this.edit.category.usedBy = [];
    this.edit.create = true;
    
    if (this.categoryDialog) {
      this.categoryDialog.open(
        { category: this.edit.category, pubUpcare: this.edit.pubUpcare, isCreate: true },
        (value) => this.onSave(value),
        () => this.onDecline()
      );
    }
  }

  trackCategory(_idx: number, cat: Category): string {
    return cat?._id ?? cat as any;
  }

  sortByGroupAndWeight(c1: Category, c2: Category): number {
    const g1 = c1.group || '';
    const g2 = c2.group || '';
    if (g1 === g2) {
      return c1.weight - c2.weight;
    }
    return g1.toLowerCase().localeCompare(g2.toLowerCase());
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
