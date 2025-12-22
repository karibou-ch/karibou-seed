import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UserAddress, Hub, DepositAddress } from 'kng2-core';
import { i18n, KngUtils } from 'src/app/common';
import { KngHUBBase } from './kng-hub.component';

/**
 * Dialog component for deposit editing - inline version (no MDC)
 */
@Component({
  selector: 'kng-deposit-dlg',
  template: `
    <wa-dialog [open]="isOpen" (wa-hide)="onClose()">
      <div slot="label">{{isEdit ? 'Modifier' : 'Ajouter'}} un dépôt</div>
      
      <form [formGroup]="form" class="deposit-form">
        <wa-input size="small" label="Nom" formControlName="name"></wa-input>
        <wa-input size="small" label="Adresse" formControlName="streetAddress" (wa-input)="onAddressChange()"></wa-input>
        <wa-input size="small" label="Étage" formControlName="floor"></wa-input>
        <wa-input size="small" label="Code postal" formControlName="postalCode" (wa-input)="onAddressChange()"></wa-input>
        <wa-input size="small" label="Région" formControlName="region"></wa-input>
        <wa-textarea size="small" label="Note" formControlName="note" resize="auto" rows="2"></wa-textarea>
        <wa-input size="small" label="Frais" type="number" formControlName="fees"></wa-input>
        <wa-input size="small" label="Poids" type="number" formControlName="weight"></wa-input>
        <wa-checkbox size="small" formControlName="active">Actif</wa-checkbox>
        
        <div class="geo-preview" *ngIf="address?.geo">
          <img [src]="getStaticMap(address)">
        </div>
      </form>
      
      <div slot="footer" class="dialog-footer">
        <wa-button size="small" appearance="text" (click)="onDelete()" *ngIf="isEdit">Supprimer</wa-button>
        <wa-button size="small" appearance="outlined" (click)="onClose()">Annuler</wa-button>
        <wa-button size="small" appearance="filled" (click)="onSave()" [disabled]="form.invalid">Enregistrer</wa-button>
      </div>
    </wa-dialog>
  `,
  styles: [`
    .deposit-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 400px;
    }
    .geo-preview img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 4px;
    }
    .dialog-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `]
})
export class KngDepositDlgComponent {
  isOpen = false;
  isEdit = false;
  address: any = {};
  idx: number | null = null;
  pubMap = '';
  
  private saveCallback: (value: any) => void;
  private deleteCallback: () => void;

  form = this.$fb.group({
    'weight': [0, [Validators.required, Validators.min(0)]],
    'active': [true],
    'name': ['', [Validators.required]],
    'streetAddress': ['', [Validators.required, Validators.minLength(4)]],
    'floor': ['', [Validators.required, Validators.minLength(1)]],
    'postalCode': ['', [Validators.required, Validators.minLength(4)]],
    'region': ['', [Validators.required]],
    'note': ['', [Validators.required]],
    'fees': [0, [Validators.required, Validators.min(0)]]
  });

  constructor(
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $util: KngUtils
  ) {}

  open(data: { edit?: { idx: number; address: any }; pubMap: string }, 
       onSave: (value: any) => void, 
       onDelete: () => void): void {
    this.isOpen = true;
    this.pubMap = data.pubMap;
    this.saveCallback = onSave;
    this.deleteCallback = onDelete;
    
    if (data.edit) {
      this.isEdit = true;
      this.idx = data.edit.idx;
      this.address = { ...data.edit.address };
      this.form.patchValue({
        weight: this.address.weight || 0,
        active: this.address.active !== false,
        name: this.address.name || '',
        streetAddress: this.address.streetAdress || this.address.streetAddress || '',
        floor: this.address.floor || '',
        postalCode: this.address.postalCode || '',
        region: this.address.region || '',
        note: this.address.note || '',
        fees: this.address.fees || 0
      });
    } else {
      this.isEdit = false;
      this.idx = null;
      this.address = {};
      this.form.reset({ weight: 0, active: true, fees: 0 });
    }
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

  onAddressChange(): void {
    const value = this.form.value;
    if (value.streetAddress && value.postalCode && value.region) {
      this.$util.updateGeoCode(value.streetAddress, value.postalCode, value.region);
    }
  }

  getStaticMap(address: UserAddress): string {
    return KngUtils.getStaticMap(address);
  }
}


@Component({
  selector: 'kng-deposit',
  templateUrl: './kng-deposit.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngDepositComponent extends KngHUBBase {
  pubMap = '';
  showDialog = false;
  
  edit: {
    idx: number | null;
    address: any;
    form: any;
  } = {
    idx: null,
    address: null,
    form: null
  };

  ngOnInit(): void {
    super.ngOnInit();
    this.pubMap = this.config?.shared?.keys?.pubMap || '';
    
    // Subscribe to geocode updates
    this.$utils.getGeoCode().subscribe(result => {
      if (result.geo && this.edit.address) {
        this.edit.address.geo = {
          lat: result.geo.location?.lat,
          lng: result.geo.location?.lng
        };
      }
    });
  }

  getStaticMap(address: UserAddress): string {
    return KngUtils.getStaticMap(address);
  }

  assign(value: any): void {
    this.edit.address.fees = value.fees;
    this.edit.address.weight = value.weight;
    this.edit.address.name = value.name;
    this.edit.address.streetAdress = value.streetAddress;
    this.edit.address.floor = value.floor;
    this.edit.address.postalCode = value.postalCode;
    this.edit.address.region = value.region;
    this.edit.address.note = value.note;
    this.edit.address.active = value.active;
  }

  onDelete(): void {
    if (this.edit.idx == null) {
      window.alert('Impossible de supprimer cet élément');
      return;
    }
    this.currentHub.deposits.splice(this.edit.idx, 1);
    this.$hub.saveManager(this.currentHub).subscribe({
      next: () => {
        this.edit.address = null;
        this.showDialog = false;
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => this.showError(err.error)
    });
  }

  onDecline(): void {
    this.edit.idx = null;
    this.edit.address = null;
    this.showDialog = false;
  }

  onSave(value: any): void {
    this.isReady = false;
    this.assign(value);
    
    if (this.edit.idx == null) {
      this.currentHub.deposits = this.currentHub.deposits || [];
      this.edit.idx = this.currentHub.deposits.push({} as DepositAddress) - 1;
    }
    Object.assign(this.currentHub.deposits[this.edit.idx], this.edit.address);

    this.$hub.saveManager(this.currentHub).subscribe({
      next: () => {
        this.edit.address = null;
        this.isReady = true;
        this.showDialog = false;
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => this.showError(err.error)
    });
  }

  onAddressCreate(): void {
    this.edit.idx = null;
    this.edit.address = { fees: 0, active: true };
    this.showDialog = true;
  }

  onAddressSelect(event: Event, address: any, idx: number): void {
    this.edit.idx = idx;
    this.edit.address = { ...address };
    this.showDialog = true;
  }
}
