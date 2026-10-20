import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { UserService } from 'kng2-core';
import { StripeService } from 'ngx-stripe';

import { i18n } from '../i18n.service';
import { KngPaymentComponent } from './kng-user-payment.component';

describe('KngPaymentComponent Stripe card mount', () => {
  let fixture: ComponentFixture<KngPaymentComponent>;
  let component: KngPaymentComponent;
  let elements$: Subject<any>;
  let card: { on: jasmine.Spy; mount: jasmine.Spy; destroy: jasmine.Spy };

  const user = {
    id: 1,
    isAuthenticated: () => true,
    display: () => 'Louis Fauchier',
    payments: [],
    addresses: [],
    context: { intent: { client_secret: 'seti_test' } }
  };

  beforeEach(async () => {
    elements$ = new Subject();
    card = {
      on: jasmine.createSpy('on'),
      mount: jasmine.createSpy('mount'),
      destroy: jasmine.createSpy('destroy')
    };
    await TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule],
      declarations: [KngPaymentComponent],
      providers: [
        { provide: i18n, useValue: { locale: 'fr', fr: { action_check: 'Vérifier', action_del: 'Supprimer' } } },
        { provide: StripeService, useValue: { setKey: () => undefined, elements: () => elements$ } },
        { provide: UserService, useValue: { checkPaymentMethod: () => of(user) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KngPaymentComponent);
    component = fixture.componentInstance;
    component.user = user as any;
    component.config = { shared: { keys: { pubStripe: 'pk_test' } } } as any;
  });

  function emitElements() {
    elements$.next({
      create: () => card
    });
  }

  it('monte la carte sur l’élément du composant quand il est dans le document', () => {
    fixture.detectChanges();
    emitElements();

    const host = fixture.nativeElement.querySelector('#card-element');
    expect(host.isConnected).toBe(true);
    expect(card.mount).toHaveBeenCalledWith(host);
    expect(card.mount).not.toHaveBeenCalledWith('#card-element');
  });

  it('ne monte pas la carte si le composant est détruit avant la réponse Stripe', () => {
    fixture.detectChanges();
    fixture.destroy();
    emitElements();

    expect(card.mount).not.toHaveBeenCalled();
  });

  it('ne monte pas la carte si l’hôte a quitté le document avant le montage différé', fakeAsync(() => {
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('#card-element');
    host.remove();
    emitElements();
    fixture.destroy();
    tick(0);

    expect(card.mount).not.toHaveBeenCalled();
    expect(card.destroy).toHaveBeenCalled();
  }));
});
