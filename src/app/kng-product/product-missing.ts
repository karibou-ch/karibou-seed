/**
 * Réponse métier de GET /v1/products/:sku quand le document n'existe pas.
 * Le contrôleur API envoie exactement ce texte en HTTP 400 (pas un 404).
 * Les autres 400 du même endpoint (erreur base, autre message) restent des erreurs.
 */
const MISSING_PRODUCT_BODY = "Ce produit n'existe pas";

export function isMissingProductResponse(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const candidate = err as { status?: unknown; error?: unknown };
  return candidate.status === 400 && candidate.error === MISSING_PRODUCT_BODY;
}
