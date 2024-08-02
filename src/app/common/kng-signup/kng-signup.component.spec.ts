import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngAddressComponent } from './kng-address.component';

describe('KngAddressComponent', () => {
  let component: KngAddressComponent;
  let fixture: ComponentFixture<KngAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngAddressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
