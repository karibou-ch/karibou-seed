/**
 * ===================================================================
 * APP.MODEL.TS - Modèles de données UX orientés intentions
 * ===================================================================
 *
 * Ce fichier centralise les modèles de données pour l'architecture UX
 * orientée intentions. Ces données seront migrées vers config.shared
 * dans une phase ultérieure.
 *
 * Usage:
 *   import { DEFAULT_INTENTIONS, IntentionsConfig } from './app.model';
 */

// ============================================================================
// TYPES - Intentions Client
// ============================================================================

/**
 * Contenu d'une intention (textes i18n)
 */
export interface IntentionContent {
  title: { fr: string; en: string };
  subtitle: { fr: string; en: string };
  cta: { fr: string; en: string };
  image?: string;
  icon?: string;
  route?: string;
}

/**
 * Question pour l'assistant James
 */
export interface AssistantQuestion {
  label: string;
  action: string;
  clazz?: string;
  icon?: string;
}

/**
 * Configuration complète de l'intention Assistant
 */
export interface AssistantIntention extends IntentionContent {
  questions: AssistantQuestion[];
}

/**
 * Configuration de toutes les intentions
 */
export interface IntentionsConfig {
  courses: IntentionContent;
  buffet: IntentionContent;
  subscription: IntentionContent;
  assistant: AssistantIntention;
}

// ============================================================================
// VALEURS PAR DÉFAUT - Intentions (hardcodées, migration config ultérieure)
// ============================================================================

/**
 * Questions par défaut pour l'assistant NEUTRE
 * Couvre tous les domaines (courses, buffet, subscriptions, général)
 */
export const DEFAULT_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  {
    icon: '🧺',
    label: 'Apéro terroir',
    action: 'Je cherche des produits pour un apéro terroir',
    clazz: ''
  },
  {
    icon: '🍳',
    label: 'Recette du jour',
    action: 'Une recette avec ce que j\'ai dans le panier',
    clazz: ''
  },
  {
    icon: '📅',
    label: 'Disponible demain ?',
    action: 'Qu\'est-ce qui est disponible demain ?',
    clazz: ''
  },
  {
    icon: '🎉',
    label: 'Buffet 20 personnes',
    action: 'Un buffet pour 20 personnes',
    clazz: ''
  },
  {
    icon: '🔄',
    label: 'Commandes auto',
    action: 'Comment fonctionnent les commandes automatiques ?',
    clazz: ''
  }
];

/**
 * Questions pour l'assistant ENCADRÉ - Buffet
 */
export const BUFFET_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  {
    icon: '🎉',
    label: 'Buffet 20 personnes',
    action: 'Un buffet pour 20 personnes',
    clazz: ''
  },
  {
    icon: '🧀',
    label: 'Plateau fromages',
    action: 'Un plateau de fromages pour 15 personnes',
    clazz: ''
  },
  {
    icon: '🍷',
    label: 'Sélection vins',
    action: 'Quelle sélection de vins pour accompagner un buffet ?',
    clazz: ''
  },
  {
    icon: '🥗',
    label: 'Buffet végétarien',
    action: 'Un buffet végétarien pour 30 personnes',
    clazz: ''
  },
  {
    icon: '❓',
    label: 'Quantités conseillées',
    action: 'Quelles quantités prévoir pour un apéro de 50 personnes ?',
    clazz: ''
  }
];

/**
 * Questions pour l'assistant ENCADRÉ - Subscriptions
 */
export const SUBSCRIPTION_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  {
    icon: '🍞',
    label: 'Pain chaque semaine',
    action: 'Je veux du pain frais chaque semaine',
    clazz: ''
  },
  {
    icon: '🥬',
    label: 'Fruits et légumes',
    action: 'Un panier de fruits et légumes chaque mercredi',
    clazz: ''
  },
  {
    icon: '🥛',
    label: 'Produits laitiers',
    action: 'Des produits laitiers régulièrement',
    clazz: ''
  },
  {
    icon: '❓',
    label: 'Comment ça marche',
    action: 'Comment fonctionnent les commandes automatiques ?',
    clazz: ''
  },
  {
    icon: '✏️',
    label: 'Modifier fréquence',
    action: 'Comment modifier la fréquence de livraison ?',
    clazz: ''
  }
];

/**
 * Questions pour l'assistant ENCADRÉ - Home (courses)
 */
export const HOME_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  {
    icon: '🧺',
    label: 'Apéro terroir',
    action: 'Je cherche des produits pour un apéro terroir',
    clazz: ''
  },
  {
    icon: '🍳',
    label: 'Recette du jour',
    action: 'Une recette avec ce que j\'ai dans le panier',
    clazz: ''
  },
  {
    icon: '🌿',
    label: 'Produits de saison',
    action: 'Quels sont les produits de saison cette semaine ?',
    clazz: ''
  },
  {
    icon: '🍖',
    label: 'Viandes pour barbecue',
    action: 'Des viandes pour un barbecue ce weekend',
    clazz: ''
  },
  {
    icon: '🥕',
    label: 'Bio et local',
    action: 'Je cherche des produits bio et locaux',
    clazz: ''
  }
];

/**
 * Configuration par défaut des intentions
 * Ces valeurs seront remplacées par config.shared.intentions quand disponible
 */
export const DEFAULT_INTENTIONS: IntentionsConfig = {
  courses: {
    title: { fr: 'Faire mes courses', en: 'Do my shopping' },
    subtitle: { fr: 'Commande ponctuelle', en: 'One-time order' },
    cta: { fr: 'Explorer le marché', en: 'Explore the market' },
    icon: '🛒',
    route: '/home'
  },
  buffet: {
    title: { fr: 'Recevoir un buffet', en: 'Get a buffet' },
    subtitle: { fr: 'Pour X personnes', en: 'For X people' },
    cta: { fr: 'Configurer', en: 'Configure' },
    icon: '🎉',
    route: '/buffet'
  },
  subscription: {
    title: { fr: 'Ne plus oublier', en: 'Never forget' },
    subtitle: { fr: 'Commande automatique', en: 'Automatic order' },
    cta: { fr: 'Configurer', en: 'Configure' },
    icon: '🔄',
    route: '/subscriptions'
  },
  assistant: {
    title: { fr: 'Besoin d\'aide', en: 'Need help' },
    subtitle: { fr: 'Questions & conseils', en: 'Questions & advice' },
    cta: { fr: 'Demander', en: 'Ask' },
    icon: '💬',
    route: '/assistant/james',
    questions: DEFAULT_ASSISTANT_QUESTIONS
  }
};

// ============================================================================
// TYPES - Buffet (discriminants et configuration)
// ============================================================================

/**
 * Gammes de personnes pour les buffets
 */
export type BuffetPeopleRange = '10-20' | '20-50' | '50-100' | '100+';

/**
 * Configuration d'un kit buffet
 */
export interface BuffetKit {
  id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  peopleRange: BuffetPeopleRange;
  basePrice: number;
  image?: string;
  products: BuffetKitProduct[];
}

/**
 * Produit dans un kit buffet
 */
export interface BuffetKitProduct {
  sku: string;
  quantity: number;
  quantityPerPerson?: number;
  optional?: boolean;
}

/**
 * État du formulaire buffet
 */
export interface BuffetFormState {
  numberOfPeople: number | null;
  eventDate: Date | null;
  isDevisMode: boolean;
  selectedKitId: string | null;
}

// ============================================================================
// TYPES - Hub (page d'aiguillage)
// ============================================================================

/**
 * État de la page Hub
 */
export interface HubState {
  isAuthenticated: boolean;
  pendingOrdersCount: number;
  activeSubscriptionsCount: number;
  lastVisitedIntention?: keyof IntentionsConfig;
}

/**
 * Raccourci rapide sur le Hub (pour utilisateurs connectés)
 */
export interface HubQuickAction {
  label: { fr: string; en: string };
  route: string;
  icon: string;
  badge?: number;
}

/**
 * Raccourcis par défaut pour utilisateurs connectés
 */
export const DEFAULT_HUB_QUICK_ACTIONS: HubQuickAction[] = [
  {
    label: { fr: 'Mes commandes', en: 'My orders' },
    route: '/me/orders',
    icon: 'receipt_long'
  },
  {
    label: { fr: 'Mes abonnements', en: 'My subscriptions' },
    route: '/me/subscriptions',
    icon: 'update'
  },
  {
    label: { fr: 'Mes favoris', en: 'My favorites' },
    route: '/home',
    icon: 'favorite'
  }
];

// ============================================================================
// NAVIGATION - Services (Niveau 1)
// ============================================================================

/**
 * Item de navigation pour les services (Niveau 1)
 * Utilisé par le bottom bar mobile et la nav header desktop
 */
export interface NavServiceItem {
  id: 'hub' | 'home' | 'buffet' | 'subscription' | 'assistant';
  label: { fr: string; en: string };
  icon: string;       // Material symbol
  emoji: string;      // Fallback/accentuation
  route: string;      // Route relative (/store/:store/xxx)
}

/**
 * Navigation services - Constante homogène
 * Ordre définit la position dans le bottom bar et la nav header
 */
export const NAV_SERVICE_ITEMS: NavServiceItem[] = [
  {
    id: 'hub',
    label: { fr: 'Accueil', en: 'Home' },
    icon: 'home',
    emoji: '🏠',
    route: ''  // /store/:store/
  },
  {
    id: 'home',
    label: { fr: 'Courses', en: 'Shopping' },
    icon: 'shopping_basket',
    emoji: '🛒',
    route: 'home'
  },
  {
    id: 'buffet',
    label: { fr: 'Buffet', en: 'Buffet' },
    icon: 'restaurant',
    emoji: '🎉',
    route: 'buffet'
  },
  {
    id: 'subscription',
    label: { fr: 'Auto', en: 'Auto' },
    icon: 'event_repeat',
    emoji: '🔄',
    route: 'subscriptions'
  },
  {
    id: 'assistant',
    label: { fr: 'James', en: 'James' },
    icon: 'smart_toy',
    emoji: '💬',
    route: 'assistant/james'
  }
];

/**
 * Helper: obtient le NavServiceItem par route actuelle
 */
export function getCurrentService(routePath: string): NavServiceItem | undefined {
  // Chercher un service correspondant à la route (priorité aux routes les plus spécifiques)
  const sortedItems = [...NAV_SERVICE_ITEMS].sort((a, b) => b.route.length - a.route.length);
  return sortedItems.find(item =>
    item.route !== '' && routePath.includes(item.route)
  ) || NAV_SERVICE_ITEMS.find(item => item.id === 'hub');
}

/**
 * Helper: obtient le NavServiceItem par ID
 */
export function getServiceById(id: NavServiceItem['id']): NavServiceItem | undefined {
  return NAV_SERVICE_ITEMS.find(item => item.id === id);
}

// ============================================================================
// SIDE INFO - Actions contextuelles (Panel right)
// ============================================================================

/**
 * Type d'action contextuelle
 */
export type SideInfoActionType = 'link' | 'order' | 'help' | 'contract' | 'cart';

/**
 * Action contextuelle pour le panel side info (right)
 * Affiché dans le panel droit selon le contexte
 */
export interface SideInfoAction {
  label: { fr: string; en: string };
  route?: string;           // Route si navigation
  action?: string;          // Action JS si pas de route
  icon: string;             // Material symbol
  type: SideInfoActionType;
  badge?: number | string;  // Badge optionnel (ex: "45 CHF", 3)
  urgency?: 'normal' | 'high';
}

/**
 * Actions par défaut pour le side info (panel right)
 */
export const DEFAULT_SIDE_INFO_ACTIONS: SideInfoAction[] = [
  {
    label: { fr: 'Besoin d\'aide ?', en: 'Need help?' },
    route: 'assistant/james',
    icon: 'help',
    type: 'help'
  }
];

/**
 * Helper: génère les actions side info pour une commande en cours
 */
export function getOrderSideInfoAction(
  order: { oid: number; shipping: { when: Date } },
  locale: 'fr' | 'en'
): SideInfoAction {
  const dayFormat: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const day = order.shipping.when.toLocaleDateString(
    locale === 'fr' ? 'fr-CH' : 'en-CH',
    dayFormat
  );
  return {
    label: {
      fr: `Votre commande de ${day}`,
      en: `Your ${day} order`
    },
    route: `me/orders/${order.oid}`,
    icon: 'local_shipping',
    type: 'order',
    urgency: 'high'
  };
}

/**
 * Helper: génère les actions side info pour un contrat actif
 */
export function getContractSideInfoAction(
  contract: { id: string; name: string }
): SideInfoAction {
  return {
    label: { fr: contract.name, en: contract.name },
    route: `subscriptions?id=${contract.id}`,
    icon: 'event_repeat',
    type: 'contract'
  };
}

/**
 * Helper: génère l'action side info pour le panier
 */
export function getCartSideInfoAction(
  itemCount: number,
  total: number,
  locale: 'fr' | 'en'
): SideInfoAction {
  return {
    label: {
      fr: `Panier : ${itemCount} article${itemCount > 1 ? 's' : ''}`,
      en: `Cart: ${itemCount} item${itemCount > 1 ? 's' : ''}`
    },
    route: 'cart/default',
    icon: 'shopping_cart',
    type: 'cart',
    badge: `${total.toFixed(2)} CHF`
  };
}

// ============================================================================
// HELPERS - Fonctions utilitaires
// ============================================================================

/**
 * Obtient le contenu d'une intention selon la locale
 */
export function getIntentionContent(
  intentions: IntentionsConfig,
  key: keyof IntentionsConfig,
  locale: 'fr' | 'en'
): { title: string; subtitle: string; cta: string; icon?: string } {
  const intention = intentions[key];
  return {
    title: intention.title[locale],
    subtitle: intention.subtitle[locale],
    cta: intention.cta[locale],
    icon: intention.icon
  };
}

/**
 * Détermine si la date choisie nécessite un mode devis (> J+6)
 */
export function isDevisRequired(eventDate: Date | null | undefined, maxDays: number = 6): boolean {
  if (!eventDate || !(eventDate instanceof Date) || isNaN(eventDate.getTime())) {
    return false;
  }
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > maxDays;
}

/**
 * Calcule la gamme de personnes à partir d'un nombre
 */
export function getPeopleRange(numberOfPeople: number): BuffetPeopleRange {
  if (numberOfPeople <= 20) return '10-20';
  if (numberOfPeople <= 50) return '20-50';
  if (numberOfPeople <= 100) return '50-100';
  return '100+';
}
