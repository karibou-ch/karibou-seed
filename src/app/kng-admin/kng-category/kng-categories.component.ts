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
    <div class="adm-dialog-overlay" *ngIf="isOpen" (click)="onClose()">
      <div class="adm-dialog" (click)="$event.stopPropagation()">

        <div class="adm-dialog-header">
          <span>{{isCreate ? 'Créer' : 'Modifier'}} une catégorie</span>
          <wa-button appearance="text" size="small" (click)="onClose()">
            <span class="material-symbols-outlined">close</span>
          </wa-button>
        </div>

        <form *ngIf="category" #dlgForm="ngForm" style="display:flex;flex-direction:column;gap:var(--adm-space-3)">

          <wa-input ngDefaultControl size="small" label="Nom" name="name"
                    [(ngModel)]="category.name"></wa-input>

          <wa-textarea ngDefaultControl size="small" label="Description" resize="auto" rows="2"
                       name="description"
                       [(ngModel)]="category.description"></wa-textarea>

          <div style="display:flex;gap:var(--adm-space-3)">
            <wa-input ngDefaultControl size="small" label="Groupe" style="flex:1"
                      name="group"
                      [(ngModel)]="category.group"></wa-input>

            <wa-input ngDefaultControl size="small" label="Poids" type="number" style="flex:1"
                      name="weight"
                      [(ngModel)]="category.weight"></wa-input>

            <wa-input ngDefaultControl size="small" label="Couleur" style="flex:1"
                      name="color"
                      [(ngModel)]="category.color"></wa-input>
          </div>

          <div style="display:flex;gap:var(--adm-space-4)">
            <wa-checkbox ngDefaultControl size="small" name="active"
                         [(ngModel)]="category.active">Actif</wa-checkbox>
            <wa-checkbox ngDefaultControl size="small" name="home"
                         [(ngModel)]="category.home">Page d'accueil</wa-checkbox>
          </div>

          <div style="display:flex;flex-direction:column;gap:var(--adm-space-2)">
            <span style="font-size:var(--adm-font-size-xs);color:var(--adm-text-label)">Type</span>
            <div style="display:flex;gap:var(--adm-space-2)">
              <wa-button size="small"
                         [appearance]="category.type === 'Category' ? 'filled' : 'outlined'"
                         (click)="category.type = 'Category'">Catégorie</wa-button>
              <wa-button size="small"
                         [appearance]="category.type === 'Group' ? 'filled' : 'outlined'"
                         (click)="category.type = 'Group'">Groupe</wa-button>
              <wa-button size="small"
                         [appearance]="category.type === 'Catalog' ? 'filled' : 'outlined'"
                         (click)="category.type = 'Catalog'">Catalogue</wa-button>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:var(--adm-space-2)">
            <span style="font-size:var(--adm-font-size-xs);color:var(--adm-text-label)">Image</span>
            <div style="display:flex;align-items:center;gap:var(--adm-space-3)">
              <img *ngIf="category.cover" [src]="getImagePrefix(category.cover)"
                   style="width:56px;height:56px;object-fit:cover;border-radius:var(--adm-radius-m);border:1px solid var(--adm-border)">
              <ngx-uploadcare-widget
                [imagesOnly]="true"
                [value]="category.cover"
                [validator]="ucValidator"
                (on-upload-complete)="onUpload($event)"
                (on-dialog-open)="onDialogOpenUC($event)"
                [public-key]="pubUpcare">
              </ngx-uploadcare-widget>
            </div>
            <wa-callout *ngIf="uploadError" variant="danger" style="font-size:var(--adm-font-size-xs)">{{uploadError}}</wa-callout>
          </div>

        </form>

        <div class="adm-action-row" style="margin-top:var(--adm-space-4)">
          <wa-button *ngIf="!isCreate" size="small" appearance="outlined"
                     (click)="onDelete()" style="margin-right:auto;color:var(--wa-color-danger-600)">
            <span class="material-symbols-outlined" slot="prefix">delete</span>
            Supprimer
          </wa-button>
          <wa-button size="small" appearance="outlined" (click)="onClose()">Annuler</wa-button>
          <wa-button size="small" appearance="filled" (click)="onSave()">Enregistrer</wa-button>
        </div>

      </div>
    </div>
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
