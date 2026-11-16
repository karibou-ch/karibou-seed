import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { OrderService } from 'kng2-core';

import { i18n } from 'src/app/common';
import { KngInvoiceComponent } from './kng-invoice.component';

function invoiceFor(order, qrbillAmount) {
  return {
    month: 4,
    year: 2026,
    invoices: [],
    transfers: [],
    paids: [order],
    totals: {
      invoicesAmount: 0,
      transfersAmount: 0,
      paidsAmount: order.amount,
      refundsAmount: 0,
      qrbillAmount
    }
  };
}

describe('KngInvoiceComponent', () => {
  let fixture: ComponentFixture<KngInvoiceComponent>;

  const paidOrder = {
    oid: 2000009,
    when: new Date(Date.UTC(2026, 3, 12)),
    amount: 12.5,
    customer: {},
    payment: {},
    refund: { hasRefund: true, amount: 2.5 },
    serviceFee: 0.75,
    itemLines: [
      { quantity: 3, title: 'Pain', amount: 12.5, refundAmount: 2.5 }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [KngInvoiceComponent],
      providers: [
        { provide: i18n, useValue: { locale: 'fr' } },
        { provide: OrderService, useValue: {} }
      ]
    }).compileComponents();
  });

  function render(invoice) {
    fixture = TestBed.createComponent(KngInvoiceComponent);
    fixture.componentInstance.invoice = invoice;
    fixture.detectChanges();
  }

  it('shows the line amount and the refund under the item', () => {
    render(invoiceFor(paidOrder, 0));
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('3x Pain');
    expect(text).toContain('12.50');
    expect(text).toContain('Remboursement appliqué');
    expect(text).toContain('Frais de service');
    expect(text).toContain('0.75');
    expect(text).toContain('2.50');
    expect(text).not.toContain(': CHF 2.50');
    expect(text).toContain('Télécharger le relevé');
    expect(fixture.nativeElement.querySelector('button.download').hidden).toBe(false);
  });

  it('shows the PDF button when a QR-bill amount is due', () => {
    render(invoiceFor(paidOrder, 12.5));

    expect(fixture.nativeElement.textContent).toContain('Télécharger la facture');
    expect(fixture.nativeElement.querySelector('button.download').hidden).toBe(false);
  });
});
