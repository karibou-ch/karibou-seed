/**
 * ===================================================================
 * KNG-SUBSCRIPTION I18N - Labels centralisés pour le module subscription
 * ===================================================================
 *
 * Ce fichier centralise tous les labels i18n relatifs aux subscriptions.
 * Il remplace les _i18n dispersés dans les composants individuels.
 *
 * Usage:
 *   import { SUBSCRIPTION_I18N } from './kng-subscription-i18n';
 *   const label = SUBSCRIPTION_I18N[this.locale];
 */

export interface SubscriptionLabels {
  // === PAGE PRINCIPALE ===
  page_title: string;
  page_subtitle: string;
  page_empty_title: string;
  page_empty_subtitle: string;
  page_cta_explore: string;
  page_cta_create: string;

  // === LISTE DES ABONNEMENTS ===
  list_title: string;
  list_empty: string;
  list_active: string;
  list_paused: string;
  list_next_delivery: string;

  // === CONTROL (depuis kng-subscription-control) ===
  title_subscription: string;
  subtitle_subscription: string;
  subtitle_subscription_premium: string;
  subtitle_subscription_start: string;
  subtitle_subscription_pause: string;
  subtitle_subscription_pause_action: string;
  subtitle_subscription_cancel: string;
  subtitle_subscription_end: string;
  subtitle_subscription_status: string;
  subtitle_subscription_next_delivery: string;
  subtitle_subscription_paused: string;
  subtitle_subscription_update_method: string;
  subtitle_subscription_confirm_method: string;
  subtitle_subscription_add: string;
  subtitle_subscription_action: string;
  subtitle_subscription_items: string;
  subtitle_subscription_service: string;
  subtitle_subscription_options: string;
  subtitle_subscription_gocart: string;

  // === ERREURS PAIEMENT ===
  payment_error_setup: string;
  payment_error_authenticate: string;
  payment_error_replace_invalid_method: string;
  payment_error_replace_expired: string;
  payment_error_update_declined: string;
  payment_error_contact: string;
  payment_error_retry_canceled: string;
  payment_error_generic: string;

  // === ITEMS (depuis kng-subscription-item) ===
  title_items: string;
  title_pending_items: string;
  action_remove: string;
  action_save: string;
  action_saving: string;
  action_cancel: string;
  action_add_item: string;
  label_quantity: string;
  label_price: string;
  label_total: string;
  label_variant: string;
  label_note: string;
  label_deleted: string;
  label_items_subtotal: string;
  label_service_fees: string;
  label_shipping_fees: string;
  label_total_amount: string;
  msg_no_items: string;
  msg_no_changes: string;
  msg_success: string;
  msg_error: string;
  msg_item_error: string;
  msg_confirm_changes: string;
  msg_blocked_by_payment: string;

  // === OPTIONS (depuis kng-subscription-option) ===
  option_title: string;
  option_title_time_contract: string;
  option_title_time_contract_update: string;

  // === CRÉATION ===
  create_title: string;
  create_subtitle: string;
  create_step_products: string;
  create_step_frequency: string;
  create_step_confirm: string;
  create_cta_start: string;
  create_cta_add_products: string;
}

export const SUBSCRIPTION_I18N: { fr: SubscriptionLabels; en: SubscriptionLabels } = {
  fr: {
    // === PAGE PRINCIPALE ===
    page_title: 'Vos commandes automatiques',
    page_subtitle: 'Simplifiez vos courses avec des livraisons régulières',
    page_empty_title: 'Aucune commande automatique',
    page_empty_subtitle: 'Créez votre premier panier régulier pour recevoir vos produits préférés automatiquement',
    page_cta_explore: 'Explorer les produits',
    page_cta_create: 'Créer une commande automatique',

    // === LISTE DES ABONNEMENTS ===
    list_title: 'Mes paniers réguliers',
    list_empty: 'Vous n\'avez pas encore de panier régulier',
    list_active: 'Actif',
    list_paused: 'En pause',
    list_next_delivery: 'Prochaine livraison',

    // === CONTROL ===
    title_subscription: 'Vos abonnements',
    subtitle_subscription: 'Votre abonnement',
    subtitle_subscription_premium: 'Votre abonnement Premium',
    subtitle_subscription_start: 'Actif depuis',
    subtitle_subscription_pause: 'Mettre en pause jusqu\'au ',
    subtitle_subscription_pause_action: 'Mettre en pause jusqu\'au',
    subtitle_subscription_cancel: 'Annuler votre abonnement',
    subtitle_subscription_end: 'Votre abonnement est supprimé',
    subtitle_subscription_status: 'Fréquence de votre abonnement :',
    subtitle_subscription_next_delivery: 'Prochaine livraison',
    subtitle_subscription_paused: 'Votre abonnement reprendra le :',
    subtitle_subscription_update_method: 'Votre méthode de paiement n\'est plus valable',
    subtitle_subscription_confirm_method: 'Votre banque souhaite une confirmation',
    subtitle_subscription_add: 'Ajouter un article',
    subtitle_subscription_action: 'Modifier et enregistrer votre abonnement',
    subtitle_subscription_items: 'Vos articles',
    subtitle_subscription_service: 'Vos services',
    subtitle_subscription_options: 'Vos options',
    subtitle_subscription_gocart: 'Modifier les articles',

    // === ERREURS PAIEMENT ===
    payment_error_setup: 'Aucune méthode de paiement n\'est configurée pour cet abonnement. Veuillez en ajouter une.',
    payment_error_authenticate: 'Votre banque demande une authentification supplémentaire (3D Secure).',
    payment_error_replace_invalid_method: 'Votre méthode de paiement n\'est plus valide ou a expiré. Veuillez la remplacer.',
    payment_error_replace_expired: 'Votre carte a expiré ou les informations sont incorrectes. Veuillez la remplacer.',
    payment_error_update_declined: 'Votre carte a été refusée. Vérifiez vos fonds, les informations de la carte ou contactez votre banque.',
    payment_error_contact: 'Votre banque a refusé le paiement. Veuillez la contacter pour plus d\'informations.',
    payment_error_retry_canceled: 'Le paiement a été annulé. Vous pouvez essayer de le relancer.',
    payment_error_generic: 'Un problème est survenu avec votre paiement.',

    // === ITEMS ===
    title_items: 'Les articles de votre abonnement',
    title_pending_items: 'Les articles que vous souhaitez ajouter',
    action_remove: 'enlever',
    action_save: 'Enregistrer les modifications',
    action_saving: 'Sauvegarde en cours...',
    action_cancel: 'Annuler',
    action_add_item: 'Ajouter un article',
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
    msg_no_items: 'Aucun article dans cet abonnement',
    msg_no_changes: 'Aucune modification à enregistrer',
    msg_success: 'Modifications enregistrées avec succès',
    msg_error: 'Erreur lors de la sauvegarde',
    msg_item_error: 'Certains articles ont des erreurs',
    msg_confirm_changes: 'Vous avez des modifications non sauvegardées',
    msg_blocked_by_payment: 'Vous devez d\'abord confirmer votre paiement avant de pouvoir modifier votre abonnement',

    // === OPTIONS ===
    option_title: 'Fréquence et jour de livraison.',
    option_title_time_contract: 'Quand souhaitez vous être livré ?',
    option_title_time_contract_update: 'La livraison est programmée à',

    // === CRÉATION ===
    create_title: 'Créer une commande automatique',
    create_subtitle: 'Choisissez vos produits et la fréquence de livraison',
    create_step_products: 'Sélectionner les produits',
    create_step_frequency: 'Choisir la fréquence',
    create_step_confirm: 'Confirmer',
    create_cta_start: 'Commencer',
    create_cta_add_products: 'Ajouter des produits',
  },
  en: {
    // === PAGE PRINCIPALE ===
    page_title: 'Your automatic orders',
    page_subtitle: 'Simplify your shopping with regular deliveries',
    page_empty_title: 'No automatic orders',
    page_empty_subtitle: 'Create your first regular basket to receive your favorite products automatically',
    page_cta_explore: 'Explore products',
    page_cta_create: 'Create an automatic order',

    // === LISTE DES ABONNEMENTS ===
    list_title: 'My regular baskets',
    list_empty: 'You don\'t have a regular basket yet',
    list_active: 'Active',
    list_paused: 'Paused',
    list_next_delivery: 'Next delivery',

    // === CONTROL ===
    title_subscription: 'Your subscriptions',
    subtitle_subscription: 'Your subscription',
    subtitle_subscription_premium: 'Your Premium Subscription',
    subtitle_subscription_start: 'Active since',
    subtitle_subscription_pause: 'Pause deliveries until',
    subtitle_subscription_pause_action: 'Pause until',
    subtitle_subscription_cancel: 'Cancel your subscription',
    subtitle_subscription_end: 'Your subscription has been deleted',
    subtitle_subscription_status: 'Subscription frequency:',
    subtitle_subscription_next_delivery: 'Next delivery',
    subtitle_subscription_paused: 'Your subscription will resume on:',
    subtitle_subscription_update_method: 'Your payment method is no longer valid',
    subtitle_subscription_confirm_method: 'For security reasons, confirm your pending payment',
    subtitle_subscription_add: 'Add an item',
    subtitle_subscription_action: 'Update and save your subscription',
    subtitle_subscription_items: 'Items',
    subtitle_subscription_service: 'Services',
    subtitle_subscription_options: 'Options',
    subtitle_subscription_gocart: 'Edit subscription items',

    // === ERREURS PAIEMENT ===
    payment_error_setup: 'No payment method is configured for this subscription. Please add one.',
    payment_error_authenticate: 'Your bank requires additional authentication (3D Secure).',
    payment_error_replace_invalid_method: 'Your payment method is no longer valid or has expired. Please replace it.',
    payment_error_replace_expired: 'Your card has expired or the information is incorrect. Please replace it.',
    payment_error_update_declined: 'Your card was declined. Please check your funds, card information, or contact your bank.',
    payment_error_contact: 'Your bank has declined the payment. Please contact them for more information.',
    payment_error_retry_canceled: 'The payment was canceled. You can try to run it again.',
    payment_error_generic: 'A problem occurred with your payment.',

    // === ITEMS ===
    title_items: 'Your subscription items',
    title_pending_items: 'Items you want to add',
    action_remove: 'remove',
    action_save: 'Save changes',
    action_saving: 'Saving...',
    action_cancel: 'Cancel',
    action_add_item: 'Add an item',
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
    msg_no_items: 'No items in this subscription',
    msg_no_changes: 'No changes to save',
    msg_success: 'Changes saved successfully',
    msg_error: 'Error while saving',
    msg_item_error: 'Some items have errors',
    msg_confirm_changes: 'You have unsaved changes',
    msg_blocked_by_payment: 'You must first confirm your payment before you can modify your subscription',

    // === OPTIONS ===
    option_title: 'Frequency and delivery day',
    option_title_time_contract: 'When would you like delivery?',
    option_title_time_contract_update: 'Delivery is scheduled for',

    // === CRÉATION ===
    create_title: 'Create an automatic order',
    create_subtitle: 'Choose your products and delivery frequency',
    create_step_products: 'Select products',
    create_step_frequency: 'Choose frequency',
    create_step_confirm: 'Confirm',
    create_cta_start: 'Start',
    create_cta_add_products: 'Add products',
  }
};
