/**
 * ===================================================================
 * KNG-BUFFET I18N - Labels centralisés pour le module buffet
 * ===================================================================
 *
 * Ce fichier centralise tous les labels i18n relatifs aux buffets.
 * Inspiré de kng-subscription-i18n.ts.
 *
 * Usage:
 *   import { BUFFET_I18N } from './kng-buffet-i18n';
 *   const label = BUFFET_I18N[this.locale];
 */

export interface BuffetLabels {
  // === PAGE PRINCIPALE ===
  page_title: string;
  page_subtitle: string;
  page_empty_title: string;
  page_empty_subtitle: string;
  page_cta_explore: string;
  page_cta_configure: string;

  // === DISCRIMINANTS ===
  question_people: string;
  question_people_placeholder: string;
  question_date: string;
  question_date_placeholder: string;

  // === MODES ===
  mode_order: string;
  mode_order_subtitle: string;
  mode_devis: string;
  mode_devis_subtitle: string;
  mode_devis_info: string;

  // === KITS ===
  kits_title: string;
  kits_subtitle: string;
  kits_empty: string;
  kits_from_price: string;
  kits_per_person: string;
  kits_select: string;
  kits_configure: string;

  // === CONFIGURATEUR ===
  config_title: string;
  config_subtitle: string;
  config_products: string;
  config_add_product: string;
  config_quantity: string;
  config_quantity_per_person: string;
  config_total: string;
  config_note: string;

  // === DEVIS ===
  devis_title: string;
  devis_subtitle: string;
  devis_name: string;
  devis_email: string;
  devis_phone: string;
  devis_company: string;
  devis_message: string;
  devis_send: string;
  devis_success: string;
  devis_error: string;

  // === ASSISTANT ===
  assistant_title: string;
  assistant_subtitle: string;
  assistant_tip_1: string;
  assistant_tip_2: string;
  assistant_tip_3: string;

  // === ACTIONS ===
  action_back: string;
  action_continue: string;
  action_add_to_cart: string;
  action_request_devis: string;
  action_contact: string;

  // === VALIDATION ===
  error_people_required: string;
  error_date_required: string;
  error_date_past: string;
  error_minimum_people: string;
}

export const BUFFET_I18N: { fr: BuffetLabels; en: BuffetLabels } = {
  fr: {
    // === PAGE PRINCIPALE ===
    page_title: 'Recevoir un buffet',
    page_subtitle: 'Valorisez votre événement avec les produits des artisans genevois',
    page_empty_title: 'Configurez votre buffet',
    page_empty_subtitle: 'Commencez par indiquer le nombre de personnes et la date de votre événement',
    page_cta_explore: 'Explorer les kits',
    page_cta_configure: 'Configurer mon buffet',

    // === DISCRIMINANTS ===
    question_people: 'Pour combien de personnes ?',
    question_people_placeholder: 'Ex: 25',
    question_date: 'Pour quelle date ?',
    question_date_placeholder: 'Sélectionnez une date',

    // === MODES ===
    mode_order: 'Commande directe',
    mode_order_subtitle: 'Livraison dans les 6 prochains jours',
    mode_devis: 'Demande de devis',
    mode_devis_subtitle: 'Pour les événements à plus de 6 jours',
    mode_devis_info: 'Pour les dates au-delà de 6 jours, nous vous invitons à demander un devis. Notre équipe vous contactera rapidement.',

    // === KITS ===
    kits_title: 'Nos kits buffet',
    kits_subtitle: 'Sélections préparées par nos artisans',
    kits_empty: 'Aucun kit disponible pour cette configuration',
    kits_from_price: 'À partir de',
    kits_per_person: '/ personne',
    kits_select: 'Sélectionner',
    kits_configure: 'Personnaliser',

    // === CONFIGURATEUR ===
    config_title: 'Votre sélection',
    config_subtitle: 'Personnalisez les quantités selon vos besoins',
    config_products: 'Produits',
    config_add_product: 'Ajouter un produit',
    config_quantity: 'Quantité',
    config_quantity_per_person: 'par personne',
    config_total: 'Total estimé',
    config_note: 'Les quantités sont ajustées automatiquement selon le nombre de personnes',

    // === DEVIS ===
    devis_title: 'Demande de devis',
    devis_subtitle: 'Nous vous recontacterons sous 24h',
    devis_name: 'Votre nom',
    devis_email: 'Email',
    devis_phone: 'Téléphone',
    devis_company: 'Entreprise (optionnel)',
    devis_message: 'Message ou précisions',
    devis_send: 'Envoyer ma demande',
    devis_success: 'Votre demande a été envoyée ! Nous vous contactons rapidement.',
    devis_error: 'Une erreur est survenue. Veuillez réessayer ou nous appeler.',

    // === ASSISTANT ===
    assistant_title: 'Besoin d\'aide ?',
    assistant_subtitle: 'James vous accompagne',
    assistant_tip_1: 'Buffet pour 20 personnes',
    assistant_tip_2: 'Plateau fromages',
    assistant_tip_3: 'Sélection vins',

    // === ACTIONS ===
    action_back: 'Retour',
    action_continue: 'Continuer',
    action_add_to_cart: 'Ajouter au panier',
    action_request_devis: 'Demander un devis',
    action_contact: 'Nous contacter',

    // === VALIDATION ===
    error_people_required: 'Veuillez indiquer le nombre de personnes',
    error_date_required: 'Veuillez sélectionner une date',
    error_date_past: 'La date doit être dans le futur',
    error_minimum_people: 'Minimum 10 personnes pour un buffet',
  },
  en: {
    // === PAGE PRINCIPALE ===
    page_title: 'Get a buffet',
    page_subtitle: 'Enhance your event with products from Geneva artisans',
    page_empty_title: 'Configure your buffet',
    page_empty_subtitle: 'Start by indicating the number of people and the date of your event',
    page_cta_explore: 'Explore kits',
    page_cta_configure: 'Configure my buffet',

    // === DISCRIMINANTS ===
    question_people: 'For how many people?',
    question_people_placeholder: 'Ex: 25',
    question_date: 'For which date?',
    question_date_placeholder: 'Select a date',

    // === MODES ===
    mode_order: 'Direct order',
    mode_order_subtitle: 'Delivery within the next 6 days',
    mode_devis: 'Quote request',
    mode_devis_subtitle: 'For events more than 6 days away',
    mode_devis_info: 'For dates beyond 6 days, we invite you to request a quote. Our team will contact you quickly.',

    // === KITS ===
    kits_title: 'Our buffet kits',
    kits_subtitle: 'Selections prepared by our artisans',
    kits_empty: 'No kit available for this configuration',
    kits_from_price: 'From',
    kits_per_person: '/ person',
    kits_select: 'Select',
    kits_configure: 'Customize',

    // === CONFIGURATEUR ===
    config_title: 'Your selection',
    config_subtitle: 'Customize quantities according to your needs',
    config_products: 'Products',
    config_add_product: 'Add a product',
    config_quantity: 'Quantity',
    config_quantity_per_person: 'per person',
    config_total: 'Estimated total',
    config_note: 'Quantities are automatically adjusted based on the number of people',

    // === DEVIS ===
    devis_title: 'Quote request',
    devis_subtitle: 'We will get back to you within 24 hours',
    devis_name: 'Your name',
    devis_email: 'Email',
    devis_phone: 'Phone',
    devis_company: 'Company (optional)',
    devis_message: 'Message or details',
    devis_send: 'Send my request',
    devis_success: 'Your request has been sent! We will contact you shortly.',
    devis_error: 'An error occurred. Please try again or call us.',

    // === ASSISTANT ===
    assistant_title: 'Need help?',
    assistant_subtitle: 'James is here to help',
    assistant_tip_1: 'Buffet for 20 people',
    assistant_tip_2: 'Cheese platter',
    assistant_tip_3: 'Wine selection',

    // === ACTIONS ===
    action_back: 'Back',
    action_continue: 'Continue',
    action_add_to_cart: 'Add to cart',
    action_request_devis: 'Request a quote',
    action_contact: 'Contact us',

    // === VALIDATION ===
    error_people_required: 'Please indicate the number of people',
    error_date_required: 'Please select a date',
    error_date_past: 'The date must be in the future',
    error_minimum_people: 'Minimum 10 people for a buffet',
  }
};
