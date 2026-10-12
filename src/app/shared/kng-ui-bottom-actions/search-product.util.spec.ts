import { ensureProduct, searchProductHasDiscount, searchProductImage } from './search-product.util';

describe('search product cards', () => {
  const plain = {
    title: 'Beurre Salé',
    photo: { url: 'https://ucarecdn.com/beurre' },
    pricing: { price: 3.5, part: '100gr', discount: 0 },
    attributes: { discount: false },
    stats: { score: 0.99 },
    variants: []
  };

  class FakeProduct {
    constructor(public json: any) {
      Object.assign(this, json);
    }
    isDiscount() {
      return !!(this['attributes'].discount && this['pricing'].discount >= 0);
    }
  }

  it('does not call a missing isDiscount on plain search JSON', () => {
    expect(typeof (plain as any).isDiscount).toBe('undefined');
    expect(searchProductHasDiscount(plain)).toBe(false);
  });

  it('hydrates a plain hit so isDiscount exists before the card renders', () => {
    const product = ensureProduct(plain, FakeProduct);
    expect(product instanceof FakeProduct).toBe(true);
    expect(typeof product.isDiscount).toBe('function');
    expect(product.isDiscount()).toBe(false);
    expect(ensureProduct(product, FakeProduct)).toBe(product);
  });

  it('uses Product.isDiscount when the hit was hydrated', () => {
    const product = {
      ...plain,
      attributes: { discount: true },
      pricing: { price: 20, part: '10pce', discount: 19 },
      isDiscount() {
        return true;
      }
    };
    expect(searchProductHasDiscount(product)).toBe(true);
  });

  it('builds a resize url and falls back when photo is missing', () => {
    expect(searchProductImage(plain)).toBe('https://ucarecdn.com/beurre/-/resize/128x/');
    expect(searchProductImage({})).toBe('/assets/img/k-product-placeholder.png');
    expect(searchProductImage(null)).toBe('/assets/img/k-product-placeholder.png');
  });
});
