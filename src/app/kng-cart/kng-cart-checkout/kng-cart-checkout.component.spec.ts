import { KngCartCheckoutComponent } from './kng-cart-checkout.component';

describe('KngCartCheckoutComponent wallet quote', () => {
  function createCheckout() {
    const quoteCheckout = jasmine.createSpy('quoteCheckout').and.returnValue({
      subscribe: () => ({ unsubscribe() {} })
    });
    const address = {
      streetAdress: 'chemin des sureaux 8',
      postalCode: '1205',
      name: 'oli'
    };
    const $cart = {
      setShippingAddress: () => true,
      getCurrentShippingDay: () => new Date('2026-10-12T10:00:00.000Z'),
      getCurrentShippingAddress: () => address,
      getCurrentPaymentMethod: () => ({ alias: 'card', issuer: 'visa' }),
      isCurrentShippingLastMinute: () => false,
      getItems: () => [{ toDEPRECATED: () => ({ sku: 9 }) }]
    };
    const $calendar = {
      getDefaultTimeByDay: () => 16
    };
    const component = new KngCartCheckoutComponent(
      {} as any,
      $cart as any,
      {} as any,
      {} as any,
      { quoteCheckout } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      $calendar as any
    );
    component['_user'] = {
      isAuthenticated: () => true,
      phoneNumbers: [],
      payments: [],
      addresses: []
    } as any;
    component['_currentHub'] = { slug: 'geneva', reservedAmount: 1 } as any;
    return { component, quoteCheckout, address };
  }

  it('does not quote when the checkout is closed', () => {
    const { component, quoteCheckout, address } = createCheckout();
    component['_items'] = [{ toDEPRECATED: () => ({ sku: 1 }) }] as any;

    component.setShippingAddress(address as any);

    expect(quoteCheckout).not.toHaveBeenCalled();
  });

  it('does not quote an empty cart while checkout is open', () => {
    const { component, quoteCheckout, address } = createCheckout();
    component['_open'] = true;
    component['_items'] = [];

    component.setShippingAddress(address as any);

    expect(quoteCheckout).not.toHaveBeenCalled();
  });

  it('quotes the wallet when checkout is open and the cart has items', () => {
    const { component, quoteCheckout, address } = createCheckout();
    component['_open'] = true;
    component['_items'] = [{ toDEPRECATED: () => ({ sku: 1 }) }] as any;

    component.setShippingAddress(address as any);

    expect(quoteCheckout).toHaveBeenCalled();
    expect(quoteCheckout.calls.mostRecent().args[0].items.length).toBe(1);
  });
});
