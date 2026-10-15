import { isMissingProductResponse } from './product-missing';

describe('isMissingProductResponse', () => {
  it('reconnaît le produit absent renvoyé par GET /v1/products/:sku', () => {
    expect(isMissingProductResponse({
      status: 400,
      error: "Ce produit n'existe pas"
    })).toBe(true);
  });

  it('laisse passer les autres réponses HTTP, y compris les autres 400', () => {
    expect(isMissingProductResponse({ status: 400, error: 'Aucun produit disponible' })).toBe(false);
    expect(isMissingProductResponse({ status: 400, error: 'Ooops, unknow product 1' })).toBe(false);
    expect(isMissingProductResponse({
      status: 400,
      error: { message: "Ce produit n'existe pas" }
    })).toBe(false);
    expect(isMissingProductResponse({ status: 404, error: "Ce produit n'existe pas" })).toBe(false);
    expect(isMissingProductResponse({ status: 500, error: "Ce produit n'existe pas" })).toBe(false);
    expect(isMissingProductResponse(new Error("Ce produit n'existe pas"))).toBe(false);
    expect(isMissingProductResponse(null)).toBe(false);
    expect(isMissingProductResponse(undefined)).toBe(false);
  });
});
