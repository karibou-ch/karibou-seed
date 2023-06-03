import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngSubscriptionOptionComponent } from './kng-subscription-option.component';

describe('KngSubscriptionOptionComponent', () => {
  let component: KngSubscriptionOptionComponent;
  let fixture: ComponentFixture<KngSubscriptionOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngSubscriptionOptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngSubscriptionOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
