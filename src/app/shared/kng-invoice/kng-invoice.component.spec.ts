import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngInvoiceComponent } from './kng-invoice.component';

describe('KngInvoiceComponent', () => {
  let component: KngInvoiceComponent;
  let fixture: ComponentFixture<KngInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngInvoiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
