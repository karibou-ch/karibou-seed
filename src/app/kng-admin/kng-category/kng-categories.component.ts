import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  CategoryService,
  Category,
  LoaderService,
  Hub,
} from 'kng2-core';
import { KngNavigationStateService, i18n } from '../../common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';


/**
 * Dialog component for category editing - inline version
 */
@Component({
  selector: 'kng-category-dlg',
  template: `
    <wa-dialog [open]="isOpen" (wa-hide)="onClose()">
      <div slot="label">{{isCreate ? 'Créer' : 'Modifier'}} une catégorie</div>
      
      <form [formGroup]="form" class="category-form">
        <wa-input size="small" label="Nom" formControlName="name"></wa-input>
        <wa-textarea size="small" label="Description" formControlName="description" resize="auto" rows="2"></wa-textarea>
        <wa-input size="small" label="Groupe" formControlName="group"></wa-input>
        <wa-input size="small" label="Poids (ordre)" type="number" formControlName="weight"></wa-input>
        <wa-input size="small" label="Couleur" formControlName="color"></wa-input>
        
        <div class="form-row">
          <wa-checkbox size="small" formControlName="active">Actif</wa-checkbox>
          <wa-checkbox size="small" formControlName="home">Afficher sur la page d'accueil</wa-checkbox>
        </div>
        
        <div class="form-group">
          <label class="field-label">Type</label>
          <div class="radio-group">
            <wa-button size="small" 
                      [appearance]="form.get('type').value === 'Category' ? 'filled' : 'outlined'"
                      (click)="form.patchValue({type: 'Category'})">Catégorie</wa-button>
            <wa-button size="small" 
                      [appearance]="form.get('type').value === 'Cellar' ? 'filled' : 'outlined'"
                      (click)="form.patchValue({type: 'Cellar'})">Cave</wa-button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="field-label">Image</label>
          <div class="image-container">
            <img *ngIf="category?.cover" [src]="category.cover" class="preview-image">
            <ngx-uploadcare-widget 
              [imagesOnly]="true"
              [validator]="ucValidator"
              (on-upload-complete)="onUpload($event)"
              (on-dialog-open)="onDialogOpen($event)"
              [public-key]="pubUpcare">
            </ngx-uploadcare-widget>
          </div>
        </div>
      </form>
      
      <div slot="footer" class="dialog-footer">
        <wa-button size="small" appearance="text" variant="danger" (click)="onDelete()" *ngIf="!isCreate">Supprimer</wa-button>
        <wa-button size="small" appearance="outlined" (click)="onClose()">Annuler</wa-button>
        <wa-button size="small" appearance="filled" (click)="onSave()" [disabled]="form.invalid">Enregistrer</wa-button>
      </div>
    </wa-dialog>
  `,
  styles: [`
    .category-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 400px;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .field-label {
      font-size: 12px;
      color: #858585;
    }
    .radio-group {
      display: flex;
      gap: 8px;
    }
    .image-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .preview-image {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #3c3c3c;
    }
    .dialog-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `]
})
export class KngCategoryDlgComponent {
  isOpen = false;
  isCreate = false;
  category: Category;
  pubUpcare = '';
  
  private saveCallback: (value: any) => void;
  private deleteCallback: () => void;

  form: FormGroup;

  constructor(
    public $fb: FormBuilder,
    public $i18n: i18n
  ) {
    this.form = this.$fb.group({
      'weight': [0, [Validators.required]],
      'active': [false],
      'home': [false],
      'color': [''],
      'image': ['', [Validators.required]],
      'group': [''],
      'name': ['', [Validators.required]],
      'description': ['', [Validators.required]],
      'type': ['Category', [Validators.required]]
    });
  }

  open(data: { category: Category; pubUpcare: string; isCreate: boolean },
       onSave: (value: any) => void,
       onDelete: () => void): void {
    this.isOpen = true;
    this.category = data.category;
    this.pubUpcare = data.pubUpcare;
    this.isCreate = data.isCreate;
    this.saveCallback = onSave;
    this.deleteCallback = onDelete;

    this.form.setValue({
      'weight': this.category.weight || 0,
      'active': this.category.active || false,
      'home': this.category.home || false,
      'color': this.category.color || '',
      'image': this.category.cover || '',
      'group': this.category.group || '',
      'name': this.category.name || '',
      'description': this.category.description || '',
      'type': this.category.type || 'Category'
    });
  }

  onClose(): void {
    this.isOpen = false;
  }

  onSave(): void {
    if (this.form.valid && this.saveCallback) {
      this.saveCallback(this.form.value);
      this.isOpen = false;
    }
  }

  onDelete(): void {
    if (this.deleteCallback) {
      this.deleteCallback();
      this.isOpen = false;
    }
  }

  ucValidator(info: any): void {
    if (info.size !== null && info.size > 150 * 1024) {
      throw new Error('fileMaximumSize');
    }
  }

  onDialogOpen(dialog: any): void {
    if (dialog?.done) {
      dialog.done(dlg => {
        if (dlg.state() === 'rejected') {
          console.warn(this.$i18n.label().img_max_sz);
        }
      });
    }
  }

  onUpload(info: any): void {
    if (this.category.cover !== info.cdnUrl) {
      this.category.cover = info.cdnUrl;
      this.form.patchValue({ image: info.cdnUrl });
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
  config: any;
  categories: Category[] = [];
  currenHub: Hub;
  saveMessage = '';
  saveError = '';
  
  edit: {
    category: Category;
    form: any;
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
      form: null,
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
    const categories = await this.$category.select({ stats: true }).toPromise();
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
