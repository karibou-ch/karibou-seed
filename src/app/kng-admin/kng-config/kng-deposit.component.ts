import { Component, ViewChild } from '@angular/core';
import { Hub, UserAddress, DepositAddress } from 'kng2-core';
import { i18n, KngUtils } from 'src/app/common';
import { KngHUBBase } from './kng-hub.component';

type DepositDraft = Partial<DepositAddress> & { name?: string; streetAdress?: string; postalCode?: string; region?: string; floor?: string; note?: string; fees?: number; weight?: number; active?: boolean; geo?: { lat?: number; lng?: number } };

@Component({
  selector: 'kng-deposit-dlg',
  template: `
    <wa-dialog class="kng-register-config" [label]="(isEdit ? $i18n.adm().edit : $i18n.adm().add) + ' — ' + $i18n.adm().nav_deposits"
               [open]="isOpen" (wa-hide)="onClose()" light-dismiss>
      <form *ngIf="address" class="kng-form" #dlgForm="ngForm">
        <wa-input ngDefaultControl size="small" [label]="$i18n.adm().name" name="name" [(ngModel)]="address.name"></wa-input>
        <div class="kng-form-row">
          <wa-input class="is-grow" ngDefaultControl size="small" [label]="$i18n.adm().street" name="street"
                    [(ngModel)]="address.streetAdress" (ngModelChange)="onGeoChange()"></wa-input>
          <wa-input ngDefaultControl size="small" [label]="$i18n.adm().floor" name="floor" [(ngModel)]="address.floor"></wa-input>
        </div>
        <div class="kng-form-row">
          <wa-input ngDefaultControl size="small" [label]="$i18n.adm().postal" name="postalCode"
                    [(ngModel)]="address.postalCode" (ngModelChange)="onGeoChange()"></wa-input>
          <wa-input class="is-grow" ngDefaultControl size="small" [label]="$i18n.adm().region" name="region"
                    [(ngModel)]="address.region" (ngModelChange)="onGeoChange()"></wa-input>
        </div>
        <wa-textarea ngDefaultControl size="small" [label]="$i18n.adm().note" resize="auto" rows="2" name="note"
                     [(ngModel)]="address.note"></wa-textarea>
        <div class="kng-form-row">
          <wa-input ngDefaultControl size="small" [label]="$i18n.adm().fees" type="number" name="fees" [(ngModel)]="address.fees"></wa-input>
          <wa-input ngDefaultControl size="small" [label]="$i18n.adm().weight" type="number" name="weight" [(ngModel)]="address.weight"></wa-input>
        </div>
        <wa-checkbox ngDefaultControl size="small" name="active" [(ngModel)]="address.active">{{ $i18n.adm().active }}</wa-checkbox>
        <img *ngIf="address.geo" class="kng-deposit-map" [src]="getStaticMap(address)" alt="">
      </form>
      <div slot="footer" class="kng-dialog-footer">
        <wa-button *ngIf="isEdit" class="is-start" size="small" appearance="plain" variant="danger" (click)="onDelete()">
          <span class="material-symbols-outlined" slot="start" aria-hidden="true">delete</span>
          {{ $i18n.adm().delete }}
        </wa-button>
        <wa-button size="small" appearance="plain" (click)="onClose()">{{ $i18n.adm().cancel }}</wa-button>
        <wa-button size="small" variant="brand" (click)="onSave()">{{ $i18n.adm().save }}</wa-button>
      </div>
    </wa-dialog>
  `
})
export class KngDepositDlgComponent {
  isOpen = false;
  isEdit = false;
  address: DepositDraft | null = null;

  private saveCallback: (address: DepositDraft) => void = () => {};
  private deleteCallback: () => void = () => {};
  private $util: KngUtils;

  constructor(public $i18n: i18n, util: KngUtils) {
    this.$util = util;
  }

  open(data: { edit?: { address: DepositDraft }; pubMap: string },
       onSave: (address: DepositDraft) => void,
       onDelete: () => void): void {
    this.isOpen = true;
    this.saveCallback = onSave;
    this.deleteCallback = onDelete;

    if (data.edit) {
      this.isEdit = true;
      this.address = { ...data.edit.address };
    } else {
      this.isEdit = false;
      this.address = { fees: 0, weight: 0, active: true };
    }
  }

  onClose(): void {
    this.isOpen = false;
  }

  onSave(): void {
    if (!this.address) { return; }
    this.address.fees = +(this.address.fees ?? 0);
    this.address.weight = +(this.address.weight ?? 0);
    this.saveCallback(this.address);
    this.isOpen = false;
  }

  onDelete(): void {
    this.deleteCallback();
    this.isOpen = false;
  }

  onGeoChange(): void {
    const a = this.address;
    if (a?.streetAdress && a.postalCode && a.region) {
      this.$util.updateGeoCode(a.streetAdress, a.postalCode, a.region);
    }
  }

  getStaticMap(address: Partial<UserAddress>): string {
    return KngUtils.getStaticMap(address as UserAddress);
  }
}


@Component({
  selector: 'kng-deposit',
  templateUrl: './kng-deposit.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngDepositComponent extends KngHUBBase {
  @ViewChild(KngDepositDlgComponent) depositDialog: KngDepositDlgComponent;

  pubMap = '';

  edit: {
    idx: number | null;
    address: DepositDraft | null;
  } = {
    idx: null,
    address: null
  };

  ngOnInit(): void {
    super.ngOnInit();
    this.pubMap = this.config?.shared?.keys?.pubMap || '';

    this.$utils.getGeoCode().subscribe(result => {
      if (result.geo && this.depositDialog?.address) {
        this.depositDialog.address.geo = {
          lat: result.geo.location?.lat,
          lng: result.geo.location?.lng
        };
      }
    });
  }

  getStaticMap(address: Partial<UserAddress>): string {
    return KngUtils.getStaticMap(address as UserAddress);
  }

  onDelete(): void {
    if (this.edit.idx == null) { return; }
    this.currentHub.deposits.splice(this.edit.idx, 1);
    this.$hub.saveManager(this.currentHub).subscribe({
      next: (hub: Hub) => {
        this.currentHub.deposits = hub?.deposits ?? this.currentHub.deposits;
        this.edit.address = null;
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => this.showError(err.error)
    });
  }

  onSave(address: DepositDraft): void {
    this.isReady = false;
    this.currentHub.deposits = this.currentHub.deposits || [];

    if (this.edit.idx == null) {
      this.currentHub.deposits = [...this.currentHub.deposits, address as DepositAddress];
      this.edit.idx = this.currentHub.deposits.length - 1;
    } else {
      this.currentHub.deposits = this.currentHub.deposits.map((d, i) =>
        i === this.edit.idx ? { ...d, ...address } as DepositAddress : d
      );
    }

    this.$hub.saveManager(this.currentHub).subscribe({
      next: (hub: Hub) => {
        if (hub?.deposits) {
          this.currentHub.deposits = hub.deposits;
        }
        this.edit.address = null;
        this.edit.idx = null;
        this.isReady = true;
        this.showSuccess(this.$i18n.label().save_ok);
      },
      error: (err) => {
        this.isReady = true;
        this.showError(err.error);
      }
    });
  }

  onAddressCreate(): void {
    this.edit.idx = null;
    this.edit.address = null;
    if (this.depositDialog) {
      this.depositDialog.open(
        { pubMap: this.pubMap },
        (address) => this.onSave(address),
        () => this.onDelete()
      );
    }
  }

  trackDeposit(idx: number): number { return idx; }

  onAddressSelect(_event: Event, address: DepositAddress, idx: number): void {
    this.edit.idx = idx;
    this.edit.address = { ...address };
    if (this.depositDialog) {
      this.depositDialog.open(
        { edit: { address: this.edit.address }, pubMap: this.pubMap },
        (a) => this.onSave(a),
        () => this.onDelete()
      );
    }
  }
}
