import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngCartItemsComponent } from './kng-cart-items.component';

describe('KngCartItemsComponent', () => {
  let component: KngCartItemsComponent;
  let fixture: ComponentFixture<KngCartItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngCartItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngCartItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
