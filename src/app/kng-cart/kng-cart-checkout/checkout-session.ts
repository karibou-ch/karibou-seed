export type CheckoutMode = 'order' | 'subscription';

/** Session du tiroir. Adresse, paiement, jour de commande et paramètres d'abonnement restent dans CartService. */
export interface CheckoutSession {
  mode: CheckoutMode;
}
