// Search hits must be Product instances before the card template runs.
// Plain JSON has the fields but not isDiscount()/getPrice(), and a throw
// during one *ngFor row aborts change detection for every following row.

export function ensureProduct(product: any, ProductClass: any): any {
  if (product instanceof ProductClass) {
    return product;
  }
  return new ProductClass(product);
}

export function searchProductHasDiscount(product: any): boolean {
  if (product && typeof product.isDiscount === 'function') {
    return !!product.isDiscount();
  }
  const attributes = product && product.attributes;
  const pricing = product && product.pricing;
  return !!(attributes && attributes.discount && pricing && pricing.discount >= 0);
}

export function searchProductImage(product: any): string {
  const url = product && product.photo && product.photo.url;
  if (!url) {
    return '/assets/img/k-product-placeholder.png';
  }
  return url + '/-/resize/128x/';
}
