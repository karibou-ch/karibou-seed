import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngCartComponent } from './kng-cart.component';

describe('KngCartComponent', () => {
  let component: KngCartComponent;
  let fixture: ComponentFixture<KngCartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngCartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
