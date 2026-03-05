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
 */
export const DEFAULT_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  { icon: '🧺', label: 'Apéro terroir', action: 'Je cherche des produits pour un apéro terroir', clazz: '' },
  { icon: '🍳', label: 'Recette du jour', action: 'Une recette avec ce que j\'ai dans le panier', clazz: '' },
  { icon: '📅', label: 'Disponible demain ?', action: 'Qu\'est-ce qui est disponible demain ?', clazz: '' },
  { icon: '🎉', label: 'Buffet 20 personnes', action: 'Un buffet pour 20 personnes', clazz: '' },
  { icon: '🔄', label: 'Commandes auto', action: 'Comment fonctionnent les commandes automatiques ?', clazz: '' }
];

/**
 * Questions pour l'assistant ENCADRÉ - Buffet
 */
export const BUFFET_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  { icon: '🎉', label: 'Buffet 20 personnes', action: 'Un buffet pour 20 personnes', clazz: '' },
  { icon: '🧀', label: 'Plateau fromages', action: 'Un plateau de fromages pour 15 personnes', clazz: '' },
  { icon: '🍷', label: 'Sélection vins', action: 'Quelle sélection de vins pour accompagner un buffet ?', clazz: '' },
  { icon: '🥗', label: 'Buffet végétarien', action: 'Un buffet végétarien pour 30 personnes', clazz: '' },
  { icon: '❓', label: 'Quantités conseillées', action: 'Quelles quantités prévoir pour un apéro de 50 personnes ?', clazz: '' }
];

/**
 * Questions pour l'assistant ENCADRÉ - Subscriptions
 */
export const SUBSCRIPTION_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  { icon: '🍞', label: 'Pain chaque semaine', action: 'Je veux du pain frais chaque semaine', clazz: '' },
  { icon: '🥬', label: 'Fruits et légumes', action: 'Un panier de fruits et légumes chaque mercredi', clazz: '' },
  { icon: '🥛', label: 'Produits laitiers', action: 'Des produits laitiers régulièrement', clazz: '' },
  { icon: '❓', label: 'Comment ça marche', action: 'Comment fonctionnent les commandes automatiques ?', clazz: '' },
  { icon: '✏️', label: 'Modifier fréquence', action: 'Comment modifier la fréquence de livraison ?', clazz: '' }
];

/**
 * Questions pour l'assistant ENCADRÉ - Home (courses)
 */
export const HOME_ASSISTANT_QUESTIONS: AssistantQuestion[] = [
  { icon: '🧺', label: 'Apéro terroir', action: 'Je cherche des produits pour un apéro terroir', clazz: '' },
  { icon: '🍳', label: 'Recette du jour', action: 'Une recette avec ce que j\'ai dans le panier', clazz: '' },
  { icon: '🌿', label: 'Produits de saison', action: 'Quels sont les produits de saison cette semaine ?', clazz: '' },
  { icon: '🍖', label: 'Viandes pour barbecue', action: 'Des viandes pour un barbecue ce weekend', clazz: '' },
  { icon: '🥕', label: 'Bio et local', action: 'Je cherche des produits bio et locaux', clazz: '' }
];

/**
 * Configuration par défaut des intentions
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
// TYPES - Buffet
// ============================================================================

export type BuffetPeopleRange = '10-20' | '20-50' | '50-100' | '100+';
export type BuffetTheme = 'terre' | 'mer' | 'vege' | 'boissons';
export type BuffetBudget = 1 | 2 | 3;

/**
 * Item dans un kit (affichage)
 */
export interface BuffetKitItem {
  icon: string;
  title: string;
  subtitle?: string;
}

/**
 * Kit buffet
 */
export interface BuffetKit {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  minPeople: number;
  items: BuffetKitItem[];
  themes: BuffetTheme[];
}

/**
 * Exemple de devis (panel left)
 */
export interface BuffetDevisExample {
  title: string;
  people: number;
  date: string;
  items: string[];
  total: number;
  status: 'confirmed' | 'pending' | 'quote';
}

/**
 * Etape process
 */
export interface BuffetProcessStep {
  icon: string;
  title: string;
  subtitle: string;
}

/**
 * État du formulaire buffet
 */
export interface BuffetFormState {
  numberOfPeople: number | null;
  eventDate: Date | null;
  isDevisMode: boolean;
  selectedKitId: string | null;
  selectedThemes: BuffetTheme[];
  selectedBudget: BuffetBudget;
}

// ============================================================================
// DATA - Buffet (JSON simple)
// ============================================================================

export const BUFFET_THEMES: { id: BuffetTheme; label: string; icon: string }[] = [
  { id: 'terre', label: 'Terre', icon: 'agriculture' },
  { id: 'mer', label: 'Mer', icon: 'set_meal' },
  { id: 'vege', label: 'Végé', icon: 'eco' },
  { id: 'boissons', label: 'Boissons', icon: 'local_cafe' }
];

export const BUFFET_BUDGETS: { id: BuffetBudget; label: string }[] = [
  { id: 1, label: '$' },
  { id: 2, label: '$$' },
  { id: 3, label: '$$$' }
];

export const BUFFET_PROCESS: BuffetProcessStep[] = [
  { icon: 'event_available', title: 'Commande', subtitle: '48h avant' },
  { icon: 'local_shipping', title: 'Livraison', subtitle: 'Avant 08h30' },
  { icon: 'restaurant', title: 'Installation', subtitle: 'Prêt !' }
];

export const BUFFET_KITS: BuffetKit[] = [
  {
    id: 'classique',
    name: 'Le Classique',
    subtitle: 'Terroir genevois',
    price: 14,
    minPeople: 5,
    themes: ['terre'],
    items: [
      { icon: 'bakery_dining', title: 'Pains & tresse artisanale', subtitle: 'Ballons, levain' },
      { icon: 'brunch_dining', title: 'Beurre & tartinables', subtitle: 'Confiture, miel' },
      { icon: 'lunch_dining', title: 'Fromage des producteurs', subtitle: 'Brebis, gruyère' },
      { icon: 'nutrition', title: 'Fruits frais de saison', subtitle: 'Sélection locale' }
    ]
  },
  {
    id: 'energie',
    name: 'Énergie & Équilibre',
    subtitle: 'Healthy & savoureux',
    price: 17.5,
    minPeople: 5,
    themes: ['terre', 'mer'],
    items: [
      { icon: 'breakfast_dining', title: 'Porridge maison', subtitle: 'Avoine, fruits' },
      { icon: 'bakery_dining', title: 'Petits buns aux graines', subtitle: 'Lin, tournesol' },
      { icon: 'set_meal', title: 'Saumon fumé d\'Écosse', subtitle: 'Qualité premium' },
      { icon: 'eco', title: 'Mélange fruits secs & noix', subtitle: 'Énergie naturelle' }
    ]
  }
];

export const BUFFET_DEVIS_EXAMPLES: BuffetDevisExample[] = [
  {
    title: 'Onboarding nouveaux collaborateurs',
    people: 15,
    date: 'Mardi 10 février',
    items: ['Kit Classique x15', 'Croissants extra x15'],
    total: 280,
    status: 'confirmed'
  },
  {
    title: 'Séminaire direction',
    people: 50,
    date: 'Jeudi 20 février',
    items: ['Kit Énergie x50', 'Café thermos x5', 'Jus frais x50'],
    total: 950,
    status: 'pending'
  },
  {
    title: 'Apéritif clients VIP',
    people: 30,
    date: 'Vendredi 28 février',
    items: ['Plateau Fromages x30', 'Kit Apéro x30', 'Vins x10'],
    total: 600,
    status: 'quote'
  }
];

// ============================================================================
// TYPES - Hub
// ============================================================================

export interface HubState {
  isAuthenticated: boolean;
  pendingOrdersCount: number;
  activeSubscriptionsCount: number;
  lastVisitedIntention?: keyof IntentionsConfig;
}

export interface HubQuickAction {
  label: { fr: string; en: string };
  route: string;
  icon: string;
  badge?: number;
}

export const DEFAULT_HUB_QUICK_ACTIONS: HubQuickAction[] = [
  { label: { fr: 'Mes commandes', en: 'My orders' }, route: '/me/orders', icon: 'receipt_long' },
  { label: { fr: 'Mes abonnements', en: 'My subscriptions' }, route: '/me/subscriptions', icon: 'update' },
  { label: { fr: 'Mes favoris', en: 'My favorites' }, route: '/home', icon: 'favorite' }
];

// ============================================================================
// NAVIGATION - Services (Niveau 1)
// ============================================================================

export interface NavServiceItem {
  id: 'hub' | 'home' | 'buffet' | 'subscription' | 'assistant';
  label: { fr: string; en: string };
  icon: string;
  emoji: string;
  route: string;
}

export const NAV_SERVICE_ITEMS: NavServiceItem[] = [
  { id: 'hub', label: { fr: 'Accueil', en: 'Home' }, icon: 'home', emoji: '🏠', route: '' },
  { id: 'home', label: { fr: 'Courses', en: 'Shopping' }, icon: 'shopping_basket', emoji: '🛒', route: 'home' },
  { id: 'subscription', label: { fr: 'Paniers régulier', en: 'Auto shopping' }, icon: 'event_repeat', emoji: '🔄', route: 'subscriptions' },
  { id: 'buffet', label: { fr: 'Buffet', en: 'Buffet' }, icon: 'restaurant', emoji: '🎉', route: 'buffet' },
  { id: 'assistant', label: { fr: 'James', en: 'James' }, icon: 'smart_toy', emoji: '💬', route: 'assistant/james' }
];

export function getCurrentService(routePath: string): NavServiceItem | undefined {
  //
  // Sort by route length (longest first) to match specific routes before generic ones
  const sortedItems = [...NAV_SERVICE_ITEMS].sort((a, b) => b.route.length - a.route.length);

  //
  // Find matching non-empty route, or fallback to hub if routePath is empty
  return sortedItems.find(item => item.route !== '' && routePath.includes(item.route))
    || (routePath === '' ? NAV_SERVICE_ITEMS.find(item => item.route === '') : undefined)
    || NAV_SERVICE_ITEMS.find(item => item.id === 'hub');
}

export function getServiceById(id: NavServiceItem['id']): NavServiceItem | undefined {
  return NAV_SERVICE_ITEMS.find(item => item.id === id);
}

// ============================================================================
// SIDE INFO - Actions contextuelles
// ============================================================================

export type SideInfoActionType = 'link' | 'order' | 'help' | 'contract' | 'cart';

export interface SideInfoAction {
  label: { fr: string; en: string };
  route?: string;
  action?: string;
  icon: string;
  type: SideInfoActionType;
  badge?: number | string;
  urgency?: 'normal' | 'high';
}

export const DEFAULT_SIDE_INFO_ACTIONS: SideInfoAction[] = [
  { label: { fr: 'Besoin d\'aide ?', en: 'Need help?' }, route: 'assistant/james', icon: 'help', type: 'help' }
];

export function getOrderSideInfoAction(order: { oid: number; shipping: { when: Date } }, locale: 'fr' | 'en'): SideInfoAction {
  const dayFormat: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const day = order.shipping.when.toLocaleDateString(locale === 'fr' ? 'fr-CH' : 'en-CH', dayFormat);
  return {
    label: { fr: `Votre commande de ${day}`, en: `Your ${day} order` },
    route: `me/orders/${order.oid}`,
    icon: 'local_shipping',
    type: 'order',
    urgency: 'high'
  };
}

export function getContractSideInfoAction(contract: { id: string; name: string }): SideInfoAction {
  return {
    label: { fr: contract.name, en: contract.name },
    route: `subscriptions?id=${contract.id}`,
    icon: 'event_repeat',
    type: 'contract'
  };
}

export function getCartSideInfoAction(itemCount: number, total: number, locale: 'fr' | 'en'): SideInfoAction {
  return {
    label: { fr: `Panier : ${itemCount} article${itemCount > 1 ? 's' : ''}`, en: `Cart: ${itemCount} item${itemCount > 1 ? 's' : ''}` },
    route: 'cart/default',
    icon: 'shopping_cart',
    type: 'cart',
    badge: `${total.toFixed(2)} CHF`
  };
}

// ============================================================================
// HELPERS
// ============================================================================

export function getIntentionContent(intentions: IntentionsConfig, key: keyof IntentionsConfig, locale: 'fr' | 'en'): { title: string; subtitle: string; cta: string; icon?: string } {
  const intention = intentions[key];
  return { title: intention.title[locale], subtitle: intention.subtitle[locale], cta: intention.cta[locale], icon: intention.icon };
}

export function isDevisRequired(eventDate: Date | null | undefined, maxDays: number = 6): boolean {
  if (!eventDate || !(eventDate instanceof Date) || isNaN(eventDate.getTime())) {
    return false;
  }
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > maxDays;
}

export function getPeopleRange(numberOfPeople: number): BuffetPeopleRange {
  if (numberOfPeople <= 20) return '10-20';
  if (numberOfPeople <= 50) return '20-50';
  if (numberOfPeople <= 100) return '50-100';
  return '100+';
}
