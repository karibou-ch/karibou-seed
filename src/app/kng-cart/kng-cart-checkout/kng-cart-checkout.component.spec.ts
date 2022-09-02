import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngCartCheckoutComponent } from './kng-cart-checkout.component';

describe('KngCartCheckoutComponent', () => {
  let component: KngCartCheckoutComponent;
  let fixture: ComponentFixture<KngCartCheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngCartCheckoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngCartCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
