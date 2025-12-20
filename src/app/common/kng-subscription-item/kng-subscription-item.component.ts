import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { CartService, CartSubscription, CartSubscriptionProductItem, Config, LoaderService, CartItemsContext } from 'kng2-core';
import { i18n } from 'src/app/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'kng-subscription-item',
  templateUrl: './kng-subscription-item.component.html',
  styleUrls: ['./kng-subscription-item.component.scss']
})
export class KngSubscriptionItemComponent implements OnInit, OnChanges, OnDestroy {

  // ===== I18N INTÉGRÉ =====
  i18n: any = {
    fr: {
      // Titre et headers
      title_items: 'Les articles de votre abonnement',
      title_pending_items: 'Les articles que vous souhaitez ajouter',

      // Actions
      action_remove: 'enlever',
      action_save: 'Enregistrer les modifications',
      action_saving: 'Sauvegarde en cours...',
      action_cancel: 'Annuler',
      action_add_item: 'Ajouter un article',

      // Labels
      label_quantity: 'Quantité',
      label_price: 'Prix',
      label_total: 'Total',
      label_variant: 'Variante',
      label_note: 'message',
      label_deleted: 'supprimer',
      label_items_subtotal: 'Sous-total articles',
      label_service_fees: 'Frais de service karibou.ch',
      label_shipping_fees: 'Frais de livraison',
      label_total_amount: 'Total',

      // Messages
      msg_no_items: 'Aucun article dans cet abonnement',
      msg_no_changes: 'Aucune modification à enregistrer',
      msg_success: 'Modifications enregistrées avec succès',
      msg_error: 'Erreur lors de la sauvegarde',
      msg_item_error: 'Certains articles ont des erreurs',
      msg_confirm_changes: 'Vous avez des modifications non sauvegardées',
      msg_blocked_by_payment: 'Vous devez d\'abord confirmer votre paiement avant de pouvoir modifier votre abonnement'
    },
    en: {
      // Title and headers
      title_items: 'Your subscription items',
      title_pending_items: 'Items you want to add',

      // Actions
      action_remove: 'remove',
      action_save: 'Save changes',
      action_saving: 'Saving...',
      action_cancel: 'Cancel',
      action_add_item: 'Add an item',

      // Labels
      label_quantity: 'Quantity',
      label_price: 'Price',
      label_total: 'Total',
      label_variant: 'Variant',
      label_note: 'note',
      label_deleted: 'delete',
      label_items_subtotal: 'Items subtotal',
      label_service_fees: 'Service fees karibou.ch',
      label_shipping_fees: 'Shipping fees',
      label_total_amount: 'Total',

      // Messages
      msg_no_items: 'No items in this subscription',
      msg_no_changes: 'No changes to save',
      msg_success: 'Changes saved successfully',
      msg_error: 'Error while saving',
      msg_item_error: 'Some items have errors',
      msg_confirm_changes: 'You have unsaved changes',
      msg_blocked_by_payment: 'You must first confirm your payment before you can modify your subscription'
    }
  };

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
  contractItems: CartSubscriptionProductItem[] = []; // Items existants du contrat (avec UI state)
  pendingItems: any[] = []; // Items du panier en attente d'ajout
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
    return this.i18n[this.locale];
  }

  get globalLabel() {
    return this.$i18n.label();
  }

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.loadItems();

    // ✅ S'abonner aux changements du panier
    this._subscription.add(
      this.$loader.update().subscribe(emit => {
        if (!emit.state) {
          return;
        }

        // Recharger les items du panier quand il change
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
    // Charger les items du contrat existant
    if (!this.contract || !this.contract.items) {
      this.contractItems = [];
    } else {
      // Copie deep des items du contrat pour modification locale
      this.contractItems = JSON.parse(JSON.stringify(this.contract.items));
    }
  }

  private loadPendingItems() {
    // Charger les items du panier en attente d'ajout
    if (!this.config || !this.contract) {
      this.pendingItems = [];
      return;
    }

    // ✅ Fallback hub si items vide (contrat shipping-only)
    const hub = this.contract.items?.[0]?.hub || this.config.shared.hub.slug;

    // ✅ Contexte pour récupérer les items du panier avec onSubscription: true
    const ctx = {
      forSubscription: true,
      onSubscription: true,
      hub: hub
    };

    // Récupérer les items du panier via CartService
    this.pendingItems = this.$cart.getItems(ctx);
  }

  // ===== PUBLIC METHODS =====

  /**
   * Détecter s'il y a des modifications non sauvegardées
   */
  hasChanges(): boolean {
    // Modifications dans les items existants du contrat
    const hasContractChanges = this.contractItems.some(item => item['updated'] === true);
    // Nouveaux items en attente d'ajout
    const hasPendingItems = this.pendingItems.length > 0;

    return hasContractChanges || hasPendingItems;
  }

  /**
   * ✅ Créer le contexte pour les calculs de panier
   */
  private createCartContext(): CartItemsContext {
    // ✅ Fallback hub si items vide (contrat shipping-only)
    const hub = this.contract?.items?.[0]?.hub || this.config?.shared?.hub?.slug || '';

    return {
      forSubscription: true,
      onSubscription: true,
      hub: hub
    };
  }

  /**
   * ✅ Calculer les frais de service Karibou (calcul manuel car modifications locales)
   */
  getServiceFees(): number {
    if (!this.config || !this.contract) {
      return 0;
    }

    // Récupérer le taux de fees du hub
    const feesRate = this.config.shared.hub.serviceFees || 0;

    // Total items du contrat (avec modifications locales, sans deleted)
    const contractTotal = this.contractItems
      .filter(item => !item['deleted'])
      .reduce((sum, item) => sum + (item.quantity* item.unit_amount), 0);


    // Total items du panier (en attente d'ajout)
    const pendingTotal = this.pendingItems
      .reduce((sum, item) => sum + (item.finalprice || 0), 0);

    // ✅ Calcul correct: (contractTotal + pendingTotal) * feesRate
    return (contractTotal/100 + pendingTotal) * feesRate;
  }

  /**
   * ✅ Calculer les frais de livraison (utilise CartService)
   */
  getShippingFees(): number {
    if (!this.config || !this.contract || !this.contract.shipping) {
      return 0;
    }

    // ✅ Utiliser la méthode CartService comme dans kng-cart-checkout
    const ctx = { ...this.createCartContext(), address: this.contract.shipping };
    return this.$cart.computeShippingFees(ctx);
  }


  /**
   * ✅ Calculer le sous-total des items (sans services)
   */
  getItemsSubTotal(): number {
    // Total items contrat (avec modifications, sans les items supprimés)
    const contractTotal = this.contractItems
      .filter(item => !item['deleted'])
      .reduce((sum, item) => sum + (item.quantity* item.unit_amount), 0);

    // Total items panier (en attente d'ajout)
    const pendingTotal = this.pendingItems
      .reduce((sum, item) => sum + (item.finalprice || 0), 0);

    return contractTotal/100 + pendingTotal;
  }

  /**
   * ✅ Calculer le total général (items + services + shipping)
   */
  getTotalAmount(): number {
    const itemsTotal = this.getItemsSubTotal();
    const serviceFees = this.getServiceFees();
    const shippingFees = this.getShippingFees();

    return itemsTotal + serviceFees + shippingFees;
  }

  /**
   * ===== ACTIONS SUR LES ITEMS DU CONTRAT =====
   */

  /**
   * Incrémenter la quantité d'un item du contrat
   */
  onContractAdd(item: CartSubscriptionProductItem) {
    item.quantity++;
    item['updated'] = true;
    delete item['deleted'];
    this.contractItemsChanged.emit(this.contractItems);
  }

  /**
   * Décrémenter la quantité d'un item du contrat
   */
  onContractRemove(item: CartSubscriptionProductItem) {
    item.quantity--;
    item['updated'] = true;
    if (item.quantity <= 0) {
      item['deleted'] = true;
      item.quantity = 0;
    }
    this.contractItemsChanged.emit(this.contractItems);
  }

  /**
   * Supprimer complètement un item du contrat
   */
  onContractRemoveAll(item: CartSubscriptionProductItem) {
    item.quantity = 0;
    item['updated'] = true;
    item['deleted'] = true;
    this.contractItemsChanged.emit(this.contractItems);
  }

  /**
   * ===== ACTIONS SUR LES ITEMS DU PANIER (en attente d'ajout) =====
   */

  /**
   * Incrémenter la quantité d'un item du panier
   */
  onPendingAdd(item: any, variant?: string) {
    this.$cart.add(item, variant);
    // Les items seront rechargés automatiquement via $loader.update()
    this.pendingItemsChanged.emit(this.pendingItems);
  }

  /**
   * Décrémenter la quantité d'un item du panier
   */
  onPendingRemove(item: any, variant?: string) {
    this.$cart.remove(item, variant);
    // Les items seront rechargés automatiquement via $loader.update()
    this.pendingItemsChanged.emit(this.pendingItems);
  }

  /**
   * Supprimer complètement un item du panier
   */
  onPendingRemoveAll(item: any, variant?: string) {
    this.$cart.removeAll(item, variant);
    // Les items seront rechargés automatiquement via $loader.update()
    this.pendingItemsChanged.emit(this.pendingItems);
  }

  /**
   * Annuler les modifications
   */
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

  /**
   * ✅ Naviguer vers la page produits pour ajouter des items
   */
  onAddItem() {
    this.addItemClick.emit();
  }

  /**
   * Sauvegarder les modifications via subscriptionUpdate
   */
  async onSave() {
    this.isRunning = true;
    this.error = null;
    this.successMessage = null;
    this.$cart.clearErrors();

    // Filtrer les items modifiés du contrat
    const updated = this.contractItems.filter(item => item['updated']);

    // ✅ Convertir les items du panier en format attendu par le backend avec frequency
    const newItems = this.pendingItems.map(item => {
      const deprecatedItem = item.toDEPRECATED();
      // ✅ CRITIQUE: Ajouter la frequency du contrat à chaque item
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

    // ✅ Fallback hub si items vide (contrat shipping-only)
    const hub = this.contract.items?.[0]?.hub || this.config.shared.hub.slug;

    // Paramètres pour subscriptionUpdate
    const subParams = {
      hub: hub,
      shipping: this.contract.shipping,
      items: newItems, // Nouveaux items à ajouter du panier (avec frequency)
      updated: updated, // Items modifiés du contrat existant
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
        // Marquer les items avec erreurs
        this.contractItems.forEach(item => {
          item.error = result.errors[item.sku];
        });
        this.pendingItems.forEach(item => {
          item.error = result.errors[item.sku];
        });
        this.error = this.label.msg_item_error;
        this.updateError.emit(result.errors);
      } else {
        // Succès
        this.successMessage = this.label.msg_success;

        // Émettre l'événement avant de recharger
        this.updateComplete.emit(result);

        // Recharger les items du contrat depuis le résultat
        if (result.items) {
          this.contractItems = JSON.parse(JSON.stringify(result.items));
        }

        // Vider le panier après ajout réussi (les items du panier sont maintenant dans le contrat)
        if (newItems.length > 0) {
          this.pendingItems.forEach(item => {
            this.$cart.removeAll(item, item.variant);
          });
          this.pendingItems = [];
        }

        // Auto-cacher le message de succès après 3s
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

