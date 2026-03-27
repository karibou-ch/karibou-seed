import { Product } from 'kng2-core';

export enum ProductTemplate {
  Detailled = 'detailled',
  Thumbnail = 'thumbnail',
  Card = 'card',
  Tiny = 'tiny'
}

export function normalizeProductTemplate(template?: ProductTemplate | string): ProductTemplate {
  switch ((template || '').toString().toLowerCase()) {
    case ProductTemplate.Thumbnail:
      return ProductTemplate.Thumbnail;
    case ProductTemplate.Card:
      return ProductTemplate.Card;
    case ProductTemplate.Tiny:
      return ProductTemplate.Tiny;
    case ProductTemplate.Detailled:
    default:
      return ProductTemplate.Detailled;
  }
}

export function isHydratedProduct(product?: Product): product is Product {
  return !!product && !!product.sku && !!product.pricing && !!product.vendor;
}
