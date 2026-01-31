import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { CartService, CartSubscription, CartSubscriptionProductItem, Config, LoaderService, CartItemsContext } from 'kng2-core';
import { i18n } from '../common';
import { Subscription } from 'rxjs';
import { SUBSCRIPTION_I18N } from './kng-subscription-i18n';

@Component({
  selector: 'kng-subscription-item',
  templateUrl: './kng-subscription-item.component.html',
  styleUrls: ['./kng-subscription-item.component.scss']
})
export class KngSubscriptionItemComponent implements OnInit, OnChanges, OnDestroy {

  // ✅ MIGRATION: Utiliser le fichier i18n centralisé
  i18n = SUBSCRIPTION_I18N;

  // ===== INPUTS =====
  @Input() contract: CartSubscription;
  @Input() config: Config;
  @Input() locale: string = 'fr';
  @Input() showTitle: boolean = true;
  @Input() allowSave: boolean = true;
  @Input() allowAddItem: boolean = true;

  // ===== OUTPUTS =====
  @Output() updateComplete = new EventEmitter<CartSubscription>();
  @Output() updateError = new EventEmitter<any>();
  @Output() contractItemsChanged = new EventEmitter<CartSubscriptionProductItem[]>();
  @Output() pendingItemsChanged = new EventEmitter<any[]>();
  @Output() addItemClick = new EventEmitter<void>();

  // ===== STATE =====
  contractItems: CartSubscriptionProductItem[] = [];
  pendingItems: any[] = [];
  isRunning: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  private _subscription: Subscription;

  constructor(
    private $cart: CartService,
    private $i18n: i18n,
    private $loader: LoaderService
  ) {
    this._subscription = new Subscription();
  }

  // ===== GETTERS I18N =====
  get label() {
    return this.i18n[this.locale] || this.i18n.fr;
  }

  get globalLabel() {
    return this.$i18n.label();
  }

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.loadItems();

    this._subscription.add(
      this.$loader.update().subscribe(emit => {
        if (!emit.state) {
          return;
        }
        this.loadPendingItems();
      })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['contract'] && this.contract) {
      this.loadItems();
    }
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  // ===== PRIVATE METHODS =====
  private loadItems() {
    this.loadContractItems();
    this.loadPendingItems();
    this.error = null;
    this.successMessage = null;
  }

  private loadContractItems() {
    if (!this.contract || !this.contract.items) {
      this.contractItems = [];
    } else {
      this.contractItems = JSON.parse(JSON.stringify(this.contract.items));
    }
  }

  private loadPendingItems() {
    if (!this.config || !this.contract) {
      this.pendingItems = [];
      return;
    }

    const hub = this.contract.items?.[0]?.hub || this.config.shared.hub.slug;

    const ctx = {
      forSubscription: true,
      onSubscription: true,
      hub: hub
    };

    this.pendingItems = this.$cart.getItems(ctx);
  }

  // ===== PUBLIC METHODS =====

  hasChanges(): boolean {
    const hasContractChanges = this.contractItems.some(item => item['updated'] === true);
    const hasPendingItems = this.pendingItems.length > 0;
    return hasContractChanges || hasPendingItems;
  }

  private createCartContext(): CartItemsContext {
    const hub = this.contract?.items?.[0]?.hub || this.config?.shared?.hub?.slug || '';
    return {
      forSubscription: true,
      onSubscription: true,
      hub: hub
    };
  }

  getServiceFees(): number {
    if (!this.config || !this.contract) {
      return 0;
    }

    const feesRate = this.config.shared?.hub?.serviceFees || 0;
    const total = this.getItemsSubTotal();
    return total * feesRate;
  }

  getShippingFees(): number {
    if (!this.config || !this.contract || !this.contract.shipping) {
      return 0;
    }

    const ctx = { ...this.createCartContext(), address: this.contract.shipping };
    const { price: basePrice, status } = this.$cart.estimateShippingFeesWithoutReduction(ctx);

    if (status === 'deposit' || status === 'plan') {
      return basePrice;
    }

    const shipping = this.config?.shared?.shipping;
    if (!shipping) return basePrice;

    const cacheTimePrice = this.$cart.getCurrentShippingTimePrice() || 0;

    const contractTime = (this.contract.shipping as any)?.hours ?? (this.contract as any)?.hours;
    const contractTimePrice = (contractTime !== undefined && shipping.pricetime)
      ? (shipping.pricetime[contractTime] || 0)
      : 0;

    let adjustedBasePrice = basePrice - cacheTimePrice + contractTimePrice;

    const combinedTotal = this.getItemsSubTotal();

    let finalPrice = adjustedBasePrice;
    if (shipping.discountB && combinedTotal >= shipping.discountB) {
      finalPrice = Math.max(adjustedBasePrice - (shipping.priceB || 0), 0);
    } else if (shipping.discountA && combinedTotal >= shipping.discountA) {
      finalPrice = Math.max(adjustedBasePrice - (shipping.priceA || 0), 0);
    }

    return finalPrice;
  }

  getItemsSubTotal(): number {
    const contractTotal = this.contractItems
      .filter(item => !item['deleted'])
      .reduce((sum, item) => {
        const itemPrice = item.fees ?? (item.unit_amount ? item.unit_amount / 100 : 0);
        return sum + (item.quantity * itemPrice);
      }, 0);

    const pendingTotal = this.pendingItems
      .reduce((sum, item) => sum + (item.finalprice || 0), 0);

    return contractTotal + pendingTotal;
  }

  getTotalAmount(): number {
    const itemsTotal = this.getItemsSubTotal();
    const serviceFees = this.getServiceFees();
    const shippingFees = this.getShippingFees();

    return itemsTotal + serviceFees + shippingFees;
  }

  // ===== ACTIONS SUR LES ITEMS DU CONTRAT =====

  onContractAdd(item: CartSubscriptionProductItem) {
    item.quantity++;
    item['updated'] = true;
    delete item['deleted'];
    this.contractItemsChanged.emit(this.contractItems);
  }

  onContractRemove(item: CartSubscriptionProductItem) {
    item.quantity--;
    item['updated'] = true;
    if (item.quantity <= 0) {
      item['deleted'] = true;
      item.quantity = 0;
    }
    this.contractItemsChanged.emit(this.contractItems);
  }

  onContractRemoveAll(item: CartSubscriptionProductItem) {
    item.quantity = 0;
    item['updated'] = true;
    item['deleted'] = true;
    this.contractItemsChanged.emit(this.contractItems);
  }

  // ===== ACTIONS SUR LES ITEMS DU PANIER (pending) =====

  onPendingAdd(item: any, variant?: string) {
    this.$cart.add(item, variant);
    this.pendingItemsChanged.emit(this.pendingItems);
  }

  onPendingRemove(item: any, variant?: string) {
    this.$cart.remove(item, variant);
    this.pendingItemsChanged.emit(this.pendingItems);
  }

  onPendingRemoveAll(item: any, variant?: string) {
    this.$cart.removeAll(item, variant);
    this.pendingItemsChanged.emit(this.pendingItems);
  }

  onCancel() {
    if (this.hasChanges()) {
      const confirmMsg = this.label.msg_confirm_changes;
      if (confirm(confirmMsg)) {
        this.loadItems();
        this.contractItemsChanged.emit(this.contractItems);
        this.pendingItemsChanged.emit(this.pendingItems);
      }
    }
  }

  onAddItem() {
    this.addItemClick.emit();
  }

  async onSave() {
    this.isRunning = true;
    this.error = null;
    this.successMessage = null;
    this.$cart.clearErrors();

    const updated = this.contractItems.filter(item => item['updated']);

    const newItems = this.pendingItems.map(item => {
      const deprecatedItem = item.toDEPRECATED();
      if (this.contract.frequency) {
        deprecatedItem.frequency = this.contract.frequency;
      }
      return deprecatedItem;
    });

    if (updated.length === 0 && newItems.length === 0) {
      this.error = this.label.msg_no_changes;
      this.isRunning = false;
      return;
    }

    const hub = this.contract.items?.[0]?.hub || this.config.shared.hub.slug;

    const subParams = {
      hub: hub,
      shipping: this.contract.shipping,
      items: newItems,
      updated: updated,
      payment: this.contract.paymentAlias,
      frequency: this.contract.frequency,
      dayOfWeek: this.contract.dayOfWeek,
      plan: this.contract.plan
    };

    try {
      const result = await this.$cart.subscriptionUpdate(
        this.contract.id,
        subParams
      ).toPromise();

      if (result.errors) {
        this.contractItems.forEach(item => {
          item.error = result.errors[item.sku];
        });
        this.pendingItems.forEach(item => {
          item.error = result.errors[item.sku];
        });
        this.error = this.label.msg_item_error;
        this.updateError.emit(result.errors);
      } else {
        this.successMessage = this.label.msg_success;

        this.updateComplete.emit(result);

        if (result.items) {
          this.contractItems = JSON.parse(JSON.stringify(result.items));
        }

        if (newItems.length > 0) {
          this.pendingItems.forEach(item => {
            this.$cart.removeAll(item, item.variant);
          });
          this.pendingItems = [];
        }

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      }
    } catch (err) {
      this.error = err.error || err.message || this.label.msg_error;
      this.updateError.emit(err);
    } finally {
      this.isRunning = false;
    }
  }
}
